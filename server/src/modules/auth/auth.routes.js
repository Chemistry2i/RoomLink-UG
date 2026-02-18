const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const authenticate = require("../../middlewares/auth.middleware");

/**
 * Auth Routes
 * POST   /api/v1/auth/register                 - User registration
 * POST   /api/v1/auth/login                    - User login
 * POST   /api/v1/auth/logout                   - User logout (requires auth)
 * POST   /api/v1/auth/refresh-token            - Refresh access token
 * POST   /api/v1/auth/verify-email             - Verify email with token
 * POST   /api/v1/auth/resend-verification      - Resend verification email
 * POST   /api/v1/auth/forgot-password          - Request password reset
 * POST   /api/v1/auth/validate-reset-token     - Validate reset token
 * POST   /api/v1/auth/resend-reset-email       - Resend reset email
 * POST   /api/v1/auth/reset-password           - Reset password with token
 * POST   /api/v1/auth/change-password          - Change password (requires auth)
 */

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerificationEmail);
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/validate-reset-token", authController.validateResetToken);
router.post("/resend-reset-email", authController.resendPasswordReset);
router.post("/reset-password", authController.resetPassword);

// Protected routes (require authentication)
router.use(authenticate);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post("/change-password", authController.changePassword);

module.exports = router;
