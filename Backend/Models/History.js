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
// historySchema.createIndex({watchedAt:-1});
export default mongoose.model("History",historySchema);