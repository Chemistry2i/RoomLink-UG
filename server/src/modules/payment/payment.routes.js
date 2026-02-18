const express = require("express");
const router = express.Router();
const paymentController = require("./payment.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { paymentLimiter } = require("../../middlewares/rateLimit.middleware");

/**
 * Payment Routes
 * POST /api/v1/payments/initiate (initiate payment via M-Pesa)
 * GET /api/v1/payments/status/:paymentId (check payment status)
 * POST /api/v1/payments/callback (M-Pesa payment callback)
 * GET /api/v1/payments/history (get payment history)
 * POST /api/v1/payments/refund (request refund)
 */

// Initiate payment
router.post("/initiate", authenticate, paymentLimiter, paymentController.initiatePayment);

// Check payment status
router.get("/status/:paymentId", authenticate, paymentController.checkPaymentStatus);

// M-Pesa callback endpoint (no authentication needed)
router.post("/callback", paymentController.handlePaymentCallback);

// Get payment history
router.get("/history", authenticate, paymentController.getPaymentHistory);

// Request refund
router.post("/refund", authenticate, paymentLimiter, paymentController.requestRefund);

module.exports = router;
