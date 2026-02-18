const ApiError = require("../utils/ApiError");

/**
 * File Upload Validation Middleware
 * Validates file size, type, and dimensions for images
 */

// Allowed file types by category
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "application/msword"],
  video: ["video/mp4", "video/quicktime"],
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
};

// Image dimensions
const IMAGE_DIMENSIONS = {
  minWidth: 100,
  minHeight: 100,
  maxWidth: 5000,
  maxHeight: 5000,
};

/**
 * Validate file upload
 */
const validateFileUpload = (fileType = "image") => {
  return (req, res, next) => {
    // Check if file exists
    if (!req.file) {
      return next(new ApiError(400, "No file provided"));
    }

    const file = req.file;
    const allowedTypes = ALLOWED_TYPES[fileType] || ALLOWED_TYPES.image;
    const maxSize = MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.image;

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      return next(
        new ApiError(
          400,
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
        )
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      return next(
        new ApiError(
          400,
          `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
        )
      );
    }

    next();
  };
};

/**
 * Validate multiple file uploads
 */
const validateMultipleFileUploads = (fileType = "image", maxFiles = 10) => {
  return (req, res, next) => {
    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return next(new ApiError(400, "No files provided"));
    }

    // Check file count
    if (req.files.length > maxFiles) {
      return next(
        new ApiError(400, `Maximum ${maxFiles} files allowed`)
      );
    }

    const allowedTypes = ALLOWED_TYPES[fileType] || ALLOWED_TYPES.image;
    const maxSize = MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.image;

    // Validate each file
    for (const file of req.files) {
      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        return next(
          new ApiError(
            400,
            `Invalid file type for ${file.originalname}. Allowed types: ${allowedTypes.join(", ")}`
          )
        );
      }

      // Validate file size
      if (file.size > maxSize) {
        return next(
          new ApiError(
            400,
            `File ${file.originalname} exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
          )
        );
      }
    }

    next();
  };
};

/**
 * Validate image dimensions using sharp
 */
const validateImageDimensions = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const sharp = require("sharp");
    const metadata = await sharp(req.file.buffer).metadata();

    const { width, height } = metadata;
    const { minWidth, minHeight, maxWidth, maxHeight } = IMAGE_DIMENSIONS;

    if (width < minWidth || height < minHeight) {
      return next(
        new ApiError(
          400,
          `Image dimensions must be at least ${minWidth}x${minHeight}px`
        )
      );
    }

    if (width > maxWidth || height > maxHeight) {
      return next(
        new ApiError(
          400,
          `Image dimensions must not exceed ${maxWidth}x${maxHeight}px`
        )
      );
    }

    next();
  } catch (error) {
    next(new ApiError(500, `Image validation failed: ${error.message}`));
  }
};

module.exports = {
  validateFileUpload,
  validateMultipleFileUploads,
  validateImageDimensions,
  ALLOWED_TYPES,
  MAX_FILE_SIZES,
  IMAGE_DIMENSIONS,
};
