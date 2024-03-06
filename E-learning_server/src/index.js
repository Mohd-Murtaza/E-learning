require("dotenv").config();
const PORT=process.env.PORT;
const express=require("express");
const cookieParser = require("cookie-parser");
const {connection} = require("./config/db");
const { userRouter } = require("./routes/user.route");
const app=express();


//all middleware
app.use(express.json())
app.use(cookieParser())

//all routes
app.use("/users",userRouter);

app.get("/", (req,res)=>{
    res.status(200).send("This is a home page")
});

app.use((req,res)=>{
    res.status(404).send("this is a invalid request");
});

// git intigration understandig purpose you can try  use(localhost:8080/login  in your browser)
// app.get("/login", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
// });

app.listen(PORT, ()=>{
    connection.then((res)=>console.log(`db is connected`)).catch((err)=>console.log(err))
    console.log(`server is runngin on this => ${PORT}`)
})