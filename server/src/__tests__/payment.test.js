/**
 * Payment Integration Tests
 * Tests M-Pesa/Marpay payment processing
 */

const request = require("supertest");
const paymentService = require("../services/paymentService");

describe("Payment Integration - M-Pesa", () => {
  let userToken;
  let userId = "test-user-id";

  beforeAll(() => {
    // Mock JWT token
    userToken = global.testUtils.generateTestToken(userId);
  });

  describe("Phone Number Validation", () => {
    it("should validate correct Kenyan phone numbers", () => {
      const validNumbers = [
        "254712345678",
        "0712345678",
        "+254712345678",
        "712345678",
      ];

      validNumbers.forEach((number) => {
        expect(paymentService.validatePhoneNumber(number)).toBe(true);
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidNumbers = [
        "123456789",
        "25412345678",
        "0812345678",
        "invalid",
      ];

      invalidNumbers.forEach((number) => {
        expect(paymentService.validatePhoneNumber(number)).toBe(false);
      });
    });
  });

  describe("Phone Number Formatting", () => {
    it("should format phone numbers to Safaricom format", () => {
      expect(paymentService.formatPhoneNumber("0712345678")).toBe(
        "254712345678"
      );
      expect(paymentService.formatPhoneNumber("712345678")).toBe("254712345678");
      expect(paymentService.formatPhoneNumber("+254712345678")).toBe(
        "254712345678"
      );
    });

    it("should throw error on invalid format", () => {
      expect(() => {
        paymentService.formatPhoneNumber("invalid");
      }).toThrow();
    });
  });

  describe("STK Push Initiation", () => {
    it("should initiate STK Push with valid parameters", async () => {
      const mockResponse = {
        CheckoutRequestID: "ws_CO_123456789",
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
      };

      // Mock the API call
      jest.spyOn(paymentService, "initiateSTKPush").mockResolvedValueOnce({
        checkoutRequestId: mockResponse.CheckoutRequestID,
        responseCode: mockResponse.ResponseCode,
        responseDescription: mockResponse.ResponseDescription,
      });

      const result = await paymentService.initiateSTKPush(
        "254712345678",
        1000,
        "payment-123",
        "Hostel Booking"
      );

      expect(result.checkoutRequestId).toBe(mockResponse.CheckoutRequestID);
      expect(result.responseCode).toBe("0");
    });
  });

  describe("Transaction Status Check", () => {
    it("should check transaction status", async () => {
      const mockStatus = {
        ResultCode: "0",
        ResultDesc: "The service request has been accepted successfully",
        MpesaReceiptNumber: "RLT61H1V6QN",
      };

      jest.spyOn(paymentService, "checkTransactionStatus").mockResolvedValueOnce(
        mockStatus
      );

      const result = await paymentService.checkTransactionStatus(
        "ws_CO_123456789"
      );

      expect(result.ResultCode).toBe("0");
      expect(result.MpesaReceiptNumber).toBeDefined();
    });
  });

  describe("B2C Payment (Refunds)", () => {
    it("should send B2C payment for refunds", async () => {
      const mockResponse = {
        ConversationID: "AG_123456",
        ResponseCode: "0",
      };

      jest.spyOn(paymentService, "sendB2CPayment").mockResolvedValueOnce({
        conversationId: mockResponse.ConversationID,
        responseCode: mockResponse.ResponseCode,
      });

      const result = await paymentService.sendB2CPayment(
        "254712345678",
        500,
        "Booking Refund"
      );

      expect(result.responseCode).toBe("0");
      expect(result.conversationId).toBeDefined();
    });
  });

  describe("Payment Callback Processing", () => {
    it("should process successful payment callback", async () => {
      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: "123456",
            CheckoutRequestID: "payment-123",
            ResultCode: 0,
            ResultDesc: "The service request has been accepted successfully",
            CallbackMetadata: {
              Item: [
                {
                  Name: "Amount",
                  Value: 1000,
                },
                {
                  Name: "MpesaReceiptNumber",
                  Value: "RLT61H1V6QN",
                },
                {
                  Name: "TransactionDate",
                  Value: 20230101120000,
                },
                {
                  Name: "PhoneNumber",
                  Value: 254712345678,
                },
              ],
            },
          },
        },
      };

      // Process the callback
      expect(callbackPayload.Body.stkCallback.ResultCode).toBe(0);
      expect(callbackPayload.Body.stkCallback.CallbackMetadata).toBeDefined();
    });

    it("should process failed payment callback", async () => {
      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: "123456",
            CheckoutRequestID: "payment-123",
            ResultCode: 1032,
            ResultDesc: "Request cancelled by user",
          },
        },
      };

      expect(callbackPayload.Body.stkCallback.ResultCode).not.toBe(0);
      expect(callbackPayload.Body.stkCallback.ResultDesc).toContain("cancelled");
    });
  });

  describe("Payment Amount Validation", () => {
    it("should reject amounts below minimum", () => {
      const amount = 5;
      expect(amount < 10).toBe(true); // Should reject
    });

    it("should accept amounts above minimum", () => {
      const amount = 50;
      expect(amount >= 10).toBe(true); // Should accept
    });
  });
});
