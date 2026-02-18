const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const PaymentReconciliation = require("./paymentReconciliation.model");
const PaymentSettlement = require("./paymentSettlement.model");
const reconciliationService = require("../../services/paymentReconciliationService");
const logger = require("../../config/logger");

/**
 * CREATE - Create settlement from verified payments
 * POST /api/v1/settlements
 * Body: hostelId, periodStart, periodEnd
 */
const createSettlement = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can create settlements");
  }

  const { hostelId, periodStart, periodEnd } = req.body;

  if (!hostelId || !periodStart || !periodEnd) {
    throw new ApiError(400, "Hostel ID, period start, and period end are required");
  }

  const settlement = await reconciliationService.createSettlement(
    hostelId,
    new Date(periodStart),
    new Date(periodEnd),
    req.user._id
  );

  return res.status(201).json(
    new ApiResponse(201, settlement, "Settlement created successfully")
  );
});

/**
 * READ ALL - Get settlements with filtering
 * GET /api/v1/settlements
 * Query: page, limit, status, hostelId
 */
const getSettlements = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can view settlements");
  }

  const { page = 1, limit = 10, status, hostelId } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.payoutStatus = status;
  if (hostelId) filter.hostel = hostelId;

  const total = await PaymentSettlement.countDocuments(filter);
  const settlements = await PaymentSettlement.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("hostel", "name")
    .populate("hostelOwner", "name email phone")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        settlements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Settlements retrieved successfully"
    )
  );
});

/**
 * READ ONE - Get settlement details
 * GET /api/v1/settlements/:id
 */
const getSettlementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const settlement = await PaymentSettlement.findById(id)
    .populate("hostel", "name address")
    .populate("hostelOwner", "name email phone")
    .populate("reconciliations");

  if (!settlement) {
    throw new ApiError(404, "Settlement not found");
  }

  // Check access (admin or hostel owner)
  if (
    req.user.role !== "ADMIN" &&
    req.user.role !== "SUPER_ADMIN" &&
    settlement.hostelOwner._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to view this settlement");
  }

  return res.status(200).json(
    new ApiResponse(200, settlement, "Settlement retrieved successfully")
  );
});

/**
 * UPDATE - Approve settlement for payout
 * PUT /api/v1/settlements/:id/approve
 * Body: notes (optional)
 */
const approveSettlement = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can approve settlements");
  }

  const { id } = req.params;
  const { notes } = req.body;

  const settlement = await reconciliationService.approveSettlement(
    id,
    req.user._id,
    req.user.role,
    notes
  );

  logger.info(`Settlement ${settlement.settlementReference} approved by ${req.user.email}`);

  return res.status(200).json(
    new ApiResponse(200, settlement, "Settlement approved successfully")
  );
});

/**
 * UPDATE - Hold settlement (prevent payout)
 * PUT /api/v1/settlements/:id/hold
 * Body: holdReason
 */
const holdSettlement = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can hold settlements");
  }

  const { id } = req.params;
  const { holdReason } = req.body;

  const settlement = await PaymentSettlement.findById(id);
  if (!settlement) {
    throw new ApiError(404, "Settlement not found");
  }

  settlement.onHold = true;
  settlement.holdReason = holdReason || "Settlement on hold by admin";
  settlement.lastUpdatedBy = req.user._id;

  await settlement.save();

  logger.warn(`Settlement ${settlement.settlementReference} placed on hold`);

  return res.status(200).json(
    new ApiResponse(200, settlement, "Settlement placed on hold")
  );
});

/**
 * UPDATE - Release hold on settlement
 * PUT /api/v1/settlements/:id/release
 */
const releaseSettlement = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can release settlements");
  }

  const { id } = req.params;

  const settlement = await PaymentSettlement.findById(id);
  if (!settlement) {
    throw new ApiError(404, "Settlement not found");
  }

  settlement.onHold = false;
  settlement.releasedAt = new Date();
  settlement.lastUpdatedBy = req.user._id;

  await settlement.save();

  logger.info(`Settlement ${settlement.settlementReference} released from hold`);

  return res.status(200).json(
    new ApiResponse(200, settlement, "Settlement released from hold")
  );
});

/**
 * CREATE - Process payout (actually send money)
 * POST /api/v1/settlements/:id/payout
 */
const processPayment = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can process payouts");
  }

  const { id } = req.params;

  // Note: In production, you would integrate with actual M-Pesa B2C service here
  // For now, we'll just mark as processed
  const settlement = await PaymentSettlement.findById(id);
  if (!settlement) {
    throw new ApiError(404, "Settlement not found");
  }

  if (!settlement.canBeProcessed()) {
    throw new ApiError(400, "Settlement cannot be processed in its current state");
  }

  settlement.payoutStatus = "Processed";
  settlement.payoutDate = new Date();
  settlement.processedDate = new Date();
  settlement.payoutTransactionId = `B2C-${Date.now()}`;
  settlement.lastUpdatedBy = req.user._id;

  await settlement.save();

  logger.info(
    `Settlement ${settlement.settlementReference} payout processed - UGX ${settlement.totalPayableAmount}`
  );

  return res.status(200).json(
    new ApiResponse(200, settlement, "Payout processed successfully")
  );
});

/**
 * READ - Get reconciliation records
 * GET /api/v1/reconciliations
 * Query: page, limit, status, bookingId
 */
const getReconciliations = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can view reconciliations");
  }

  const { page = 1, limit = 10, status, transactionId } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.paymentStatus = status;
  if (transactionId) filter.transactionId = transactionId;

  const total = await PaymentReconciliation.countDocuments(filter);
  const reconciliations = await PaymentReconciliation.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("booking", "bookingReference guestDetails")
    .populate("hostel", "name")
    .populate("hostelOwner", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reconciliations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Reconciliations retrieved successfully"
    )
  );
});

/**
 * UPDATE - Verify reconciliation
 * PUT /api/v1/reconciliations/:id/verify
 */
const verifyReconciliation = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can verify reconciliations");
  }

  const { id } = req.params;

  const reconciliation = await reconciliationService.verifyReconciliation(id, req.user._id);

  logger.info(`Reconciliation ${reconciliation.transactionId} verified`);

  return res.status(200).json(
    new ApiResponse(200, reconciliation, "Reconciliation verified successfully")
  );
});

/**
 * READ - Get settlement statistics
 * GET /api/v1/settlements/stats
 */
const getSettlementStats = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only admins can view statistics");
  }

  const stats = await reconciliationService.getSettlementStats();

  return res.status(200).json(
    new ApiResponse(200, stats, "Settlement statistics retrieved successfully")
  );
});

/**
 * READ - Get host earnings
 * GET /api/v1/earnings
 */
const getHostEarnings = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;

  const earnings = await reconciliationService.getHostEarnings(req.user._id, {
    months,
  });

  return res.status(200).json(
    new ApiResponse(200, earnings, "Host earnings retrieved successfully")
  );
});

module.exports = {
  createSettlement,
  getSettlements,
  getSettlementById,
  approveSettlement,
  holdSettlement,
  releaseSettlement,
  processPayment,
  getReconciliations,
  verifyReconciliation,
  getSettlementStats,
  getHostEarnings,
};
