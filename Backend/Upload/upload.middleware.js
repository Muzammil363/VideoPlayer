// this middleware checks whether user logged in or not also serializing all user details in  req.user
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

//will check whether req.token is valid and if yes serialize user details in req.user
export const requireUser = (req, res, next) => {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('ERROR: Could not verify token');
            return res.sendStatus(403); // Forbidden
        }
        // console.log(decoded);
        req.user = decoded;
        console.log("req.user: ",req.user);
        next();
    });
};


//will serialize the token in req.token
export const checkToken = (req, res, next) => {
    const token = req.cookies.token;
    console.log("token: ",token);
    if (!token) {
        return res.status(403).json({
            error: "token not there in cookies"
        }); // Forbidden
    }
    req.token=token;
    next();
};
