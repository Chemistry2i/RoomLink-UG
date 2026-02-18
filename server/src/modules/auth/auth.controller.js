const crypto = require("crypto");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const logger = require("../../config/logger");
const { 
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail 
} = require("../../services/emailHelper");

/**
 * Auth Controller
 * Handles all authentication operations with email integration
 */

// Register user
const register = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, role = "user", staffType } = req.body;

    // Validate input
    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
    }

    // Validate staff role must have staffType
    if (role === "staff" && !staffType) {
      throw new ApiError(400, "Staff role requires staffType (MANAGER, RECEPTIONIST, or CLEANER)");
    }

    // Validate staffType is valid
    const validStaffTypes = ["MANAGER", "RECEPTIONIST", "CLEANER"];
    if (role === "staff" && !validStaffTypes.includes(staffType)) {
      throw new ApiError(400, `Invalid staffType. Must be one of: ${validStaffTypes.join(", ")}`);
    }

    const User = require("../user/user.model");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already registered");
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      staffType: role === "staff" ? staffType : null,
      emailVerificationToken,
      emailVerificationExpires,
      accountStatus: "active",
    });

    logger.info(`User registered: ${user.email} (role: ${role}${role === "staff" ? ", type: " + staffType : ""})`);

    // Send welcome email with verification link
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email?token=${emailVerificationToken}`;
    try {
      await sendWelcomeEmail(user.email, user.name, verificationLink);
    } catch (emailError) {
      logger.error(`Failed to send welcome email: ${emailError.message}`);
      // Don't block registration if email fails
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        { user: { id: user._id, email: user.email, name: user.name, role: user.role } },
        "User registered. Check email for verification link."
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Login user
const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const User = require("../user/user.model");
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check account status
    if (user.accountStatus === "suspended") {
      throw new ApiError(403, `Account is suspended. Reason: ${user.suspendReason || "No reason provided"}. Please contact support.`);
    }

    if (user.accountStatus === "locked") {
      if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
        throw new ApiError(403, "Account is locked due to too many failed login attempts. Please try again later.");
      } else {
        // Unlock the account if lockout period has expired
        user.lockoutUntil = null;
        user.loginAttempts = 0;
        await user.save();
      }
    }

    if (user.accountStatus === "deleted") {
      throw new ApiError(403, "Account has been deleted");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new ApiError(403, "Please verify your email before logging in");
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.accountStatus = "locked";
        user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minute lockout
        await user.save();
        throw new ApiError(403, "Too many failed login attempts. Account is locked for 30 minutes.");
      }

      await user.save();
      throw new ApiError(401, "Invalid email or password");
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        staffType: user.staffType,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`User logged in: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            staffType: user.staffType,
          },
        },
        "Login successful"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Optional: Invalidate token by adding to blacklist in Redis
    // This is optional but recommended for added security
    // const redisClient = require("../../config/redis");
    // const token = req.headers.authorization?.split(" ")[1];
    // if (token) {
    //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    //   if (ttl > 0) {
    //     await redisClient.setex(`blacklist:${token}`, ttl, "true");
    //   }
    // }

    logger.info(`User logged out: ${userId}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Logout successful")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const jwt = require("jsonwebtoken");
    
    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const User = require("../user/user.model");
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check account status
    if (user.accountStatus === "suspended") {
      throw new ApiError(403, "Account is suspended");
    }

    if (user.accountStatus === "deleted") {
      throw new ApiError(403, "Account has been deleted");
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        staffType: user.staffType,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Generate new refresh token (optional for rotation)
    const newRefreshToken = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
    );

    logger.info(`Token refreshed for user: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        "Token refreshed successfully"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, "Verification token is required");
    }

    const User = require("../user/user.model");
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`Email verified: ${user.email}`);

    // Send verification confirmation email
    try {
      await sendEmailVerificationEmail(user.email, user.name);
    } catch (emailError) {
      logger.error(`Failed to send verification email: ${emailError.message}`);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Email verified successfully!")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Resend verification email
const resendVerificationEmail = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const User = require("../user/user.model");
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.emailVerified) {
      throw new ApiError(400, "Email is already verified");
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    logger.info(`Resending verification email: ${user.email}`);

    // Send welcome email with new verification link
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email?token=${emailVerificationToken}`;
    try {
      await sendWelcomeEmail(user.email, user.name, verificationLink);
    } catch (emailError) {
      logger.error(`Failed to resend verification email: ${emailError.message}`);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Verification email sent. Check your inbox.")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const User = require("../user/user.model");
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json(
        new ApiResponse(200, null, "If account exists, password reset link sent to email")
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    logger.info(`Password reset requested: ${user.email}`);

    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
    } catch (emailError) {
      logger.error(`Failed to send reset email: ${emailError.message}`);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "If account exists, password reset link sent to email")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Validate reset token
const validateResetToken = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, "Reset token is required");
    }

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const User = require("../user/user.model");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Reset token is valid")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Resend password reset email
const resendPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const User = require("../user/user.model");
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json(
        new ApiResponse(200, null, "If account exists, password reset link sent to email")
      );
    }

    // Generate new reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    logger.info(`Resending password reset email: ${user.email}`);

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
    } catch (emailError) {
      logger.error(`Failed to resend reset email: ${emailError.message}`);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "If account exists, password reset link sent to email")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      throw new ApiError(400, "Token and passwords are required");
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const User = require("../user/user.model");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Password reset successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Change password (when logged in)
const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new ApiError(400, "Old password and new passwords are required");
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "New passwords do not match");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    const User = require("../user/user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify old password
    const isOldPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isOldPasswordCorrect) {
      throw new ApiError(401, "Old password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Password changed successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// ============================================================
// TWO-FACTOR AUTHENTICATION ENDPOINTS
// ============================================================

// Setup 2FA - Returns QR code for authenticator app
const setup2FA = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const speakeasy = require("speakeasy");
    const QRCode = require("qrcode");

    const User = require("../user/user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.twoFactorEnabled) {
      throw new ApiError(400, "2FA is already enabled for this account");
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `RoomLink (${user.email})`,
      issuer: "RoomLink",
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    logger.info(`2FA setup initiated: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          secret: secret.base32,
          qrCode,
          email: user.email,
        },
        "2FA QR code generated. Scan with authenticator app."
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Enable 2FA - Verify token and save secret
const enable2FA = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { secret, token } = req.body;

    if (!secret || !token) {
      throw new ApiError(400, "Secret and verification token are required");
    }

    const speakeasy = require("speakeasy");

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new ApiError(400, "Invalid 2FA token. Please try again.");
    }

    const User = require("../user/user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    await user.save();

    logger.info(`2FA enabled: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Two-factor authentication enabled successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Disable 2FA
const disable2FA = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      throw new ApiError(400, "Password is required to disable 2FA");
    }

    const User = require("../user/user.model");
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Incorrect password");
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    logger.info(`2FA disabled: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Two-factor authentication disabled successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Verify 2FA token (during login)
const verify2FA = asyncHandler(async (req, res) => {
  try {
    const { tempToken, token } = req.body; // tempToken = JWT without 2FA verified, token = TOTP code

    if (!tempToken || !token) {
      throw new ApiError(400, "Temporary token and 2FA code are required");
    }

    const jwt = require("jsonwebtoken");

    // Verify temp token
    const decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const User = require("../user/user.model");
    const user = await User.findById(decoded.id).select("+twoFactorSecret");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new ApiError(400, "2FA is not enabled for this account");
    }

    const speakeasy = require("speakeasy");

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new ApiError(400, "Invalid 2FA code");
    }

    // Generate final JWT token
    const finalToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        staffType: user.staffType,
        twoFactorVerified: true,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`2FA verified: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token: finalToken,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        "2FA verified successfully"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  validateResetToken,
  resendPasswordReset,
  resetPassword,
  changePassword,
  // 2FA endpoints
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FA,
};

