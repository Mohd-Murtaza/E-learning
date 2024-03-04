// Set expiration time for OTP (5 minutes from now)
const otpExpiration=(minutes)=>{
    return new Date(Date.now() + minutes * 60000);
};
module.exports={otpExpiration};