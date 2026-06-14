import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './Auth/auth.router.js';
import uploadRouter from './Upload/upload.router.js';
import streamRouter from './Stream/stream.router.js';
import userRouter from './User/user.router.js';
import videoControls from './VideoControls/videoControl.router.js'
import adminRouter from './Admin/admin.router.js';

import './Config/awsConfig.js';
import {connectMongoDB} from './Config/Mongo.js';

import { Queue } from 'bullmq';

dotenv.config();
await connectMongoDB();

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

export const redisConnection = {
    host: "127.0.0.1",
    port: 6379
};

const videoQueue = new Queue("videoQueue", {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    },  
});

app.use('/auth', authRouter);
app.use("/user", userRouter);
app.use('/upload', uploadRouter);
app.use('/stream', streamRouter);
app.use('/save',videoControls);
app.use('/admin', adminRouter);

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
});
