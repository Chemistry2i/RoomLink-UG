const mongoose = require("mongoose");

const paymentSettlementSchema = new mongoose.Schema(
  {
    settlementReference: {
      type: String,
      unique: true,
      required: true,
      example: "SETTLE20260218001", // SETTLE + date + sequence
    },

    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel is required"],
    },

    hostelOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hostel owner is required"],
    },

    // Settlement period
    settlementPeriodStart: {
      type: Date,
      required: true,
    },

    settlementPeriodEnd: {
      type: Date,
      required: true,
    },

    // Financial details
    reconciliations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentReconciliation",
      },
    ],

    totalGrossAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPlatformCommission: {
      type: Number,
      required: true,
      default: 0,
    },

    totalTaxAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPayableAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    transactionCount: {
      type: Number,
      required: true,
      default: 0,
    },

    // Payout details
    payoutStatus: {
      type: String,
      enum: ["Pending", "Approved", "Scheduled", "Processed", "Failed", "Cancelled"],
      default: "Pending",
    },

    payoutMethod: {
      type: String,
      enum: ["M-Pesa", "Bank Transfer", "Mobile Money", "Manual Check"],
      required: true,
    },

    payoutPhoneNumber: String, // For M-Pesa payouts
    payoutAccountDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      swiftCode: String,
    },

    payoutDate: Date,
    processedDate: Date,
    payoutTransactionId: String, // M-Pesa transaction ID for B2C

    // Hold/Release logic
    onHold: {
      type: Boolean,
      default: false,
    },

    holdReason: String,
    releasedAt: Date,

    // Notes
    adminNotes: String,
    hostNotes: String,

    // Approval workflow
    approvals: [
      {
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: String, // FINANCE, ADMIN
        approvedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],

    // Dispute info
    isDisputed: {
      type: Boolean,
      default: false,
    },

    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    disputeReason: String,
    disputeResolvedAt: Date,
    disputeResolution: String,

    // Currency
    currency: {
      type: String,
      default: "UGX",
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
paymentSettlementSchema.index({ hostel: 1 });
paymentSettlementSchema.index({ hostelOwner: 1 });
paymentSettlementSchema.index({ payoutStatus: 1 });
paymentSettlementSchema.index({ settlementPeriodStart: 1, settlementPeriodEnd: 1 });
paymentSettlementSchema.index({ createdAt: -1 });
paymentSettlementSchema.index({ hostel: 1, payoutStatus: 1 });
paymentSettlementSchema.index({ isDisputed: 1 });

// Virtual for settlement status
paymentSettlementSchema.virtual("isProcessed").get(function () {
  return this.payoutStatus === "Processed";
});

// Instance methods
paymentSettlementSchema.methods.hasAllApprovals = function () {
  // Require at least one approval for payout
  return this.approvals && this.approvals.length > 0;
};

paymentSettlementSchema.methods.canBeProcessed = function () {
  return (
    this.payoutStatus === "Approved" &&
    !this.onHold &&
    this.hasAllApprovals() &&
    !this.isDisputed
  );
};

module.exports = mongoose.model("PaymentSettlement", paymentSettlementSchema);
