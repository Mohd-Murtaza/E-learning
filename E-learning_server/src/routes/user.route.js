const express = require("express");
const {
  userLogin,
  userRegister,
  userVerifyOTP,
  userResendOTP,
  gitRegistration,
  resetPassword,
  requestForOtpToForgetPass,
  forgetPassword,
} = require("../controllers/user.controller");
const userRouter = express.Router();

userRouter.route("/login").post(userLogin);
userRouter.route("/register").post(userRegister);
userRouter.route("/verifyOtp").post(userVerifyOTP);
userRouter.route("/resendOtp").post(userResendOTP);
userRouter.route("/gitRegistration").get(gitRegistration);
userRouter.route("/resetPassword").post(resetPassword);
userRouter.route("/otpRequestForPass").post(requestForOtpToForgetPass);
userRouter.route("/forgetPassword").post(forgetPassword);

module.exports = { userRouter };
