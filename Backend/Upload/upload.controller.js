import Video from '../Models/Video.js';
import { Channel } from '../Models/Channel.js';
import UploadSession from '../Models/UploadSession.js';
import { 
    uploadVideoService,
} from './upload.service.js';

import { Queue } from 'bullmq';

import { 
    PutObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand
 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import crypto from 'crypto';
import { s3Client } from '../Config/awsConfig.js';

const videoQueue = new Queue('videoQueue', {
    connection: { host: '127.0.0.1', port: 6379 }
});

const SESSION_TTL_DAYS = 2;

const getUploadSessionExpiry = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
    return expiresAt;
};

const getSessionFolderToken = (userId, idempotencyKey) => {
    return crypto
        .createHash('sha256')
        .update(`${userId}:${idempotencyKey}`)
        .digest('hex')
        .slice(0, 24);
};

const sanitizeFilename = (filename = 'file') => filename.replace(/\s+/g, '_');

const normalizeFileMetadata = ({
    videoFilename,
    videoContentType,
    videoSize,
    thumbnailFilename,
    thumbnailContentType,
    thumbnailSize,
    totalChunks,
}) => ({
    videoFilename,
    videoContentType,
    videoSize: Number.isFinite(Number(videoSize)) ? Number(videoSize) : null,
    thumbnailFilename,
    thumbnailContentType,
    thumbnailSize: Number.isFinite(Number(thumbnailSize)) ? Number(thumbnailSize) : null,
    totalChunks: Number(totalChunks),
});

const metadataMatches = (sessionMetadata = {}, incomingMetadata = {}) => {
    return [
        'videoFilename',
        'videoContentType',
        'videoSize',
        'thumbnailFilename',
        'thumbnailContentType',
        'thumbnailSize',
        'totalChunks',
    ].every((key) => String(sessionMetadata[key] ?? '') === String(incomingMetadata[key] ?? ''));
};

const buildPartUrls = async ({ videoKey, uploadId, totalChunks }) => {
    const partPromises = [];
    for (let i = 1; i <= totalChunks; i++) {
        const partCommand = new UploadPartCommand({
            Bucket: process.env.AWS_RAW_BUCKET_NAME,
            Key: videoKey,
            UploadId: uploadId,
            PartNumber: i,
        });
        partPromises.push(getSignedUrl(s3Client, partCommand, { expiresIn: 3600 }));
    }

    return Promise.all(partPromises);
};

const buildCompletedSessionPayload = async (session) => {
    const video = session.videoId ? await Video.findById(session.videoId).select('status transcodeJobId') : null;

    return {
        success: true,
        completed: true,
        message: "Upload already completed.",
        videoId: session.videoId,
        jobId: session.jobId || video?.transcodeJobId || null,
        status: video?.status || 'queued',
    };
};

const waitForCompletedSession = async (sessionId) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const session = await UploadSession.findById(sessionId);
        if (session?.status === 'completed') return session;
        if (session?.status === 'failed' || session?.status === 'aborted') return session;
    }

    return UploadSession.findById(sessionId);
};

const buildUploadSessionResponse = async (session) => {
    if (session.status === 'completed') {
        return buildCompletedSessionPayload(session);
    }

    const thumbnailCommand = new PutObjectCommand({
        Bucket: process.env.AWS_THUMBNAILS_BUCKET_NAME,
        Key: session.thumbnailKey,
        ContentType: session.fileMetadata.thumbnailContentType,
    });

    const [thumbnailUploadUrl, partUrls] = await Promise.all([
        getSignedUrl(s3Client, thumbnailCommand, { expiresIn: 3600 }),
        buildPartUrls({
            videoKey: session.videoKey,
            uploadId: session.s3MultipartUploadId,
            totalChunks: session.fileMetadata.totalChunks,
        }),
    ]);

    return {
        success: true,
        folderPath: session.folderPath,
        status: session.status,
        video: {
            uploadId: session.s3MultipartUploadId,
            s3Key: session.videoKey,
            partUrls,
        },
        thumbnail: {
            uploadUrl: thumbnailUploadUrl,
            s3Key: session.thumbnailKey,
        },
    };
};

export const uploadVideoController = async (req, res) => {
    try {
        let { title, description, genre } = req.body;
        if (!description || !title || !genre) {
            throw new Error("description or title or genre is not coming from req.body");
        }
        // console.log(genre);
        // genre = JSON.parse(genre);
        
        const { storedFileName, uniqueFolderPath, files } = req;
        const file = files?.video?.[0];
        if (!storedFileName || !uniqueFolderPath || !file) {
            throw new Error("storedFileName or uniqueFolderPath or file is not coming from req");
        }
        console.log("req.user at upload video controller:  ",req.user);
        // return res.status(200).json({ success: true, message: "File received, processing..." });
        const newVideo = await uploadVideoService(storedFileName, uniqueFolderPath, file, title, description, req.user._id, genre, req.files.thumbnail?.[0]);

        return res.status(201).json({
            success: true,
            message: "Video uploaded and processed successfully.",
            m3u8Url: newVideo.m3u8Path,
            videoId: newVideo._id,
        });

    } catch (err) {
        console.error("Upload Handler Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const uploadURLController = async (req, res) => {
    try {
        const { 
            videoFilename, 
            videoContentType, 
            thumbnailFilename, 
            thumbnailContentType 
        } = req.body;

        if (!videoContentType?.startsWith('video/') || !thumbnailContentType?.startsWith('image/')) { 
            return res.status(400).json({ 
                success: false, 
                error: "Invalid file types. Please provide a valid video and image." 
            });
        }

        const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const folderPath = `uploads/${uniqueId}`; 

        const videoKey = `${folderPath}/video_${videoFilename.replace(/\s+/g, '_')}`;
        const thumbnailKey = `${folderPath}/thumb_${thumbnailFilename.replace(/\s+/g, '_')}`;

        const videoCommand = new PutObjectCommand({
            Bucket: process.env.AWS_RAW_BUCKET_NAME,
            Key: videoKey,
            ContentType: videoContentType,
        });

        const thumbnailCommand = new PutObjectCommand({
            Bucket: process.env.AWS_THUMBNAILS_BUCKET_NAME,
            Key: thumbnailKey,
            ContentType: thumbnailContentType,
        });

        const [videoUploadUrl, thumbnailUploadUrl] = await Promise.all([
            getSignedUrl(s3Client, videoCommand, { expiresIn: 300 }),
            getSignedUrl(s3Client, thumbnailCommand, { expiresIn: 300 })
        ]);

        return res.json({
            success: true,
            folderPath, // Frontend needs this to send to your 'Save to MongoDB' endpoint
            video: {
                uploadUrl: videoUploadUrl,
                s3Key: videoKey
            },
            thumbnail: {
                uploadUrl: thumbnailUploadUrl,
                s3Key: thumbnailKey
            }
        });

    } catch (error) {
        console.error("Error generating URLs:", error);
        return res.status(500).json({ success: false, error: "Failed to generate upload URLs" });
    }
};


export const processVideoController = async (req, res) => {
    try {
        const {
            title,
            description,
            genre,
            folderPath,
            videoKey,
            thumbnailPath,
            originalName,
            mimeType,
            size,
        } = req.body;

        if (!req.user || !req.user._id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!title || !folderPath || !videoKey || !thumbnailPath || !originalName || !mimeType || !size) {
            return res.status(400).json({ error: 'Missing required video metadata' });
        }

        const genreArray = Array.isArray(genre)
            ? genre
            : typeof genre === 'string' && genre.length > 0
                ? [genre]
                : [];

        const channel = await Channel.findOne({ owner: req.user._id }).select('_id');
        if (!channel) {
            return res.status(400).json({ error: 'User channel not found' });
        }

        // Convert thumbnail S3 key to full URL
        const thumbnailUrl = `https://${process.env.AWS_THUMBNAILS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailPath}`;

        const newVideo = new Video({
            title,
            originalName,
            mimeType,
            size,
            uploadTime: new Date(),
            status: 'queued',
            m3u8Path: null,
            folderPath,
            description: description || '',
            uploadedBy: req.user._id,
            likesCount: 0,
            genre: genreArray,
            thumbnailPath: thumbnailUrl,
            rawS3Key: videoKey,
            thumbnailS3Key: thumbnailPath,
            views: 0,
            channel: channel._id,
        });

        const jobId = `vid_${Date.now()}`;
        newVideo.transcodeJobId = jobId;
        await newVideo.save();

        const job = await videoQueue.add('transcode', {
            s3Key: videoKey,
            videoId: jobId,
            dbVideoId: newVideo._id,
        }, {
            jobId,
        });

        console.log(`🚀 Job ${job.id} added to queue for video ${jobId}`);

        return res.status(202).json({
            success: true,
            message: 'Video processing queued successfully',
            jobId: job.id,
            videoId: newVideo._id,
        });

    } catch (error) {
        console.error('Error queueing video:', error);
        return res.status(500).json({ error: 'Failed to queue video processing' });
    }
};

export const uploadMultipartURLController = async (req, res) => {
    try {
        const { 
            videoFilename, 
            videoContentType, 
            videoSize,
            thumbnailFilename, 
            thumbnailContentType,
            thumbnailSize,
            totalChunks,
            idempotencyKey,
        } = req.body;

        if (!idempotencyKey || typeof idempotencyKey !== 'string') {
            return res.status(400).json({ success: false, error: "idempotencyKey is required." });
        }

        if (!videoContentType?.startsWith('video/') || !thumbnailContentType?.startsWith('image/')) {
            return res.status(400).json({ success: false, error: "Invalid file types." });
        }

        if (!totalChunks || totalChunks < 1) {
            return res.status(400).json({ success: false, error: "totalChunks is required." });
        }

        const fileMetadata = normalizeFileMetadata({
            videoFilename,
            videoContentType,
            videoSize,
            thumbnailFilename,
            thumbnailContentType,
            thumbnailSize,
            totalChunks,
        });

        const existingSession = await UploadSession.findOne({
            user: req.user._id,
            idempotencyKey,
        });

        if (existingSession) {
            if (!metadataMatches(existingSession.fileMetadata, fileMetadata)) {
                return res.status(409).json({
                    success: false,
                    error: "This upload session belongs to a different file. Please start a new upload.",
                });
            }

            if (existingSession.status === 'failed' || existingSession.status === 'aborted') {
                return res.status(409).json({
                    success: false,
                    error: "This upload session is no longer active. Please start a new upload.",
                });
            }

            if (existingSession.status === 'finalizing') {
                return res.status(409).json({
                    success: false,
                    error: "This upload is currently being finalized. Please wait.",
                });
            }

            return res.json(await buildUploadSessionResponse(existingSession));
        }

        const folderToken = getSessionFolderToken(req.user._id, idempotencyKey);
        const folderPath = `uploads/${folderToken}`;
        const videoKey = `${folderPath}/video_${sanitizeFilename(videoFilename)}`;
        const thumbnailKey = `${folderPath}/thumb_${sanitizeFilename(thumbnailFilename)}`;

        const multipartCommand = new CreateMultipartUploadCommand({
            Bucket: process.env.AWS_RAW_BUCKET_NAME,
            Key: videoKey,
            ContentType: videoContentType,
        });

        const multipartUploadResponse = await s3Client.send(multipartCommand);
        const uploadId = multipartUploadResponse.UploadId;

        let session;
        try {
            session = await UploadSession.create({
                user: req.user._id,
                idempotencyKey,
                status: 'uploading',
                videoKey,
                thumbnailKey,
                folderPath,
                s3MultipartUploadId: uploadId,
                fileMetadata,
                expiresAt: getUploadSessionExpiry(),
            });
        } catch (error) {
            if (error.code === 11000) {
                try {
                    await s3Client.send(new AbortMultipartUploadCommand({
                        Bucket: process.env.AWS_RAW_BUCKET_NAME,
                        Key: videoKey,
                        UploadId: uploadId,
                    }));
                } catch (abortError) {
                    console.warn("Could not abort duplicate multipart upload:", abortError.message);
                }

                const duplicateSession = await UploadSession.findOne({
                    user: req.user._id,
                    idempotencyKey,
                });

                if (duplicateSession && metadataMatches(duplicateSession.fileMetadata, fileMetadata)) {
                    return res.json(await buildUploadSessionResponse(duplicateSession));
                }
            }

            throw error;
        }

        console.log(`Initiated Multipart Upload for: ${videoKey} with ${totalChunks} chunks.`);

        return res.json(await buildUploadSessionResponse(session));

    } catch (error) {
        console.error("Error initiating upload:", error);
        return res.status(500).json({ success: false, error: "Failed to initiate upload" });
    }
}


export const completeMultipartUploadController = async (req, res) => {
    let lockedSession = null;
    let createdVideo = null;

    try {
        const { 
            videoKey, uploadId, parts, 
            title, description, folderPath, thumbnailPath,
            originalName, mimeType, size, genre,
            idempotencyKey,
        } = req.body;

        if (!idempotencyKey || typeof idempotencyKey !== 'string') {
            return res.status(400).json({ success: false, error: "idempotencyKey is required." });
        }

        const existingSession = await UploadSession.findOne({
            user: req.user._id,
            idempotencyKey,
        });

        if (!existingSession) {
            return res.status(404).json({ success: false, error: "Upload session not found." });
        }

        if (
            existingSession.videoKey !== videoKey ||
            existingSession.s3MultipartUploadId !== uploadId ||
            existingSession.folderPath !== folderPath ||
            existingSession.thumbnailKey !== thumbnailPath
        ) {
            return res.status(409).json({
                success: false,
                error: "Upload completion data does not match the active session.",
            });
        }

        if (existingSession.status === 'completed') {
            return res.json(await buildCompletedSessionPayload(existingSession));
        }

        if (existingSession.status === 'failed' || existingSession.status === 'aborted') {
            return res.status(409).json({
                success: false,
                error: "This upload session is no longer active. Please start a new upload.",
            });
        }

        lockedSession = await UploadSession.findOneAndUpdate(
            {
                _id: existingSession._id,
                status: { $in: ['initiated', 'uploading'] },
            },
            { $set: { status: 'finalizing' } },
            { new: true }
        );

        if (!lockedSession) {
            const latestSession = await waitForCompletedSession(existingSession._id);
            if (latestSession?.status === 'completed') {
                return res.json(await buildCompletedSessionPayload(latestSession));
            }

            return res.status(409).json({
                success: false,
                error: "Upload finalization is already in progress. Please wait and retry if needed.",
            });
        }

        const completeCommand = new CompleteMultipartUploadCommand({
            Bucket: process.env.AWS_RAW_BUCKET_NAME,
            Key: videoKey,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts }
        });

        await s3Client.send(completeCommand);
        console.log(`Video stitched successfully in S3: ${videoKey}`);

        const channel = await Channel.findOne({ 
            owner: req.user._id 
        }).select('_id');

        if (!channel) return res.status(400).json({ 
            error: 'User channel not found' 
        });

        const genreArray = Array.isArray(genre) ? genre : (typeof genre === 'string' && genre.length > 0 ? [genre] : []);
        
        const thumbnailUrl = `https://${process.env.AWS_THUMBNAILS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailPath}`;

        const newVideo = new Video({
            title, 
            description: description || '', 
            folderPath, 
            thumbnailPath: thumbnailUrl, 
            originalName, 
            mimeType, 
            size,
            status: 'queued', 
            m3u8Path: null, 
            uploadTime: new Date(),
            uploadedBy: req.user._id, 
            channel: channel._id,
            likesCount: 0, 
            views: 0, 
            genre: genreArray,
            rawS3Key: videoKey,
            thumbnailS3Key: thumbnailPath,
            uploadSessionId: lockedSession._id,
            uploadIdempotencyKey: idempotencyKey,
        });

        const jobId = `vid_${lockedSession._id}`;
        newVideo.transcodeJobId = jobId;
        try {
            await newVideo.save();
            createdVideo = newVideo;
        } catch (error) {
            if (error.code === 11000) {
                const duplicateVideo = await Video.findOne({ uploadSessionId: lockedSession._id });
                if (duplicateVideo) {
                    await UploadSession.findByIdAndUpdate(lockedSession._id, {
                        status: 'completed',
                        videoId: duplicateVideo._id,
                        jobId: duplicateVideo.transcodeJobId,
                        expiresAt: getUploadSessionExpiry(),
                    });

                    return res.json({
                        success: true,
                        message: "Upload already completed.",
                        jobId: duplicateVideo.transcodeJobId,
                        videoId: duplicateVideo._id,
                        status: duplicateVideo.status,
                    });
                }
            }

            throw error;
        }

        const job = await videoQueue.add('transcode', {
            s3Key: videoKey,
            videoId: jobId,
            dbVideoId: newVideo._id,
        }, {
            jobId,
        });

        console.log(`Job ${job.id} added to queue for video ${jobId}`);

        await UploadSession.findByIdAndUpdate(lockedSession._id, {
            status: 'completed',
            videoId: newVideo._id,
            jobId: job.id,
            expiresAt: getUploadSessionExpiry(),
        });

        return res.json({
            success: true,
            message: "Upload complete, processing started!",
            jobId: job.id,
            videoId: newVideo._id,
            status: newVideo.status
        });

    } catch (error) {
        console.error("Error completing multipart upload:", error);
        if (lockedSession) {
            try {
                await UploadSession.findByIdAndUpdate(lockedSession._id, {
                    status: createdVideo ? 'completed' : 'failed',
                    videoId: createdVideo?._id || lockedSession.videoId || null,
                    jobId: createdVideo?.transcodeJobId || lockedSession.jobId || null,
                    expiresAt: getUploadSessionExpiry(),
                });

                if (createdVideo) {
                    await Video.findByIdAndUpdate(createdVideo._id, { status: 'failed' });
                }
            } catch (sessionError) {
                console.warn("Could not update upload session after completion failure:", sessionError.message);
            }
        }
        return res.status(500).json({ success: false, error: "Failed to complete upload" });
    }
}
