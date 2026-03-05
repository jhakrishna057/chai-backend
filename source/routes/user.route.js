import{json, Router} from "express"
import { upload } from "../middlewares/multer.midddleware.js"
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"



const router =new Router()

router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secure routes

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router
