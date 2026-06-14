import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },

  originalName: String,
  mimeType: String,
  size: Number,
  
  uploadTime: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },

  status: {
    type:String,
    enum: ['queued', 'processing', 'ready', 'failed', 'deleting'],
    default: 'queued',
    required: true
  },

  m3u8Path: {
    type: String,
    default: null,
  },
  folderPath: {
    type: String,
    required: true,
  },
  description:{
    type: String,
    default: "",
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // for O(logn) search time for a specific user
  },
  likesCount: {
    type: Number,
    default: 0,
    index: true, // optional for sorting most liked
    required: true,
  },
  genre: [
    {
      type: String,
      enum: ['Education',
        'Entertainment',
        'Music',
        'Gaming',
        'Technology',
        'Sports',
        'News',
        'Comedy',
        'Travel',
        'Food',
        'Lifestyle',
        'Science',
        'Art',
        'Documentary',
        'Other'],
    },
  ],
  thumbnailPath: {
    type: String,
    required: true,
    default: null,
  },
  rawS3Key: {
    type: String,
    default: null,
  },
  thumbnailS3Key: {
    type: String,
    default: null,
  },
  processedS3Prefix: {
    type: String,
    default: null,
  },
  transcodeJobId: {
    type: String,
    default: null,
  },
  processingStartedAt: {
    type: Date,
    default: null,
  },
  processingCompletedAt: {
    type: Date,
    default: null,
  },
  processingFailedAt: {
    type: Date,
    default: null,
  },
  processingError: {
    type: String,
    default: null,
  },
  uploadSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UploadSession",
    default: null,
    unique: true,
    sparse: true,
  },
  uploadIdempotencyKey: {
    type: String,
    default: null,
  },
  views : {
    type: Number,
    default: 0,
    required: true,
    index: true, // optional for sorting most viewed
  },
  channel:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
    index: true,
  },
});

videoSchema.index({ status: 1, uploadTime: -1 });
videoSchema.index({ uploadedBy: 1, uploadTime: -1 });
videoSchema.index({ channel: 1, uploadTime: -1 });
videoSchema.index({ transcodeJobId: 1 });
videoSchema.index({ title: 'text', description: 'text' });

export default mongoose.model("Video", videoSchema); // even i set Video correctly
