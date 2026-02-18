const express = require("express");
const router = express.Router();
const auditController = require("./audit.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

/**
 * Audit Routes
 * All routes require ADMIN or SUPER_ADMIN role
 * GET    /api/v1/audit/logs               - Get all audit logs with filters
 * GET    /api/v1/audit/resource/:id       - Get audit history for a resource
 * GET    /api/v1/audit/user/:userId       - Get user activity
 * GET    /api/v1/audit/deleted            - Get deleted resources
 * GET    /api/v1/audit/suspicious         - Get suspicious activities
 * GET    /api/v1/audit/stats/:module      - Get module statistics
 */

// All audit routes require authentication and admin role
router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/logs", auditController.getLogs);
router.get("/deleted", auditController.getDeletedResources);
router.get("/suspicious", auditController.getSuspiciousActivities);
router.get("/resource/:resourceId", auditController.getResourceAudit);
router.get("/user/:userId", auditController.getUserActivity);
router.get("/stats/:module", auditController.getModuleStats);

module.exports = router;
