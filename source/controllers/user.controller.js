// source/controllers/user.controller.js
import { AssyncHandler } from "../utils/AssyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary} from "cloudinary";
import fs from "fs"
import jwt from "jsonwebtoken"


const generateRefreshAndAccesstoken=async(userId)=>{
  try{
    
    const user=await User.findById(userId)

    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken

    await user.save({validateBeforeSave:false})   

    return {accessToken,refreshToken}

  }catch (e) {
  console.log("ACTUAL ERROR:", e)
  throw new ApiError(
    500,
    e?.message || "Token generation failed"
  )
}
}
const registerUser = AssyncHandler(async (req, res) => {

  const { fullName, email, username, password } = req.body;

  //console.log(fullName, email, username, password);

  // 1️⃣ Validate required fields
  if ([fullName, email, username, password].some(f => !f || f.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // 2️⃣ Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // 3️⃣ Get avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 4️⃣ Upload avatar
  
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // 5️⃣ Upload cover image (optional)
  let coverImageUrl = "";
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (coverImageLocalPath) {

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    coverImageUrl = coverImage?.url || "";
  }

  // 6️⃣ Create user

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImageUrl
  });


  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken");

  return res.status(201).json({
    success: true,
    data: createdUser,
    message: "User registered successfully"
  });
});


const loginUser = AssyncHandler(async (req, res) => {


  const { email, password, username } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Enter email or username");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "No User Found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is wrong");
  }

  const { accessToken, refreshToken } =await generateRefreshAndAccesstoken(user._id);
    
    

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res.status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in Successfully"
      )
    );
});

const refreshAccessToken=AssyncHandler(async (req,res) => {
  const incomingRefreshToken=req.cookies?.refreshToken || req.body?.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }

  let decodedToken
  try {
    console.log("this is before jwt")
    decodedToken=await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    console.log(`this is after jwt ${decodedToken}`)
  
  } catch (error) {
    throw new ApiError(401,error.message)
  }
  
  
  const user=await User.findById(decodedToken?._id).select("-password -accessToken")
  if (!user) {
  throw new ApiError(401, "no user found")
  }

  if(user.refreshToken!==incomingRefreshToken){
    throw new ApiError(401,"wrong refresh token from cookies")
  }

  const {accessToken,refreshToken}=generateRefreshAndAccesstoken(user._id)

  const options={
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .cookie("refreshToken",refreshToken,options)
  .cookie("accessToken",accessToken,options)
  .json(new ApiResponse(200,{refreshToken,accessToken},"refreshed token successfully"))

})

const logoutUser=AssyncHandler(async (req , res)=>{
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset:{
          refreshToken:""
        }
      },
      {
        returnDocument:"after"
      }
    )

    const options={
      httpOnly:true,
      secure:true
    }

    return res.status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(
      new ApiResponse(200, null, "Logged out successfully")
    )
})

const changePassword=AssyncHandler(async (req,res) => {
  const {oldPassword,newPassword}=req.body;
  const loggedInUser=await User.findById(req.user?._id)
  if(!loggedInUser){
   throw new ApiError(404,"User not found")
}
const ispassCorrect=await loggedInUser.isPasswordCorrect(oldPassword)
  if(!ispassCorrect){
    throw new ApiError(400,"old password is incorrect")
  }
  loggedInUser.password=newPassword
  await loggedInUser.save({validateBeforeSave:false})
  
  return res
  .status(200)
  .json(
    new ApiResponse(200,"successfully changed password")
  )
})

const getCurrentUser = AssyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateDetails= AssyncHandler(async(req,res)=>{
  const {fullName,email}=req.body

  if(!(fullName && email)){
    throw new ApiError(400,"enter all fields")
  }

  const user=await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        "fullName":fullName,
        "email":email
      }
    },
    {returnDocument:false}
  ).select("-password")

 

  return res.status(200)
  .json(new ApiResponse(200,user,"user updated successfully"))
})

const updateAvatar=AssyncHandler(async (req,res) => {
  //fetching file from frontend
  let avatar=req.files?.avatar?.[0]?.path
  if(!avatar){
    throw new ApiError(400,"please provide avatar url")
  }
  //deleting old avatar

 

  console.log(`avatar local path ${avatar}`)
  console.log(fs.existsSync(avatar))
  avatar=await uploadOnCloudinary(avatar)

  if(!avatar){
    throw new ApiError(500,"error in uploading on cloudinary")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {returnDocument:false}
  ).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,user,"updated avatar successfully"))
})


export{ 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateDetails,
    updateAvatar

};