import express from "express"

import { checkToken,requireUser } from "./user.middleware.js";

import { myVideoController,
    watchLaterController,
    historyController,
    likedVideoController,
    updateNameController,
    updateProfileColorController,
    updateChannelController,
    profileController,
    resetPasswordController,
    verifyResetController,
    updatePasswordController,
    deleteVideoController
} from "./user.controller.js";

const router = express.Router();

router.use(checkToken);
router.use(requireUser);

// get profile details
router.get("/profile",profileController);
router.get("/myVideos",myVideoController)
router.delete("/videos/:videoId", deleteVideoController);
// get watch later
router.get("/watch-later",watchLaterController);
// get history
router.get("/history",historyController);

router.get("/liked-videos",likedVideoController);
// update channel
router.post("/updateChannel",updateChannelController);
// update name 
router.post("/updatename",updateNameController);
router.post("/profile-color", updateProfileColorController);
// reset password 

router.put("/reset-password",resetPasswordController);

router.post("/verify-reset", verifyResetController);

// update password 
router.put("/update-password",updatePasswordController);

export default router;
