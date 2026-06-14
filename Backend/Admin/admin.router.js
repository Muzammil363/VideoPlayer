import express from "express";
import {
    deleteVideoAsAdminController,
    getJobsSummaryController,
    getOverviewController,
    getStorageHealthController,
    getUserDetailController,
    getVideoDetailController,
    listJobsController,
    listUploadSessionsController,
    listUsersController,
    listVideosController,
    retryJobController,
} from "./admin.controller.js";
import { checkAdminToken, requireAdmin } from "./admin.middleware.js";

const router = express.Router();

router.use(checkAdminToken);
router.use(requireAdmin);

router.get("/overview", getOverviewController);

router.get("/users", listUsersController);
router.get("/users/:userId", getUserDetailController);

router.get("/videos", listVideosController);
router.get("/videos/:videoId", getVideoDetailController);
router.delete("/videos/:videoId", deleteVideoAsAdminController);

router.get("/jobs/summary", getJobsSummaryController);
router.get("/jobs", listJobsController);
router.post("/jobs/:jobId/retry", retryJobController);

router.get("/upload-sessions", listUploadSessionsController);
router.get("/storage/health", getStorageHealthController);

export default router;
