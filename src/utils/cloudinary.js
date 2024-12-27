import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const upload = cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("FILE IS UPLOADED TO CLOUDINARY", upload.url);
    return upload;
  } catch (err) {
    fs.unlinkSync(localFilePath); //remeve the locally  temporary saved file as the upload operation got failled
    return null;
  }
};
