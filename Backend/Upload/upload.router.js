import express from 'express';
import { upload } from './utils/multer.js';



import { 
    uploadVideoController,
    uploadURLController,
    processVideoController,
    uploadMultipartURLController,
    completeMultipartUploadController
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
    
router.post("/upload-url", checkToken, requireUser, uploadURLController);

router.post("/process-video", checkToken, requireUser, processVideoController);

// new feature 
router.post("/upload-multipart-url", checkToken, requireUser, uploadMultipartURLController);

router.post("/complete-multipart-upload", checkToken, requireUser,completeMultipartUploadController);


export default router;