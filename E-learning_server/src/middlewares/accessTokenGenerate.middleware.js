require("dotenv").config();
const jwt = require("jsonwebtoken");

const generateAccessToken = (req, res, next) => {
  try {
    const { _id, email } = req.user;
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };
    const accesstoken = jwt.sign(
      { _id, email },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    if (accesstoken) {
      // Set the cookie
      res.cookie("accesstoken", accesstoken, cookiesOption,{maxAge:1 * 24 * 60 * 60 * 1000});
      next()
    }
  } catch (error) {
    res.status(401).send({ error: error.message, message: "Unable to generate access token" });
  }
};

module.exports = { generateAccessToken };