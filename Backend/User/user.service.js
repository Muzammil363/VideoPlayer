import Video from '../Models/Video.js'
import { Channel } from '../Models/Channel.js'
import WatchLater from '../Models/WatchLater.js'
import History from '../Models/History.js'
import { User } from '../Models/User.js'
import Liked from '../Models/Liked.js'
import { PasswordReset } from '../Models/PasswordReset.js'

import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';


export const myVideoService = async (userId) => {
    try {
        const channelId = await Channel.find({ owner: userId }).select('_id');
        let videos = await Video.find({ channel: channelId }).select('title uploadTime thumbnailPath views');
        // Add pagination later
        return {
            status: 200,
            success: true,
            message: "Fetched videos",
            data: videos
        }
    } catch (error) {
        console.log("At myVid serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const watchLaterService = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        // want title , thumbnailPath , uploadTime , views , channel.populate and take channel name
        const watchLater = await WatchLater.find({ user: userId })
            .populate({
                path: 'videoId',
                select: 'title thumbnailPath uploadTime views channel',
                populate: {
                    path: 'channel',
                    select: 'name'
                }
            })
            .sort({ savedAt: -1 });
        return {
            status: 200,
            success: true,
            message: "Fetched watch later videos",
            data: watchLater
        }
    } catch (error) {
        console.log("At watch later serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const historyService = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        const history = await History.find({ user: userId })
            .populate({
                path: 'videoId',
                select: 'title thumbnailPath uploadTime views channel',
                populate: {
                    path: 'channel',
                    select: 'name'
                }
            })
            .sort({ watchedAt: -1 });

        return {
            status: 200,
            success: true,
            message: "Fetched history videos",
            data: history
        }
    } catch (error) {
        console.log("At History serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const likedVideoService = async(userId)=> {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        const likedVideos = await Liked.find({ user: userId })
            .populate({
                path: 'videoId',
                select: 'title thumbnailPath uploadTime views channel',
                populate: {
                    path: 'channel',
                    select: 'name'
                }
            })
            .sort({ likedAt: -1 });

        return {
            status: 200,
            success: true,
            message: "Fetched liked videos",
            data: likedVideos
        }
    } catch (error) {
        console.log("At liked video serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const updateNameService = async(userId, name) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        user.username = name;

        await user.save();
        return {
            status: 200,
            success: true,
            message: "Name updated successfully",
            data: { name: user.username }
        }
    } catch (error) {
        console.log("At update name serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",   
            data: null
        }
    }   
}

export const updateChannelService = async(userId, channelName,channelDescription) => {
    try {
        const channel = await Channel.findOne({ owner: userId });
        if (!channel) {
            return {
                status: 404,
                success: false,
                message: "Channel not found",
                data: null
            }
        }
        
        // check for length > 3 and other validations later
        if(channelName && channelName.length > 3) {
            channel.name = channelName;
        }
        else {
            return {
                status: 400,
                success: false, 
                message: "Invalid channel name",
                data: null
            }
        }
        if(channelDescription && channelDescription.length > 10) {
            channel.description = channelDescription;
        }
        else {
            return {
                status: 400,
                success: false,
                message: "Invalid channel description",
                data: null
            }
        }


        await channel.save();
        
        return {
            status: 200,
            success: true,
            message: "Channel updated successfully",
            data: {
                name: channel.name,
                description: channel.description
            }
        }
    } catch (error) {
        console.log("At update Channel: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",   
            data: null
        }
    }
}

export const profileService = async(userId) => {
    try {
        const user = await User.findById(userId).select('username');

        if(!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }
        const channel = await Channel.findOne({ owner: userId }).select('name description');

        return {
            status: 200,
            success: true,
            message: "Profile fetched successfully",
            data: {
                username: user.username,
                channelName: channel ? channel.name : null,
                channelDescription: channel ? channel.description : null
            }
        }
    } catch (error) {
        console.log("At profile serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",   
            data: null
        }
    }
}


const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
};

export const MailService = async (email, otp) => {
    try {
        const transporter = createTransporter(); // Create it right when needed
        
        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: `Videoplayer Password Reset request- ${new Date().toLocaleTimeString()}`,
            text: `Dear user, Your OTP to reset password is ${otp}. Valid for 10 minutes.`
        });
    } catch (error) {
        console.error('MailService error:', error);
        throw new Error('Failed to send verification email');
    }
};

export const resetPasswordService = async(userId) => {
    try {
        const user = await User.findById(userId).select('email');
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // hash OTP
        const saltRounds = 10;
        const hashedOtp = await bcrypt.hash(otp, saltRounds);

        await PasswordReset.deleteMany({ userId: userId });

        await PasswordReset.create({ userId: userId, otp: hashedOtp });
        
        await MailService(user, otp);

        return {
            status: 200,
            success: true,
            message: "OTP generated and sent to registered email",
            data: null
        }
    } catch (error) {
        console.log("At resetPassword serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}

export const verifyResetService = async(userId, otp) => {
    try {
        const resetRecord = await PasswordReset.findOne({ userId: userId });
        if (!resetRecord) {
            return {    
                status: 404,
                success: false,
                message: "No reset request found",
                data: null
            }
        }   

        const isOtpValid = await bcrypt.compare(otp, resetRecord.otp);

        if (!isOtpValid) {
            return {
                status: 400,
                success: false,
                message: "Invalid OTP",
                data: null
            }
        }
        
        const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
        await PasswordReset.deleteMany({ userId: userId });

        return {
            status: 200,
            success: true,
            message: "Password reset successful",
            data:  token
        }
    } catch (error) {
        console.log("At verifyReset serv: ", error);
        return {    
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }   
}

export const updatePasswordService = async(userId, newPassword,token) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {    
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }   

        // verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.userId !== userId) {
                return {    
                    status: 401,
                    success: false,
                    message: "Unauthorized",
                    data: null
                }
            }
        } catch (err) {
            return {    
                status: 401,
                success: false,
                message: "Invalid or expired token",
                data: null
            }
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();

        return {    
            status: 200,
            success: true,  
            message: "Password updated successfully",
            data: null
        }
    }
    catch (error) {
        console.log("At updatePassword serv: ", error);
        return {
            status: 500,
            success: false,
            message: "Service error",
            data: null
        }
    }
}