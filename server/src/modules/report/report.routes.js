const express = require("express");
const router = express.Router();
const reportController = require("./report.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const { cache } = require("../../middlewares/cache.middleware");

/**
 * Report Routes
 * GET /api/v1/reports/bookings (admin only)
 * GET /api/v1/reports/complaints (admin/staff)
 * GET /api/v1/reports/users (admin only)
 * GET /api/v1/reports/revenue (admin only)
 */

router.get(
  "/bookings",
  authenticate,
  authorize("admin"),
  cache(600),
  reportController.getBookingReport
);
router.get(
  "/complaints",
  authenticate,
  authorize("admin", "staff"),
  cache(600),
  reportController.getComplaintReport
);
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  cache(600),
  reportController.getUserReport
);
router.get(
  "/revenue",
  authenticate,
  authorize("admin"),
  cache(600),
  reportController.getRevenueReport
);

module.exports = router;
