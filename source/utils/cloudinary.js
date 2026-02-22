import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);
console.log("Cloudinary name:", process.env.CLOUDINARY_NAME);
export const uploadOnCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, { folder: "users" });
    fs.unlinkSync(filePath)
    return result;
  } catch (error) {
    console.error("error in uploading Local Path on cloudinary", error);
    fs.unlinkSync(filePath)
    throw error;
  }
};