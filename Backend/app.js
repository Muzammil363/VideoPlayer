import express from 'express'
import authRouter from './Auth/auth.router.js';
import {connectMongoDB} from './Config/Mongo.js';
import dotenv from 'dotenv';

dotenv.config();
await connectMongoDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/auth', authRouter);

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
});