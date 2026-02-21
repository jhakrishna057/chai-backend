import {AssyncHandler} from "./../utils/AssyncHandler.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary as upload} from "../utils/cloudinary.js"

const registerUser=AssyncHandler(async (req,res) => {
    const {userName,fullName,email,password}=req.body;

    if(
          [fullName,userName,email,password].some((fields=>{fields?.trim()===""}))
     ){throw new ApiError(401,"enter all credentials")}




    console.log(userName)
    return res.status(201).send("running")

})

export {registerUser}