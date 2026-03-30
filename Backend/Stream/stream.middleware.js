import jwt from 'jsonwebtoken';

export const streamMiddleware = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // return res.status(401).json({ message: "Unauthorized: Invalid token" });
        req.user = null;
        next();
    }
};