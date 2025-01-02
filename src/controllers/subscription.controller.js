import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  try {
    if (!userId) throw new ApiError(401, "Unauthorized user");
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

    const subscribed = await Subscription.findOne({
      channel: channelId,
      subscriber: userId,
    });

    if (subscribed) {
      await Subscription.deleteOne({ _id: subscribed._id });
      return res.status(200).json({
        success: true,
        message: "Unsubscribed successfully",
      });
    }

    await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    return res.status(201).json({
      success: true,
      message: "Subscribed successfully",
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to toggle subscription");
  }
});

// Get channel subscribers
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  try {
    if (!isValidObjectId(userId)) throw new ApiError(401, "Unauthorized user ID");
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

    const subscribers = await Subscription.find({ channel: channelId }).populate(
      "subscriber",
      "username"
    );

    if (subscribers.length === 0) {
      return res.status(200).json(new ApiResponse(200, "No subscribers found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Subscribers found", subscribers));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to get subscribers");
  }
});

// Get subscribed channels
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const userId = req.user?._id;

  try {
    if (!isValidObjectId(subscriberId))
      throw new ApiError(401, "Unauthorized user ID");
    if (!isValidObjectId(userId))
      throw new ApiError(401, "Unauthorized user ID");

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          subscriber: mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channelDetails",
        },
      },
      {
        $addFields: {
          channelDetails: { $arrayElemAt: ["$channelDetails", 0] },
        },
      },
      {
        $project: {
          "channelDetails._id": 1,
          "channelDetails.name": 1,
          "channelDetails.description": 1,
        },
      },
    ]);

    if (subscribers.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No subscribed channels found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Subscribed channels found", subscribers));
  } catch (error) {
    throw new ApiError(500, error.message || "Invalid subscription");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
