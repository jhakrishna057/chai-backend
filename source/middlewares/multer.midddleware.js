import express from "express";
import multer from "multer";


const router = express.Router();
const upload = multer({ dest: "public/temp" });




export  {upload};