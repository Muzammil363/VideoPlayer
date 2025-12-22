import { 
    uploadVideoService,
} from './upload.service.js';

export const uploadVideoController = async (req, res) => {
    try {
        let { title, description, genre } = req.body;
        if (!description || !title || !genre) {
            throw new Error("description or title or genre is not coming from req.body");
        }
        // console.log(genre);
        genre = JSON.parse(genre);
        
        const { storedFileName, uniqueFolderPath, files } = req;
        const file = files?.video?.[0];
        if (!storedFileName || !uniqueFolderPath || !file) {
            throw new Error("storedFileName or uniqueFolderPath or file is not coming from req");
        }
        const newVideo = await uploadVideoService(storedFileName, uniqueFolderPath, file, title, description, req.user._id, genre, req.files.thumbnail?.[0]);

        return res.status(201).json({
            success: true,
            message: "Video uploaded and processed successfully.",
            m3u8Url: newVideo.m3u8Path,
            videoId: newVideo._id,
        });

    } catch (err) {
        console.error("Upload Handler Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};