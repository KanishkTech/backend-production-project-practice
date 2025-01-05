import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;

  //TODO: create playlist

  try {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    if (!name || !description) {
      throw new ApiError(400, "Name and description are required");
    }
    const playlist = await Playlist.create({
      name,
      description,
      owner: userId,
    });
    if (!playlist) {
      throw new ApiError(400, "Failed to create playlist");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "Playlist created successfully", playlist));
  } catch (error) {
    throw new ApiError(
      error.status || 500,
      error.message || "Failed to create playlist"
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  try {
    const userPlaylist = await Playlist.aggregate([
      {
        $match: { owner: mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos",
        },
      },
      {
        $unwind: {
          path: "$videos",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "videos.owner",
          foreignField: "_id",
          as: "videosOwner",
        },
      },
      {
        $unwind: {
          path: "$videosOwner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "videos.owner": {
            username: "$videosOwner.username",
            avatar: "$videosOwner.avatar",
          },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          videos: {
            videoFile: 1,
            title: 1,
            discription: 1,
            owner: 1,
          },
        },
      },
    ]);

    if (!userPlaylist || userPlaylist.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, "No playlists found for the user", []));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Playlists found for the user", userPlaylist));
  } catch (error) {
    throw new ApiError(
      error.message || "Internal Server Error",
      error.status || 500
    );
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  try {
    const playlist = await Playlist.findById(playlistId).populate("videos");
    if (!playlist) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Playlist not found", []));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Playlist found", playlist));
  } catch (error) {
    throw new ApiError(
      error.message || "Internal Server Error",
      error.status || 500
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user.id;

  try {
    if (!playlistId || !videoId) {
      throw new ApiError(400, "Missing required parameters: playlistId or videoId.");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== userId) {
      throw new ApiError(403, "Invalid request, missing playlistId or videoId");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Video added to playlist", playlist));
  } catch (error) {
    throw new ApiError(
      error.message || "Internal Server Error",
      error.status || 500
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  try {
    if (!playlistId || !videoId) {
      throw new ApiError(400, "Missing required parameters: playlistId or videoId.");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user.id) {
      throw new ApiError(403, "Unauthorized access to the playlist.");
    }

    playlist.videos.pull(videoId);
    await playlist.save();
    return res
      .status(200)
      .json(new ApiResponse(200, "Video removed from playlist", playlist));
  } catch (error) {
    throw new ApiError(
      error.message || "Internal Server Error",
      error.status || 500
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  try {
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid request ,missing playlistId");
    }

    const playlist = await Playlist.getPlaylistById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user.id) {
      throw new ApiError(403, "Unauthorized access to the playlist.");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Playlist deleted successFully"));
  } catch (error) {
    throw new ApiError(
      error.message || "Internal Server Error",
      error.status || 500
    );
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  try {
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid request ,missing playlistId");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user.id) {
      throw new ApiError(403, "Unauthorized access to the playlist.");
    }
    if (!name && !description) {
      throw new ApiError(400, "name or description is required");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        ...(name && { name }), // Only include name if provided
        ...(description && { description }),
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Playlist updated successfully", updatedPlaylist));
  } catch (err) {
    throw new ApiError(
      err.message || "Internal Server Error",
      err.status || 500
    );
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
