import {
    sendManifestService,
    sendSegmentService,
    loadMoreVideosService,
    getVideoService,
    sendMasterManifestService
} from "./stream.service.js";

export const loadMoreVideosController = async (req, res) => {
    const { pageNo } = req.params;
    if (pageNo < 0 || pageNo === undefined) {
        return res.status(400).json({
            success: false,
            error: "pageNo cannot be negative"
        });
    }
    const response = await loadMoreVideosService(pageNo);
    console.log("response :", response.videos)
    if (!response.success) {
        return res.status(500).json({
            success: false,
            error: "internal server error on sendVideos in stream.controller.js"
        });
    }
    return res.status(200).json({
        success: true,
        message: "videos fetched successfully",
        videos: response.videos,
        hasNext: response.hasNext,
    });
}

export const sendVideo = async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        return res.status(400).json({
            error: "videoId is not coming",
        });
    }
    const token = req.cookies.token;
    const response = await getVideoService(token, videoId);
    if (!response.success) {
        return res.status(400).json({
            success: false,
            error: response.message,
        });
    }
    return res.status(200).json({
        success: true,
        message: response.message,
        video: response.video,
    });
}

export const sendMasterManifest = async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: "videoId cannot be undefined"
            });
        }

        // Pass the user's auth token (if it exists) to the service for validation
        const response = await sendMasterManifestService(videoId, req.cookies.token);

        if (!response.success) {
            return res.status(response.status).json({
                success: false,
                error: response.message,
            });
        }

        // Set the content type required by HLS players
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        // Send the modified manifest string as the response
        return res.send(response.manifestContent);

    } catch (error) {
        console.log("Server Error in sendMasterManifest: " + error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
}

export const sendManifest = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: "token not found",
            });
        }
        const response = await sendManifestService(token);
        if (!response.success) {
            return res.status(response.status).json({
                success: false,
                error: response.message,
            });
        }

        // Set the content type required by HLS players
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        // Send the modified manifest string as the response
        return res.send(response.manifestContent);

    } catch (error) {
        console.log("Server Error in sendManifest: " + error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
}

export const sendSegment = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: "token not found",
            });
        }
        const response = await sendSegmentService(token);
        if (!response.success) {
            return res.status(response.status).json({
                success: false,
                error: response.message,
            });
        }
        res.sendFile(response.path) //i dont know whether this is correct or not
    } catch (error) {
        console.log("Server Error in sendSegment: " + error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
}
