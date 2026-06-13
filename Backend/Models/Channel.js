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
    avatarColor: {
        type: String,
        enum: ['#6b21a8', '#0f766e', '#1d4ed8', '#be123c', '#374151'],
        default: '#6b21a8',
    },
    subscribers: {
        type: Number,
        default: 0
    }
}
);

export const Channel = mongoose.model("Channel", channelSchema);
