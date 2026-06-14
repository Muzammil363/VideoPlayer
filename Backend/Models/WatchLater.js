import mongoose from "mongoose";

const watchLaterSchema = new mongoose.Schema({
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
    savedAt: {
        type:Date,
        required:true
    }
})
watchLaterSchema.index({ user: 1, videoId: 1 }, { unique: true });
watchLaterSchema.index({ videoId: 1 });
watchLaterSchema.index({ savedAt: -1 });
export default mongoose.model("WatchLater",watchLaterSchema);
