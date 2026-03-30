import express from 'express'

import { 
    watchLaterController,
    historyController,
    likeController,
    subscribeController
 } from './videoControl.controller.js';

import { 
    checkToken,
    requireUser
 } from  '../Upload/upload.middleware.js'


const router = express.Router();
router.use(checkToken);
router.use(requireUser);

// save to watch later
router.post("/watch-later/:videoId",watchLaterController);
// save to history
// this should not be there when user streams automatically save 
router.post("/history/:videoId",historyController);
// save likes
router.post("/like/:videoId",likeController);
// handle subscribes
router.post("/subscribe/:channelId",subscribeController);

export default router;