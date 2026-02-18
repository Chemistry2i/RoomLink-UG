const express = require("express");
const router = express.Router();
const roomController = require("./room.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const upload = require("../../middlewares/upload.middleware");

/**
 * Room Routes
 * GET    /api/v1/rooms                      - List all rooms
 * GET    /api/v1/rooms/:id                  - Get single room
 * GET    /api/v1/rooms/:id/availability     - Check availability
 * POST   /api/v1/rooms                      - Create room (HOST/ADMIN)
 * PUT    /api/v1/rooms/:id                  - Update room (owner/ADMIN)
 * DELETE /api/v1/rooms/:id                  - Delete room (owner/ADMIN)
 */

// Public routes
router.get("/", roomController.getRooms);
router.get("/:id", roomController.getRoomById);
router.get("/:id/availability", roomController.checkAvailability);

// Protected routes
router.post(
  "/",
  authenticate,
  authorize("HOST", "ADMIN", "SUPER_ADMIN"),
  upload.single("images"),
  roomController.createRoom
);

router.put(
  "/:id",
  authenticate,
  authorize("HOST", "ADMIN", "SUPER_ADMIN"),
  upload.single("images"),
  roomController.updateRoom
);

router.delete(
  "/:id",
  authenticate,
  authorize("HOST", "ADMIN", "SUPER_ADMIN"),
  roomController.deleteRoom
);

module.exports = router;
