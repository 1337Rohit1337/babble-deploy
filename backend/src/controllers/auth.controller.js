import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../lib/utils.js";
import { v2 as cloudinary } from 'cloudinary';

export const signUp = async(req,res)=>{
    const{fullName,email,password} = req.body;
    if(!fullName,!email,!password){
        return res.status(400).json({message:"All fields required!"});
    }
    try {
        if(password.length < 6){
            return res.status(400).json({message:"Password must be atleast 6 characters long!"})
        }
        const user = await User.findOne({email});

        if (user) return res.status(400).json({message:"User already exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new User({
            fullName,
            email,
            password:hashedPassword,
        });

        if(newUser){
            generateToken(newUser._id,res);
            await newUser.save();

            res.status(201).json({
                _id:newUser.id,
                fullName: newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });
        }else{
            res.status(400).json({message:"User could not be created!"});
        }
    } catch (error) {
        console.log("Error from signup controller",error.message);
        res.status(500).json({message:"Internal Server Error"})
    }
    
}

export const logIn = async(req,res)=>{
    try {
        const {email,password}=req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        const isPasswordCorredt = await bcrypt.compare(password,user.password);
        if(!isPasswordCorredt){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        generateToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller",error);
        return res.status(500).json({message:"Internal Server Error"});
    }
};

export const logOut = (req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0})
        return res.status(200).json({message:"Logged out Successfully"});
    }
    catch(error){
        console.log("Error in logout controller");
        return res.status(500).json({message:"Internal Server Error"});
    }
}

export const updateProfile = async(req,res)=>{
    try {
        const{profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"No profile pic found!"});
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true});

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("error in update profile", error);
        res.status(500).json({message:"Internal server error"});
        
    }
}
export const checkAuth = async(req,res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in check auth controller",error);
        res.status(500).json({message:"Internal server error"});
    }
}