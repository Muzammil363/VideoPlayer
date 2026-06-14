import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectMongoDB } from "../Config/Mongo.js";
import { User } from "../Models/User.js";
import { Channel } from "../Models/Channel.js";

dotenv.config();

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "123456";
const ADMIN_USERNAME = "Admin";

const seedAdmin = async () => {
    await connectMongoDB();

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
        existingAdmin.role = "admin";
        if (!existingAdmin.username) existingAdmin.username = ADMIN_USERNAME;
        await existingAdmin.save();

        await Channel.findOneAndUpdate(
            { owner: existingAdmin._id },
            { $setOnInsert: { name: "StreamForge Admin", description: "Admin operations channel" } },
            { upsert: true, new: true }
        );

        console.log(`Admin user already exists and is marked admin: ${ADMIN_EMAIL}`);
        return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
    });

    await Channel.create({
        owner: admin._id,
        name: "StreamForge Admin",
        description: "Admin operations channel",
    });

    console.log(`Admin user created: ${ADMIN_EMAIL}`);
};

try {
    await seedAdmin();
} catch (error) {
    console.error("Failed to seed admin user:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
