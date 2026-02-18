/**
 * Email Service
 * Handles all email sending with Brevo (Sendinblue)
 */

const SibApiV3Sdk = require("sib-api-v3-sdk");
const templates = require("./emailTemplates-Airbnb");
const logger = require("../config/logger");

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Initialize email API
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send email function using Brevo
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = {
      name: "RoomLink",
      email: process.env.FROM_EMAIL || "noreply@roomlink.com",
    };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.replyTo = {
      email: "support@roomlink.com",
    };

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    logger.info(`Email sent successfully to ${to}: ${subject}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send registration welcome email
 */
const sendRegistrationWelcome = async (email, name, verificationLink) => {
  try {
    const html = templates.registrationWelcome(name, verificationLink);
    await sendEmail(email, "Welcome to RoomLink! Verify Your Email", html);
  } catch (error) {
    logger.error(`Failed to send registration welcome email: ${error.message}`);
    throw error;
  }
};

/**
 * Send email verification confirmation
 */
const sendEmailVerificationConfirmed = async (email, name) => {
  try {
    const html = templates.emailVerified(name);
    await sendEmail(email, "Email Verified Successfully", html);
  } catch (error) {
    logger.error(`Failed to send email verification email: ${error.message}`);
    throw error;
  }
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmation = async (email, name, bookingDetails) => {
  try {
    const html = templates.bookingConfirmation(name, bookingDetails);
    await sendEmail(email, "Booking Confirmed", html);
  } catch (error) {
    logger.error(`Failed to send booking confirmation email: ${error.message}`);
    throw error;
  }
};

/**
 * Send booking cancellation email
 */
const sendBookingCancellation = async (email, name, bookingDetails) => {
  try {
    const html = templates.bookingCancellation(name, bookingDetails);
    await sendEmail(email, "Booking Cancelled", html);
  } catch (error) {
    logger.error(`Failed to send booking cancellation email: ${error.message}`);
    throw error;
  }
};

/**
 * Send complaint acknowledgment email
 */
const sendComplaintAcknowledgment = async (email, name, complaintId) => {
  try {
    const html = templates.complaintAcknowledgment(name, complaintId);
    await sendEmail(email, "We Received Your Complaint", html);
  } catch (error) {
    logger.error(`Failed to send complaint acknowledgment email: ${error.message}`);
    throw error;
  }
};

/**
 * Send complaint resolution email
 */
const sendComplaintResolution = async (email, name, resolutionDetails) => {
  try {
    const html = templates.complaintResolution(name, resolutionDetails);
    await sendEmail(email, "Your Complaint Has Been Resolved", html);
  } catch (error) {
    logger.error(`Failed to send complaint resolution email: ${error.message}`);
    throw error;
  }
};

/**
 * Send review invitation email
 */
const sendReviewInvitation = async (email, name, hostelName, reviewLink) => {
  try {
    const html = templates.reviewInvitation(name, hostelName, reviewLink);
    await sendEmail(email, `Rate Your Stay at ${hostelName}`, html);
  } catch (error) {
    logger.error(`Failed to send review invitation email: ${error.message}`);
    throw error;
  }
};

/**
 * Send password reset email
 */
const sendPasswordReset = async (email, name, resetLink) => {
  try {
    const html = templates.passwordReset(name, resetLink);
    await sendEmail(email, "Reset Your Password", html);
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`);
    throw error;
  }
};

/**
 * Send host welcome email
 */
const sendHostWelcome = async (email, name, setupGuideLink) => {
  try {
    const html = templates.hostWelcome(name, setupGuideLink);
    await sendEmail(email, "Welcome to RoomLink Hosting", html);
  } catch (error) {
    logger.error(`Failed to send host welcome email: ${error.message}`);
    throw error;
  }
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmation = async (email, name, paymentDetails) => {
  try {
    const html = templates.paymentConfirmation(name, paymentDetails);
    await sendEmail(email, "Payment Confirmed", html);
  } catch (error) {
    logger.error(`Failed to send payment confirmation email: ${error.message}`);
    throw error;
  }
};

/**
 * Send refund email
 */
const sendRefundEmail = async (email, name, refundDetails) => {
  try {
    const html = templates.refundEmail(name, refundDetails);
    await sendEmail(email, "Refund Processed", html);
  } catch (error) {
    logger.error(`Failed to send refund email: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendRegistrationWelcome,
  sendEmailVerificationConfirmed,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendComplaintAcknowledgment,
  sendComplaintResolution,
  sendReviewInvitation,
  sendPasswordReset,
  sendHostWelcome,
  sendPaymentConfirmation,
  sendRefundEmail,
};
