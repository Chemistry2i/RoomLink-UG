/**
 * Upload Controller
 * Handles file upload endpoints
 */

const fs = require("fs");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const uploadService = require("../../services/uploadService");
const logger = require("../../config/logger");

/**
 * Upload single file (avatar, hostel image, etc.)
 */
const uploadSingleFile = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file provided");
    }

    const fileType = req.body.type || "general"; // avatar, hostel, room, document
    let uploadResult;

    // Route to appropriate upload function
    switch (fileType) {
      case "avatar":
        uploadResult = await uploadService.uploadUserAvatar(req.file.path);
        break;
      case "hostel":
        uploadResult = await uploadService.uploadHostelImage(req.file.path);
        break;
      case "document":
        uploadResult = await uploadService.uploadDocument(req.file.path);
        break;
      default:
        uploadResult = await uploadService.uploadFile(req.file.path);
    }

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    logger.info(`File uploaded: ${req.user.id || "anonymous"} - ${fileType}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          file: uploadResult,
        },
        "File uploaded successfully"
      )
    );
  } catch (error) {
    // Clean up temp file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

/**
 * Upload multiple files (room gallery, documents, etc.)
 */
const uploadMultipleFiles = asyncHandler(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "No files provided");
    }

    const fileType = req.body.type || "general";
    const filePaths = req.files.map((file) => file.path);
    let uploadResults;

    // Route to appropriate upload function
    switch (fileType) {
      case "room":
        uploadResults = await uploadService.uploadRoomImages(filePaths);
        break;
      default:
        uploadResults = await uploadService.uploadMultipleFiles(filePaths);
    }

    // Delete temporary files
    req.files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    logger.info(
      `${req.files.length} files uploaded: ${req.user.id || "anonymous"} - ${fileType}`
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          files: uploadResults,
          count: uploadResults.length,
        },
        "Files uploaded successfully"
      )
    );
  } catch (error) {
    // Clean up temp files if exist
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

/**
 * Delete file
 */
const deleteFile = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      throw new ApiError(400, "Public ID is required");
    }

    await uploadService.deleteFile(publicId);

    logger.info(`File deleted: ${publicId} by ${req.user.id}`);

    return res.status(200).json(
      new ApiResponse(200, null, "File deleted successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

/**
 * Get file info
 */
const getFileInfo = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw new ApiError(400, "Public ID is required");
    }

    const fileInfo = await uploadService.getFileInfo(publicId);

    return res.status(200).json(
      new ApiResponse(200, { file: fileInfo }, "File info retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  getFileInfo,
};
