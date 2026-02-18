const express = require("express");
const router = express.Router();
const complaintController = require("./complaint.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const { complaintLimiter } = require("../../middlewares/rateLimit.middleware");

/**
 * Complaint Routes
 * GET    /api/v1/complaints (admin/staff view all, user view own)
 * GET    /api/v1/complaints/:id
 * POST   /api/v1/complaints (rate limited)
 * PATCH  /api/v1/complaints/:id/status (staff only)
 * PATCH  /api/v1/complaints/:id/resolve (staff only)
 * PATCH  /api/v1/complaints/:id/reassign (admin only)
 * PATCH  /api/v1/complaints/:id/escalate (staff only)
 * PATCH  /api/v1/complaints/:id/note (staff only)
 */

router.get("/", authenticate, complaintController.getComplaints);
router.post("/", authenticate, complaintLimiter, complaintController.createComplaint);
router.get("/:id", authenticate, complaintController.getComplaintById);
router.patch(
  "/:id/status",
  authenticate,
  authorize("STAFF", "ADMIN", "SUPER_ADMIN"),
  complaintController.updateComplaintStatus
);
router.patch(
  "/:id/resolve",
  authenticate,
  authorize("STAFF", "ADMIN", "SUPER_ADMIN"),
  complaintController.resolveComplaint
);
router.patch(
  "/:id/reassign",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  complaintController.reassignComplaint
);
router.patch(
  "/:id/escalate",
  authenticate,
  authorize("STAFF", "ADMIN", "SUPER_ADMIN"),
  complaintController.escalateComplaint
);
router.patch(
  "/:id/note",
  authenticate,
  authorize("STAFF", "ADMIN", "SUPER_ADMIN"),
  complaintController.addComplaintNote
);

module.exports = router;
