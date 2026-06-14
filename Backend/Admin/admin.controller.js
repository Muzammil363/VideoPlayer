import {
    deleteVideoAsAdminService,
    getJobsSummaryService,
    getOverviewService,
    getStorageHealthService,
    getUserDetailService,
    getVideoDetailService,
    listJobsService,
    listUploadSessionsService,
    listUsersService,
    listVideosService,
    retryJobService,
} from "./admin.service.js";

const sendServiceResponse = (res, response) => {
    return res.status(response.status).json({
        success: response.success,
        message: response.message,
        data: response.data,
    });
};

export const getOverviewController = async (req, res) => {
    return sendServiceResponse(res, await getOverviewService());
};

export const listUsersController = async (req, res) => {
    return sendServiceResponse(res, await listUsersService(req.query));
};

export const getUserDetailController = async (req, res) => {
    return sendServiceResponse(res, await getUserDetailService(req.params.userId));
};

export const listVideosController = async (req, res) => {
    return sendServiceResponse(res, await listVideosService(req.query));
};

export const getVideoDetailController = async (req, res) => {
    return sendServiceResponse(res, await getVideoDetailService(req.params.videoId));
};

export const deleteVideoAsAdminController = async (req, res) => {
    return sendServiceResponse(
        res,
        await deleteVideoAsAdminService(req.user._id, req.params.videoId)
    );
};

export const getJobsSummaryController = async (req, res) => {
    return sendServiceResponse(res, await getJobsSummaryService());
};

export const listJobsController = async (req, res) => {
    return sendServiceResponse(res, await listJobsService(req.query));
};

export const retryJobController = async (req, res) => {
    return sendServiceResponse(res, await retryJobService(req.user._id, req.params.jobId));
};

export const listUploadSessionsController = async (req, res) => {
    return sendServiceResponse(res, await listUploadSessionsService(req.query));
};

export const getStorageHealthController = async (req, res) => {
    return sendServiceResponse(res, await getStorageHealthService());
};
