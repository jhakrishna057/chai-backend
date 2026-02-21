import {v2 as cloudinary} from "cloudinary"
import fs, { existsSync } from "fs"

cloudinary.config({
    cloud_name:process.env.cloud_name,
    api_secret:process.env.api_secret,
    api_key:process.env.api_key
})



const uploadOnCloudinary=async(LocalPath)=> {
    try{
        if(!LocalPath){
            return null
        }
        console.log("uploading on cloudinary")
        const response=await cloudinary.uploader.upload(LocalPath,{
            folder:"user",
            resource_type:"auto"
        })
        fs.unlinkSync(LocalPath)
        console.log(response)
        return response.url
    }
    catch(e){
        console.log("error in uploading Local Path on cloudinary",e);
        if(existsSync(LocalPath)){
            fs.unlinkSync(LocalPath)
        }
        
    }
    
}
export {uploadOnCloudinary}