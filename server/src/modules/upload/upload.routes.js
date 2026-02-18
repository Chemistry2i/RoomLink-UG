const express = require("express");
const router = express.Router();
const uploadController = require("./upload.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { uploadLimiter } = require("../../middlewares/rateLimit.middleware");
const upload = require("../../middlewares/upload.middleware");

/**
 * Upload Routes
 * POST   /api/v1/upload/single        - Upload single file
 * POST   /api/v1/upload/multiple      - Upload multiple files
 * DELETE /api/v1/upload/:id           - Delete file
 * GET    /api/v1/upload/:id/info      - Get file info
 */

// All routes require authentication and rate limiting
router.use(authenticate);

router.post(
  "/single",
  uploadLimiter,
  upload.single("file"),
  uploadController.uploadSingleFile
);

router.post(
  "/multiple",
  uploadLimiter,
  upload.array("files", 10),
  uploadController.uploadMultipleFiles
);

router.delete("/:id", uploadController.deleteFile);

router.get("/:id/info", uploadController.getFileInfo);

module.exports = router;
