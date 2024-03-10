require("dotenv").config();
const passport = require("passport");
const { UserModel } = require("../models/user.model");
const { v4: uuidv4 } = require("uuid");

const GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/google/callback",
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        const email = profile._json.email;
        const name = profile._json.name;
        // Check if user with the same email already exists
        let existingUser = await UserModel.findOne({ email });
        if (existingUser) {
          // If user already exists, return that user
          return done(null, {existingUser});
        } else {
          // If user doesn't exist, create a new user
          const newUser = new UserModel({
            name,
            email,
            password: uuidv4(),
            emailVerified: true,
          });
          await newUser.save();
          return done(null, {newUser});
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);
module.exports = { passport };
