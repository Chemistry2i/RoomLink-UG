const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const AuditService = require("../../services/auditService");
const Joi = require("joi");

/**
 * Audit Controller
 * Handles audit log retrieval and analysis for admin/compliance
 */

// Validation schemas
const querySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  userId: Joi.string().optional(),
  module: Joi.string().optional(),
  action: Joi.string()
    .valid("CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "FAILED_LOGIN")
    .optional(),
  resourceId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

/**
 * GET - Retrieve audit logs with filtering
 * GET /api/v1/audit/logs
 * Query: page, limit, userId, module, action, resourceId, startDate, endDate
 * Admin/SUPER_ADMIN only
 */
const getLogs = asyncHandler(async (req, res) => {
  const { error, value } = querySchema.validate(req.query);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { page = 1, limit = 50, ...filters } = value;

  const { logs, pagination } = await AuditService.getLogs(filters, page, limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      { logs, pagination },
      "Audit logs retrieved successfully"
    )
  );
});

/**
 * GET - Get audit history for a specific resource
 * GET /api/v1/audit/resource/:resourceId
 */
const getResourceAudit = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const { resourceType } = req.query;

  if (!resourceType) {
    throw new ApiError(400, "Resource type is required");
  }

  const logs = await AuditService.getResourceAudit(resourceId, resourceType);

  return res.status(200).json(
    new ApiResponse(200, logs, "Resource audit history retrieved successfully")
  );
});

/**
 * GET - Get user activity logs
 * GET /api/v1/audit/user/:userId
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 100 } = req.query;

  const logs = await AuditService.getUserActivity(userId, limit);

  return res.status(200).json(
    new ApiResponse(200, logs, "User activity logs retrieved successfully")
  );
});

/**
 * GET - Get recently deleted resources
 * GET /api/v1/audit/deleted
 * Query: resourceType, limit
 */
const getDeletedResources = asyncHandler(async (req, res) => {
  const { resourceType } = req.query;
  const { limit = 50 } = req.query;

  if (!resourceType) {
    throw new ApiError(400, "Resource type is required");
  }

  const logs = await AuditService.getDeletedResources(resourceType, limit);

  return res.status(200).json(
    new ApiResponse(200, logs, "Deleted resources retrieved successfully")
  );
});

/**
 * GET - Get suspicious activities (failed logins, errors, etc.)
 * GET /api/v1/audit/suspicious
 * Query: userId, limit
 */
const getSuspiciousActivities = asyncHandler(async (req, res) => {
  const { userId, limit = 50 } = req.query;

  const logs = await AuditService.getSuspiciousActivities({ userId }, limit);

  return res.status(200).json(
    new ApiResponse(200, logs, "Suspicious activities retrieved successfully")
  );
});

/**
 * GET - Get module activity statistics
 * GET /api/v1/audit/stats/:module
 */
const getModuleStats = asyncHandler(async (req, res) => {
  const { module } = req.params;

  const stats = await AuditService.getModuleStats(module);

  return res.status(200).json(
    new ApiResponse(200, stats, `${module} activity statistics retrieved successfully`)
  );
});

module.exports = {
  getLogs,
  getResourceAudit,
  getUserActivity,
  getDeletedResources,
  getSuspiciousActivities,
  getModuleStats,
};
