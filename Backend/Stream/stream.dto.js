import Video from "../Models/Video"

export const getVideoById= async (videoId) => {
    return await Video.findById(videoId);
}

export const getVideos = async (pageNo) => {
    try {
        const limit = 20;
        const skip = pageNo * limit;
        return await Video.find().skip(skip).limit(limit + 1); //fetching one extra to check whether next page is there or not
    } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
    }   
}

// needs to be changed ,Seperate schema for Likes
export const isLiked = async (userId, videoId) => {
    try {
        const video = await Video.findById(videoId);    
        if (!video) {
            return false;
        }
        return video.likes.includes(userId);
    } catch (error) {
        console.error("Error checking if video is liked:", error);
        return false;
    }   
}