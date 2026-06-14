import mongoose from "mongoose";

const likedSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    videoId :{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
        required:true
    },
    likedAt: {
        type:Date,
        required:true
    }
})
likedSchema.index({ user: 1, videoId: 1 }, { unique: true });
likedSchema.index({ videoId: 1 });
likedSchema.index({ likedAt: -1 });
export default mongoose.model("Liked",likedSchema);
