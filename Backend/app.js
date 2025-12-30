import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './Auth/auth.router.js';
import uploadRouter from './Upload/upload.router.js';
import streamRouter from './Stream/stream.router.js';

import {connectMongoDB} from './Config/Mongo.js';

dotenv.config();
await connectMongoDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: '*',
    credentials: true,
}))

app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/stream', streamRouter);

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
});