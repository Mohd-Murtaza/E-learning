const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      otpCode: {
        type: String,
      },
      otpExpirationTime: {
        type: Date,
      },
    },
  },
  { versionKey: false }
);

//hashed password before save in database with the help of pre hooks

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const hashedPasswordByBcrypt = await bcrypt.hash(this.password, 5);
    this.password = hashedPasswordByBcrypt;
    next();
  } catch (error) {
    next(error);
  }
});

//compare password whenever user want to login again or reset password

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//creating a jwt access token for authorization
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      userId: this._id,
      userMail: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

//creating a jwt refresh token for making a new access token

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      userId: this._id,
      userMail: this.email,
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

const UserModel = new mongoose.model("User", userSchema);
module.exports = { UserModel };
