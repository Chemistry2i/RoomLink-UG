const express = require("express");
const router = express.Router();
const bookingController = require("./booking.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

/**
 * Booking Routes
 * GET    /api/v1/bookings                   - List bookings (auth required)
 * GET    /api/v1/bookings/:id               - Get single booking
 * POST   /api/v1/bookings                   - Create booking
 * PUT    /api/v1/bookings/:id               - Update booking
 * DELETE /api/v1/bookings/:id               - Cancel booking
 * POST   /api/v1/bookings/:id/checkin       - Check-in guest
 * POST   /api/v1/bookings/:id/checkout      - Check-out guest
 */

// Protected routes (require authentication)
router.post("/", authenticate, bookingController.createBooking);

router.get("/", authenticate, bookingController.getBookings);

router.get("/:id", authenticate, bookingController.getBookingById);

router.put("/:id", authenticate, bookingController.updateBooking);

router.delete("/:id", authenticate, bookingController.cancelBooking);

router.post(
  "/:id/checkin",
  authenticate,
  authorize("STAFF", "ADMIN", "SUPER_ADMIN"),
  bookingController.checkIn
);

router.post(
  "/:id/checkout",
  authenticate,
  authorize("STAFF", "ADMIN", "SUPER_ADMIN"),
  bookingController.checkOut
);

module.exports = router;
