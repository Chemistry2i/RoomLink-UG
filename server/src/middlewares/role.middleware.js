const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES, ROLE_HIERARCHY, ACCOUNT_STATUS, STAFF_TYPES } = require("../utils/constants");

/**
 * Check account status - must be active to proceed
 */
const checkAccountStatus = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (
    req.user.accountStatus === ACCOUNT_STATUS.SUSPENDED ||
    req.user.accountStatus === ACCOUNT_STATUS.LOCKED
  ) {
    throw new ApiError(403, `Account is ${req.user.accountStatus}. Please contact support.`);
  }

  if (req.user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new ApiError(403, "Account has been deleted");
  }

  next();
});

/**
 * Role-Based Access Control Middleware
 * Checks if user has required role(s) and account is active
 */
const authorize = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    // Check account status first
    if (
      req.user.accountStatus === ACCOUNT_STATUS.SUSPENDED ||
      req.user.accountStatus === ACCOUNT_STATUS.LOCKED
    ) {
      throw new ApiError(403, `Account is ${req.user.accountStatus}. Please contact support.`);
    }

    const userRole = req.user.role;

  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(
      403,
      `Forbidden. Required role(s): ${allowedRoles.join(", ")}. Your role: ${userRole}`
    );
  }

    next();
  });
};

/**
 * Check if user is owner (for resource-based authorization)
 */
const checkOwnership = (resourceOwnerId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (req.user._id.toString() !== resourceOwnerId.toString()) {
      throw new ApiError(
        403,
        "You don't have permission to modify this resource"
      );
    }

    next();
  });
};

/**
 * Check role hierarchy - can only manage users of lower rank
 * Prevents lower roles from managing same or higher roles
 */
const checkRoleHierarchy = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Insufficient permissions for this action");
    }

    const userRankLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const targetRoleLevel = ROLE_HIERARCHY[req.body.role] || 0;

    if (userRankLevel <= targetRoleLevel && req.user.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Cannot manage users with equal or higher rank");
    }

    next();
  });
};

/**
 * Validate staff type - ensures STAFF role has valid staffType
 */
const validateStaffRole = asyncHandler(async (req, res, next) => {
  if (req.body.role === ROLES.STAFF) {
    if (!req.body.staffType || !Object.values(STAFF_TYPES).includes(req.body.staffType)) {
      throw new ApiError(
        400,
        `Staff type required. Must be one of: ${Object.values(STAFF_TYPES).join(", ")}`
      );
    }
  }

  next();
});

module.exports = {
  authorize,
  checkOwnership,
  checkAccountStatus,
  checkRoleHierarchy,
  validateStaffRole,
};
