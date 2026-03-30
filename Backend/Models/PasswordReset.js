import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    otp: { 
        type: String, 
        required: true
    },
    expiresAt: { 
        type: Date, 
        default: Date.now, 
        index: { expires: 600 } 
    }
}, { timestamps: true });

export const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

