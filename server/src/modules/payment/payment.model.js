const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [10, "Minimum payment amount is KES 10"],
    },

    amountReceived: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    provider: {
      type: String,
      enum: ["mpesa", "card", "bank_transfer"],
      default: "mpesa",
    },

    transactionId: {
      type: String,
    },

    mpesaReceiptNumber: {
      type: String,
    },

    currency: {
      type: String,
      default: "KES",
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ booking: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
