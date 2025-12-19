import express from 'express';

import { 
    LoginController,
    SignupController,
    LogoutController,
    VerifyEmailController,
    ResendOtpController
 } from './auth.controller.js';

const router = express.Router();

router.post("/login", LoginController);

router.post("/signup", SignupController);
router.post("/verify-email", VerifyEmailController);
router.post("/resend-otp",ResendOtpController)

router.delete("/logout", LogoutController);

export default router;