require("dotenv").config();
const { UserModel } = require("../models/user.model");
const { otpExpiration } = require("../utils/otpExpiration.utils");
const { otpGenerator } = require("../utils/otpGenerator.utils");
const { sendEmail } = require("../utils/sendEmail.utils");

const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the email meets the specified criteria
    if (!emailRegex.test(email)) {
      return res.status(400).send({ error: "Invalid email address" }); // Specific status code 400 for client error
    }

    // Check if the password meets the specified criteria means password should have one uppercase character,one number,one special character, and the length of password should be at least 8 characters long
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&+]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .send({ error: "Password does not meet the criteria" });
    }

    // Check if the user already exists
    const checkUserIsExist = await UserModel.findOne({ email });
    if (checkUserIsExist) {
      return res.status(409).send({ error: "User already exists" }); // Specific status code 409 for conflict
    }

    // Generate 6 digit OTP
    const otpCode = otpGenerator();

    // Set expiration time for OTP (5 minutes from now)
    const otpExpirationTime = otpExpiration(5);

    // Save user data to the database
    const newUser = new UserModel({
      name,
      email,
      password,
      otp: {
        otpCode,
        otpExpirationTime,
      },
    });
    await newUser.save();

    const subject = `Welcome to E-learning - Your Registration OTP Inside`;
    const text = `Dear ${name},

    Thank you for choosing E-learning for your educational journey.
    
    We are pleased to provide you with your One-Time Password (OTP) for registration: ${otpCode}. Please ensure to keep this code confidential. This OTP is valid for the next 5 minutes to ensure the security of your account.
    
    Should you have any questions or require further assistance, please do not hesitate to reach out to our support team.
    
    Best Regards,
    Mohd Murtaza
    E-learning`;

    // Send OTP via email
    sendEmail(email, subject, text);

    return res
      .status(201)
      .send({ status: "success", message: "OTP sent successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error while user registration", message: error.message }); // Specific status code   500 for server error
  }
};

const userVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if the user exists with the provided email
    const userCheckIsExist = await UserModel.findOne({ email });
    if (!userCheckIsExist) {
      return res.status(404).send({
        status: "fail",
        message: "User not found with this email address",
      });
    }

    // Check if the OTP has expired
    if (new Date(userCheckIsExist.otp.otpExpirationTime) < new Date()) {
      return res.status(401).send({
        status: "fail",
        error: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check if the provided OTP matches the stored OTP
    if (otp !== userCheckIsExist.otp.otpCode) {
      return res.status(400).send({ status: "fail", message: "Incorrect OTP" });
    }

    await UserModel.findByIdAndUpdate(userCheckIsExist._id, {
      $set: { emailVerified: true },
    });

    return res.status(200).send({
      status: "success",
      message: "Email verified successfully. User registered successfully.",
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error while verifying OTP and registering user",
      error: error.message,
    });
  }
};
const userResendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate 6 digit OTP
    const otpCode = otpGenerator();

    // Set expiration time for OTP (5 minutes from now)
    const otpExpirationTime = otpExpiration(5);

    await UserModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          "otp.otpCode": otpCode,
          "otp.otpExpirationTime": otpExpirationTime,
        },
      }
    );

    // Send OTP via email
    const subject = `Important: Your New OTP for E-learning Registration`;
    const text = `Hi Dear,

    We hope this message finds you well.
    
    Due to the expiration of your previous OTP, we have generated a new one for you to complete your registration process on E-learning. Please find your new OTP below:
    
    New OTP: ${otpCode}
    
    Please note that this OTP is valid for the next 5 minutes. We kindly ask you to use it promptly to ensure a seamless registration experience.
    
    If you encounter any issues or have any questions, please don't hesitate to contact our support team.
    
    Thank you for choosing E-learning for your learning journey.
    
    Best Regards,
    Mohd Murtaza
    E-learning`;

    sendEmail(email, subject, text);

    return res
      .status(201)
      .send({ status: "success", msg: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: "Error while resending OTP",
      error: error.message,
    });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };
    //user login email is registered or not checking
    const findUserWithMail = await UserModel.findOne({ email });
    if (!findUserWithMail) {
      return res
        .status(401)
        .send({ msg: "you have to put your email that you register" });
    }

    //verifying user is registered and their otp is verified is true or false
    if (!findUserWithMail.emailVerified) {
      return res
        .status(401)
        .send({
          msg: "Your registration process is not completed. Verify your email with help of OTP verification process.",
        });
    }
    //if email is ok ( password checking )
    const passwordChecking = await UserModel.comparePassword(password);
    if (!passwordChecking) {
      return res.status(401).send({ msg: "your password is wrong" });
    }
    //if password is correct than we have to generate access_token and refresh_token
    const accesstoken = await UserModel.generateAccessToken();
    const refreshtoken = await UserModel.generateRefreshToken();

    res.cookie("accesstoken", accesstoken, cookiesOption);
    res.cookie("refreshtoken", refreshtoken, cookiesOption);

    //user is successfully login
    res
      .status(200)
      .send({ status: "successfull", msg: "user is successfully login" });
  } catch (error) {
    res
      .status(400)
      .send({ status: "error while user login", msg: error.message });
  }
};

module.exports = { userLogin, userRegister, userVerifyOTP, userResendOTP };
