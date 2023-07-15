const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
    });
    return {
      url: data.secure_url,
    };
  } catch (error) {
    return error;
  }
};

module.exports = cloudinaryUpload;
