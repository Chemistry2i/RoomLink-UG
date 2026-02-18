const express = require("express");
const router = express.Router();
const settlementController = require("./payment.settlement.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

/**
 * Settlement & Reconciliation Routes
 * 
 * Admin Routes:
 * POST   /api/v1/settlements                 - Create settlement
 * GET    /api/v1/settlements                 - List settlements
 * GET    /api/v1/settlements/:id             - Get settlement
 * PUT    /api/v1/settlements/:id/approve     - Approve settlement
 * POST   /api/v1/settlements/:id/payout      - Process payout
 * PUT    /api/v1/settlements/:id/hold        - Hold settlement
 * PUT    /api/v1/settlements/:id/release     - Release hold
 * GET    /api/v1/settlements/stats           - Stats dashboard
 * 
 * Reconciliation Routes (Admin):
 * GET    /api/v1/reconciliations             - List reconciliations
 * PUT    /api/v1/reconciliations/:id/verify  - Verify payment
 * 
 * Host Routes:
 * GET    /api/v1/earnings                    - Host earnings summary
 */

// Admin routes - Settlement Management
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.createSettlement
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.getSettlements
);

router.get(
  "/stats",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.getSettlementStats
);

router.get(
  "/:id",
  authenticate,
  settlementController.getSettlementById
);

router.put(
  "/:id/approve",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.approveSettlement
);

router.put(
  "/:id/hold",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.holdSettlement
);

router.put(
  "/:id/release",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.releaseSettlement
);

router.post(
  "/:id/payout",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.processPayment
);

// Admin routes - Reconciliation Management
router.get(
  "/reconciliations",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.getReconciliations
);

router.put(
  "/reconciliations/:id/verify",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  settlementController.verifyReconciliation
);

// Host routes - View earnings
router.get(
  "/my/earnings",
  authenticate,
  authorize("HOST", "ADMIN", "SUPER_ADMIN"),
  settlementController.getHostEarnings
);

module.exports = router;
