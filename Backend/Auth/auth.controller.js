import {
    LoginService,
    SignupService,
    VerifyEmailService,
    ResendOtpService
} from './auth.service.js';

/*
    Login Controller to handle login requests
*/ 
export const LoginController=async (req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({message:"Email and Password are required"});
    }

    let response=await LoginService(email,password);
    if(response.success) {
        console.log("setting cookie");
        console.log("cookie: ",response.data)
        res.cookie('token', response.data ,{
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        console.log(res.cookie);
    }
    return res.status(response.status).json({success:response.success,message:response.message,data:response.data});
}

/*
    Signup Controller to handle signup requests
*/ 
export const SignupController=async (req,res)=>{
    console.log(req.body);
    const {username,email,password}=req.body
    if(!username || !email || !password){
        return res.status(400).json({message:"Username, Email and Password are required"});
    }

    let response=await SignupService(username,email,password);
    return res.status(response.status).json({
        success:response.success,
        message:response.message,
        data:response.data
    });
}

/*
    Verify Email Controller to handle email verification requests
 */
export const VerifyEmailController=async (req,res)=>{
    const {email,code}=req.body;
    if(!email || !code){
        return res.status(400).json({message:"Email and Code are required"});
    }
    let response=await VerifyEmailService(email,code);
    return res.status(response.status).json({
        success:response.success,
        message:response.message,
        data:response.data
    });
}

/*
    Resend OTP Controller to handle OTP resending requests
*/
export const ResendOtpController=async (req,res)=>{
    const {email,username,password}=req.body;
    if(!email){
        return res.status(400).json({message:"Email is required"});
    }
    let response=await ResendOtpService(email,username,password);
    return res.status(response.status).json({
        success:response.success,
        message:response.message,
        data:response.data
    });
}

export const LogoutController=async (req,res)=>{
    res.clearCookie('token');
    return res.status(200).json({success:true,message:"Logged out successfully",data:null});
}