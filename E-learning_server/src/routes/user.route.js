const express=require("express");
const { userLogin, userRegister, userVerifyOTP, userResendOTP, gitRegistration } = require("../controllers/user.controller");
const userRouter=express.Router();


userRouter.route("/login").post(userLogin);
userRouter.route("/register").post(userRegister);
userRouter.route("/verifyotp").post(userVerifyOTP);
userRouter.route("/resendotp").post(userResendOTP);
userRouter.route("/gitRegistration").get(gitRegistration)
module.exports={userRouter};