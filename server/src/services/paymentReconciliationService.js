const PaymentReconciliation = require("../modules/payment/paymentReconciliation.model");
const PaymentSettlement = require("../modules/payment/paymentSettlement.model");
const Booking = require("../modules/booking/booking.model");
const Hostel = require("../modules/hostel/hostel.model");
const logger = require("../config/logger");

/**
 * Payment Reconciliation Service
 * Handles M-Pesa payment verification, reconciliation, and host payouts
 */

/**
 * Create reconciliation record from booking payment
 * Called when M-Pesa payment callback is received and verified
 */
const createReconciliation = async (bookingId, mpesaCallbackData) => {
  try {
    // Check if reconciliation already exists
    const existing = await PaymentReconciliation.findOne({ booking: bookingId });
    if (existing) {
      logger.warn(`Reconciliation already exists for booking ${bookingId}`);
      return existing;
    }

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate("hostel")
      .populate("user");

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const hostel = await Hostel.findById(booking.hostel._id);
    if (!hostel) {
      throw new Error(`Hostel not found for booking`);
    }

    // Calculate amounts
    const grossAmount = booking.pricing.totalPrice;
    const platformCommissionPercentage = 15; // 15% default fee
    const platformCommissionAmount = Math.round((grossAmount * platformCommissionPercentage) / 100);
    const taxAmount = 0; // Already included in booking price
    const hostPayableAmount = grossAmount - platformCommissionAmount;

    // Create reconciliation record
    const reconciliation = new PaymentReconciliation({
      booking: bookingId,
      hostel: booking.hostel._id,
      hostelOwner: hostel.owner,
      transactionId: mpesaCallbackData.CheckoutRequestID || `TXN-${bookingId}`,
      mpesaTransactionRef: mpesaCallbackData.MpesaReceiptNumber,
      guestPhone: booking.payment.phoneNumber || booking.guestDetails.phone,
      grossAmount,
      platformCommission: {
        percentage: platformCommissionPercentage,
        amount: platformCommissionAmount,
      },
      taxAmount,
      hostPayableAmount,
      paymentStatus: "Received",
      mpesaReceivedAt: new Date(),
      mpesaResponse: {
        resultCode: mpesaCallbackData.Result,
        resultDesc: mpesaCallbackData.ResultDesc,
        checkoutRequestID: mpesaCallbackData.CheckoutRequestID,
        merchantRequestID: mpesaCallbackData.MerchantRequestID,
        amount: mpesaCallbackData.Amount,
        mpesaReceiptNumber: mpesaCallbackData.MpesaReceiptNumber,
        transactionDate: mpesaCallbackData.TransactionDate,
        phoneNumber: mpesaCallbackData.PhoneNumber,
      },
    });

    await reconciliation.save();

    logger.info(
      `Payment reconciliation created for booking ${bookingId}: UGX ${hostPayableAmount}`
    );

    return reconciliation;
  } catch (error) {
    logger.error(`Failed to create reconciliation for booking ${bookingId}:`, error.message);
    throw error;
  }
};

/**
 * Mark reconciliation as verified
 * Admin verification before payout
 */
const verifyReconciliation = async (reconciliationId, verifiedBy) => {
  try {
    const reconciliation = await PaymentReconciliation.findById(reconciliationId);
    if (!reconciliation) {
      throw new Error("Reconciliation not found");
    }

    // Verify the payment status with M-Pesa (optional - for security)
    reconciliation.paymentStatus = "Verified";
    reconciliation.verifiedAt = new Date();
    reconciliation.lastUpdatedBy = verifiedBy;

    await reconciliation.save();

    logger.info(`Payment reconciliation verified: ${reconciliationId}`);
    return reconciliation;
  } catch (error) {
    logger.error(`Failed to verify reconciliation:`, error.message);
    throw error;
  }
};

/**
 * Create settlement from reconciliations
 * Groups multiple reconciliations into one settlement for payout
 */
const createSettlement = async (hostelId, periodStart, periodEnd, createdBy) => {
  try {
    // Check if settlement already exists for this period
    const existing = await PaymentSettlement.findOne({
      hostel: hostelId,
      settlementPeriodStart: { $lte: periodEnd },
      settlementPeriodEnd: { $gte: periodStart },
      payoutStatus: { $in: ["Pending", "Approved", "Scheduled", "Processed"] },
    });

    if (existing) {
      logger.warn(
        `Active settlement already exists for hostel ${hostelId} in this period`
      );
      return existing;
    }

    // Get all verified reconciliations for this hostel in the period
    const reconciliations = await PaymentReconciliation.find({
      hostel: hostelId,
      paymentStatus: "Verified",
      verifiedAt: { $gte: periodStart, $lte: periodEnd },
    });

    if (reconciliations.length === 0) {
      throw new Error("No verified payments found for this settlement period");
    }

    // Calculate totals
    let totalGrossAmount = 0;
    let totalPlatformCommission = 0;
    let totalTaxAmount = 0;
    let totalPayableAmount = 0;

    for (const recon of reconciliations) {
      totalGrossAmount += recon.grossAmount;
      totalPlatformCommission += recon.platformCommission.amount;
      totalTaxAmount += recon.taxAmount;
      totalPayableAmount += recon.hostPayableAmount;
    }

    // Get hostel owner
    const hostel = await Hostel.findById(hostelId);

    // Generate settlement reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const settlementRef = `SETTLE${dateStr}${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create settlement
    const settlement = new PaymentSettlement({
      settlementReference: settlementRef,
      hostel: hostelId,
      hostelOwner: hostel.owner,
      settlementPeriodStart: periodStart,
      settlementPeriodEnd: periodEnd,
      reconciliations: reconciliations.map((r) => r._id),
      totalGrossAmount,
      totalPlatformCommission,
      totalTaxAmount,
      totalPayableAmount,
      transactionCount: reconciliations.length,
      payoutStatus: "Pending",
      payoutMethod: "M-Pesa", // Default, can be changed
      createdBy,
    });

    await settlement.save();

    // Mark reconciliations as reconciled
    await PaymentReconciliation.updateMany(
      { _id: { $in: reconciliations.map((r) => r._id) } },
      {
        paymentStatus: "Reconciled",
        reconciledAt: new Date(),
      }
    );

    logger.info(
      `Settlement created: ${settlementRef} for hostel ${hostelId} with ${reconciliations.length} transactions totaling UGX ${totalPayableAmount}`
    );

    return settlement;
  } catch (error) {
    logger.error(`Failed to create settlement:`, error.message);
    throw error;
  }
};

/**
 * Approve settlement for payout
 * Finance/Admin approval step
 */
const approveSettlement = async (settlementId, approvedBy, approverRole, notes) => {
  try {
    const settlement = await PaymentSettlement.findById(settlementId);
    if (!settlement) {
      throw new Error("Settlement not found");
    }

    if (settlement.payoutStatus !== "Pending") {
      throw new Error(`Settlement cannot be approved from ${settlement.payoutStatus} status`);
    }

    // Add approval record
    settlement.approvals.push({
      approvedBy,
      role: approverRole,
      approvedAt: new Date(),
      notes,
    });

    settlement.payoutStatus = "Approved";
    settlement.lastUpdatedBy = approvedBy;

    await settlement.save();

    logger.info(`Settlement approved: ${settlement.settlementReference}`);
    return settlement;
  } catch (error) {
    logger.error(`Failed to approve settlement:`, error.message);
    throw error;
  }
};

/**
 * Process payout (actually send money via M-Pesa B2C)
 */
const processSettlementPayout = async (
  settlementId,
  processedBy,
  mpesaService
) => {
  try {
    const settlement = await PaymentSettlement.findById(settlementId).populate(
      "hostelOwner",
      "phone"
    );

    if (!settlement) {
      throw new Error("Settlement not found");
    }

    if (!settlement.canBeProcessed()) {
      throw new Error("Settlement cannot be processed in its current state");
    }

    // Get hostel owner's phone (should be validated M-Pesa account)
    const recipientPhone = settlement.payoutPhoneNumber || settlement.hostelOwner.phone;
    const amount = settlement.totalPayableAmount;

    // Send M-Pesa B2C payment
    let mpesaTransactionId = null;
    if (mpesaService) {
      try {
        const result = await mpesaService.sendB2CPayment({
          phoneNumber: recipientPhone,
          amount: Math.round(amount),
          remarks: `Settlement ${settlement.settlementReference}`,
          occasion: `RoomLink Host Payout for ${new Date(settlement.settlementPeriodStart).toLocaleDateString()}`,
        });

        mpesaTransactionId = result.ConversationID;
      } catch (mpesaError) {
        logger.error("M-Pesa B2C payment failed:", mpesaError.message);
        settlement.payoutStatus = "Failed";
        settlement.adminNotes = `M-Pesa error: ${mpesaError.message}`;
        await settlement.save();
        throw new Error(`M-Pesa B2C failed: ${mpesaError.message}`);
      }
    }

    // Update settlement
    settlement.payoutStatus = "Processed";
    settlement.payoutDate = new Date();
    settlement.processedDate = new Date();
    settlement.payoutTransactionId = mpesaTransactionId;
    settlement.lastUpdatedBy = processedBy;

    await settlement.save();

    logger.info(
      `Settlement payout processed: ${settlement.settlementReference} - UGX ${amount}`
    );

    return settlement;
  } catch (error) {
    logger.error(`Failed to process settlement payout:`, error.message);
    throw error;
  }
};

/**
 * Get settlement statistics for admin dashboard
 */
const getSettlementStats = async (filters = {}) => {
  try {
    const matchStage = {};

    if (filters.hostel) matchStage.hostel = mongoose.Types.ObjectId(filters.hostel);
    if (filters.payoutStatus) matchStage.payoutStatus = filters.payoutStatus;

    if (filters.startDate || filters.endDate) {
      matchStage.settlementPeriodStart = {};
      if (filters.startDate) matchStage.settlementPeriodStart.$gte = new Date(filters.startDate);
      if (filters.endDate) matchStage.settlementPeriodStart.$lte = new Date(filters.endDate);
    }

    const stats = await PaymentSettlement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$payoutStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalPayableAmount" },
          avgAmount: { $avg: "$totalPayableAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = await PaymentSettlement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSettlements: { $sum: 1 },
          totalPaidOut: {
            $sum: {
              $cond: [{ $eq: ["$payoutStatus", "Processed"] }, "$totalPayableAmount", 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ["$payoutStatus", "Pending"] }, "$totalPayableAmount", 0],
            },
          },
          totalPlatformFees: { $sum: "$totalPlatformCommission" },
        },
      },
    ]);

    return {
      byStatus: stats,
      totals: totals[0] || {
        totalSettlements: 0,
        totalPaidOut: 0,
        totalPending: 0,
        totalPlatformFees: 0,
      },
    };
  } catch (error) {
    logger.error("Failed to get settlement statistics:", error.message);
    throw error;
  }
};

/**
 * Get host earnings summary
 */
const getHostEarnings = async (hostelOwnerId, period = { months: 6 }) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (period.months || 6));

    const reconciliations = await PaymentReconciliation.find({
      hostelOwner: hostelOwnerId,
      paymentStatus: "Verified",
      verifiedAt: { $gte: startDate },
    });

    const settlements = await PaymentSettlement.find({
      hostelOwner: hostelOwnerId,
      createdAt: { $gte: startDate },
    });

    let totalEarnings = 0;
    let totalCommissionPaid = 0;
    let totalPaidOut = 0;

    for (const recon of reconciliations) {
      totalEarnings += recon.hostPayableAmount;
      totalCommissionPaid += recon.platformCommission.amount;
    }

    for (const settlement of settlements) {
      if (settlement.payoutStatus === "Processed") {
        totalPaidOut += settlement.totalPayableAmount;
      }
    }

    return {
      hostelOwner: hostelOwnerId,
      period: `Last ${period.months} months`,
      totalEarnings,
      totalCommissionPaid,
      totalPaidOut,
      outstandingBalance: totalEarnings - totalPaidOut,
      settlements: settlements.length,
      transactions: reconciliations.length,
    };
  } catch (error) {
    logger.error("Failed to get host earnings:", error.message);
    throw error;
  }
};

module.exports = {
  createReconciliation,
  verifyReconciliation,
  createSettlement,
  approveSettlement,
  processSettlementPayout,
  getSettlementStats,
  getHostEarnings,
};
