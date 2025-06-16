import express from "express";
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import dotenv from "dotenv"
import {connectDB} from "./lib/db.js"
import cookieParser from "cookie-parser"
import cors from "cors"

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))
console.log('Cloudinary config:', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_SECRET);


app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`);
    connectDB();
})