import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = re.user._id;

  const VideoCount = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Schema.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: "$videoFile",

        totalViews: {
          $sum: "$views",
        },
        totalVideos: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
        totalVideos: 1,
      },
    },
  ]);

  const subscriptionCount = await Subscription.aggregate([
    {
      $match: {
        subscriber: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscribers: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSubscribers: 1,
      },
    },
  ]);

  const likeCount = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo",
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweetInfo",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "comment",
        foreignField: "_id",
        as: "commentInfo",
      },
    },
    {
      $match: {
        $or: [
          {
            "videoInfo.owner": userId,
          },
          {
            "tweetInfo.owner": userId,
          },
          {
            "commentInfo.owner": userId,
          },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalLikes: 1,
      },
    },
  ]);

  const info = {
    totalViews: videoCount[0].totalViews,
    totalVideos: videoCount[0].totalVideos,
    totalSubscribers: subsCount[0].totalSubscribers,
    totalLikes: likeCount[0].totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, info, "Channel Stats Fetched"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user._id;
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Schema.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(ApiResponse.success(videos, "Videos retrieved successfully"));
});

export { getChannelStats, getChannelVideos };
