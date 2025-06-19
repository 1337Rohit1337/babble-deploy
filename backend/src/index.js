import express from "express";
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import dotenv from "dotenv"
import {connectDB} from "./lib/db.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import { app, server } from "./lib/socket.js";
import path from "path";
dotenv.config();

const PORT = process.env.PORT;

console.log("NODE_ENV:", process.env.NODE_ENV);
const __dirname = path.resolve();
if(process.env.NODE_ENV==="production"){
  console.log("✅ Serving frontend from /frontend/dist");
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))
console.log('Cloudinary config:', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_SECRET);


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`);
    connectDB();
})