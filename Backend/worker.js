import { Worker } from "bullmq";
import { GetObjectCommand,
     PutObjectCommand, 
    DeleteObjectCommand 
} from "@aws-sdk/client-s3";

import ffmpeg from "fluent-ffmpeg";

import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import Video from "./Models/Video.js";

import { s3Client } from "./Config/awsConfig.js";

import { redisConnection } from "./app.js";


const RAW_BUCKET = process.env.AWS_RAW_BUCKET_NAME; 
const PROCESSED_BUCKET = process.env.AWS_PROCESSED_BUCKET_NAME; 

const cleanupLocalFiles = (localInputPath, localOutputFolder) => {
    if (fs.existsSync(localInputPath)) {
        fs.unlinkSync(localInputPath);
    }

    if (fs.existsSync(localOutputFolder)) {
        fs.rmSync(localOutputFolder, { recursive: true, force: true });
    }
};

const cleanupProcessedFiles = async (processedPrefix, files) => {
    for (const file of files) {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: PROCESSED_BUCKET,
            Key: `${processedPrefix}${file}`,
        });
        await s3Client.send(deleteCommand);
    }
};

const myWorker = new Worker("videoQueue", async (job) => {
    const { s3Key, videoId, dbVideoId } = job.data;

    console.log(`Starting job ${job.id} for video: ${s3Key}`);

    const queuedVideo = await Video.findById(dbVideoId);
    if (!queuedVideo || queuedVideo.status === 'deleting') {
        console.log(`Skipping job ${job.id}; video was deleted before processing.`);
        return { success: false, skipped: true };
    }

    await Video.findByIdAndUpdate(dbVideoId, {
        status: 'processing',
        processingStartedAt: new Date(),
        processingFailedAt: null,
        processingError: null,
    });

    const localInputPath = path.resolve(`./temp/${videoId}-input.mp4`);
    const localOutputFolder = path.resolve(`./temp/${videoId}-output`);
    
    if (!fs.existsSync(localOutputFolder)) {
        fs.mkdirSync(localOutputFolder, { recursive: true });
    }

    try {
        console.log("Downloading raw video");
        const getCommand = new GetObjectCommand({ Bucket: RAW_BUCKET, Key: s3Key });
        const s3Item = await s3Client.send(getCommand);
        await pipeline(s3Item.Body, fs.createWriteStream(localInputPath));

        console.log("Processing video..!");
        await new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .outputOptions([
                    '-profile:v baseline', 
                    '-level 3.0',
                    '-start_number 0',
                    '-hls_time 10',    
                    '-hls_list_size 0', 
                    '-f hls'
                ])
                .output(`${localOutputFolder}/master.m3u8`)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        console.log("Uploading processed files..!");
        const files = fs.readdirSync(localOutputFolder);
        const processedPrefix = `videos/${videoId}/`;

        const currentVideo = await Video.findById(dbVideoId).select('status');
        if (!currentVideo || currentVideo.status === 'deleting') {
            console.log(`Skipping processed upload for job ${job.id}; video was deleted.`);
            cleanupLocalFiles(localInputPath, localOutputFolder);
            return { success: false, skipped: true };
        }

        for (const file of files) {
            const filePath = path.join(localOutputFolder, file);
            const fileStream = fs.createReadStream(filePath);
            
            const putCommand = new PutObjectCommand({
                Bucket: PROCESSED_BUCKET,
                Key: `${processedPrefix}${file}`,
                Body: fileStream,
                ContentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T'
            });
            await s3Client.send(putCommand);
        }

        console.log("Deleting raw video to clean up");
        const deleteCommand = new DeleteObjectCommand({ Bucket: RAW_BUCKET, Key: s3Key });
        await s3Client.send(deleteCommand);

        fs.unlinkSync(localInputPath);
        fs.rmSync(localOutputFolder, { recursive: true, force: true });

        const manifestUrl = `https://${PROCESSED_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/videos/${videoId}/master.m3u8`;
        console.log(`✅ Job ${job.id} Complete! Manifest URL: ${manifestUrl}`);

        const readyVideo = await Video.findById(dbVideoId).select('status');
        if (!readyVideo || readyVideo.status === 'deleting') {
            console.log(`Skipping ready update for job ${job.id}; video was deleted.`);
            await cleanupProcessedFiles(processedPrefix, files);
            return { success: false, skipped: true };
        }

        await Video.findByIdAndUpdate(dbVideoId, {
            m3u8Path: manifestUrl,
            processedS3Prefix: processedPrefix,
            status: 'ready',
            processingCompletedAt: new Date(),
            processingFailedAt: null,
            processingError: null,
        });

        return { success: true, manifestUrl };

    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        
        if (dbVideoId) {
            try {
                const failedVideo = await Video.findById(dbVideoId).select('status');
                if (failedVideo && failedVideo.status !== 'deleting') {
                    await Video.findByIdAndUpdate(dbVideoId, {
                        status: 'failed',
                        processingFailedAt: new Date(),
                        processingError: error.message,
                    });
                }
            } catch (dbError) {
                console.error(`Failed to update DB status for job ${job.id}:`, dbError);
            }
        }
        
        throw error; 
    }
}, 
    // Worker options for retry
    {
        connection: redisConnection,
        maxStalledCount: 2,      
        stalledInterval: 30000,
        lockDuration: 30000,
    }
);

myWorker.on('stalled', (jobId) => {
  console.warn(`[WARNING] Job ${jobId} stalled. auto-retry.`);
});

myWorker.on('completed', (job) => {
  console.log(`Video ${job.data.dbVideoId} processed.`);
});

myWorker.on('failed', async (job, err) => {
  console.error(`Video ${job.data.dbVideoId} failed permanently: ${err.message}`);
  // This is where you would trigger DB status updates to "failed"
    const failedVideo = await Video.findById(job.data.dbVideoId).select('status');
    if (failedVideo && failedVideo.status !== 'deleting') {
        await Video.findByIdAndUpdate(job.data.dbVideoId, {
            status: 'failed',
            processingFailedAt: new Date(),
            processingError: err.message,
        })
    }

});
