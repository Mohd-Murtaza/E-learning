// Generate 6 digit OTP
const otpGenerator=()=>{
    return Math.floor(100000 + Math.random() * 900000);
};
module.exports={otpGenerator};
