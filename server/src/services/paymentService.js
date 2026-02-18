/**
 * Payment Service
 * Handles M-Pesa/Marpay payment processing
 */

const axios = require("axios");
const logger = require("../config/logger");

/**
 * M-Pesa/Marpay Payment Service
 * Supports M-Pesa, Airtel Money, and other mobile payment providers
 */
class PaymentService {
  constructor() {
    this.provider = process.env.PAYMENT_PROVIDER || "mpesa"; // mpesa, airtel, marpay
    this.baseUrl = process.env.MARPAY_BASE_URL || "https://api.marpay.com";
    this.apiKey = process.env.MARPAY_API_KEY;
    this.accountId = process.env.MARPAY_ACCOUNT_ID;
    this.secretKey = process.env.MARPAY_SECRET_KEY;
  }

  /**
   * Initiate STK Push (for M-Pesa)
   * Prompts user to enter PIN on their phone
   */
  async initiateSTKPush(phoneNumber, amount, accountReference, description) {
    try {
      const payload = {
        BusinessShortCode: process.env.MPESA_BUSINESS_CODE,
        Password: this.generatePassword(),
        Timestamp: this.getTimestamp(),
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_BUSINESS_CODE,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: description,
      };

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        payload,
        {
          headers: {
            Authorization: `Bearer ${await this.getMPesaAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`STK Push initiated: ${accountReference}`);
      return {
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
      };
    } catch (error) {
      logger.error(`STK Push error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check M-Pesa transaction status
   */
  async checkTransactionStatus(checkoutRequestId) {
    try {
      const payload = {
        BusinessShortCode: process.env.MPESA_BUSINESS_CODE,
        Password: this.generatePassword(),
        Timestamp: this.getTimestamp(),
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
        payload,
        {
          headers: {
            Authorization: `Bearer ${await this.getMPesaAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Transaction status check error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send money to customer (B2C)
   * For refunds or payouts
   */
  async sendB2CPayment(phoneNumber, amount, description = "Refund") {
    try {
      const payload = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment",
        Amount: Math.round(amount),
        PartyA: process.env.MPESA_BUSINESS_CODE,
        PartyB: phoneNumber,
        Remarks: description,
        QueueTimeOutURL: process.env.MPESA_TIMEOUT_URL,
        ResultURL: process.env.MPESA_RESULT_URL,
      };

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
        payload,
        {
          headers: {
            Authorization: `Bearer ${await this.getMPesaAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`B2C payment sent: ${phoneNumber} - ${amount}`);
      return {
        conversationId: response.data.ConversationID,
        responseCode: response.data.ResponseCode,
      };
    } catch (error) {
      logger.error(`B2C payment error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Kenyan phone format: 254XXXXXXXXX or 07XXXXXXXX
    const phoneRegex = /^(?:254|\+254|0)?([71](?:\d{8})?)$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to Safaricom format
   */
  formatPhoneNumber(phoneNumber) {
    if (!this.validatePhoneNumber(phoneNumber)) {
      throw new Error("Invalid phone number format");
    }

    // Remove leading 0 or + if present
    let formatted = phoneNumber.replace(/^[\+0]/, "");

    // Add country code if not present
    if (!formatted.startsWith("254")) {
      formatted = "254" + formatted;
    }

    return formatted;
  }

  /**
   * Get M-Pesa access token
   */
  async getMPesaAccessToken() {
    try {
      const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString("base64");

      const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error(`Failed to get M-Pesa access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate M-Pesa password
   */
  generatePassword() {
    const timestamp = this.getTimestamp();
    const data =
      process.env.MPESA_BUSINESS_CODE + process.env.MPESA_PASSKEY + timestamp;
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(data).digest("base64");
  }

  /**
   * Get current timestamp in YYYYMMDDHHmmss format
   */
  getTimestamp() {
    const now = new Date();
    return (
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0")
    );
  }
}

module.exports = new PaymentService();
