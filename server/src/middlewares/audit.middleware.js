const AuditService = require("../services/auditService");
const logger = require("../config/logger");

/**
 * Audit Middleware
 * Automatically logs all API requests for audit trail
 */

const auditMiddleware = async (req, res, next) => {
  // Capture the original send function
  const originalSend = res.send;

  // Override res.send to log after the response is completed
  res.send = function (data) {
    // Restore the original send
    res.send = originalSend;

    // Extract request information
    const user = req.user ? req.user._id : null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent") || "Unknown";

    // Determine module and action based on the route
    let module = "Unknown";
    let action = "READ";
    let resourceId = null;
    let resourceType = null;
    let description = `${req.method} ${req.originalUrl}`;

    // Parse the route to determine module and action
    let pathParts = req.path.split("/").filter((p) => p);

    // Skip 'api' and version prefix (e.g., 'v1') if present
    if (pathParts[0] === "api") pathParts.shift();
    if (pathParts[0] && /^v\d+$/.test(pathParts[0])) pathParts.shift();

    if (pathParts.length > 0) {
      const moduleName = pathParts[0];

      // Map routes to modules
      const moduleMap = {
        auth: "Auth",
        users: "Users",
        hostels: "Hostels",
        rooms: "Rooms",
        bookings: "Bookings",
        reviews: "Reviews",
        complaints: "Complaints",
        payments: "Payments",
        settlements: "Payments",
        dashboard: "Admin",
        admin: "Admin",
        reports: "Reports",
        audit: "Audit",
        upload: "Upload",
      };

      module = moduleMap[moduleName] || "Unknown";

      // Determine action based on HTTP method
      if (req.method === "POST") {
        action = "CREATE";
      } else if (req.method === "PUT" || req.method === "PATCH") {
        action = "UPDATE";
      } else if (req.method === "DELETE") {
        action = "DELETE";
      }

      // Extract resource ID from URL if present
      if (pathParts.length > 1 && pathParts[1] !== "login" && pathParts[1] !== "register") {
        resourceId = pathParts[1];
        resourceType = moduleName;
      }
    }

    // Only log for authenticated users (to reduce noise)
    // Or log specific important actions regardless of authentication
    const importantActions = ["LOGIN", "logout", "register"];
    const shouldLog =
      user ||
      req.path.includes("login") ||
      req.path.includes("register") ||
      req.path.includes("password");

    if (shouldLog) {
      // Log based on response status
      const isError = res.statusCode >= 400;

      // Validate values before logging to prevent Mongoose cast errors
      const mongoose = require("mongoose");
      const validUserId = user && mongoose.Types.ObjectId.isValid(user) ? user : null;
      const validResourceId = resourceId && mongoose.Types.ObjectId.isValid(resourceId) ? resourceId : null;

      AuditService.log({
        action,
        module,
        userId: validUserId,
        resourceId: validResourceId,
        resourceType,
        changes: req.body ? sanitizeBody(req.body) : {},
        ipAddress,
        userAgent,
        description,
        status: isError ? "FAILED" : "SUCCESS",
        errorMessage: isError ? data : null,
      }).catch((err) => {
        logger.debug(`Audit logging error: ${err.message}`);
      });
    }

    // Call the original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body) {
  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "token",
    "refreshToken",
    "creditCard",
    "cvv",
    "ssn",
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  });

  return sanitized;
}

module.exports = auditMiddleware;
