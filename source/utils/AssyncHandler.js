const AssyncHandler=(controller)=>{
    return (req,res,next)=>{
        Promise.resolve(controller(req,res,next)).catch((err)=>next(err))
    }
}
export {AssyncHandler}