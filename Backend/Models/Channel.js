import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: "My Channel",
    },
    description: {
        type: String,
        default:"Welcome to my channel!",
        required: false
    },
    subscribers: {
        type: Number,
        default: 0
    }
}
);

export const Channel = mongoose.model("Channel", channelSchema);