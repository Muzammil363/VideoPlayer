import {
    watchLaterService,
    historyService,
    likeService,
    subscribeService
} from './videoControl.service.js'

export const watchLaterController = async (req,res) => {
    try {
        const videoId = req.params.videoId;
        const userId = req.user._id;

        if(!userId || !videoId) {
            return res.status(400).json({
                success:false,
                message:"Missing fields"
            })
        }

        let response = await watchLaterService(userId,videoId);
        return res.status(response.status).json({
            success:response.success,
            message:response.message
        })
    } catch (error) {
        console.log("At watchlater :",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

export const historyController = async(req,res) => {
    try {
        const userId = req.user._id;
        const videoId = req.params.videoId;

        if(!userId || !videoId) {
            return res.status(400).json({
                success:false,
                message:"Missing fields"
            })
        }

        let response = await historyService(userId,videoId);
        return res.status(response.status).json({
            success:response.success,
            message:response.message
        })
    } catch (error) {
        console.log("At History controller:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}   

export const likeController = async(req,res)=> {
    try {
        const userId = req.user._id;
        const videoId = req.params.videoId;

        if(!userId || !videoId) {
            return res.status(400).json({
                success:false,
                message:"Missing fields"
            })
        }

        let response = await likeService(userId,videoId);
        return res.status(response.status).json({
            success:response.success,
            message:response.message
        })
    } catch (error) {
        
    }
}

export const subscribeController = async(req,res) => {
    try {
        const userId = req.user._id;
        const channelId = req.params.channelId;

        if(!userId || !channelId) {
            return res.status(400).json({
                success:false,
                message:"Missing fields"
            })
        }

        let response = await subscribeService(userId,channelId);
        return res.status(response.status).json({
            success:response.success,
            message:response.message
        })
    } catch (error) {
        
    }
}