const { UserModel } = require("../models/user.model");

const userLogin=async(req,res)=>{
    try {
        const {email,password}=req.body;
        const cookiesOption={
            httpOnly:true,
            secure:true,
            sameSite:"none"
        }
        //user login email is registered or not checking
        const findUserWithMail=await UserModel.findOne({email});
        if(!findUserWithMail){
           return res.status(401).send({msg:"you have to put your email that you register"});
        }
        //if email is ok ( password checking )
        const passwordChecking= await UserModel.comparePassword(password);
        if(!passwordChecking){
            return res.status(401).send({msg:"your password is wrong"});
        }
        //if password is correct than we have to generate access_token and refresh_token
        const accesstoken=await UserModel.generateAccessToken();
        const refreshtoken=await UserModel.generateRefreshToken();

        res.cookie("accesstoken",accesstoken,cookiesOption);
        res.cookie("refreshtoken",refreshtoken,cookiesOption);

        //user is successfully login
        res.status(200).send({status:"successfull",msg:"user is successfully login"})
    } catch (error) {
        res.status(400).send({status:"error while user login",msg:error.message});
    }
}

module.exports={userLogin}