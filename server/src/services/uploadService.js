/**
 * Upload Service
 * Handles file uploads to Cloudinary
 */

const cloudinary = require("cloudinary").v2;
const logger = require("../config/logger");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload single file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder
 * @param {string} resourceType - 'image', 'video', 'auto'
 */
const uploadFile = async (filePath, folder = "roomlink", resourceType = "auto") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
      quality: "auto",
      fetch_format: "auto",
    });

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw error;
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleFiles = async (filePaths, folder = "roomlink") => {
  try {
    const uploads = filePaths.map((filePath) =>
      uploadFile(filePath, folder)
    );
    const results = await Promise.all(uploads);
    return results;
  } catch (error) {
    logger.error(`Multiple file upload error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return true;
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw error;
  }
};

/**
 * Get file info from Cloudinary
 */
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      createdAt: result.created_at,
    };
  } catch (error) {
    logger.error(`Get file info error: ${error.message}`);
    throw error;
  }
};

/**
 * Upload hostel image
 */
const uploadHostelImage = async (filePath) => {
  return uploadFile(filePath, "roomlink/hostels", "image");
};

/**
 * Upload user avatar
 */
const uploadUserAvatar = async (filePath) => {
  return uploadFile(filePath, "roomlink/avatars", "image");
};

/**
 * Upload hostel room images
 */
const uploadRoomImages = async (filePaths) => {
  return uploadMultipleFiles(filePaths, "roomlink/rooms");
};

/**
 * Upload document (ID, proof, etc.)
 */
const uploadDocument = async (filePath) => {
  return uploadFile(filePath, "roomlink/documents", "auto");
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFileInfo,
  uploadHostelImage,
  uploadUserAvatar,
  uploadRoomImages,
  uploadDocument,
};
