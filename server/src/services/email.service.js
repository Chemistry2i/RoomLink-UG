const SibApiV3Sdk = require("sib-api-v3-sdk");
const logger = require("../config/logger");

/**
 * Brevo Email Configuration
 * Initializes Brevo API client for email sending
 */

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

/**
 * Send email using Brevo
 * @param {Object} emailData - Email data object
 * @returns {Promise}
 */
const sendEmail = async (emailData) => {
  try {
    if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
      logger.info(`Email notifications disabled. Would send: ${emailData.to}`);
      return { success: true, skipped: true };
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = emailData.subject;
    sendSmtpEmail.htmlContent = emailData.htmlContent;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "RoomLink",
      email: process.env.BREVO_SENDER_EMAIL || "noreply@roomlink.com",
    };
    sendSmtpEmail.to = [
      {
        email: emailData.to,
        name: emailData.toName || emailData.to,
      },
    ];

    // Add CC if provided
    if (emailData.cc) {
      sendSmtpEmail.cc = emailData.cc.map((email) => ({ email }));
    }

    // Add BCC if provided
    if (emailData.bcc) {
      sendSmtpEmail.bcc = emailData.bcc.map((email) => ({ email }));
    }

    // Add attachments if provided
    if (emailData.attachments) {
      sendSmtpEmail.attachment = emailData.attachments;
    }

    // Add reply-to if provided
    if (emailData.replyTo) {
      sendSmtpEmail.replyTo = {
        email: emailData.replyTo,
      };
    }

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(
      `✅ Email sent successfully to ${emailData.to}. Message ID: ${response.messageId}`
    );
    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error) {
    logger.error(`❌ Failed to send email: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send bulk emails
 * @param {Array} recipients - Array of recipient objects
 * @param {String} subject - Email subject
 * @param {String} htmlContent - HTML email content
 * @returns {Promise}
 */
const sendBulkEmail = async (recipients, subject, htmlContent) => {
  try {
    if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
      logger.info(`Bulk email notifications disabled for ${recipients.length} recipients`);
      return { success: true, skipped: true };
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "RoomLink",
      email: process.env.BREVO_SENDER_EMAIL || "noreply@roomlink.com",
    };
    sendSmtpEmail.to = recipients;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(
      `✅ Bulk email sent to ${recipients.length} recipients. Message ID: ${response.messageId}`
    );
    return {
      success: true,
      messageId: response.messageId,
      recipientCount: recipients.length,
    };
  } catch (error) {
    logger.error(`❌ Failed to send bulk email: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
};
