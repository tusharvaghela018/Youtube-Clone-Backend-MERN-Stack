import dotenv from "dotenv"
dotenv.config()
import connectDB from "./db/connection.js";
import { app } from "./app.js";

connectDB()
.then(()=>{
    console.log("Connection eastablished...")
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at the port : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error(`Error occur while connection building: `, error)
});




/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv from "dotenv"
dotenv.config()
import express from "express"
const app = express()
;(async() => {
    try {

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log("DB connection is done successfully...")
        app.on("error", (error)=>{
            console.log("ERRR: ",error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening at port at ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error("ERROR ", error);
        throw error
    }
})() */

