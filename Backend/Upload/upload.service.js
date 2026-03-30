import path from 'path';
import { segmentToHLS } from './utils/ffmpeg.js';
import { addVideoDao } from './upload.dto.js'

import {Channel} from '../Models/Channel.js'

export const uploadVideoService = async (storedFileName, uniqueFolderPath, file, title, description, userId, genre, thumbnailFile) => {

    const parsedGenre = JSON.parse(genre);
    const inputPath = path.join(uniqueFolderPath, storedFileName);
    const masterM3U8 = await segmentToHLS(inputPath, uniqueFolderPath);
    const channelId = await Channel.findOne({owner:userId}).select('_id');

    // console.log("thumbnail path : ",thumbnailFile.path);
    
    return await addVideoDao(file, title, description, masterM3U8, uniqueFolderPath, userId, parsedGenre, thumbnailFile.path,channelId);
}