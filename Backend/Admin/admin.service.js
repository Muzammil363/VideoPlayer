import mongoose from "mongoose";
import { Queue } from "bullmq";
import Video from "../Models/Video.js";
import { User } from "../Models/User.js";
import { Channel } from "../Models/Channel.js";
import UploadSession from "../Models/UploadSession.js";
import AuditLog from "../Models/AuditLog.js";
import History from "../Models/History.js";
import Liked from "../Models/Liked.js";
import WatchLater from "../Models/WatchLater.js";
import { deleteVideoService } from "../User/user.service.js";

const redisConnection = { host: "127.0.0.1", port: 6379 };
const videoQueue = new Queue("videoQueue", { connection: redisConnection });

const VIDEO_STATUSES = ["queued", "processing", "ready", "failed", "deleting"];
const JOB_STATES = ["waiting", "active", "failed", "completed", "delayed"];
const PAGE_LIMIT_MAX = 100;

const getPagination = (query) => {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(PAGE_LIMIT_MAX, Math.max(1, Number.parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

const getDateHoursAgo = (hours) => {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
};

const toObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const buildPaginatedResult = (items, total, page, limit) => ({
    items,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
    },
});

export const getOverviewService = async () => {
    try {
        const last24h = getDateHoursAgo(24);
        const last7d = getDateHoursAgo(24 * 7);

        const [
            totalUsers,
            totalVideos,
            videoStatusCounts,
            videoTotals,
            uploadsLast24h,
            uploadsLast7d,
            queueCounts,
        ] = await Promise.all([
            User.countDocuments(),
            Video.countDocuments({ status: { $ne: "deleting" } }),
            Video.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            Video.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: "$views" },
                        totalLikes: { $sum: "$likesCount" },
                    },
                },
            ]),
            Video.countDocuments({ uploadTime: { $gte: last24h } }),
            Video.countDocuments({ uploadTime: { $gte: last7d } }),
            videoQueue.getJobCounts("waiting", "active", "delayed", "failed", "completed"),
        ]);

        const byStatus = Object.fromEntries(VIDEO_STATUSES.map((status) => [status, 0]));
        for (const item of videoStatusCounts) {
            byStatus[item._id] = item.count;
        }

        return {
            status: 200,
            success: true,
            data: {
                users: { total: totalUsers },
                videos: {
                    total: totalVideos,
                    byStatus,
                    uploadsLast24h,
                    uploadsLast7d,
                    totalViews: videoTotals[0]?.totalViews || 0,
                    totalLikes: videoTotals[0]?.totalLikes || 0,
                },
                queue: queueCounts,
            },
        };
    } catch (error) {
        console.error("Admin overview error:", error);
        return { status: 500, success: false, message: "Failed to load overview" };
    }
};

export const listUsersService = async (query) => {
    try {
        const { page, limit, skip } = getPagination(query);
        const search = query.search?.trim();
        const match = search
            ? {
                $or: [
                    { username: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const [items, total] = await Promise.all([
            User.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "channels",
                        localField: "_id",
                        foreignField: "owner",
                        as: "channel",
                    },
                },
                { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "videos",
                        localField: "_id",
                        foreignField: "uploadedBy",
                        as: "videos",
                    },
                },
                {
                    $project: {
                        username: 1,
                        email: 1,
                        role: 1,
                        profileColor: 1,
                        createdAt: 1,
                        channel: {
                            _id: "$channel._id",
                            name: "$channel.name",
                            avatarColor: "$channel.avatarColor",
                        },
                        videoCount: { $size: "$videos" },
                        totalViews: { $sum: "$videos.views" },
                    },
                },
            ]),
            User.countDocuments(match),
        ]);

        return { status: 200, success: true, data: buildPaginatedResult(items, total, page, limit) };
    } catch (error) {
        console.error("Admin users error:", error);
        return { status: 500, success: false, message: "Failed to load users" };
    }
};

export const getUserDetailService = async (userId) => {
    try {
        const userObjectId = toObjectId(userId);
        if (!userObjectId) return { status: 400, success: false, message: "Invalid user id" };

        const [user, channel, videos, statusBreakdown] = await Promise.all([
            User.findById(userObjectId).select("username email role profileColor createdAt updatedAt").lean(),
            Channel.findOne({ owner: userObjectId }).lean(),
            Video.find({ uploadedBy: userObjectId })
                .select("title status views likesCount uploadTime size transcodeJobId")
                .sort({ uploadTime: -1 })
                .limit(25)
                .lean(),
            Video.aggregate([
                { $match: { uploadedBy: userObjectId } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
        ]);

        if (!user) return { status: 404, success: false, message: "User not found" };

        return {
            status: 200,
            success: true,
            data: {
                user,
                channel,
                videos,
                statusBreakdown,
            },
        };
    } catch (error) {
        console.error("Admin user detail error:", error);
        return { status: 500, success: false, message: "Failed to load user" };
    }
};

export const listVideosService = async (query) => {
    try {
        const { page, limit, skip } = getPagination(query);
        const match = {};

        if (query.status && VIDEO_STATUSES.includes(query.status)) match.status = query.status;
        if (query.owner) {
            const ownerId = toObjectId(query.owner);
            if (!ownerId) return { status: 400, success: false, message: "Invalid owner id" };
            match.uploadedBy = ownerId;
        }
        if (query.search?.trim()) {
            match.$or = [
                { title: { $regex: query.search.trim(), $options: "i" } },
                { description: { $regex: query.search.trim(), $options: "i" } },
            ];
        }

        const [items, total] = await Promise.all([
            Video.find(match)
                .select("title status views likesCount uploadTime size rawS3Key thumbnailS3Key processedS3Prefix transcodeJobId uploadedBy channel")
                .populate("uploadedBy", "username email role")
                .populate("channel", "name avatarColor")
                .sort({ uploadTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Video.countDocuments(match),
        ]);

        return { status: 200, success: true, data: buildPaginatedResult(items, total, page, limit) };
    } catch (error) {
        console.error("Admin videos error:", error);
        return { status: 500, success: false, message: "Failed to load videos" };
    }
};

export const getVideoDetailService = async (videoId) => {
    try {
        const video = await Video.findById(videoId)
            .populate("uploadedBy", "username email role profileColor")
            .populate("channel", "name description avatarColor subscribers")
            .populate("uploadSessionId")
            .lean();

        if (!video) return { status: 404, success: false, message: "Video not found" };

        const [historyCount, likedCount, watchLaterCount, job] = await Promise.all([
            History.countDocuments({ videoId }),
            Liked.countDocuments({ videoId }),
            WatchLater.countDocuments({ videoId }),
            video.transcodeJobId ? videoQueue.getJob(video.transcodeJobId) : null,
        ]);

        return {
            status: 200,
            success: true,
            data: {
                video,
                engagement: { historyCount, likedCount, watchLaterCount },
                job: job ? await formatJob(job) : null,
            },
        };
    } catch (error) {
        console.error("Admin video detail error:", error);
        return { status: 500, success: false, message: "Failed to load video" };
    }
};

export const deleteVideoAsAdminService = async (adminId, videoId) => {
    const response = await deleteVideoService(adminId, videoId, { allowAdmin: true });

    if (response.success) {
        await AuditLog.create({
            actor: adminId,
            action: "admin.video.delete",
            targetType: "Video",
            targetId: videoId,
            metadata: {},
        });
    }

    return response;
};

export const getJobsSummaryService = async () => {
    try {
        const counts = await videoQueue.getJobCounts("waiting", "active", "delayed", "failed", "completed", "paused");
        const isPaused = await videoQueue.isPaused();

        return { status: 200, success: true, data: { counts, isPaused } };
    } catch (error) {
        console.error("Admin jobs summary error:", error);
        return { status: 500, success: false, message: "Failed to load jobs summary" };
    }
};

const formatJob = async (job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    state: await job.getState(),
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason || null,
    timestamp: job.timestamp,
    processedOn: job.processedOn || null,
    finishedOn: job.finishedOn || null,
    progress: job.progress,
});

export const listJobsService = async (query) => {
    try {
        const state = JOB_STATES.includes(query.state) ? query.state : "failed";
        const { page, limit } = getPagination(query);
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const [jobs, counts] = await Promise.all([
            videoQueue.getJobs([state], start, end, false),
            videoQueue.getJobCounts(state),
        ]);

        const items = await Promise.all(jobs.map(formatJob));
        const total = counts[state] || 0;

        return { status: 200, success: true, data: buildPaginatedResult(items, total, page, limit) };
    } catch (error) {
        console.error("Admin jobs error:", error);
        return { status: 500, success: false, message: "Failed to load jobs" };
    }
};

export const retryJobService = async (adminId, jobId) => {
    try {
        const job = await videoQueue.getJob(jobId);
        if (!job) return { status: 404, success: false, message: "Job not found" };

        await job.retry();
        await AuditLog.create({
            actor: adminId,
            action: "admin.job.retry",
            targetType: "Job",
            targetId: null,
            metadata: { jobId, data: job.data },
        });

        return { status: 200, success: true, message: "Job retry requested", data: await formatJob(job) };
    } catch (error) {
        console.error("Admin retry job error:", error);
        return { status: 500, success: false, message: error.message || "Failed to retry job" };
    }
};

export const listUploadSessionsService = async (query) => {
    try {
        const { page, limit, skip } = getPagination(query);
        const match = {};
        if (query.status) match.status = query.status;

        const [items, total] = await Promise.all([
            UploadSession.find(match)
                .populate("user", "username email role")
                .populate("videoId", "title status uploadTime")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UploadSession.countDocuments(match),
        ]);

        return { status: 200, success: true, data: buildPaginatedResult(items, total, page, limit) };
    } catch (error) {
        console.error("Admin upload sessions error:", error);
        return { status: 500, success: false, message: "Failed to load upload sessions" };
    }
};

export const getStorageHealthService = async () => {
    try {
        const staleRawDate = getDateHoursAgo(6);
        const [
            failedUploadSessions,
            staleRawUploads,
            readyMissingProcessedPrefix,
            videosMissingThumbnailKey,
            failedVideos,
        ] = await Promise.all([
            UploadSession.countDocuments({ status: "failed" }),
            Video.countDocuments({
                status: { $in: ["queued", "processing", "failed"] },
                rawS3Key: { $ne: null },
                uploadTime: { $lte: staleRawDate },
            }),
            Video.countDocuments({
                status: "ready",
                $or: [{ processedS3Prefix: null }, { processedS3Prefix: "" }],
            }),
            Video.countDocuments({
                $or: [{ thumbnailS3Key: null }, { thumbnailS3Key: "" }],
            }),
            Video.countDocuments({ status: "failed" }),
        ]);

        return {
            status: 200,
            success: true,
            data: {
                failedUploadSessions,
                staleRawUploads,
                readyMissingProcessedPrefix,
                videosMissingThumbnailKey,
                failedVideos,
                note: "S3 object existence scanning is intentionally excluded from v1 dashboard health checks.",
            },
        };
    } catch (error) {
        console.error("Admin storage health error:", error);
        return { status: 500, success: false, message: "Failed to load storage health" };
    }
};
