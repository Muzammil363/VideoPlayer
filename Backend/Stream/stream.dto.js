import Video from "../Models/Video.js"
import Liked from "../Models/Liked.js"
import watchLater from "../Models/WatchLater.js"

export const getVideoById= async (videoId) => {
    return await Video.findById(videoId);
}

export const getVideos = async (pageNo) => {
    try {
        const limit = 20;
        const skip = pageNo * limit;
        return await Video.find().populate('channel','name').skip(skip).limit(limit + 1); //fetching one extra to check whether next page is there or not
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
