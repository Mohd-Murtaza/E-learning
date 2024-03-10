require("dotenv").config();
const jwt = require("jsonwebtoken");

const generateAccessToken = (req, res, next) => {
  try {
    const { _id, email } = req.body;
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
      console.log({accesstoken, accesstokenMiddleware:"line 19"})
      res.cookie("accesstoken", accesstoken, cookiesOption);
      console.log(req.cookies.accesstoken,"line 21")
      next()
    }
  } catch (error) {
    res.status(401).send({ error: error.message, message: "Unable to generate access token" });
  }
};

module.exports = { generateAccessToken };