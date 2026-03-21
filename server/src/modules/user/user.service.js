const User = require("./user.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * User Service
 * Business logic for user profile and account management
 */

/**
 * Get user profile by ID
 */
const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    throw error;
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    // Fields that cannot be updated
    const restrictedFields = [
      "password",
      "email",
      "role",
      "staffType",
      "accountStatus",
      "isEmailVerified",
      "isPhoneVerified",
      "loginAttempts",
      "lockoutUntil",
    ];

    // Remove restricted fields
    restrictedFields.forEach((field) => delete updateData[field]);

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select(
      "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`User profile updated: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    throw error;
  }
};

/**
 * Delete user account (soft delete)
 */
const deleteUserAccount = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: "deleted", deletedAt: new Date() },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`User account deleted: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error deleting user account: ${error.message}`);
    throw error;
  }
};

/**
 * Update user avatar
 */
const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`User avatar updated: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error updating avatar: ${error.message}`);
    throw error;
  }
};

/**
 * Update user notification preferences
 */
const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`Notification preferences updated: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error updating notification preferences: ${error.message}`);
    throw error;
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email }).select("-password");
    return user;
  } catch (error) {
    logger.error(`Error fetching user by email: ${error.message}`);
    throw error;
  }
};

/**
 * Check if email exists
 */
const emailExists = async (email) => {
  try {
    const user = await User.findOne({ email });
    return !!user;
  } catch (error) {
    logger.error(`Error checking email existence: ${error.message}`);
    throw error;
  }
};

/**
 * Get all users (admin function)
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.accountStatus) query.accountStatus = filters.accountStatus;

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    throw error;
  }
};

/**
 * Suspend user account
 */
const suspendUserAccount = async (userId, adminId, reason) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: "suspended",
        suspendedBy: adminId,
        suspendedAt: new Date(),
        suspendReason: reason,
      },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`User suspended: ${userId} by ${adminId}`);
    return user;
  } catch (error) {
    logger.error(`Error suspending user: ${error.message}`);
    throw error;
  }
};

/**
 * Unsuspend user account
 */
const unsuspendUserAccount = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: "active",
        suspendedBy: null,
        suspendedAt: null,
        suspendReason: null,
      },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`User unsuspended: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error unsuspending user: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  updateUserAvatar,
  updateNotificationPreferences,
  getUserByEmail,
  emailExists,
  getAllUsers,
  suspendUserAccount,
  unsuspendUserAccount,
};
