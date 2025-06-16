import express from "express"
const router = express.Router();
import {signUp,logIn,logOut,updateProfile,checkAuth} from "../controllers/auth.controller.js"
import {protectRoute} from "../middleware/auth.middleware.js"
router.post("/signup",signUp)
router.post("/login",logIn)
router.post("/logout",logOut)

router.put("/update-profile",protectRoute,updateProfile)

router.get("/check", protectRoute, checkAuth)
export default router;