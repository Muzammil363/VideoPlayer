import { getVideoById, getVideos } from './stream.dto.js';
import { isLiked } from './stream.dto.js'
import {User} from '../Models/User.js';

import jwt from "jsonwebtoken";
import fs from 'fs/promises';
import path from 'path';

export const getVideoService = async (token, videoId) => {
    const video = await getVideoById(videoId);
    if (!video) {
        return {
            success: false,
            message: "no video with the given videoId",
        }
    }
    
    if (token === undefined) {
        console.log("token not there while sending video");
        video.isLiked = false;
    } else {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        
        video.isLiked = await isLiked(decoded._id, videoId);
    }
    return {
        success: true,
        message: "video details fetched successfully",
        video: video,
    }
}

export const loadMoreVideosService = async (pageNo , user) => {
    const limit = 20;
    const videos = await getVideos(pageNo);
    
    let fetched;
    if(pageNo == 0) {
        fetched = await User.findById(user._id);
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
    if (!video) {
        return {
            success: false,
            status: 404,
            message: "Video not found",
        };
    }

    try {
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
                return `/stream/manifest?token=${resourceToken}`; //the leading / importance 💀
            }
            // Keep comments and tags as they are
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
