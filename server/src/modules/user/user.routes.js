const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authenticate = require("../../middlewares/auth.middleware");

/**
 * User Routes
 * All routes require authentication
 * 
 * GET    /api/v1/users/profile                  - Get own profile
 * PATCH  /api/v1/users/profile                  - Update own profile
 * DELETE /api/v1/users/profile                  - Delete own account
 * GET    /api/v1/users/preferences              - Get notification preferences
 * PATCH  /api/v1/users/preferences              - Update notification preferences
 * GET    /api/v1/users/public/:userId           - Get public profile
 */

// Protected routes (require authentication)
router.use(authenticate);

router.get("/profile", userController.getProfile);
router.patch("/profile", userController.updateProfile);
router.delete("/profile", userController.deleteAccount);

router.get("/preferences", userController.getNotificationPreferences);
router.patch("/preferences", userController.updateNotificationPreferences);

// Public profile (optional - can be accessed with param)
router.get("/public/:userId", userController.getPublicProfile);

module.exports = router;
