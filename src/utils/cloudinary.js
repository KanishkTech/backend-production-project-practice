import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file to cloudinary
    const upload = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    
    console.log("FILE IS UPLOADED TO CLOUDINARY AND THIS WE GET IN CLODINARY ", upload);
    fs.unlinkSync(localFilePath); //remove the locally  temporary saved file after uploading it to cloudinary
    return upload;
  } catch (err) {
    fs.unlinkSync(localFilePath); //remove the locally  temporary saved file as the upload operation got failled
    return null;
  }
};

const deleteFromCloudinary = async (oldCloudinaryImg) => {
  try {
    if(!oldCloudinaryImg) return null;

    const oldImage = oldCloudinaryImg.split("/").pop().split(".")[0];
    const result = await cloudinary.uploader.destroy(oldImage);
    console.log(result);
    if (result.result === "ok") {
      console.log("Image deleted successfully:", result);
      return { success: true, message: "Image deleted successfully" };
    } else {
      console.warn("Failed to delete image:", result);
      return { success: false, message: "Failed to delete image" };
    }

 
  } catch (error) {
    throw new ApiError(500, "Failed to delete image from cloudinary");
  }
}

export { uploadToCloudinary ,deleteFromCloudinary };