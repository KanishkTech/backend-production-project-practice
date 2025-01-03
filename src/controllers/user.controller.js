import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";

const registerUser = asyncHandler(async (req, res, next) => {
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
  //   console.log(email);

  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "") // here we are checking if any of the fields are empty and then we are throwing an error

    // here .some() checks if at least one element in an array satisfies a condition and returns true or false.
    //and feild?. The ?. ensures that if field is null or undefined, it does not try to call trim(), and the expression simply returns undefined instead of throwing an error.
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }], // checking here if any of the fields are already present in the database then throw an error $or:[{},{}] work as or operator
  });
  if (existUser) {
    throw new ApiError(400, "User already exists");
  }

  // check for coverImages, check for avatar
  // console.log("in req.files we get :- ",req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path; //file ki local path access karna
  // const coverLocalPath = req.files?.coverImage[0]?.path;

  let coverLocalPath;

  // 1) req.files => Ensures that the files property exists in the req object
  // 2) Array.isArray(req.files.coverImage) => Ensures that the coverImage property is an array
  // Arrays.isArray() is a method that checks if the given value is an array or not.
  // 3) req.files.coverImage.length > 0 => Ensures that the coverImage array has at least one element
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverLocalPath);
  // console.log(avatar);
  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed its required field");
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
  if (!createdUser) {
    throw new ApiError(500, "Something went Wrong while User creation failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validationBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh  tokens and access tokens"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  // console.log(email);
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //.select("-password -refreshToken") ka matlab hai result se "password" aur "refreshToken" fields ko exclude karna (nahi dena).

  // These options are used to set cookies securely, ensuring the tokens (like accessToken or refreshToken) cannot be easily accessed or modified by the user in the frontend.  const option = {
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // get the user
  // remove the refresh token
  // clear the cookies

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", option)
    .clearCookie("accessToken", option)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(400, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(400, "invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, " refresh token is expired or invalid");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };
    const { newRefreshToken, accessToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, option)
      .cookie("accessToken", accessToken, option)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token and refresh token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid REfreshToken token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id); //this req.user getting from our auth.middleware because first we checking user is exist or not by middleware
  const isPasswordMatch = user.comparePassword(oldPassword);
  if (!isPasswordMatch) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validationBeforeSave: false });

  //and hashing password in user.model
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User found successfully")); // because we added middleware where se sending the user from req
});

//plain text details update
const updateDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "Please provide all fields");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName:fullName , email :email } },
    { new: true } // This ensures the updated user document is returned
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});


const updateUserAvatar = asyncHandler(async (req, res) => {
  const NewAvatarLocalPath = req.file?.path;

  if (! NewAvatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  try {
    const avatar = await uploadToCloudinary( NewAvatarLocalPath);
    if (!avatar.url) {
      throw new ApiError(500, "Avatar upload failed while uploading");
    }

 
    const oldAvatarUrl = req.user?.avatar;


    req.user.avatar = avatar.url;
    const updatedUser = await req.user.save();

    if (oldAvatarUrl) {
      await deleteFromCloudinary(oldAvatarUrl);
    }

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "User avatar updated successfully")
    );
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw new ApiError(500, "An error occurred while updating the avatar");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath  = req.file?.path; // here we are getting the avatar from the req.file from multer

  if(!coverImageLocalPath){
    throw new ApiError(400, "CoverImage file is required");
  }
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  if(!coverImage.url){
    throw new ApiError(500, "CoverImage upload failed while uploading");
  }

  const user =  await User.findById(
    req.user?._id,
    {
    $set:{
      coverImage: coverImage.url
    }
  },
  {
    new :true
  },
).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

  const { username } = req.params; // req.params means data coming from url 
  // so here we are using aggregate pipeline to get the user details and the channel details it will return a array of channel
  if(!username){
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),

      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers" // herre in this model we find the subscribers of the channel
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo" // here in this model we find :- how many  channels user subscribed to
      }
    },
    {
      $addFields:{ // here we are adding fields to the uesr model
        subscriberCount:{
          $size:"$subscribers" // here { $subcribers } $ tell us this is field
        },
        channelSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id , "$subscribers.subscriber"]}, // here we are checking if the user is already subscribed to the channel or not
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{ // here we are projecting the fields we want to show 
      fullName:1,// 
      username:1,
      subscriberCount:1,
      channelSubscribedToCount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1,
      email:1,

      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Channel found successfully"));
})

const getWatchedHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchedVideos",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                first:"$owner",
              }
            }
          }
        ]
      }
    }
  ])
  if(!user){
    throw new ApiError(400, "User is missing");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user[0]?.watchHistory, "Watched history found successfully"));

})




export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchedHistory
};
