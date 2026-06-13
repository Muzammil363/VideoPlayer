import Video from '../Models/Video.js'
import { Channel } from '../Models/Channel.js'
import WatchLater from '../Models/WatchLater.js'
import History from '../Models/History.js'
import { User } from '../Models/User.js'
import Liked from '../Models/Liked.js'
import { PasswordReset } from '../Models/PasswordReset.js'
import { s3Client } from '../Config/awsConfig.js'
import { addSignedThumbnailToVideo } from '../Utils/thumbnailUrl.js'

import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs/promises';
import { Queue } from 'bullmq';
import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command
} from '@aws-sdk/client-s3';

const videoQueue = new Queue("videoQueue", {
    connection: { host: "127.0.0.1", port: 6379 }
});

const PROFILE_COLORS = ['#6b21a8', '#0f766e', '#1d4ed8', '#be123c', '#374151'];


export const myVideoService = async (userId) => {
    try {
        const channelIds = await Channel.find({ owner: userId }).select('_id');
        let videos = await Video.find({
            channel: { $in: channelIds.map((channel) => channel._id) },
            status: { $ne: 'deleting' }
        })
            .select('title uploadTime thumbnailPath thumbnailS3Key views status')
            .sort({ uploadTime: -1 });
        videos = await Promise.all(videos.map(addSignedThumbnailToVideo));
        // Add pagination later
        return {
            status: 200,
            success: true,
            message: "Fetched videos",
            data: videos
        }
    } catch (error) {
        console.log("At myVid serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

const getS3KeyFromUrl = (value) => {
    if (!value || !value.startsWith('http')) return null;

    try {
        const url = new URL(value);
        return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    } catch (error) {
        console.warn("Could not parse S3 URL:", value);
        return null;
    }
};

const getProcessedPrefix = (video) => {
    if (video.processedS3Prefix) return video.processedS3Prefix;

    const key = getS3KeyFromUrl(video.m3u8Path);
    if (!key) return null;

    const lastSlash = key.lastIndexOf('/');
    if (lastSlash === -1) return null;

    return key.slice(0, lastSlash + 1);
};

const deleteS3ObjectIfPresent = async (bucket, key, label) => {
    if (!bucket || !key) return;

    try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
        console.warn(`Could not delete ${label} from S3:`, error.message);
    }
};

const deleteS3PrefixIfPresent = async (bucket, prefix) => {
    if (!bucket || !prefix) return;

    try {
        let continuationToken;
        do {
            const listedObjects = await s3Client.send(new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken
            }));

            const objects = (listedObjects.Contents || []).map((item) => ({ Key: item.Key }));
            if (objects.length > 0) {
                await s3Client.send(new DeleteObjectsCommand({
                    Bucket: bucket,
                    Delete: { Objects: objects }
                }));
            }

            continuationToken = listedObjects.IsTruncated ? listedObjects.NextContinuationToken : undefined;
        } while (continuationToken);
    } catch (error) {
        console.warn(`Could not delete processed S3 prefix ${prefix}:`, error.message);
    }
};

const deleteLocalPathIfPresent = async (relativePath) => {
    if (!relativePath || relativePath.startsWith('http')) return;

    try {
        const absolutePath = path.resolve(process.cwd(), relativePath);
        const allowedRoots = [
            path.resolve(process.cwd(), 'uploads'),
            path.resolve(process.cwd(), 'public')
        ];
        const canDelete = allowedRoots.some((root) => (
            absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`)
        ));

        if (!canDelete) {
            console.warn(`Skipping local deletion outside allowed roots: ${relativePath}`);
            return;
        }

        await fs.rm(absolutePath, { recursive: true, force: true });
    } catch (error) {
        console.warn(`Could not delete local path ${relativePath}:`, error.message);
    }
};

export const deleteVideoService = async (userId, videoId) => {
    try {
        const video = await Video.findById(videoId);
        if (!video) {
            return {
                status: 404,
                success: false,
                message: "Video not found",
                data: null
            };
        }

        if (video.uploadedBy.toString() !== userId.toString()) {
            return {
                status: 403,
                success: false,
                message: "You are not allowed to delete this video",
                data: null
            };
        }

        video.status = 'deleting';
        await video.save();

        if (video.transcodeJobId) {
            try {
                const job = await videoQueue.getJob(video.transcodeJobId);
                if (job) await job.remove();
            } catch (error) {
                console.warn(`Could not remove transcode job ${video.transcodeJobId}:`, error.message);
            }
        }

        const rawKey = video.rawS3Key;
        const thumbnailKey = video.thumbnailS3Key || getS3KeyFromUrl(video.thumbnailPath);
        const processedPrefix = getProcessedPrefix(video);

        await Promise.all([
            Liked.deleteMany({ videoId: video._id }),
            WatchLater.deleteMany({ videoId: video._id }),
            History.deleteMany({ videoId: video._id }),
            deleteS3ObjectIfPresent(process.env.AWS_RAW_BUCKET_NAME, rawKey, "raw video"),
            deleteS3ObjectIfPresent(process.env.AWS_THUMBNAILS_BUCKET_NAME, thumbnailKey, "thumbnail"),
            deleteS3PrefixIfPresent(process.env.AWS_PROCESSED_BUCKET_NAME, processedPrefix),
            deleteLocalPathIfPresent(video.folderPath),
            deleteLocalPathIfPresent(video.thumbnailPath),
        ]);

        await Video.deleteOne({ _id: video._id });

        return {
            status: 200,
            success: true,
            message: "Video deleted successfully",
            data: null
        };
    } catch (error) {
        console.log("At delete video serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        };
    }
};

export const watchLaterService = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        // want title , thumbnailPath , uploadTime , views , channel.populate and take channel name
        const watchLater = await WatchLater.find({ user: userId })
            .populate({
                path: 'videoId',
                select: 'title thumbnailPath thumbnailS3Key uploadTime views channel',
                populate: {
                    path: 'channel',
                    select: 'name avatarColor'
                }
            })
            .sort({ savedAt: -1 });
        const existingWatchLater = watchLater.filter((item) => item.videoId);
        const data = await Promise.all(existingWatchLater.map(async (item) => {
            const plainItem = item.toObject();
            return {
                ...plainItem,
                videoId: await addSignedThumbnailToVideo(plainItem.videoId)
            };
        }));

        return {
            status: 200,
            success: true,
            message: "Fetched watch later videos",
            data
        }
    } catch (error) {
        console.log("At watch later serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const historyService = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        const history = await History.find({ user: userId })
            .populate({
                path: 'videoId',
                select: 'title thumbnailPath thumbnailS3Key uploadTime views channel',
                populate: {
                    path: 'channel',
                    select: 'name avatarColor'
                }
            })
            .sort({ watchedAt: -1 });

        const existingHistory = history.filter((item) => item.videoId);
        const data = await Promise.all(existingHistory.map(async (item) => {
            const plainItem = item.toObject();
            return {
                ...plainItem,
                videoId: await addSignedThumbnailToVideo(plainItem.videoId)
            };
        }));

        return {
            status: 200,
            success: true,
            message: "Fetched history videos",
            data
        }
    } catch (error) {
        console.log("At History serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const likedVideoService = async(userId)=> {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        const likedVideos = await Liked.find({ user: userId })
            .populate({
                path: 'videoId',
                select: 'title thumbnailPath thumbnailS3Key uploadTime views channel',
                populate: {
                    path: 'channel',
                    select: 'name avatarColor'
                }
            })
            .sort({ likedAt: -1 });

        const existingLikedVideos = likedVideos.filter((item) => item.videoId);
        const data = await Promise.all(existingLikedVideos.map(async (item) => {
            const plainItem = item.toObject();
            return {
                ...plainItem,
                videoId: await addSignedThumbnailToVideo(plainItem.videoId)
            };
        }));

        return {
            status: 200,
            success: true,
            message: "Fetched liked videos",
            data
        }
    } catch (error) {
        console.log("At liked video serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const updateNameService = async(userId, name) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        user.username = name;

        await user.save();
        return {
            status: 200,
            success: true,
            message: "Name updated successfully",
            data: { name: user.username }
        }
    } catch (error) {
        console.log("At update name serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",   
            data: null
        }
    }   
}

export const updateProfileColorService = async(userId, profileColor) => {
    try {
        if (!PROFILE_COLORS.includes(profileColor)) {
            return {
                status: 400,
                success: false,
                message: "Invalid profile color",
                data: null
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }

        user.profileColor = profileColor;
        await user.save();

        return {
            status: 200,
            success: true,
            message: "Profile color updated successfully",
            data: { profileColor: user.profileColor }
        }
    } catch (error) {
        console.log("At update profile color serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const updateChannelService = async(userId, channelName,channelDescription, channelAvatarColor) => {
    try {
        const channel = await Channel.findOne({ owner: userId });
        if (!channel) {
            return {
                status: 404,
                success: false,
                message: "Channel not found",
                data: null
            }
        }
        
        // check for length > 3 and other validations later
        if(channelName && channelName.length > 3) {
            channel.name = channelName;
        }
        else {
            return {
                status: 400,
                success: false, 
                message: "Invalid channel name",
                data: null
            }
        }
        if(channelDescription && channelDescription.length > 10) {
            channel.description = channelDescription;
        }
        else {
            return {
                status: 400,
                success: false,
                message: "Invalid channel description",
                data: null
            }
        }

        if (channelAvatarColor) {
            if (!PROFILE_COLORS.includes(channelAvatarColor)) {
                return {
                    status: 400,
                    success: false,
                    message: "Invalid channel avatar color",
                    data: null
                }
            }
            channel.avatarColor = channelAvatarColor;
        }


        await channel.save();
        
        return {
            status: 200,
            success: true,
            message: "Channel updated successfully",
            data: {
                name: channel.name,
                description: channel.description,
                avatarColor: channel.avatarColor
            }
        }
    } catch (error) {
        console.log("At update Channel: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",   
            data: null
        }
    }
}

export const profileService = async(userId) => {
    try {
        const user = await User.findById(userId).select('username profileColor');

        if(!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        const channel = await Channel.findOne({ owner: userId }).select('name description avatarColor');

        return {
            status: 200,
            success: true,
            message: "Profile fetched successfully",
            data: {
                username: user.username,
                profileColor: user.profileColor,
                channelName: channel ? channel.name : null,
                channelDescription: channel ? channel.description : null,
                channelAvatarColor: channel ? channel.avatarColor : '#6b21a8'
            }
        }
    } catch (error) {
        console.log("At profile serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",   
            data: null
        }
    }
}


const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
};

export const MailService = async (email, otp) => {
    try {
        const transporter = createTransporter(); // Create it right when needed
        
        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: `Videoplayer Password Reset request- ${new Date().toLocaleTimeString()}`,
            text: `Dear user, Your OTP to reset password is ${otp}. Valid for 10 minutes.`
        });
    } catch (error) {
        console.error('MailService error:', error);
        throw new Error('Failed to send verification email');
    }
};

export const resetPasswordService = async(userId) => {
    try {
        const user = await User.findById(userId).select('email');
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // hash OTP
        const saltRounds = 10;
        const hashedOtp = await bcrypt.hash(otp, saltRounds);

        await PasswordReset.deleteMany({ userId: userId });

        await PasswordReset.create({ userId: userId, otp: hashedOtp });
        
        await MailService(user, otp);

        return {
            status: 200,
            success: true,
            message: "OTP generated and sent to registered email",
            data: null
        }
    } catch (error) {
        console.log("At resetPassword serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const verifyResetService = async(userId, otp) => {
    try {
        const resetRecord = await PasswordReset.findOne({ userId: userId });
        if (!resetRecord) {
            return {    
                status: 404,
                success: false,
                message: "No reset request found",
                data: null
            }
        }   

        const isOtpValid = await bcrypt.compare(otp, resetRecord.otp);

        if (!isOtpValid) {
            return {
                status: 400,
                success: false,
                message: "Invalid OTP",
                data: null
            }
        }
        
        const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
        await PasswordReset.deleteMany({ userId: userId });

        return {
            status: 200,
            success: true,
            message: "Password reset successful",
            data:  token
        }
    } catch (error) {
        console.log("At verifyReset serv: ", error);
        return {    
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }   
}

export const updatePasswordService = async(userId, newPassword,token) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {    
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }   

        // verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.userId !== userId) {
                return {    
                    status: 401,
                    success: false,
                    message: "Unauthorized",
                    data: null
                }
            }
        } catch (err) {
            return {    
                status: 401,
                success: false,
                message: "Invalid or expired token",
                data: null
            }
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();

        return {    
            status: 200,
            success: true,  
            message: "Password updated successfully",
            data: null
        }
    }
    catch (error) {
        console.log("At updatePassword serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}
