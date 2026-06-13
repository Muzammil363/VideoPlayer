import Video from "../Models/Video.js"
import Liked from "../Models/Liked.js"
import watchLater from "../Models/WatchLater.js"
import { addSignedThumbnailToVideo } from "../Utils/thumbnailUrl.js"
import { backfillVideoViewsFromHistory } from "../Utils/viewCounts.js"

export const getVideoById= async (videoId) => {
    const video = await Video.findById(videoId).populate('channel', 'name avatarColor');
    await backfillVideoViewsFromHistory(video);
    return await addSignedThumbnailToVideo(video);
}

export const getVideos = async (pageNo) => {
    try {
        const limit = 20;
        const skip = pageNo * limit;
        const videos = await Video.find({ status: 'ready' }).populate('channel','name avatarColor').skip(skip).limit(limit + 1); //fetching one extra to check whether next page is there or not
        await Promise.all(videos.map(backfillVideoViewsFromHistory));
        return await Promise.all(videos.map(addSignedThumbnailToVideo));
    } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
    }   
}

export const isLiked = async (userId, videoId) => {
    try {
        const video = await Video.findById(videoId);    
        if (!video) {
            return false;
        }
        const likedDoc = await Liked.findOne({user:userId,videoId:videoId});
        return likedDoc != null;
    } catch (error) {
        console.error("Error checking if video is liked:", error);
        return false;
    }   
}

export const isSaved = async (userId,videoId) => {
    try {
        const video = await Video.findById(videoId);    
        if (!video) {
            return false;
        }

        const savedDoc = await watchLater.findOne({user:userId,videoId:videoId});
        return savedDoc != null;
    } catch (error) {
        console.error("Error checking if video is liked:", error);
        return false;
    }   
}
