const mongoose = require("mongoose");

const paymentReconciliationSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
      unique: true,
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

    transactionId: {
      type: String,
      required: [true, "M-Pesa transaction ID is required"],
      unique: true,
    },

    mpesaTransactionRef: {
      type: String,
      unique: true,
      sparse: true, // Can be null for pending
    },

    guestPhone: {
      type: String,
      required: true,
    },

    // Amount breakdown
    grossAmount: {
      type: Number,
      required: [true, "Gross amount is required"],
      min: [0, "Gross amount cannot be negative"],
    },

    platformCommission: {
      percentage: {
        type: Number,
        default: 15, // 15% platform fee
      },
      amount: {
        type: Number,
        required: true,
      },
    },

    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    hostPayableAmount: {
      type: Number,
      required: true,
      min: [0, "Host payable amount cannot be negative"],
    },

    // Payment status tracking
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Received",
        "Verified",
        "Reconciled",
        "Failed",
        "Reversed",
      ],
      default: "Pending",
    },

    mpesaReceivedAt: Date,
    verifiedAt: Date,
    reconciledAt: Date,

    // Reconciliation details
    reconciliationNotes: String,
    reconciliationFailureReason: String,

    // M-Pesa callback response
    mpesaResponse: {
      resultCode: Number,
      resultDesc: String,
      checkoutRequestID: String,
      merchantRequestID: String,
      amount: Number,
      mpesaReceiptNumber: String,
      transactionDate: Date,
      phoneNumber: String,
      originalAmount: Number,
      balanceAmount: Number,
    },

    // Currency
    currency: {
      type: String,
      default: "UGX",
    },

    // Flags
    isDisputed: {
      type: Boolean,
      default: false,
    },

    disputeReason: String,
    disputeResolvedAt: Date,

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reconciliationAttempts: {
      type: Number,
      default: 0,
    },

    nextReconciliationAttempt: Date,
  },
  { timestamps: true }
);

// Indexes
paymentReconciliationSchema.index({ booking: 1 });
paymentReconciliationSchema.index({ hostel: 1 });
paymentReconciliationSchema.index({ hostelOwner: 1 });
paymentReconciliationSchema.index({ transactionId: 1 });
paymentReconciliationSchema.index({ mpesaTransactionRef: 1 });
paymentReconciliationSchema.index({ paymentStatus: 1 });
paymentReconciliationSchema.index({ createdAt: -1 });
paymentReconciliationSchema.index({
  hostel: 1,
  paymentStatus: 1,
  createdAt: -1,
});
paymentReconciliationSchema.index({ isDisputed: 1 });

// Virtual for total hostel earnings
paymentReconciliationSchema.virtual("hostEarnings").get(function () {
  return this.hostPayableAmount;
});

module.exports = mongoose.model("PaymentReconciliation", paymentReconciliationSchema);
