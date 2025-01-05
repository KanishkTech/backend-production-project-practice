import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    return next(new ApiError(400, "Invalid video id"));
  }
  const video = await Video.findById(videoId);
  if (!video) {
    return next(new ApiError(404, "Video not found"));
  }
  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });
  try {
    if (existingLike) {
      await existingLike.remove();

      return res
        .status(200)
        .json(new ApiResponse(200, "Like removed successfully of video"));
    } else {
      const like = await Like.create({ video: videoId, likedBy: userId });

      return res
        .status(200)
        .json(new ApiResponse(200, "Like added successfully to video"));
    }
  } catch (error) {
    return next(new ApiError(500, "Error toggling like"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const userId = req.user?._id;
  if (!isValidObjectId(commentId)) {
    return next(new ApiError(400, "Invalid comment id"));
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(404, "Comment not found"));
  }
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  try {
    if (existingLike) {
      await existingLike.remove();
      return res
        .status(200)
        .json(new ApiResponse(200, "Like removed successfully from comment "));
    } else {
      const like = await Like.create({ comment: commentId, likedBy: userId });
      return res
        .status(200)
        .json(new ApiResponse(200, "Like added successfully to comment"));
    }
  } catch (error) {
    return next(new ApiError(500, "Error toggling like"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet id");
  }
  const tweet = await Like.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  const existingLike = await Like.findOne({ likedBy: userId, tweet: tweetId });
  try {
    if (existingLike) {
      await existingLike.remove();
      return res
        .status(200)
        .json(new ApiResponse(200, "Like removed successfully from tweet "));
    } else {
      const like = await Like.create({ tweet: tweetId, likedBy: userId });
      return res
        .status(200)
        .json(new ApiResponse(200, "Like added successfully to tweet"));
    }
  } catch (e) {
    throw new ApiError(500, "Error toggling like on tweet");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;

  //step 1: by using populate function we can fetch the liked videos
//   const likedVideos = await Like.find({ likedBy: userId }).populate({
//     path: "videos",
//     select: "title description thumbnail duration",
//     populate: {
//       path: "owners",
//       select: "avatar username fullname",
//     },
//   });

// step 2 : by aggregation pipeline 

const likedVideos = await Like.aggregate(
    [
        {
            $match: { 
                likedBy: mongoose.Types.ObjectId(userId) 
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as:"video"
            }
        },
        {
            $unwind:{
                path:"$video" // since $lookup returns an array
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as:"owner"
            }
        },
        {
            $unwind:{
                path: "$owner"
            }
        },
        {
            $project: {
                "video.title": 1,
                "video.description": 1,
                "video.thumbnail": 1,
                "video.duration": 1,
                "owner.avatar": 1,
                "owner.username": 1,
                "owner.fullName": 1,
            }
        }

    ]
)

 if(!likedVideos || likedVideos.length  === 0){
    throw new ApiError(
        404,
        "No liked videos found"
    )
 }

 return res
 .status(200)
 .json(new ApiResponse(200, "Liked videos fetched successfully", likedVideos));

});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
