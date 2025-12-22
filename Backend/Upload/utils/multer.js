import multer from "multer";
import fs from "node:fs";
import path from "path";

const fileFilter = (req, file, cb) => {
    if (file.fieldname === "video") {
        const allowedMimeTypes = ["video/mp4", "video/x-matroska", "video/webm"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only video files (mp4, mkv, webm) are allowed"), false);
        }
    // }else if(file.fieldname === "thumbnail"){
    //     const allowedMimeTypes = [""];
    //     if (allowedMimeTypes.includes(file.mimetype)) {
    //         cb(null, true);
    //     } else {
    //         cb(new Error("Only video files (, , ) are allowed"), false);
    //     }
    }else {
        //for now untill i write all cases
        cb(null, true);
    }
}


const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("upload path file");

        let uploadPath = "uploads/";
        //because in future I might keep profile pictures or anything
        let folderPath;
        if (file.fieldname === "video") {
            uploadPath += "videos/";
            const folderId = Date.now() + "-" + req.user._id;
            folderPath = path.join(uploadPath, folderId);
            // console.log("folderpath: ", folderPath);
            req.uniqueFolderPath = folderPath; //remember this field!!
        } else if (file.fieldname === "thumbnail") {
            uploadPath = "public/";
            folderPath = path.join(uploadPath, "thumbnails");
        }
        ensureDirectoryExists(folderPath);
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        let fileName;
        if (file.fieldname === "thumbnail") {
            const ext = path.extname(file.originalname);
            fileName = Date.now() + "-" + req.user._id+ext;
        } else if (file.fieldname === "video") {
            //as any way storing in unique folder for every file
            fileName = path.basename(file.originalname);
            console.log("fileName: ", fileName);
            req.storedFileName = fileName; //remember this field!!
        }
        cb(null, fileName);
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
        files: 5, // Maximum 5 files per request
    },
    fileFilter: fileFilter,
});

export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.log(err)
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File too large. Maximum size is 500MB.",
            })
        }
        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                success: false,
                message: "Too many files. Maximum 1 file allowed.",
            })
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                success: false,
                message: "Unexpected field name for file upload.",
            })
        }
    }

    if (err.message.includes("Invalid file type")) {
        return res.status(400).json({
            success: false,
            message: err.message,
        })
    }

    next(err);
}