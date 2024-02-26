const express=require("express");
const { userLogin } = require("../controllers/user.controller");
const userRouter=express.Router();


userRouter.post("/login",userLogin)


module.exports={userRouter};