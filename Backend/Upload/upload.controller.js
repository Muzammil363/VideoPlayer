import Video from '../Models/Video.js';
import { Channel } from '../Models/Channel.js';
import { 
    uploadVideoService,
} from './upload.service.js';

import { Queue } from 'bullmq';

import { 
    PutObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand
 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import crypto from 'crypto';
import { s3Client } from '../Config/awsConfig.js';

const videoQueue = new Queue('videoQueue', {
    connection: { host: '127.0.0.1', port: 6379 }
});

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
            views: 0,
            channel: channel._id,
        });

        await newVideo.save();

        const jobId = `vid_${Date.now()}`;
        const job = await videoQueue.add('transcode', {
            s3Key: videoKey,
            videoId: jobId,
            dbVideoId: newVideo._id,
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
            thumbnailFilename, 
            thumbnailContentType,
            totalChunks
        } = req.body;

        if (!videoContentType?.startsWith('video/') || !thumbnailContentType?.startsWith('image/')) {
            return res.status(400).json({ success: false, error: "Invalid file types." });
        }

        if (!totalChunks || totalChunks < 1) {
            return res.status(400).json({ success: false, error: "totalChunks is required." });
        }

        const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const folderPath = `uploads/${uniqueId}`; 
        const videoKey = `${folderPath}/video_${videoFilename.replace(/\s+/g, '_')}`;
        const thumbnailKey = `${folderPath}/thumb_${thumbnailFilename.replace(/\s+/g, '_')}`;

        const thumbnailCommand = new PutObjectCommand({
            Bucket: process.env.AWS_THUMBNAILS_BUCKET_NAME,
            Key: thumbnailKey,
            ContentType: thumbnailContentType,
        });
        const thumbnailUploadUrl = await getSignedUrl(s3Client, thumbnailCommand, { expiresIn: 3600 });

        const multipartCommand = new CreateMultipartUploadCommand({
            Bucket: process.env.AWS_RAW_BUCKET_NAME,
            Key: videoKey,
            ContentType: videoContentType,
        });

        const multipartUploadResponse = await s3Client.send(multipartCommand);
        const uploadId = multipartUploadResponse.UploadId;

        
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
        
        const partUrls = await Promise.all(partPromises);

        console.log(`Initiated Multipart Upload for: ${videoKey} with ${totalChunks} chunks.`);

        return res.json({
            success: true,
            folderPath,
            video: {
                uploadId,  
                s3Key: videoKey,
                partUrls
            },
            thumbnail: {
                uploadUrl: thumbnailUploadUrl,
                s3Key: thumbnailKey
            }
        });

    } catch (error) {
        console.error("Error initiating upload:", error);
        return res.status(500).json({ success: false, error: "Failed to initiate upload" });
    }
}


export const completeMultipartUploadController = async (req, res) => {
    try {
        const { 
            videoKey, uploadId, parts, 
            title, description, folderPath, thumbnailPath,
            originalName, mimeType, size, genre // Added missing fields
        } = req.body;

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
            genre: genreArray
        });

        await newVideo.save();

        const jobId = `vid_${Date.now()}`;
        const job = await videoQueue.add('transcode', {
            s3Key: videoKey,
            videoId: jobId,
            dbVideoId: newVideo._id,
        });

        console.log(`Job ${job.id} added to queue for video ${jobId}`);

        return res.json({ success: true, message: "Upload complete, processing started!", jobId: job.id });

    } catch (error) {
        console.error("Error completing multipart upload:", error);
        return res.status(500).json({ success: false, error: "Failed to complete upload" });
    }
}