import path from 'path';
import { segmentToHLS } from './utils/ffmpeg.js';
import { addVideoDao } from './upload.dto.js'

export const uploadVideoService = async (storedFileName, uniqueFolderPath, file, title, description, userId, genre, thumbnailFile) => {
    console.log("userId: ",userId);
    const inputPath = path.join(uniqueFolderPath, storedFileName);
    const masterM3U8 = await segmentToHLS(inputPath, uniqueFolderPath);

    console.log(thumbnailFile.path);
    
    return await addVideoDao(file, title, description, masterM3U8, uniqueFolderPath, userId, genre, thumbnailFile.path);
}