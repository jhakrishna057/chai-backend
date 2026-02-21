import express from "express";
import multer from "multer";
import { registerUser } from "../controllers/user.controller.js";

const router = express.Router();
const upload = multer({ dest: "public/temp" });

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  registerUser
);

export  {upload};