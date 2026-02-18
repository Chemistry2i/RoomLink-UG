const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const logger = require("../../config/logger");

/**
 * User Controller
 * Handles user profile and account management
 */

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const User = require("./user.model");
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { user }, "User profile retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city, state, country, zipCode } = req.body;

    // Validate input
    if (!name && !phone && !address) {
      throw new ApiError(400, "At least one field must be updated");
    }

    const User = require("./user.model");
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (country) updateData.country = country;
    if (zipCode) updateData.zipCode = zipCode;

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    logger.info(`User profile updated: ${userId}`);

    return res.status(200).json(
      new ApiResponse(200, { user }, "Profile updated successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Delete user account (soft delete)
const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      throw new ApiError(400, "Password is required to delete account");
    }

    const User = require("./user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify password
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Incorrect password");
    }

    // Soft delete user
    user.deleted = true;
    user.deletedAt = new Date();
    await user.save();

    logger.info(`User account deleted: ${userId}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Account deleted successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Get notification preferences
const getNotificationPreferences = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const User = require("./user.model");
    const user = await User.findById(userId).select("notificationPreferences");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { preferences: user.notificationPreferences || {} },
        "Notification preferences retrieved"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Update notification preferences
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      bookingNotifications,
      complaintNotifications,
      reviewNotifications,
      marketingEmails,
    } = req.body;

    const User = require("./user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Update preferences
    if (emailNotifications !== undefined)
      user.notificationPreferences = user.notificationPreferences || {};
    user.notificationPreferences.emailNotifications = emailNotifications;
    if (bookingNotifications !== undefined)
      user.notificationPreferences.bookingNotifications = bookingNotifications;
    if (complaintNotifications !== undefined)
      user.notificationPreferences.complaintNotifications = complaintNotifications;
    if (reviewNotifications !== undefined)
      user.notificationPreferences.reviewNotifications = reviewNotifications;
    if (marketingEmails !== undefined)
      user.notificationPreferences.marketingEmails = marketingEmails;

    await user.save();

    logger.info(`Notification preferences updated: ${userId}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        { preferences: user.notificationPreferences },
        "Preferences updated successfully"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Visit user profile (for hosts/others)
const getPublicProfile = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    const User = require("./user.model");
    const user = await User.findById(userId)
      .select("-password -email -phone -address -emailVerificationToken -resetPasswordToken")
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Remove sensitive fields for deleted users
    if (user.deleted) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { user }, "User profile retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// ============================================================
// ADMIN ENDPOINTS - User Management
// ============================================================

// Get all users (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    
    const User = require("./user.model");
    const filter = { isDeleted: false };

    if (role) filter.role = role;
    if (status) filter.accountStatus = status;

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password -twoFactorSecret -resetPasswordToken -resetPasswordExpires -emailVerificationToken")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    logger.info(`Admin retrieved users list - Total: ${total}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
          },
        },
        "Users retrieved successfully"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Suspend user account (admin only)
const suspendUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      throw new ApiError(400, "Suspension reason is required");
    }

    const User = require("./user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Prevent suspending admins
    if (user.role === "super_admin" || user.role === "admin") {
      throw new ApiError(403, "Cannot suspend admin users");
    }

    // Update user status
    user.accountStatus = "suspended";
    user.suspendedBy = adminId;
    user.suspendedAt = new Date();
    user.suspendReason = reason;
    await user.save();

    logger.info(`User suspended: ${user.email} by admin: ${adminId}. Reason: ${reason}`);

    return res.status(200).json(
      new ApiResponse(200, { user }, "User suspended successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Unsuspend user account (admin only)
const unsuspendUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    const User = require("./user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.accountStatus !== "suspended") {
      throw new ApiError(400, "User is not suspended");
    }

    // Update user status
    user.accountStatus = "active";
    user.suspendedBy = null;
    user.suspendedAt = null;
    user.suspendReason = null;
    await user.save();

    logger.info(`User unsuspended: ${user.email}`);

    return res.status(200).json(
      new ApiResponse(200, { user }, "User unsuspended successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Assign staff to hostel
const assignStaffToHostel = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { hostelId, startDate, endDate } = req.body;

    if (!hostelId) {
      throw new ApiError(400, "Hostel ID is required");
    }

    const User = require("./user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "staff") {
      throw new ApiError(400, "User must have staff role to be assigned to hostel");
    }

    // Check if already assigned to this hostel
    const isAlreadyAssigned = user.assignedHostels.some(
      (h) => h.hostelId.toString() === hostelId && (!h.endDate || h.endDate > Date.now())
    );

    if (isAlreadyAssigned) {
      throw new ApiError(400, "Staff member is already assigned to this hostel");
    }

    // Add hostel assignment
    user.assignedHostels.push({
      hostelId,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
    });

    await user.save();

    logger.info(`Staff assigned to hostel: ${user.email} -> ${hostelId}`);

    return res.status(200).json(
      new ApiResponse(200, { user }, "Staff assigned to hostel successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Remove staff from hostel
const removeStaffFromHostel = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { hostelId } = req.body;

    if (!hostelId) {
      throw new ApiError(400, "Hostel ID is required");
    }

    const User = require("./user.model");
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Find and remove the hostel assignment
    user.assignedHostels = user.assignedHostels.filter(
      (h) => h.hostelId.toString() !== hostelId
    );

    await user.save();

    logger.info(`Staff removed from hostel: ${user.email} -> ${hostelId}`);

    return res.status(200).json(
      new ApiResponse(200, { user }, "Staff removed from hostel successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

// Get staff by hostel
const getStaffByHostel = asyncHandler(async (req, res) => {
  try {
    const { hostelId } = req.params;

    const User = require("./user.model");
    const staff = await User.find({
      role: "staff",
      "assignedHostels.hostelId": hostelId,
      isDeleted: false,
    })
      .select("-password -twoFactorSecret")
      .populate("assignedHostels.hostelId", "name");

    logger.info(`Retrieved staff for hostel: ${hostelId}`);

    return res.status(200).json(
      new ApiResponse(200, { staff }, "Hostel staff retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  getNotificationPreferences,
  updateNotificationPreferences,
  getPublicProfile,
  // Admin endpoints
  getAllUsers,
  suspendUser,
  unsuspendUser,
  assignStaffToHostel,
  removeStaffFromHostel,
  getStaffByHostel,
};
