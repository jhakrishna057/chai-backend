import { ApiError } from "../utils/ApiError.js";
import { AssyncHandler } from "../utils/AssyncHandler.js";
import  JsonWebToken  from "jsonwebtoken";
import { User } from "../models/user.models.js";

const {jwt}=JsonWebToken

export const verifyJWT=AssyncHandler(async(req ,_ ,next)=>{
    
    try {
        const token= req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401,"unauthorized user")
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        if(!decodedToken){
            throw new ApiError(402,"problem in decoding token")
        }
    
        const user=await User.findOne(_.id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(403,"no user from the corresponding to refresh token")
        }
    
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(404,error?.message || "invalid jwt")
    }
    
})

