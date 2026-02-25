// source/controllers/user.controller.js
import { AssyncHandler } from "../utils/AssyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateRefreshAndAccesstoken=async(userId)=>{
  try{
    
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken

    await user.save({validateBeforeSave:false})   

    return {accessToken,refreshToken}

  }catch(e){
    throw new ApiResponse(403,"something went wrong while generating accessToken and refreshToken")
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


const loginUser=AssyncHandler(async (req , res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    
    
    console.log(`this is inside login user${req.body}`)

    const {email , password, username} =req.body;
    
    if(!email && !username){
      throw new ApiResponse(401,"enter email or username")
    }

    const user = await User.findOne({
      $or: [{username}, {email}],
    })
  
    if(!user){
      return new ApiResponse(402,"No User Found")    
    }

    const ispasswordValid =await user.ispasswordCorrect()

    if(!ispasswordValid){
      throw new ApiResponse(404,"password is wrong")
    }

    const {accessToken , refreshToken}= await generateRefreshAndAccesstoken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    
    const options={
      httpOnly:true ,
      secure:true,
    }

    return res.status(201)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    json(
      new ApiResponse(
        200,
        {user:refreshToken,logInUser,accessToken},
        "logedin Successfully"
      )
    )

})

const logoutUser=AssyncHandler(async (req , res)=>{
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset:{
          refreshToken:undefined
        }
      },
      {
        new:true
      }
    )

    const options={
      httpOnly:true,
      secure:true
    }

    return res.status(404)
    .clearcookie("refreshToken",options)
    .clearcookie("accessToken",options)
    .json(
      new ApiError(404,"log out successfully")
    )
})

export{ 
    registerUser,
    loginUser,
    logoutUser
};