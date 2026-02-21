// source/controllers/user.controller.js
import { AssyncHandler } from "../utils/AssyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = AssyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  // Validate required fields
  if ([fullName, email, username, password].some(f => !f || f.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });
  if (existedUser) throw new ApiError(409, "User with email or username already exists");

  // Get avatar path from multer
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  // Optional cover image
  let coverImageUrl = "";
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (coverImageLocalPath) {
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    coverImageUrl = coverImage?.url || "";
  }

  // Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) throw new ApiError(400, "Avatar upload failed");

  // Create user in DB
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImageUrl
  });

  // Remove sensitive fields from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) throw new ApiError(500, "Something went wrong while registering the user");

  return res.status(201).json(new ApiResponse(true, "User registered successfully", createdUser));
});

export { registerUser };