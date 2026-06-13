import path from 'path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../Config/awsConfig.js';

const THUMBNAIL_URL_EXPIRES_IN = 60 * 60;

const getS3KeyFromUrl = (value) => {
    if (!value || !value.startsWith('http')) return null;

    try {
        const url = new URL(value);
        return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    } catch (error) {
        console.warn("Could not parse thumbnail URL:", value);
        return null;
    }
};

const getLocalThumbnailUrl = (value) => {
    if (!value || value.startsWith('http')) return null;

    const filename = path.basename(value.replaceAll('\\', '/'));
    if (!filename) return null;

    return `http://localhost:3000/thumbnails/${encodeURIComponent(filename)}`;
};

export const getSignedThumbnailUrl = async (video) => {
    if (!video) return null;

    const thumbnailKey = video.thumbnailS3Key || getS3KeyFromUrl(video.thumbnailPath);
    if (thumbnailKey && process.env.AWS_THUMBNAILS_BUCKET_NAME) {
        try {
            return await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                    Bucket: process.env.AWS_THUMBNAILS_BUCKET_NAME,
                    Key: thumbnailKey,
                }),
                { expiresIn: THUMBNAIL_URL_EXPIRES_IN }
            );
        } catch (error) {
            console.warn("Could not sign thumbnail URL:", error.message);
        }
    }

    return getLocalThumbnailUrl(video.thumbnailPath) || video.thumbnailPath || null;
};

export const addSignedThumbnailToVideo = async (video) => {
    if (!video) return video;

    const plainVideo = typeof video.toObject === 'function' ? video.toObject() : video;
    const thumbnailUrl = await getSignedThumbnailUrl(plainVideo);

    return {
        ...plainVideo,
        thumbnailPath: thumbnailUrl,
        thumbnailUrl,
    };
};
