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
// likedSchema.createIndex({likedAt:-1});
export default mongoose.model("Liked",likedSchema);