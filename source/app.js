import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieparser())


// importing router 
import { Router } from "express"
import { upload } from "./middlewares/multer.midddleware.js"
import userRoute from "./routes/user.route.js"
app.use("/api/v1/user",userRoute)
   



export {app} 