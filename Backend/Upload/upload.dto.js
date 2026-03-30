import Video from "../Models/Video.js";

export const addVideoDao = async (file, title, description, masterM3U8, uniqueFolderPath, userId,genre,thumbnailPath,channelId) => {
    console.log(title);
    
    const newVideo = new Video({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        title: title,
        description: description,
        uploadTime: new Date(),
        m3u8Path: masterM3U8,
        folderPath: uniqueFolderPath,
        uploadedBy: userId,
        likesCount: 0,
        genre:genre,
        thumbnailPath: thumbnailPath || null,
        channel:channelId
    });

    return await newVideo.save();
}