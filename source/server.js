import conncectDB from "./db/index.js"
import { app } from "./app.js"
import dotenv from "dotenv"

dotenv.config({
    path:"./.env",
})

conncectDB().then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`app is listening on ${process.env.PORT}`);
        
    })
})
.catch((e)=>{
    console.log(`app cant talk to db `,e);  
})
