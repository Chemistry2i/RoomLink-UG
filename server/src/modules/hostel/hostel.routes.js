const express = require("express");
const router = express.Router();
const hostelController = require("./hostel.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const upload = require("../../middlewares/upload.middleware");

/**
 * Hostel Routes
 * GET    /api/v1/hostels                    - List all hostels
 * GET    /api/v1/hostels/:id                - Get single hostel
 * GET    /api/v1/hostels/:id/analytics      - Get hostel analytics
 * POST   /api/v1/hostels                    - Create hostel (HOST/ADMIN)
 * PUT    /api/v1/hostels/:id                - Update hostel (owner/ADMIN)
 * DELETE /api/v1/hostels/:id                - Delete hostel (owner/ADMIN)
 */

// Public routes
router.get("/", hostelController.getHostels);
router.get("/:id", hostelController.getHostelById);

// Protected routes
router.post(
  "/",
  authenticate,
  authorize("HOST", "ADMIN", "SUPER_ADMIN"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "coverImage", maxCount: 1 },
  ]),
  hostelController.createHostel
);

router.put(
  "/:id",
  authenticate,
  authorize("HOST", "ADMIN", "SUPER_ADMIN"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "coverImage", maxCount: 1 },
  ]),
  hostelController.updateHostel
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  hostelController.deleteHostel
);

module.exports = router;
