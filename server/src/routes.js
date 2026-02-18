const express = require("express");

// Import route modules
const authRoutes = require("./modules/auth/auth.routes");
const hostelRoutes = require("./modules/hostel/hostel.routes");
const bookingRoutes = require("./modules/booking/booking.routes");
const reviewRoutes = require("./modules/review/review.routes");
const complaintRoutes = require("./modules/complaint/complaint.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const reportRoutes = require("./modules/report/report.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const settlementRoutes = require("./modules/payment/settlement.routes");
const auditRoutes = require("./modules/audit/audit.routes");
const uploadRoutes = require("./modules/upload/upload.routes");
const userRoutes = require("./modules/user/user.routes");
const roomRoutes = require("./modules/room/room.routes");

const router = express.Router();

/**
 * API Routes
 * Centralized routing for all modules
 */

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/hostels", hostelRoutes);
router.use("/rooms", roomRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/complaints", complaintRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/payments", paymentRoutes);
router.use("/settlements", settlementRoutes);
router.use("/audit", auditRoutes);
router.use("/upload", uploadRoutes);

module.exports = router;
