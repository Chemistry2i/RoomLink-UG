const { sendEmail, sendBulkEmail } = require("./email.service");
const templates = require("./emailTemplates");
const logger = require("../config/logger");

/**
 * Email Helper Functions
 * Simplified email sending with templates
 */

// Send registration welcome email
const sendWelcomeEmail = async (userEmail, userName, verificationLink) => {
  try {
    const htmlContent = templates.registrationWelcome(userName, verificationLink);
    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Welcome to RoomLink 🏨",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send email verification confirmation
const sendEmailVerificationEmail = async (userEmail, userName) => {
  try {
    const htmlContent = templates.emailVerified(userName);
    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Email Verified - RoomLink",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send email verification: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation
const sendBookingConfirmationEmail = async (
  userEmail,
  userName,
  bookingDetails
) => {
  try {
    const {
      hostelName,
      bookingId,
      checkIn,
      checkOut,
      totalPrice,
      hostelLocation,
    } = bookingDetails;

    const htmlContent = templates.bookingConfirmation(
      userName,
      hostelName,
      bookingId,
      checkIn,
      checkOut,
      totalPrice,
      hostelLocation
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: `Booking Confirmed - ${hostelName} 🎉`,
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send booking confirmation: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send booking cancellation
const sendBookingCancellationEmail = async (
  userEmail,
  userName,
  cancellationDetails
) => {
  try {
    const {
      hostelName,
      bookingId,
      refundAmount,
      reason,
    } = cancellationDetails;

    const htmlContent = templates.bookingCancellation(
      userName,
      hostelName,
      bookingId,
      refundAmount,
      reason
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Booking Cancelled - Refund Confirmation 💔",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send cancellation email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send complaint acknowledgment
const sendComplaintAcknowledgmentEmail = async (
  userEmail,
  userName,
  complaintDetails
) => {
  try {
    const {
      complaintId,
      hostelName,
      category,
      priority,
    } = complaintDetails;

    const htmlContent = templates.complaintAcknowledgment(
      userName,
      complaintId,
      hostelName,
      category,
      priority
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: `Complaint Received - Ticket #${complaintId}`,
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send complaint acknowledgment: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send complaint resolution
const sendComplaintResolutionEmail = async (
  userEmail,
  userName,
  complaintDetails
) => {
  try {
    const { complaintId, resolutionNote } = complaintDetails;

    const htmlContent = templates.complaintResolution(
      userName,
      complaintId,
      resolutionNote
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: `Complaint Resolved - Ticket #${complaintId}`,
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send complaint resolution: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send review invitation
const sendReviewInvitationEmail = async (
  userEmail,
  userName,
  reviewDetails
) => {
  try {
    const { hostelName, bookingId } = reviewDetails;

    const htmlContent = templates.reviewInvitation(
      userName,
      hostelName,
      bookingId
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: `Share Your Experience at ${hostelName} ⭐`,
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send review invitation: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send password reset
const sendPasswordResetEmail = async (userEmail, userName, resetLink) => {
  try {
    const htmlContent = templates.passwordReset(userName, resetLink);
    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Reset Your Password - RoomLink 🔐",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send password reset: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send host welcome email
const sendHostWelcomeEmail = async (hostEmail, hostName) => {
  try {
    const htmlContent = templates.hostWelcome(hostName);
    return await sendEmail({
      to: hostEmail,
      toName: hostName,
      subject: "Welcome to RoomLink Host Program 🏨",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send host welcome email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send payment confirmation
const sendPaymentConfirmationEmail = async (
  userEmail,
  userName,
  paymentDetails
) => {
  try {
    const { bookingId, hostelName, amount, transactionId } = paymentDetails;

    const htmlContent = templates.paymentConfirmation(
      userName,
      bookingId,
      hostelName,
      amount,
      transactionId
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Payment Confirmed - RoomLink ✅",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send payment confirmation: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send refund confirmation
const sendRefundEmail = async (userEmail, userName, refundDetails) => {
  try {
    const { bookingId, hostelName, refundAmount, reason } = refundDetails;

    const htmlContent = templates.refundEmail(
      userName,
      bookingId,
      hostelName,
      refundAmount,
      reason
    );

    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Refund Processed - RoomLink 💳",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send refund email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendComplaintAcknowledgmentEmail,
  sendComplaintResolutionEmail,
  sendReviewInvitationEmail,
  sendPasswordResetEmail,
  sendHostWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendRefundEmail,
};
