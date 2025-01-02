import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

try {
    
      if(!title||!description){
        throw new ApiError(400, "Please provide title and description");
      }
    
      const videoLocalPath = req.file?.path;
      if(!videoLocalPath){
        throw new ApiError(400, "Please provide a video");
      }
    
      const video  = await uploadToCloudinary(videoLocalPath);
    
      if(!video){
        throw new ApiError(400, "Failed to upload video to cloudinary");
      }
      const newVideo = await Video.create({
        title,
        description,
        owner:req.user?._id,
        videoFile:video.url,
    
      })
    
      if(!newVideo){
        throw new ApiError(400, "Failed to publish video");
      }
      return res
      .status(201)
      .json(new ApiResponse(201, "Video published successfully", newVideo));
    
    
} catch (error) {
    throw new ApiError("Failed to publish video", error.message)
    
}
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const userId = req.user?._id;
  try {
    const video = await Video.aggregate([
      {
        $match: {
          _id: mongoose.model.Types.ObjectId(videoId),
        },
      },
      {
        lookup: {
          from: "users",
          localField: "OwnerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $addFields: {
          owner: {
            $arrayElemAt: ["$owner", 0],
          },
        },
      },
      {
        $project: {
          title: 1,
          videoFile: 1,
          thumbnail: 1,
          description: 1,
          duration: 1,
          views: 1,
          "owner.username": 1,
          "owner._id": 1,
          "owner.avatar": 1,
        },
      },
    ]);
    if (!video || video.length === 0) {
      throw new ApiError(404, "Video not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, video, "Video Details are fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message, "Video not found");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
try {
    
      const video = await Video.findone({ _id: videoId });
      if (!video) {
        throw new ApiError(404, "Video not found");
      }
      if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "u cant do changes , your are not owner");
      }
    
      const UpdateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          $set: {
            title: req.body.title,
            description: req.body.description,
            thumbnail: req.body.thumbnail,
          },
        },
        { new: true }
      );
    
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            UpdateVideo,
            "Video Details are updated successfully"
          )
        );
} catch (error) {
    throw new ApiError(
        500,
        error.message || "Error while updating video"  
    )
}
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  try {
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Video not found", error.message);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res
    .status(200)
    .json(new ApiResponse(200, "Video publish status updated successfully"));
    
  } catch (error) {
    throw new ApiError(500, "Error while toggle", error.message);
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
