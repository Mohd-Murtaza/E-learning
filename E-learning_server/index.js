require("dotenv").config();
const PORT=process.env.PORT;
const express=require("express");
const app=express();

app.get("/", (req,res)=>{
    res.status(200).send("This is a home page")
});

app.use((req,res)=>{
    res.status(404).send("this is a invalid request");
});

app.listen(PORT, async()=>{
    console.log(`server is runngin on this => ${PORT}`)
})