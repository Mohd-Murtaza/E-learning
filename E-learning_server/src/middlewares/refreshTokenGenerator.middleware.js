require("dotenv").config();
const jwt=require('jsonwebtoken');

const generateRefreshToken=(req,res,next)=>{
    try {
        const {_id, email}= req.user;
        const cookiesOptions={
            httpOnly:true,
            secure:true,
            sameSite:"none"
        }
        const refreshtoken=jwt.sign(
            {_id, email}, 
            process.env.REFRESH_TOKEN_SECRET_KEY ,
            {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
        );
        if(refreshtoken){
            res.cookie("refreshtoken",refreshtoken,cookiesOptions, {maxAge:7 * 24 * 60 * 60 * 1000})
            next();
        }
    } catch (error) {
        res.status(401).send({ error: error.message, message: "Unable to generate refresh token" });
    }
};

module.exports={generateRefreshToken};
