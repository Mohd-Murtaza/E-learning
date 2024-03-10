require("dotenv").config();
const jwt=require('jsonwebtoken');

const generateRefreshToken=(req,res,next)=>{
    try {
        const {_id, email}= req.body;
        const cookiesOptions={
            httpOnly:true,
            secure:true,
            sameSite:"none"
        }
        const refreshtoken=jwt.sign({_id, email}, process.env.REFRESH_TOKEN_SECRET_KEY ,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY});
        if(refreshtoken){
            res.cookie("refreshtoken",refreshtoken,cookiesOptions)
            next();
        }
    } catch (error) {
        res.status(401).send({ error: error.message, message: "Unable to generate refresh token" });
    }
};

module.exports={generateRefreshToken};
