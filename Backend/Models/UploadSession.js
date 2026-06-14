import mongoose from "mongoose";

const uploadSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  idempotencyKey: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["initiated", "uploading", "finalizing", "completed", "failed", "aborted"],
    default: "initiated",
    required: true,
    index: true,
  },
  videoKey: {
    type: String,
    required: true,
  },
  thumbnailKey: {
    type: String,
    required: true,
  },
  folderPath: {
    type: String,
    required: true,
  },
  s3MultipartUploadId: {
    type: String,
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    default: null,
  },
  jobId: {
    type: String,
    default: null,
  },
  fileMetadata: {
    videoFilename: { type: String, required: true },
    videoContentType: { type: String, required: true },
    videoSize: { type: Number, default: null },
    thumbnailFilename: { type: String, required: true },
    thumbnailContentType: { type: String, required: true },
    thumbnailSize: { type: Number, default: null },
    totalChunks: { type: Number, required: true },
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
}, { timestamps: true });

uploadSessionSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
uploadSessionSchema.index({ status: 1, createdAt: -1 });
uploadSessionSchema.index({ user: 1, createdAt: -1 });
uploadSessionSchema.index({ videoId: 1 });

export default mongoose.model("UploadSession", uploadSessionSchema);
