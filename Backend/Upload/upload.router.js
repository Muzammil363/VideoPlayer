import express from 'express';
import { upload } from './utils/multer.js';

import { 
    uploadVideoController,
} from './upload.controller.js';

import { 
    checkToken,
    requireUser,
} from './upload.middleware.js';

const router= express.Router();

router.post('/video', checkToken, requireUser,  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
]), uploadVideoController);

export default router;