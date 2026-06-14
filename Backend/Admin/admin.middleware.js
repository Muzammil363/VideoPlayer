import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../Models/User.js";

dotenv.config();

export const checkAdminToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({ success: false, message: "Admin token missing" });
    }

    req.token = token;
    next();
};

export const requireAdmin = async (req, res, next) => {
    try {
        const decoded = jwt.verify(req.token, process.env.JWT_SECRET);
        const admin = await User.findById(decoded._id).select("_id username email role");

        if (!admin) {
            return res.status(401).json({ success: false, message: "Admin user not found" });
        }

        if (admin.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }

        req.user = {
            _id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
        };

        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid admin token" });
    }
};
