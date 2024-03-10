require("dotenv").config();
const PORT = process.env.PORT;
const express = require("express");
const cookieParser = require("cookie-parser");
const { connection } = require("./config/db");
const { userRouter } = require("./routes/user.route");
const { passport } = require("./config/googleOauth");
const { generateAccessToken } = require("./middlewares/accessTokenGenerate.middleware");
const { generateRefreshToken } = require("./middlewares/refreshTokenGenerator.middleware");

const app = express();

//all middleware
app.use(express.json());
app.use(cookieParser());

//all routes
app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.status(200).send("This is a home page");
});

//Google Oauth start here

app.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/google/callback",
  generateAccessToken,
  generateRefreshToken,
  passport.authenticate("google", {
    session: false,

    failureRedirect: "/google/failure",
  }),
  function (req, res) {
    console.log("line no 41")
    console.log(generateAccessToken, generateRefreshToken),
    console.log(req.user,req.cookies);
    res.redirect("/");
  }
);

app.get("/google/success", (req, res) => {
  res.send("google o auth success");
});
app.get("/google/failure", (req, res) => {
  res.send("google o auth failed");
});

//Google Oauth ends here

// git intigration understandig purpose you can try  use(localhost:8080/login  in your browser)
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.use((req, res) => {
  res.status(404).send("this is a invalid request");
});



app.listen(PORT, () => {
  connection
    .then((res) => console.log(`db is connected`))
    .catch((err) => console.log(err));
  console.log(`server is runngin on this => ${PORT}`);
});
