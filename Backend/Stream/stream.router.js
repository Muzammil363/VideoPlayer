import express from "express";

import { 
    loadMoreVideosController,
    sendManifest,
    sendSegment,
    sendMasterManifest,
    sendVideo,
    recomendedVideosController,
    SearchVideosController
} from "./stream.controller.js";

import {
    streamMiddleware
} from "./stream.middleware.js";


const router = express.Router();
/*
    Pagination for videos and middleware 
*/

router.get("/recommendedVideos/:videoId", recomendedVideosController);

router.get("/videos/:pageNo", streamMiddleware, loadMoreVideosController);

router.get("/video/:videoId", sendVideo);

router.get("/masterManifest/:videoId",sendMasterManifest); //check whether the requester is allowed or not then rewrite it and send
router.get("/manifest",sendManifest); //validate token and reqrite the output.m3u8 and send it
router.get("/segment",sendSegment); //validate token and send the sengment file

router.get("/search/:query", streamMiddleware, SearchVideosController); //search for videos based on the query and return the results
export default router;