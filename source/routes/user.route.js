import{json, Router} from "express"
import { upload } from "../middlewares/multer.midddleware.js"
import { changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAvatar, updateDetails } from "../controllers/user.controller.js"
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



//routes using multer-upload
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  registerUser
)
router.route("/update-avatar").post(
    upload.fields([
    { name: "avatar", maxCount: 1 }
  ]),
  updateAvatar
)
router.route("/update-CoverImage").post(
    upload.fields([
    { name: "coverImageLocal", maxCount: 1 }
  ]),
  updateAvatar
)



router.route("/logout").post(verifyJWT,logoutUser)
router.route("/update-details").post(verifyJWT,updateDetails)
router.route("/getUser").get(verifyJWT,getCurrentUser)
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/refresh-token").post(refreshAccessToken)






export default router
