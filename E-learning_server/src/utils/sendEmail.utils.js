require("dotenv").config();
const nodemailer=require('nodemailer');
// Send OTP via email
const sendEmail=async(email,subject,text)=>{
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: email,
        subject,
        text,
      };
      return await transporter.sendMail(mailOptions);
};
module.exports={sendEmail};