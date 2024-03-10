require("dotenv").config();
const { BlackListModel } = require("../models/blackList.model");
const { UserModel } = require("../models/user.model");
const { otpExpiration } = require("../utils/otpExpiration.utils");
const { otpGenerator } = require("../utils/otpGenerator.utils");
const { sendEmail } = require("../utils/sendEmail.utils");
const { v4: uuidv4 } = require("uuid");

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
      return res.status(401).send({
        msg: "Your registration process is not completed. Verify your email with help of OTP verification process.",
      });
    }
    //if email is ok ( password checking )
    const passwordChecking = await findUserWithMail.comparePassword(password);
    if (!passwordChecking) {
      return res.status(401).send({ msg: "your password is wrong" });
    }
    //if password is correct than we have to generate access_token and refresh_token
    const accesstoken = await findUserWithMail.generateAccessToken();
    const refreshtoken = await findUserWithMail.generateRefreshToken();

    // res.cookie("accesstoken", accesstoken, cookiesOption);
    res.cookie("refreshtoken", refreshtoken, cookiesOption);

    //user is successfully login
    res
      .status(200)
      .send({ status: "successfull", msg: "user is successfully login", accesstoken, refreshtoken });
  } catch (error) {
    res
      .status(400)
      .send({ status: "error while user login", msg: error.message });
  }
};

// user logout

const userLogout = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    const findAccessTokenInBlackListModel = await BlackListModel.findOne({
      accessToken,
    });

    if (findAccessTokenInBlackListModel) {
      return res
        .status(401)
        .send({ status: "fail", msg: "you are already logged out" });
    }

    const saveAccessTokenInBlackListModel = new BlackListModel({ accessToken });
    await saveAccessTokenInBlackListModel.save();
    res.status(201).send({ status: "success", msg: "You are logged out" });
  } catch (error) {
    res.status(401).send({ status: "fail", msg: "error while logout user" });
  }
};

const gitRegistration = async (req, res) => {
  // Get the code from the query parameters received from the GitHub OAuth redirect
  const { code } = req.query;
  console.log("code :" + code);

  const cookiesOption = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  try {
    // Exchange the received code for an access token using GitHub API
    const accessToken = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GIT_CLIENT_ID,
          client_secret: process.env.GIT_CLIENT_SECRETE_KEY,
          code,
        }),
      }
    );

    // Throw an error if the access token request is not successful
    if (!accessToken.ok) {
      throw new Error(`Failed to get access token: ${accessToken.statusText}`);
    }

    // Extract the access token from the response
    const accesstoken = await accessToken.json();
    console.log({ accesstoken: accesstoken.access_token });

    // Fetch user details from GitHub using the obtained access token
    const userNameRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accesstoken.access_token}`,
      },
    });

    // Throw an error if the request for user details is not successful
    if (!userNameRes.ok) {
      throw new Error(`Failed to get user details: ${userNameRes.statusText}`);
    }

    // Extract user details from the response
    const userName = await userNameRes.json();

    // Fetch user email from GitHub using the obtained access token
    const userEmailRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accesstoken.access_token}`,
      },
    });

    // Throw an error if the request for user email is not successful
    if (!userEmailRes.ok) {
      throw new Error(`Failed to get user email: ${userEmailRes.statusText}`);
    }

    // Extract user email from the response
    const userEmail = await userEmailRes.json();
    console.log({ email: userEmail[0].email, name: userName.name });

    // Check if the user already exists in the database
    const alreadyUser = await UserModel.findOne({
      email: userEmail[0].email,
      emailVerified: true,
    });

    // Generate a random password (consider using a more secure method for real applications)
    const generatedPass = uuidv4();

 
    if (alreadyUser) {

      //setCookie-login
    const accesstokenInGit = await alreadyUser.generateAccessToken();
    const refreshtokenInGit = await alreadyUser.generateRefreshToken();

    res.cookie("accesstoken", accesstokenInGit, cookiesOption);
    res.cookie("refreshtoken", refreshtokenInGit, cookiesOption);

      // If the user already exists, send a success message
      return res
        .status(200)
        .send({ status: "success", message: "You are logged in with GitHub" });
    } else {
      // If the user doesn't exist, create a new user in the database
      const newUser = new UserModel({
        name: userName.name,
        email: userEmail[0].email,
        password: generatedPass,
        emailVerified: true,
      });

      // Save the new user in the database
      await newUser.save();

       //setCookie-login
    const accesstokenInGit = await newUser.generateAccessToken();
    const refreshtokenInGit = await newUser.generateRefreshToken();

    res.cookie("accesstoken", accesstokenInGit, cookiesOption);
    res.cookie("refreshtoken", refreshtokenInGit, cookiesOption);
      // Send a success message for the new user creation
      return res.status(201).send({
        status: "success",
        message: "New user is created with the help of GitHub authorization",
      });
    }
  } catch (error) {
    // Handle errors during the GitHub OAuth process
    console.error("GitHub OAuth error:", error);
    res.status(500).send("Error during GitHub OAuth");
  }
};

// Reset password logic
const resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, email } = req.body;
    const findUserForResetPassword = await UserModel.findOne({ email });

    if (!findUserForResetPassword) {
      return res.status(401).send({ status: "fail", msg: "User not found" });
    }

    const oldPasswordValidation =
      await findUserForResetPassword.comparePassword(oldPassword);

    if (!oldPasswordValidation) {
      return res
        .status(401)
        .send({ status: "fail", msg: "Your old password is incorrect" });
    }

    findUserForResetPassword.password = newPassword;
    await findUserForResetPassword.save({ validateBeforeSave: false });
    res
      .status(201)
      .send({ status: "success", msg: "Your password changed successfully" });
  } catch (error) {
    res.status(400).send({ status: "fail", msg: error.message });
  }
};


// send otp to user for forget password

const requestForOtpToForgetPass = async (req, res) => {
  try {
    const { email } = req.body;
    const findUserWithThisEmail = await UserModel.findOne({ email });
    if (!findUserWithThisEmail) {
      return res
        .status(400)
        .send({ status: "fail", msg: "User not found by this email" });
    }

    //now generate otp
    const otpCode = otpGenerator();
    // here update otp in user document also
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

    const subject = `Important: Your New OTP for E-learning forget password`;

    const text = `Hi Dear,

    We hope this message finds you well.
    
    Due to the expiration of your previous OTP, we have generated a new one for you to complete your forget password process on E-learning. Please find your new OTP below:
    
    New OTP: ${otpCode}
    
    Please note that this OTP is valid for the next 5 minutes. We kindly ask you to use it promptly to ensure a seamless forget password experience.
    
    If you encounter any issues or have any questions, please don't hesitate to contact our support team.
    
    Thank you for choosing E-learning for your learning journey.
    
    Best Regards,
    E-learning`;

    sendEmail(email, subject, text);
    res.status(201).send({ status: "success", msg: "opt send " });
  } catch (error) {
    res.status(200).send({ status: "fail", msg: error.message });
  }
};

// now finally update user password

const forgetPassword = async (req, res) => {
  try {
    const { newPassword, email } = req.body;
    const findUserWithEmail = await UserModel.findOne({ email });
    if (!findUserWithEmail) {
      return res.status(400).send({ status: "fail", msg: "User not found" });
    }
    findUserWithEmail.password = newPassword;
    await findUserWithEmail.save();
    res
      .status(201)
      .send({ status: "success", msg: "Password forget successfully" });
  } catch (error) {
    res.status(200).send({ status: "fail", msg: error.message });
  }
};

module.exports = {
  userLogin,
  userRegister,
  userLogout,
  userVerifyOTP,
  userResendOTP,
  gitRegistration,
  resetPassword,
  requestForOtpToForgetPass,
  forgetPassword,
};
