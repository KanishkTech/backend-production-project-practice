import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const user = req.user?._id;

  try {
    if (!user) {
      throw new ApiError(401, "Unauthorized user");
    }
    if (!content) {
      throw new ApiError(400, "Tweet content is required");
    }
    const newTweet = await Tweet.create({
      content,
      owner: user,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, "Tweet created successfully", newTweet));
  } catch (error) {
    throw new ApiError(500, "Failed to create tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const user = req.user?._id;

  // Check if the user ID is valid
  if (!isValidObjectId(user)) {
    throw new ApiError(401, "Unauthorized user ID");
  }

  const tweets = await Tweet.find({ owner: user }).sort({ createdAt: -1 });

  if (tweets.length === 0) {
    return res.status(200).json(new ApiResponse(200, "No tweets found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User tweets retrieved successfully", tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
  const user = req.user;
  const { tweetId } = req.params;
  const { content } = req.body;

  try {
    if (!user) {
      throw new ApiError(401, "Unauthorized user");
    }
    if (!tweetId) {
      throw new ApiError(400, "Tweet ID is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
    if (tweet.owner.toString() !== user.toString()) {
      throw new ApiError(403, "Unauthorized to update tweet");
    }
    const modifiedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      { $set: { content } },
      { new: true }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet updated successfully", modifiedTweet));
  } catch (error) {
    throw new ApiError(500, "Failed to update tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const user = req.user;
  const { tweetId } = req.params;

  if (!user) {
    throw new ApiError(401, "Unauthorized user");
  }
  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (tweet.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete tweet");
  }

  await tweet.remove();
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
