const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const logger = require("../../config/logger");
const paymentService = require("../../services/paymentService");
const reconciliationService = require("../../services/paymentReconciliationService");
const notificationService = require("../../services/notificationService");
const { sendPaymentConfirmationEmail, sendRefundEmail } = require("../../services/emailHelper");

const Payment = require("./payment.model");
const Booking = require("../booking/booking.model");
const User = require("../user/user.model");

/**
 * Initiate payment via M-Pesa STK Push
 */
const initiatePayment = asyncHandler(async (req, res) => {
  try {
    const { phoneNumber, amount, description, bookingId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!phoneNumber || !amount || !description) {
      throw new ApiError(400, "Phone number, amount, and description are required");
    }

    if (amount < 10) {
      throw new ApiError(400, "Minimum payment amount is KES 10");
    }

    // Validate phone number
    if (!paymentService.validatePhoneNumber(phoneNumber)) {
      throw new ApiError(400, "Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX");
    }

    // Format phone number
    const formattedPhone = paymentService.formatPhoneNumber(phoneNumber);

    // Create payment record
    const payment = await Payment.create({
      userId,
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      description,
      bookingId,
      status: "pending",
      provider: "mpesa",
    });

    // Initiate STK Push
    const stkResponse = await paymentService.initiateSTKPush(
      formattedPhone,
      amount,
      payment._id.toString(),
      description
    );

    // Update payment with checkout ID
    payment.transactionId = stkResponse.checkoutRequestId;
    await payment.save();

    logger.info(`Payment initiated: ${payment._id} - ${amount} KES`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          paymentId: payment._id,
          checkoutRequestId: stkResponse.checkoutRequestId,
          message: "STK Push sent. Enter PIN to complete payment",
        },
        "Payment initiated successfully"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

/**
 * Check payment status
 */
const checkPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    // If payment is already completed, return cached status
    if (payment.status === "completed") {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            paymentId: payment._id,
            status: payment.status,
            transactionId: payment.transactionId,
            amount: payment.amount,
          },
          "Payment completed"
        )
      );
    }

    // Check status with payment provider
    const statusResponse = await paymentService.checkTransactionStatus(
      payment.transactionId
    );

    // Update payment status if successful
    if (
      statusResponse.ResultCode === "0" ||
      statusResponse.ResultDesc?.includes("success")
    ) {
      payment.status = "completed";
      payment.mpesaReceiptNumber = statusResponse.MpesaReceiptNumber;
      await payment.save();

      logger.info(`Payment completed: ${payment._id}`);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          paymentId: payment._id,
          status: payment.status,
          transactionId: payment.transactionId,
          amount: payment.amount,
        },
        "Payment status retrieved"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

/**
 * Process payment callback from M-Pesa
 * Called by M-Pesa when transaction completes
 */
const handlePaymentCallback = asyncHandler(async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;

    const payment = await Payment.findById(callbackData.CheckoutRequestID);

    if (!payment) {
      logger.warn(`Callback received for unknown payment: ${callbackData.CheckoutRequestID}`);
      return res.status(200).json({ ResultCode: "1" }); // Acknowledge receipt
    }

    if (callbackData.ResultCode === 0) {
      // Payment successful
      payment.status = "completed";
      payment.mpesaReceiptNumber =
        callbackData.CallbackMetadata?.Item?.find((item) => item.Name === "MpesaReceiptNumber")
          ?.Value || null;

      const amountReceived =
        callbackData.CallbackMetadata?.Item?.find((item) => item.Name === "Amount")?.Value || 0;

      payment.amountReceived = amountReceived;
      await payment.save();

      // Create payment reconciliation record (if booking exists)
      if (payment.bookingId) {
        try {
          await reconciliationService.createReconciliation(payment.bookingId, callbackData);

          // Update booking payment status
          const booking = await Booking.findById(payment.bookingId);
          if (booking) {
            booking.payment.status = "Completed";
            booking.payment.transactionId = callbackData.CheckoutRequestID;
            booking.payment.paidAt = new Date();
            await booking.save();

            // Send payment confirmation email
            notificationService.sendPaymentConfirmation(
              booking._id,
              callbackData.CheckoutRequestID,
              amountReceived
            ).catch((err) => {
              logger.error("Failed to send payment confirmation:", err.message);
            });
          }
        } catch (reconError) {
          logger.error(`Failed to create reconciliation:`, reconError.message);
          // Don't fail the callback - M-Pesa already processed the payment
        }
      }

      logger.info(`Payment callback success: ${payment._id}`);
    } else {
      // Payment failed
      payment.status = "failed";
      payment.failureReason = callbackData.ResultDesc;
      await payment.save();

      // Update booking payment status
      if (payment.bookingId) {
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
          booking.payment.status = "Failed";
          await booking.save();
        }
      }

      logger.warn(`Payment callback failed: ${payment._id} - ${callbackData.ResultDesc}`);
    }

    // Return success response to M-Pesa
    return res.status(200).json({ ResultCode: "0", ResultDesc: "Received successfully" });
  } catch (error) {
    logger.error(`Payment callback error: ${error.message}`);
    return res.status(200).json({ ResultCode: "1", ResultDesc: "Error processing callback" });
  }
});

/**
 * Get payment history
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const payments = await Payment.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    logger.info(`Payment history retrieved: ${userId}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          payments,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
          },
        },
        "Payment history retrieved"
      )
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

/**
 * Request refund
 */
const requestRefund = asyncHandler(async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.userId.toString() !== userId) {
      throw new ApiError(403, "Unauthorized to refund this payment");
    }

    if (payment.status !== "completed") {
      throw new ApiError(400, "Only completed payments can be refunded");
    }

    if (payment.refundStatus === "requested" || payment.refundStatus === "completed") {
      throw new ApiError(400, "Refund already requested for this payment");
    }

    // Request refund
    payment.refundStatus = "requested";
    payment.refundReason = reason;
    payment.refundRequestedAt = new Date();
    await payment.save();

    logger.info(`Refund requested: ${payment._id} - Reason: ${reason}`);

    return res.status(200).json(
      new ApiResponse(200, { payment }, "Refund request submitted. We will process it shortly.")
    );
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
});

module.exports = {
  initiatePayment,
  checkPaymentStatus,
  handlePaymentCallback,
  getPaymentHistory,
  requestRefund,
};
