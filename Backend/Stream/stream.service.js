import { getVideoById, getVideos } from './stream.dto.js';
import { isLiked,isSaved } from './stream.dto.js'
import {User} from '../Models/User.js';
import Video from '../Models/Video.js';
import { historyService } from '../VideoControls/videoControl.service.js';
import { addSignedThumbnailToVideo } from '../Utils/thumbnailUrl.js';
import { backfillVideoViewsFromHistory } from '../Utils/viewCounts.js';
import { s3Client } from '../Config/awsConfig.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

import jwt from "jsonwebtoken";
import fs from 'fs/promises';
import path from 'path';

const getS3KeyFromUrl = (value) => {
    if (!value || !value.startsWith('http')) return null;

    try {
        const url = new URL(value);
        return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    } catch (error) {
        return null;
    }
};

const getParentS3Prefix = (key) => {
    const index = key.lastIndexOf('/');
    return index === -1 ? '' : key.slice(0, index + 1);
};

const joinS3Key = (prefix, value) => {
    if (value.startsWith('http')) return getS3KeyFromUrl(value);
    return `${prefix}${value.replace(/^\/+/, '')}`.replaceAll('\\', '/');
};

const getS3TextObject = async (key) => {
    const response = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.AWS_PROCESSED_BUCKET_NAME,
        Key: key,
    }));

    return await response.Body.transformToString();
};

const rewriteS3Manifest = (manifestContent, currentKey) => {
    const prefix = getParentS3Prefix(currentKey);

    return manifestContent.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        const s3Key = joinS3Key(prefix, trimmed);
        if (!s3Key) return line;

        const route = s3Key.endsWith('.m3u8') ? '/stream/manifest' : '/stream/segment';
        const resourceToken = jwt.sign(
            { s3Key },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return `${route}?token=${resourceToken}`;
    }).join('\n');
};

export const getVideoService = async (token, videoId) => {
    let video = await getVideoById(videoId);
    if (!video || video.status !== 'ready') {
        return {
            success: false,
            message: "no video with the given videoId",
        }
    }
    let liked = false;
    let saved = false;

    if (token === undefined) {
        console.log("token not there while sending video");
        liked = false;
        saved = false;
    } else {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("in get video service: ",decoded);
        
        liked = await isLiked(decoded._id, videoId) != null;
        saved = await isSaved(decoded._id, videoId) != null;
        await historyService(decoded._id,videoId);
        video = await getVideoById(videoId);
    }
    return {
        success: true,
        message: "video details fetched successfully",
        video: video,
        isLiked:liked,
        isSaved:saved
    }
}

export const loadMoreVideosService = async (pageNo , user) => {
    const limit = 20;
    const videos = await getVideos(pageNo);
    
    let fetched=null;
    if(pageNo == 0 && user) {
        fetched = await User.findById(user._id).select('username profileColor');
    }
    return {
        success: true,
        videos: videos,
        user: fetched,
        hasNext: (videos.length > limit),
    }
}

export const sendMasterManifestService = async (videoId, userAuthToken) => {
    const video = await getVideoById(videoId);
    if (!video || video.status !== 'ready') {
        return {
            success: false,
            status: 404,
            message: "Video not found",
        };
    }
    
    try {
        const s3ManifestKey = video.processedS3Prefix
            ? `${video.processedS3Prefix}master.m3u8`
            : getS3KeyFromUrl(video.m3u8Path);

        if (s3ManifestKey && process.env.AWS_PROCESSED_BUCKET_NAME) {
            const manifestContent = await getS3TextObject(s3ManifestKey);
            return {
                success: true,
                manifestContent: rewriteS3Manifest(manifestContent, s3ManifestKey),
            };
        }

        // --- File Reading Step ---
        // Construct the path to the original master manifest file
        const manifestPath = path.join(process.cwd(), video.m3u8Path);
        console.log("manifest path: " + manifestPath);
        const manifestContent = await fs.readFile(manifestPath, 'utf8');

        // --- URL Rewriting Step ---
        const lines = manifestContent.split('\n');
        const modifiedLines = lines.map(line => {
            // Only modify lines that are not comments/tags (i.e., they are URLs)
            if (line.trim() && !line.startsWith('#')) {
                // The resource path for this specific variant playlist
                const resourcePath = path.join(video.folderPath, line.trim());

                // Create a JWT for this specific resource
                const resourceToken = jwt.sign(
                    { resource: resourcePath },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' } // This playlist can be accessed for 24 hours
                );

                // Construct the new, absolute, signed URL
                // Note: The token is passed as a query parameter to your /manifest endpoint
                const route = line.trim().endsWith('.m3u8') ? '/stream/manifest' : '/stream/segment';
                return `${route}?token=${resourceToken}`;
            }
            return line;
        });

        const modifiedManifest = modifiedLines.join('\n');

        return {
            success: true,
            manifestContent: modifiedManifest,
        };

    } catch (error) {
        console.error("Error processing manifest:", error);
        return { success: false, status: 500, message: "Could not process video manifest." };
    }
};

export const sendManifestService = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.s3Key) {
            const manifestContent = await getS3TextObject(decoded.s3Key);
            return {
                success: true,
                manifestContent: rewriteS3Manifest(manifestContent, decoded.s3Key),
            };
        }

        const manifestPath = path.join(process.cwd(), decoded.resource);
        const manifestContent = await fs.readFile(manifestPath, 'utf8');

        const lines = manifestContent.split('\n');
        const modifiedLines = lines.map(line => {
            if (line.trim() && !line.startsWith('#')) {
                const resourcePath = path.join(path.dirname(decoded.resource), line.trim());
                const resourceToken = jwt.sign(
                    { resource: resourcePath },
                    process.env.JWT_SECRET,
                    { expiresIn: '5m' }
                );
                return `/stream/segment?token=${resourceToken}`; //the leading / is important --<
            }
            return line;
        });

        const modifiedManifest = modifiedLines.join('\n');

        return {
            success: true,
            manifestContent: modifiedManifest,
        };
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return { success: false, status: 403, message: "Invalid or expired token." };
        }
        console.error("Error processing manifest:", error);
        return { success: false, status: 500, message: "Could not process video manifest." };
    }
}

export const sendSegmentService = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.s3Key) {
            const segment = await s3Client.send(new GetObjectCommand({
                Bucket: process.env.AWS_PROCESSED_BUCKET_NAME,
                Key: decoded.s3Key,
            }));

            return {
                success: true,
                body: segment.Body,
                contentType: decoded.s3Key.endsWith('.m3u8')
                    ? 'application/vnd.apple.mpegurl'
                    : 'video/MP2T',
            };
        }

        const relativePath = decoded.resource;
        const absolutePath = path.join(process.cwd(), relativePath);

        await fs.access(absolutePath);
        return {
            success: true,
            path: absolutePath // Send the absolute path back to the controller
        };

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return { success: false, status: 403, message: "Invalid or expired token." };
        }
        if (error.code === 'ENOENT') {
            return { success: false, status: 404, message: "Segment not found." };
        }
        console.error("Error in sendSegmentService:", error);
        return { success: false, status: 500, message: "Internal server error." };
    }
};


export const recomendedVideoService = async (videoId) => {
    try {
        const video = await getVideoById(videoId);
        if (!video) {
            return { success: false, status: 404, message: "Video not found" };
        }

        const genres = Array.isArray(video.genre) ? video.genre : (video.genre ? [video.genre] : []);
        console.log("genres: ",genres);
        
        const videosByGenre = {};

        for (const g of genres) {
            const vids = await Video.find({
                    genre: g,
                    _id: { $ne: video._id },
                    status: 'ready'
                })
                .sort({ uploadTime: -1 })
                .limit(5)
                .select('_id title likesCount views thumbnailPath thumbnailS3Key channel')
                .populate({ path: 'channel', select: 'name avatarColor' });

            await Promise.all(vids.map(backfillVideoViewsFromHistory));
            const signedVideos = await Promise.all(vids.map(addSignedThumbnailToVideo));
            videosByGenre[g] = signedVideos.map(v => ({
                _id: v._id,
                title: v.title,
                likesCount: v.likesCount,
                views: v.views,
                thumbnailPath: v.thumbnailPath,
                thumbnailUrl: v.thumbnailUrl,
                channel: v.channel ? {
                    _id: v.channel._id,
                    name: v.channel.name,
                    avatarColor: v.channel.avatarColor
                } : null
            }));
        }

        console.log("Recommended videos by genre: ", videosByGenre);
        
        return { 
            success: true, 
            status: 200,
            message: "Recommended videos fetched", 
            videos: videosByGenre
        };
    } catch (error) {
        console.error("Error in recomendedVideoService:", error);
        return { success: false, status: 500, message: "Internal server error." };
    }
}

export const SearchVideosService = async (query,pageNo = 0) => {
    try {
        const limit = 20;
        const page = Number.isInteger(Number(pageNo)) ? Number(pageNo) : 0;
        const videos = await Video.find({
                title: { $regex: query, $options: 'i' },
                status: 'ready'
            })
            .sort({ uploadTime: -1 })
            .skip(page * limit)
            .limit(limit)
                .select('_id title description likesCount views uploadTime thumbnailPath thumbnailS3Key channel')
                .populate({ path: 'channel', select: 'name avatarColor' });
        await Promise.all(videos.map(backfillVideoViewsFromHistory));
        const signedVideos = await Promise.all(videos.map(addSignedThumbnailToVideo));
        const formattedVideos = signedVideos.map(v => ({
            _id: v._id,
            title: v.title, 
            description: v.description,
            likesCount: v.likesCount,
            views: v.views,
            uploadTime: v.uploadTime,
            thumbnailPath: v.thumbnailPath,
            thumbnailUrl: v.thumbnailUrl,
            channel: v.channel ? {
                _id: v.channel._id,
                name: v.channel.name,
                avatarColor: v.channel.avatarColor
            } : null
        }));
        console.log("formatted: ",formattedVideos);
        return {
            success: true,
            status: 200,
            message: "Search results fetched",
            videos: formattedVideos,
            hasNext: (videos.length === limit)
        };
    } catch (error) {
        console.error("Error in SearchVideosService:", error);
        return { success: false, status: 500, message: "Internal server error." };
    }
}
