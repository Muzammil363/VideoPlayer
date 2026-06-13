import { myVideoService 
    , watchLaterService
    , historyService,
    likedVideoService,
    updateNameService,
    updateChannelService,
    updateProfileColorService,
    profileService,
    resetPasswordService,
    verifyResetService,
    updatePasswordService,
    deleteVideoService
} from "./user.service.js";

export const myVideoController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = req.user._id // check this once
        let response = await myVideoService(userId);
        
        return res.status(response.status).json({
            success:response.success,
            message:response.message,
            data : response.data
        })
    } catch (error) {
        console.log("at myvidoes: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const deleteVideoController = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { videoId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!videoId) {
            return res.status(400).json({ success: false, message: "Missing video id" });
        }

        const response = await deleteVideoService(userId, videoId);

        return res.status(response.status).json({
            success: response.success,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        console.log("at deleteVideo: ", error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
}

export const watchLaterController = async(req,res)=> {
    try {
        const userId = req.user._id;
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }

        const response = await watchLaterService(userId);

        return res.status(response.status).json({
            success:response.success,
            message: response.message,
            data:response.data
        })
    } catch (error) {
        console.log("at watchLater: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const historyController = async(req,res)=> {
    try {
        const userId = req.user._id;
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }

        let response = await historyService(userId);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data:response.data
        })
    } catch (error) {
        console.log("at history: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const likedVideoController = async(req,res) => {
    try {
        const userId = req.user._id;
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }

        let response = await likedVideoService(userId);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data:response.data
        })
    } catch (error) {
        console.log("at likedVideo: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const updateNameController = async(req,res) => {
    try {
        const userId = req.user._id;
        const {name} = req.body;

        if(!userId || !name) {
            return res.status(400).json({success:false,message:"Missing fields"})
        }

        let response = await updateNameService(userId,name);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data:response.data
        })
    } catch (error) {
        console.log("at updateName: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const updateProfileColorController = async(req,res) => {
    try {
        const userId = req.user._id;
        const { profileColor } = req.body;

        if(!userId || !profileColor) {
            return res.status(400).json({success:false,message:"Missing fields"})
        }

        let response = await updateProfileColorService(userId, profileColor);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data:response.data
        })
    } catch (error) {
        console.log("at updateProfileColor: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const updateChannelController = async(req,res) => {
    try {
        const userId = req.user._id;
        const {channelName,channelDescription, channelAvatarColor} = req.body;

        if(!userId) {
            return res.status(401).json({success:false,message:"Unauthorized"})
        }

        if(!channelName && !channelDescription && !channelAvatarColor) {
            return res.status(400).json({success:false,message:"Invalid request"});
        }
        let response = await updateChannelService(userId,channelName,channelDescription,channelAvatarColor);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data:response.data
        })
    }catch (error) {
        console.log("at likedVideo: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const profileController = async(req,res) => {
    try {
        const userId = req.user._id;
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }

        let response = await profileService(userId);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data:response.data
        })
    } catch (error) {
        console.log("at profile: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}

export const resetPasswordController = async(req,res) => {
    try {
        const userId = req.user._id;
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }
        // Implement password reset logic here (e.g., send OTP, verify OTP, update password)
        const response = await resetPasswordService(userId);

        return res.status(response.status).json({
            success: response.success,
            message:response.message
        })

    } catch (error) {
        console.log("at resetPassword: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }   
}

export const verifyResetController = async(req,res) => {
    try {
        const userId = req.user._id;
    
        const { otp } = req.body 

        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }
        if(!otp || otp.length !== 4) { 
            return res.status(400).json({success:false,message:"Missing fields"})
        }   

        const response = await verifyResetService(userId, otp);

        return res.status(response.status).json({
            success: response.success,
            message:response.message,
            data: response.data
        })
        
    } catch (error) {
        console.log("at verifyReset: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }   
}

export const updatePasswordController = async(req,res) => {
    try {
        const userId = req.user._id;
        const { newPassword,token } = req.body;
        
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized"})
        }
        if(!newPassword || newPassword.length < 6 || !token) {
            return res.status(400).json({success:false,message:"Missing fields"})
        }

        const response = await updatePasswordService(userId, newPassword, token);

        return res.status(response.status).json({
            success: response.success,
            message:response.message
        })
    } catch (error) {
        console.log("at updatePassword: ",error);
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }
}
