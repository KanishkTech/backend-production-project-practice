//step 1:u can use promise to resolve the function [source-chai aur code v-9]
const asyncHandler = (fn)=>{
    (rq,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err));
    }
}

export { asyncHandler};

// step :2 u can use try catch block to resolve the function

// const asyncHandler = ()=>{}  //normal function
// const asyncHandler = (fn)=>{ () => {} } ;// higher order function which take function as parameter an can return a function
// const asyncHandler = (fn) => async () => {} ; // makes it async function and remove {}

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       errorMsg: error.message,
//     });
//     next(error);
//   }
// };
