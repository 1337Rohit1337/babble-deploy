import dotenv from "dotenv"
dotenv.config();

import express from "express";
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import {connectDB} from "./lib/db.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import { app, server } from "./lib/socket.js";
import path from "path";

console.log("🔑 GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🗄️ MONGODB_URI:", process.env.MONGODB_URI ? "✅ Loaded" : "❌ Missing");

const PORT = process.env.PORT;
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))
console.log("NODE_ENV:", process.env.NODE_ENV);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const __dirname = path.resolve();
if(process.env.NODE_ENV==="production"){
  console.log("✅ Serving frontend from /frontend/dist");
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}


console.log('Cloudinary config:', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_SECRET);




server.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`);
    connectDB();
})