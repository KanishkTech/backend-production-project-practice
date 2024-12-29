import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
    
    // console.log("FILE IS UPLOADED TO CLOUDINARY AND THIS WE GET IN CLODINARY ", upload);
    fs.unlinkSync(localFilePath); //remove the locally  temporary saved file after uploading it to cloudinary
    return upload;
  } catch (err) {
    fs.unlinkSync(localFilePath); //remove the locally  temporary saved file as the upload operation got failled
    return null;
  }
};

export { uploadToCloudinary };