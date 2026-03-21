const Audit = require("./audit.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Audit Service
 * Business logic for audit trail logging and monitoring
 */

/**
 * Log audit event
 */
const logAuditEvent = async (auditData) => {
  try {
    const audit = await Audit.create({
      userId: auditData.userId || null,
      action: auditData.action,
      module: auditData.module,
      method: auditData.method,
      endpoint: auditData.endpoint,
      statusCode: auditData.statusCode,
      requestData: auditData.requestData || {},
      responseData: auditData.responseData || {},
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      errorMessage: auditData.errorMessage || null,
      timestamp: new Date(),
    });

    return audit;
  } catch (error) {
    logger.error(`Error logging audit event: ${error.message}`);
    // Don't throw error for audit logging - should not interrupt main flow
    return null;
  }
};

/**
 * Get audit logs with filters and pagination
 */
const getAuditLogs = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.module) query.module = filters.module;
    if (filters.method) query.method = filters.method;
    if (filters.statusCode) query.statusCode = filters.statusCode;

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await Audit.find(query)
      .select("-requestData -responseData") // Exclude large data fields in list
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });

    const total = await Audit.countDocuments(query);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching audit logs: ${error.message}`);
    throw error;
  }
};

/**
 * Get audit log by ID
 */
const getAuditLogById = async (auditId) => {
  try {
    const audit = await Audit.findById(auditId);

    if (!audit) {
      throw new ApiError(404, "Audit log not found");
    }

    return audit;
  } catch (error) {
    logger.error(`Error fetching audit log: ${error.message}`);
    throw error;
  }
};

/**
 * Get user audit logs
 */
const getUserAuditLogs = async (userId, pagination = {}) => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const logs = await Audit.find({ userId })
      .select("-requestData -responseData")
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });

    const total = await Audit.countDocuments({ userId });

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching user audit logs: ${error.message}`);
    throw error;
  }
};

/**
 * Get audit statistics
 */
const getAuditStats = async (startDate = null, endDate = null) => {
  try {
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const stats = {
      totalEvents: await Audit.countDocuments(query),
      byModule: {},
      byAction: {},
      byMethod: {
        GET: 0,
        POST: 0,
        PUT: 0,
        PATCH: 0,
        DELETE: 0,
      },
      byStatusCode: {
        success: 0, // 2xx
        redirect: 0, // 3xx
        clientError: 0, // 4xx
        serverError: 0, // 5xx
      },
      errorCount: 0,
    };

    const logs = await Audit.find(query);

    logs.forEach((log) => {
      // By Module
      if (!stats.byModule[log.module]) stats.byModule[log.module] = 0;
      stats.byModule[log.module]++;

      // By Action
      if (!stats.byAction[log.action]) stats.byAction[log.action] = 0;
      stats.byAction[log.action]++;

      // By Method
      if (stats.byMethod[log.method]) stats.byMethod[log.method]++;

      // By Status Code
      const statusCode = log.statusCode;
      if (statusCode >= 200 && statusCode < 300) stats.byStatusCode.success++;
      else if (statusCode >= 300 && statusCode < 400)
        stats.byStatusCode.redirect++;
      else if (statusCode >= 400 && statusCode < 500)
        stats.byStatusCode.clientError++;
      else if (statusCode >= 500) stats.byStatusCode.serverError++;

      // Error Count
      if (log.errorMessage) stats.errorCount++;
    });

    return stats;
  } catch (error) {
    logger.error(`Error calculating audit stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get suspicious activities
 */
const getSuspiciousActivities = async (threshold = 10, timeWindowMinutes = 30) => {
  try {
    // Get recent failed requests
    const recentTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const suspiciousUsers = await Audit.aggregate([
      {
        $match: {
          timestamp: { $gte: recentTime },
          statusCode: { $gte: 400 },
        },
      },
      {
        $group: {
          _id: "$userId",
          failureCount: { $sum: 1 },
          ipAddresses: { $push: "$ipAddress" },
          endpoints: { $push: "$endpoint" },
        },
      },
      {
        $match: {
          failureCount: { $gte: threshold },
        },
      },
      {
        $sort: { failureCount: -1 },
      },
    ]);

    return suspiciousUsers;
  } catch (error) {
    logger.error(`Error fetching suspicious activities: ${error.message}`);
    throw error;
  }
};

/**
 * Get most accessed endpoints
 */
const getMostAccessedEndpoints = async (limit = 10, startDate = null) => {
  try {
    const query = {};
    if (startDate) {
      query.timestamp = { $gte: new Date(startDate) };
    }

    const endpoints = await Audit.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$endpoint",
          count: { $sum: 1 },
          avgResponse: { $avg: "$responseTime" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return endpoints;
  } catch (error) {
    logger.error(`Error fetching most accessed endpoints: ${error.message}`);
    throw error;
  }
};

/**
 * Get user activity timeline
 */
const getUserActivityTimeline = async (userId, limit = 50) => {
  try {
    const logs = await Audit.find({ userId })
      .select("action module endpoint method statusCode timestamp")
      .sort({ timestamp: -1 })
      .limit(limit);

    return logs;
  } catch (error) {
    logger.error(`Error fetching user activity timeline: ${error.message}`);
    throw error;
  }
};

/**
 * Export audit logs to CSV
 */
const exportAuditLogsToCSV = async (filters = {}) => {
  try {
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.module) query.module = filters.module;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await Audit.find(query)
      .select("userId action module method statusCode endpoint timestamp errorMessage")
      .sort({ timestamp: -1 });

    // Convert to CSV format
    let csv =
      "User ID, Action, Module, Method, Status Code, Endpoint, Timestamp, Error\n";
    logs.forEach((log) => {
      csv += `"${log.userId || "N/A"}","${log.action}","${log.module}","${
        log.method
      }","${log.statusCode}","${log.endpoint}","${
        log.timestamp
      }","${log.errorMessage || ""}"\n`;
    });

    logger.info(`Audit logs exported to CSV: ${logs.length} records`);
    return csv;
  } catch (error) {
    logger.error(`Error exporting audit logs: ${error.message}`);
    throw error;
  }
};

/**
 * Clear old audit logs
 */
const clearOldAuditLogs = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await Audit.deleteMany({ timestamp: { $lt: cutoffDate } });

    logger.info(`Cleared ${result.deletedCount} old audit logs`);
    return result;
  } catch (error) {
    logger.error(`Error clearing old audit logs: ${error.message}`);
    throw error;
  }
};

module.exports = {
  logAuditEvent,
  getAuditLogs,
  getAuditLogById,
  getUserAuditLogs,
  getAuditStats,
  getSuspiciousActivities,
  getMostAccessedEndpoints,
  getUserActivityTimeline,
  exportAuditLogsToCSV,
  clearOldAuditLogs,
};
