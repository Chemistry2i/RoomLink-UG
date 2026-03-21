const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("./payment.model");
const Booking = require("../booking/booking.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Payment Service
 * Business logic for payment processing, Stripe integration, and reconciliation
 */

/**
 * Create payment intent with Stripe
 */
const createPaymentIntent = async (userId, amount, bookingId, description) => {
  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description: description || `Booking payment: ${bookingId}`,
      metadata: {
        userId,
        bookingId,
      },
    });

    // Create payment record in database
    const payment = await Payment.create({
      user: userId,
      booking: bookingId,
      amount,
      description: description || `Booking payment: ${bookingId}`,
      status: "pending",
      provider: "card",
      transactionId: paymentIntent.id,
      metadata: {
        stripeIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    logger.info(
      `Payment intent created: ${paymentIntent.id} for user ${userId}`
    );

    return {
      payment,
      clientSecret: paymentIntent.client_secret,
      stripeIntentId: paymentIntent.id,
    };
  } catch (error) {
    logger.error(`Error creating payment intent: ${error.message}`);
    throw new ApiError(500, `Payment creation failed: ${error.message}`);
  }
};

/**
 * Confirm payment after Stripe completes
 */
const confirmPayment = async (stripeIntentId, bookingId) => {
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(stripeIntentId);

    if (!paymentIntent) {
      throw new ApiError(404, "Payment intent not found");
    }

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(
        400,
        `Payment failed. Status: ${paymentIntent.status}`
      );
    }

    // Update payment in database
    const payment = await Payment.findOneAndUpdate(
      { transactionId: stripeIntentId },
      {
        status: "completed",
        amountReceived: paymentIntent.amount / 100, // Convert back from cents
        metadata: {
          ...paymentIntent.metadata,
          stripeChargeId: paymentIntent.charges.data[0]?.id,
        },
      },
      { new: true }
    );

    // Update booking status
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "completed",
        paymentId: payment._id,
      });

      logger.info(`Booking payment confirmed: ${bookingId}`);
    }

    logger.info(`Payment confirmed: ${stripeIntentId}`);
    return payment;
  } catch (error) {
    logger.error(`Error confirming payment: ${error.message}`);
    throw error;
  }
};

/**
 * Refund payment
 */
const refundPayment = async (stripeIntentId, amount = null) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(stripeIntentId);

    if (!paymentIntent.charges.data[0]) {
      throw new ApiError(404, "Charge not found for this intent");
    }

    const chargeId = paymentIntent.charges.data[0].id;

    // Create refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
    });

    // Update payment in database
    const payment = await Payment.findOneAndUpdate(
      { transactionId: stripeIntentId },
      {
        status: "refunded",
        metadata: {
          ...paymentIntent.metadata,
          refundId: refund.id,
          refundedAmount: refund.amount / 100,
        },
      },
      { new: true }
    );

    logger.info(`Payment refunded: ${stripeIntentId}, refundId: ${refund.id}`);
    return { payment, refund };
  } catch (error) {
    logger.error(`Error refunding payment: ${error.message}`);
    throw new ApiError(500, `Refund failed: ${error.message}`);
  }
};

/**
 * Get payment status
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId).populate(
      "booking",
      "bookingNumber checkInDate checkOutDate"
    );

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return payment;
  } catch (error) {
    logger.error(`Error fetching payment status: ${error.message}`);
    throw error;
  }
};

/**
 * Get user payment history
 */
const getUserPaymentHistory = async (userId, filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = { user: userId };
    if (filters.status) query.status = filters.status;
    if (filters.provider) query.provider = filters.provider;

    const payments = await Payment.find(query)
      .populate("booking", "bookingNumber checkInDate checkOutDate room")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching payment history: ${error.message}`);
    throw error;
  }
};

/**
 * Handle Stripe webhook
 */
const handleStripeWebhook = async (event) => {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await confirmPayment(event.data.object.id);
        logger.info(`Payment succeeded via webhook: ${event.data.object.id}`);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = await Payment.findOneAndUpdate(
          { transactionId: event.data.object.id },
          { status: "failed" },
          { new: true }
        );
        logger.info(`Payment failed via webhook: ${event.data.object.id}`);
        break;

      case "charge.refunded":
        await Payment.findOneAndUpdate(
          { transactionId: event.data.object.payment_intent },
          { status: "refunded" },
          { new: true }
        );
        logger.info(`Payment refunded via webhook: ${event.data.object.id}`);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    logger.error(`Error handling webhook: ${error.message}`);
    throw error;
  }
};

/**
 * Get payment reconciliation report
 */
const getPaymentReconciliationReport = async (startDate, endDate) => {
  try {
    const payments = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const report = {
      totalTransactions: payments.length,
      totalAmount: 0,
      completedAmount: 0,
      failedAmount: 0,
      refundedAmount: 0,
      pendingAmount: 0,
      byStatus: {
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0,
      },
      byProvider: {
        card: 0,
        mpesa: 0,
        bank_transfer: 0,
      },
    };

    payments.forEach((payment) => {
      report.totalAmount += payment.amount;

      // By Status
      if (payment.status === "completed") {
        report.completedAmount += payment.amount;
        report.byStatus.completed++;
      } else if (payment.status === "pending") {
        report.pendingAmount += payment.amount;
        report.byStatus.pending++;
      } else if (payment.status === "failed") {
        report.failedAmount += payment.amount;
        report.byStatus.failed++;
      } else if (payment.status === "refunded") {
        report.refundedAmount += payment.amount;
        report.byStatus.refunded++;
      }

      // By Provider
      if (payment.provider === "card") report.byProvider.card++;
      else if (payment.provider === "mpesa") report.byProvider.mpesa++;
      else if (payment.provider === "bank_transfer")
        report.byProvider.bank_transfer++;
    });

    return report;
  } catch (error) {
    logger.error(`Error generating reconciliation report: ${error.message}`);
    throw error;
  }
};

/**
 * Download invoice
 */
const generateInvoice = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate("user", "name email phone")
      .populate({
        path: "booking",
        populate: {
          path: "room",
          select: "roomNumber roomType pricePerNight",
        },
      });

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    const invoiceData = {
      invoiceNumber: `INV-${payment._id}`,
      date: payment.createdAt,
      user: {
        name: payment.user.name,
        email: payment.user.email,
        phone: payment.user.phone,
      },
      booking: payment.booking
        ? {
            bookingNumber: payment.booking.bookingNumber,
            checkInDate: payment.booking.checkInDate,
            checkOutDate: payment.booking.checkOutDate,
            room: payment.booking.room.roomNumber,
          }
        : null,
      amount: payment.amount,
      amountReceived: payment.amountReceived,
      status: payment.status,
      provider: payment.provider,
      transactionId: payment.transactionId,
    };

    logger.info(`Invoice generated for payment: ${paymentId}`);
    return invoiceData;
  } catch (error) {
    logger.error(`Error generating invoice: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentStatus,
  getUserPaymentHistory,
  handleStripeWebhook,
  getPaymentReconciliationReport,
  generateInvoice,
};
