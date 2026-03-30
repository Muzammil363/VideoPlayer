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
// watchLaterSchema.createIndex({savedAt:-1});
export default mongoose.model("WatchLater",watchLaterSchema);