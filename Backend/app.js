import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './Auth/auth.router.js';
import uploadRouter from './Upload/upload.router.js';
import streamRouter from './Stream/stream.router.js';
import userRouter from './User/user.router.js';

import {connectMongoDB} from './Config/Mongo.js';

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
}))

app.use('/auth', authRouter);
app.use("/user", userRouter);
app.use('/upload', uploadRouter);
app.use('/stream', streamRouter);

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
});