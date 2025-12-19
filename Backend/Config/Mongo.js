import mongoose from "mongoose";
// Connection for mongodb
export const connectMongoDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection failed: ", error);
        process.exit(1);
    }   
}