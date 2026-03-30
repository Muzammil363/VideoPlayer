import { User } from '../Models/User.js'
import watchLater from '../Models/WatchLater.js'
import Video from '../Models/Video.js'
import History from '../Models/History.js'
import Liked from '../Models/Liked.js'
import { Channel } from '../Models/Channel.js'

export const watchLaterService = async (userId, videoId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
            };
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return {
                status: 404,
                success: false,
                message: "Video not found",
            };
        }

        const existingEntry = await watchLater.findOne({ user: userId, videoId: videoId });
        if (existingEntry) {
            await watchLater.deleteOne({ user: userId, videoId: videoId });

            return {
                status: 400,
                success: false,
                message: "Video is already in your Watch Later list",
            };
        }

        const newWatchLater = await watchLater.create({
            user: userId,
            videoId: videoId,
            savedAt: new Date()
        });

        return {
            status: 201,
            success: true,
            message: "Video added to Watch Later",
            data: newWatchLater
        };

    } catch (error) {
        console.error("Watch Later Service Error:", error);
        return {
            status: 500,
            success: false,
            message: "Internal server error while saving to Watch Later",
        };
    }
};

export const historyService = async (userId, videoId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
            };
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return {
                status: 404,
                success: false,
                message: "Video not found",
            };
        }

        const existingEntry = await History.findOne({ user: userId, videoId: videoId });
        if (existingEntry) {
            existingEntry.watchedAt = new Date();
            await existingEntry.save();
            return {
                status: 200,
                success: true,
                message: "Video watch time updated in History",
            };
        }
        const newHistory = await History.create({
            user: userId,
            videoId: videoId,
            watchedAt: new Date()
        });
        return {
            status: 201,
            success: true,
            message: "Video added to History",
            data: newHistory
        };
    } catch (error) {
        console.error("History Service Error:", error);
        return {
            status: 500,
            success: false,
            message: "Internal server error while saving to History",
        };
    }
}

export const likeService = async (userId, videoId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
            };
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return {
                status: 404,
                success: false,
                message: "Video not found",
            };
        }

        const existingEntry = await Liked.findOne({ user: userId, videoId: videoId });
        if (existingEntry) {
            await Liked.deleteOne({ _id: existingEntry._id });
            video.likesCount = video.likesCount - 1;
            video.save();

            return {
                status: 400,
                success: false,
                liked: false,
                message: "Like removed from the video"
            }
        }
        try {
            const newLike = await Liked.create({
                user: userId,
                videoId: videoId,
                likedAt: new Date()
            });

            video.likesCount = video.likesCount + 1;
            video.save();
            
        } catch (error) {
            console.log("Error while creating like");
            return {
                status: 500,
                success: false,
                message: "Internal server error while liking the video",
            }
        }
        return {
            status: 201,
            success: true,
            liked: true,
            message: "Video liked successfully",
        };
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Internal server error while liking the video",
        }
    }
}

export const subscribeService = async (userId, channelId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
            };
        }

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return {
                status: 404,
                success: false,
                message: "Channel not found",
            };
        }

        const existingEntry = await Channel.findOne({ user: userId, channelId: channelId });
        if (existingEntry) {
            await Channel.deleteOne({ _id: existingEntry._id });
            return {
                status: 200,
                success: true,
                subscribed: false,
                message: "Subscription removed from the channel"
            }
        }
        const newSubscribe = await Channel.create({
            user: userId,
            channelId: channelId,
            subscribedAt: new Date()
        });
        return {
            status: 201,
            success: true,
            subscribed: true,
            message: "Channel subscribed successfully",
        };
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Internal server error while liking the video",
        }
    }
}