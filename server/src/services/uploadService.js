/**
 * Upload Service
 * Handles file uploads - uses Cloudinary if configured, otherwise local storage
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const logger = require("../config/logger");

// Check if Cloudinary is properly configured
const cloudinaryEnabled =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary;
if (cloudinaryEnabled) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info("Cloudinary configured for file uploads");
} else {
  logger.info("Using local file storage for uploads");
}

// Base URL for local files - constructed from env or defaults
const getBaseUrl = () => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
};

/**
 * Upload single file
 * @param {string} filePath - Local file path from multer
 * @param {string} folder - Subfolder for organization
 * @param {string} resourceType - 'image', 'video', 'auto'
 */
const uploadFile = async (filePath, folder = "roomlink", resourceType = "auto") => {
  // Try Cloudinary first if configured
  if (cloudinaryEnabled) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: resourceType,
        quality: "auto",
        fetch_format: "auto",
      });

      // Clean up local temp file after successful Cloudinary upload
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

      logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
      };
    } catch (error) {
      logger.warn(`Cloudinary upload failed, falling back to local: ${error.message}`);
    }
  }

  // Local storage fallback
  try {
    const uploadsDir = path.join(__dirname, "../../uploads", folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(filePath);
    const uniqueName = crypto.randomUUID() + ext;
    const destPath = path.join(uploadsDir, uniqueName);

    // Move file from multer temp location to organized folder
    fs.copyFileSync(filePath, destPath);
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    const publicId = `${folder}/${uniqueName}`;
    const url = `${getBaseUrl()}/uploads/${folder}/${uniqueName}`;
    const stats = fs.statSync(destPath);

    logger.info(`File stored locally: ${publicId}`);
    return {
      publicId,
      url,
      format: ext.replace(".", ""),
      size: stats.size,
    };
  } catch (error) {
    logger.error(`Local upload error: ${error.message}`);
    throw error;
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleFiles = async (filePaths, folder = "roomlink") => {
  try {
    const uploads = filePaths.map((fp) => uploadFile(fp, folder));
    return await Promise.all(uploads);
  } catch (error) {
    logger.error(`Multiple file upload error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete file
 */
const deleteFile = async (publicId) => {
  try {
    if (cloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`File deleted from Cloudinary: ${publicId}`);
    } else {
      const localPath = path.join(__dirname, "../../uploads", publicId);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        logger.info(`File deleted locally: ${publicId}`);
      }
    }
    return true;
  } catch (error) {
    logger.error(`Delete file error: ${error.message}`);
    throw error;
  }
};

/**
 * Get file info
 */
const getFileInfo = async (publicId) => {
  try {
    if (cloudinaryEnabled) {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at,
      };
    }
    const localPath = path.join(__dirname, "../../uploads", publicId);
    const stats = fs.statSync(localPath);
    return {
      publicId,
      url: `${getBaseUrl()}/uploads/${publicId}`,
      format: path.extname(localPath).replace(".", ""),
      size: stats.size,
      createdAt: stats.birthtime,
    };
  } catch (error) {
    logger.error(`Get file info error: ${error.message}`);
    throw error;
  }
};

const uploadHostelImage = async (filePath) => uploadFile(filePath, "hostels", "image");
const uploadUserAvatar = async (filePath) => uploadFile(filePath, "avatars", "image");
const uploadRoomImages = async (filePaths) => uploadMultipleFiles(filePaths, "rooms");
const uploadDocument = async (filePath) => uploadFile(filePath, "documents", "auto");

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
