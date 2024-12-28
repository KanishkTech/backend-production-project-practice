import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  //ALGORITHM
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  console.log(email);

  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "") // here we are checking if any of the fields are empty and then we are throwing an error

    // here .some() checks if at least one element in an array satisfies a condition and returns true or false.
    //and feild?. The ?. ensures that if field is null or undefined, it does not try to call trim(), and the expression simply returns undefined instead of throwing an error.
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existUser = User.findOne({
    $or: [{ username }, { email }], // checking here if any of the fields are already present in the database then throw an error $or:[{},{}] work as or operator
  });
  if (existUser) {
    throw new ApiError(400, "User already exists");
  }

  // check for coverImages, check for avatar

  const avatarLocalPath = req.files?.avatar[0]?.path; //file ki local path access karna
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed its required");
  }

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if(!createdUser){
    throw new ApiError(500, "Something went Wrong while User creation failed");
  }

  return res.status(200).json(
    new ApiResponse(
        200,
        createdUser,
        "User created successfully",
        
    )
  )

});
