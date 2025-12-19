import express from 'express'
import authRouter from './Auth/auth.router.js';

const app = express();

app.use('/auth', authRouter);

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
});