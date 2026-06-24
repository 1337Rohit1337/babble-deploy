import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });


if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is undefined. Your .env is not being read.");
  console.log("Expected .env location:", path.resolve(__dirname, "../../.env"));
  process.exit(1);
}

import mongoose from "mongoose";
import User from "../models/user.model.js";

await mongoose.connect(process.env.MONGODB_URI);

const existing = await User.findOne({ email: "ai@chatapp.com" });

if (existing) {
  console.log(" AI user already exists:", existing._id);
} else {
  const aiUser = await User.create({
    email: "ai@chatapp.com",
    fullName: "AI Assistant",
    password: "not-a-real-password-123!",
    profilePic: "https://api.dicebear.com/7.x/bottts/svg?seed=ai",
  });
  console.log("AI User created! Save this ID:", aiUser._id);
}

await mongoose.disconnect();