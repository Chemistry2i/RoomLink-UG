const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const { cache } = require("../../middlewares/cache.middleware");

/**
 * Dashboard Routes
 * GET /api/v1/dashboard/admin (admin only)
 * GET /api/v1/dashboard/host (host only)
 * GET /api/v1/dashboard/staff (staff only)
 */

router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  cache(300),
  dashboardController.getAdminDashboard
);
router.get(
  "/host",
  authenticate,
  authorize("host"),
  cache(300),
  dashboardController.getHostDashboard
);
router.get(
  "/staff",
  authenticate,
  authorize("staff"),
  cache(300),
  dashboardController.getStaffDashboard
);

module.exports = router;
