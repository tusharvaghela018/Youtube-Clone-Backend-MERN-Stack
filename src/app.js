import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

//set the limit to take the json data from the request body
//use the middleware for the except the data in json format
app.use(express.json({limit : "16kb"}))
//for encoding the url we use 
app.use(express.urlencoded({extended : true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routers import

import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)

export { app }