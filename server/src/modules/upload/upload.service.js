const cloudinary = require("cloudinary").v2;
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Upload Service
 * Business logic for file uploads to Cloudinary
 */

/**
 * Upload single file to Cloudinary
 */
const uploadFile = async (file, folderName = "roomlink") => {
  try {
    if (!file) {
      throw new ApiError(400, "No file provided");
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new ApiError(400, "File size exceeds maximum limit of 5MB");
    }

    // Return promise to upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          resource_type: "auto",
          public_id: `${Date.now()}-${file.filename}`,
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload error: ${error.message}`);
            reject(new ApiError(500, `Upload failed: ${error.message}`));
          } else {
            logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              size: result.bytes,
              format: result.format,
              uploadedAt: new Date(),
            });
          }
        }
      );

      uploadStream.end(file.data);
    });
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 */
const uploadMultipleFiles = async (files, folderName = "roomlink") => {
  try {
    if (!files || files.length === 0) {
      throw new ApiError(400, "No files provided");
    }

    const uploadPromises = files.map((file) =>
      uploadFile(file, folderName)
    );

    const uploadedFiles = await Promise.all(uploadPromises);

    logger.info(`${uploadedFiles.length} files uploaded to Cloudinary`);
    return uploadedFiles;
  } catch (error) {
    logger.error(`Error uploading multiple files: ${error.message}`);
    throw error;
  }
};

/**
 * Upload room images
 */
const uploadRoomImages = async (files, roomId) => {
  try {
    const images = await uploadMultipleFiles(files, `roomlink/rooms/${roomId}`);
    return images;
  } catch (error) {
    logger.error(`Error uploading room images: ${error.message}`);
    throw error;
  }
};

/**
 * Upload hostel images
 */
const uploadHostelImages = async (files, hostelId) => {
  try {
    const images = await uploadMultipleFiles(files, `roomlink/hostels/${hostelId}`);
    return images;
  } catch (error) {
    logger.error(`Error uploading hostel images: ${error.message}`);
    throw error;
  }
};

/**
 * Upload user avatar
 */
const uploadUserAvatar = async (file, userId) => {
  try {
    const avatar = await uploadFile(file, `roomlink/avatars/${userId}`);
    return avatar;
  } catch (error) {
    logger.error(`Error uploading user avatar: ${error.message}`);
    throw error;
  }
};

/**
 * Upload review images
 */
const uploadReviewImages = async (files, reviewId) => {
  try {
    const images = await uploadMultipleFiles(
      files,
      `roomlink/reviews/${reviewId}`
    );
    return images;
  } catch (error) {
    logger.error(`Error uploading review images: ${error.message}`);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId) => {
  try {
    if (!publicId) {
      throw new ApiError(400, "Public ID is required");
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      logger.info(`File deleted from Cloudinary: ${publicId}`);
      return true;
    } else {
      throw new ApiError(500, "Failed to delete file from Cloudinary");
    }
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 */
const deleteMultipleFiles = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      throw new ApiError(400, "No public IDs provided");
    }

    const deletePromises = publicIds.map((publicId) => deleteFile(publicId));
    await Promise.all(deletePromises);

    logger.info(`${publicIds.length} files deleted from Cloudinary`);
    return true;
  } catch (error) {
    logger.error(`Error deleting multiple files: ${error.message}`);
    throw error;
  }
};

/**
 * Get file metadata from Cloudinary
 */
const getFileMetadata = async (publicId) => {
  try {
    if (!publicId) {
      throw new ApiError(400, "Public ID is required");
    }

    const result = await cloudinary.api.resource(publicId);

    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      uploadedAt: result.created_at,
    };
  } catch (error) {
    logger.error(`Error getting file metadata: ${error.message}`);
    throw new ApiError(500, `Failed to get file metadata: ${error.message}`);
  }
};

/**
 * Optimize image for display
 */
const optimizeImage = (url, width = 500, height = 500, quality = "auto") => {
  try {
    if (!url) {
      throw new ApiError(400, "URL is required");
    }

    // Extract public ID from URL
    const urlParts = url.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      throw new ApiError(400, "Invalid Cloudinary URL");
    }

    const baseUrl = urlParts.slice(0, uploadIndex + 1).join("/");
    const transformations = `w_${width},h_${height},c_fill,q_${quality}`;
    const publicId = urlParts.slice(uploadIndex + 2).join("/");

    const optimizedUrl = `${baseUrl}/${transformations}/${publicId}`;
    return optimizedUrl;
  } catch (error) {
    logger.error(`Error optimizing image: ${error.message}`);
    throw error;
  }
};

/**
 * Generate thumbnail
 */
const generateThumbnail = (url, size = 200) => {
  try {
    return optimizeImage(url, size, size, "auto");
  } catch (error) {
    logger.error(`Error generating thumbnail: ${error.message}`);
    throw error;
  }
};

/**
 * Check file type
 */
const isValidImageFile = (file) => {
  try {
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    const fileExtension = file.filename
      ? `.${file.filename.split(".").pop().toLowerCase()}`
      : "";

    const isValidType = validMimeTypes.includes(file.mimetype);
    const isValidExtension = validExtensions.includes(fileExtension);

    return isValidType && isValidExtension;
  } catch (error) {
    logger.error(`Error validating file: ${error.message}`);
    return false;
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  uploadRoomImages,
  uploadHostelImages,
  uploadUserAvatar,
  uploadReviewImages,
  deleteFile,
  deleteMultipleFiles,
  getFileMetadata,
  optimizeImage,
  generateThumbnail,
  isValidImageFile,
};
