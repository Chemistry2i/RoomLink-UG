const AuditLog = require("../modules/audit/audit.model");
const logger = require("../config/logger");

/**
 * Audit Service
 * Handles logging of all user actions for compliance and security
 */

class AuditService {
  /**
   * Log an action
   * @param {Object} auditData
   * @param {String} auditData.action - CREATE, READ, UPDATE, DELETE, LOGIN, etc.
   * @param {String} auditData.module - Module name (Users, Hostels, Bookings, etc.)
   * @param {String} auditData.userId - User performing the action
   * @param {String} auditData.resourceId - ID of the resource being acted upon
   * @param {String} auditData.resourceType - Type of resource (User, Hostel, etc.)
   * @param {Object} auditData.changes - Details of what changed (for UPDATE operations)
   * @param {String} auditData.ipAddress - IP address of the user
   * @param {String} auditData.userAgent - User agent/browser info
   * @param {String} auditData.description - Detailed description
   * @param {String} auditData.status - SUCCESS or FAILED
   * @param {String} auditData.errorMessage - Error message if status is FAILED
   */
  static async log(auditData) {
    try {
      const {
        action,
        module,
        userId,
        resourceId,
        resourceType,
        changes = {},
        ipAddress,
        userAgent,
        description,
        status = "SUCCESS",
        errorMessage = null,
      } = auditData;

      // Validate required fields
      if (!action || !module || !userId) {
        logger.warn("Incomplete audit log data provided", auditData);
        return null;
      }

      const auditLog = new AuditLog({
        action,
        module,
        userId,
        resourceId,
        resourceType,
        changes,
        ipAddress,
        userAgent,
        description,
        status,
        errorMessage,
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error(`Failed to create audit log: ${error.message}`);
      // Don't throw - audit logging failures shouldn't break the app
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getLogs(filters = {}, page = 1, limit = 50) {
    try {
      const { userId, module, action, resourceId, startDate, endDate } = filters;

      let query = {};

      if (userId) query.userId = userId;
      if (module) query.module = module;
      if (action) query.action = action;
      if (resourceId) query.resourceId = resourceId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const skip = (page - 1) * limit;
      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .populate("userId", "name email role")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      return {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Failed to fetch audit logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAudit(resourceId, resourceType) {
    try {
      const logs = await AuditLog.find({
        resourceId,
        resourceType,
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      return logs;
    } catch (error) {
      logger.error(`Failed to fetch resource audit logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId, limit = 100) {
    try {
      const logs = await AuditLog.find({ userId })
        .select("-changes") // Don't include detailed changes for privacy
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return logs;
    } catch (error) {
      logger.error(`Failed to fetch user activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get deleted resources (for recovery purposes)
   */
  static async getDeletedResources(resourceType, limit = 100) {
    try {
      const logs = await AuditLog.find({
        action: "DELETE",
        resourceType,
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return logs;
    } catch (error) {
      logger.error(`Failed to fetch deleted resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get suspicious activities (failed logins, etc.)
   */
  static async getSuspiciousActivities(filter = {}, limit = 100) {
    try {
      const query = {
        $or: [{ status: "FAILED" }, { action: "FAILED_LOGIN" }],
      };

      if (filter.userId) {
        query.userId = filter.userId;
      }

      const logs = await AuditLog.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return logs;
    } catch (error) {
      logger.error(`Failed to fetch suspicious activities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get module statistics
   */
  static async getModuleStats(module) {
    try {
      const stats = await AuditLog.aggregate([
        { $match: { module } },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ]);

      return stats;
    } catch (error) {
      logger.error(`Failed to fetch module stats: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AuditService;
