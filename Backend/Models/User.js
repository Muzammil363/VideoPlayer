import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({   
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    profileColor: {
        type: String,
        enum: ['#6b21a8', '#0f766e', '#1d4ed8', '#be123c', '#374151'],
        default: '#6b21a8',
    },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
