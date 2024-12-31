import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  try {
    if(!videoId){
      throw new ApiError(400, "Video ID is required");
    }
    const video = await Video.findById(videoId);
    if(!video){
      throw new ApiError(404, "Video not found");
    }
    
    
  } catch (error) {
    throw new ApiError(500, "Failed to get comments");
  }

});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user._id;
  try {
    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    if (!content) {
      throw new ApiError(400, "Comment content is required");
    }

    const newComment = await Comment.create({
      content,
      video: videoId,
      owner: user,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Comment added successfully", newComment));
  } catch (error) {
    throw new ApiError(500, "Failed to add comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const user = req.user._id;
    try {
        if(!commentId || !content){
            throw new ApiError(400, "Comment ID and content is required");
        }
        const comment = await Comment.findById(commentId);
        if(!comment){
            throw new ApiError(404, "Comment not found");
        }
        if(comment.owner.toString() !== user.toString()){
            throw new ApiError(403, "You are not authorized to update this comment");
        }
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId, 
            {content},
            {new: true}
        );
        
        if(!updatedComment){
            throw new ApiError(500, "Failed to update comment");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment updated successfully",
                updatedComment
            ));
        
    } catch (error) {
        throw new ApiError(500, "Failed to update comment");
    }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
    const user = req.user._id;
    try {
        if(!commentId){
            throw new ApiError(400, "Comment ID is required");
        }
        const commentOwner = await Comment.findById(commentId);
        if(!commentOwner){
            throw new ApiError(404, "Comment not found");
        }
        if(commentOwner.owner.toString() !== user.toString()){
            throw new ApiError(403, "You are not authorized to delete this comment");
        }
        await Comment.findByIdAndDelete(commentId);
       
        return res.status(200).json(
            new ApiResponse(200, "Comment deleted successfully",)
        );

    }catch(error) {
        throw new ApiError(500, "Failed to delete comment");
    }
});

export { getVideoComments, addComment, updateComment, deleteComment };
