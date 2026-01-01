import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import  {User}  from '../Models/User.js';
import { PendingUser } from '../Models/PendingUser.js';
import nodemailer from 'nodemailer';

import {
    comparePasswords,
    generateToken
} from './auth.utils.js';

/*
   Login service with email and password
*/
export const LoginService = async (email, password) => {
    try {
        let user = await User.findOne({ email: email });
        if (!user) {
            return {
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }
        }

        if (await comparePasswords(password, user.password)) {
            const token = await generateToken(user._id , user.username);
            return {
                status: 200,
                success: true,
                message: "Login successful",
                data: token
            }
        } else {
            return {
                status: 401,
                success: false,
                message: "Invalid credentials",
                data: null
            }
        }
    } catch (error) {
        console.log("At login service: ", error);
        return {
            status: 500,
            success: false,
            message: "Internal Service Error",
            data: null
        }
    }
}
/*
    Signup service with email validation
    Generates and sends OTP to user's email for verification
*/
export const SignupService = async (username, email, password) => {
    try {
        let user = await User.findOne({ email: email });
        if (user) {
            return {
                status: 409,
                success: false,
                message: "User already exists",
                data: null
            }
        }

        await PendingUser.deleteOne({ email: email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = crypto.randomInt(100000, 999999).toString();
        const otp_salt = await bcrypt.genSalt(5);
        const hashedOTP = await bcrypt.hash(otp, otp_salt);

        let pendingUser = null;
        try {
            pendingUser = await PendingUser.create({
                username: username,
                email: email,
                password: hashedPassword,
                otp: hashedOTP
            });
        } catch (error) {
            console.log("At pending user : ", error);
            return {
                status: 500,
                success: false,
                message: "User already exists in pending users",
                data: null
            }
        }

        await MailService(email, otp);

        return {
            status: 201,
            success: true,
            message: "Email verification OTP sent",
            data: pendingUser.email
        }
    } catch (error) {
        console.log("At signup service: ", error);
        return {
            status: 500,
            success: false,
            message: "Internal Service Error",
            data: null
        }
    }
}

/*
    Verify Email service with OTP
 */
export const VerifyEmailService = async (email, code) => {
    try {
        const pendingUser = await PendingUser.findOne({ email: email });
        if (!pendingUser) {
            const user = await User.findOne({ email });
            if (user) {
                const token = await generateToken(user._id,user.username);
                return {
                    status: 200,
                    success: true,
                    message: "Email already verified",
                    data: token
                }
            }

            return {
                status: 404,
                success: false,
                message: "Verification expired",
                data: null
            }
        }

        if (await comparePasswords(code, pendingUser.otp)) {
            try {
                const user = await User.create({
                    username: pendingUser.username,
                    email: pendingUser.email,
                    password: pendingUser.password
                });

                await PendingUser.deleteOne({ email: email });

                const token = await generateToken(user.email);
                return {
                    status: 200,
                    success: true,
                    message: "Email verified successfully",
                    data: token
                }
            } catch (error) {
                if (error.code === 11000) {
                    const token = await generateToken(email);
                    return {
                        status: 200,
                        success: true,
                        message: "Email already verified",
                        data: token
                    }
                }

                throw error;
            }
        }
        else {
            return {
                status: 401,
                success: false,
                message: "Invalid OTP",
                data: null
            }
        }
    } catch (error) {
        console.log("At verify email service: ", error);
        return {
            status: 500,
            success: false,
            message: "Internal Service Error",
            data: null
        }
    }
}

/*
    Resend OTP service for email verification
*/
export const ResendOtpService = async (email) => {
    try {
        const pendingUser = await PendingUser.findOne({ email });

        if (!pendingUser) {
            return {
                status: 404,
                success: false,
                message: "Verification expired. Please signup again.",
                data: null
            };
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otp_salt = await bcrypt.genSalt(5);
        const hashedOTP = await bcrypt.hash(otp, otp_salt);

        pendingUser.otp = hashedOTP;
        pendingUser.createdAt = new Date(); 
        await pendingUser.save();

        await MailService(email, otp);

        return {
            status: 200,
            success: true,
            message: "OTP resent successfully",
            data: null
        };
    } catch (error) {
        console.log("At resend OTP service:", error);
        return {
            status: 500,
            success: false,
            message: "Internal Service Error",
            data: null
        };
    }
};

/*
    Mail Service to send OTP to user's email
    transporter configuration using nodemailer
*/
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
            subject: `Verify your account - ${new Date().toLocaleTimeString()}`,
            text: `Your OTP is ${otp}. Valid for 10 minutes.`
        });
    } catch (error) {
        console.error('MailService error:', error);
        throw new Error('Failed to send verification email');
    }
};