import mongoose from "mongoose";

const historySchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    videoId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
        required:true
    },
    watchedAt :{
        type:Date,
        required:true
    }
})
historySchema.index({ user: 1, videoId: 1 }, { unique: true });
historySchema.index({ videoId: 1 });
historySchema.index({ watchedAt: -1 });
export default mongoose.model("History",historySchema);
