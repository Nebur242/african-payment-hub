import { PaytechGateway } from "../../../../src/providers/paytech/PaytechGateway";
import {
  GatewayConfig,
  PaymentRequest,
  TransactionStatus,
  WebhookEventType,
} from "../../../../src/types";
import axios from "axios";
import {
  PAYTECH_API_BASE_URL,
  PAYTECH_ENDPOINTS,
} from "../../../../src/providers/paytech/constants";
import { jest, describe, it, beforeEach, expect } from "@jest/globals";

// Mock axios
jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock webhook utility functions
jest.mock("../../../../src/providers/paytech/utils", () => ({
  verifyWebhookSignature: jest.fn(),
  isValidPaytechCurrency: jest
    .fn()
    .mockImplementation((currency) =>
      ["XOF", "EUR", "USD", "CAD", "GBP", "MAD"].includes(currency as string)
    ),
  isValidPaytechAmount: jest
    .fn()
    .mockImplementation((amount) => (amount as number) > 0),
}));

describe("PaytechGateway", () => {
  let gateway: PaytechGateway;
  let config: GatewayConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create axios create mock
    mockAxios.create.mockReturnValue(mockAxios as any);

    // Set up a fresh gateway instance before each test
    gateway = new PaytechGateway();

    // Prepare test configuration
    config = {
      apiKey: "test_api_key",
      apiSecret: "test_api_secret",
      environment: "test",
      webhookSecret: "test_webhook_secret",
    };
  });

  describe("initialize", () => {
    it("should initialize the gateway with valid config", async () => {
      const result = await gateway.initialize(config);

      expect(result).toBe(true);
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: PAYTECH_API_BASE_URL,
          headers: expect.objectContaining({
            Accept: "application/json",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should initialize with additional config options", async () => {
      const configWithAdditional: GatewayConfig = {
        ...config,
        additionalConfig: {
          timeout: 20000,
          merchantId: "test_merchant",
          defaultIpnUrl: "https://example.com/ipn",
        },
      };

      const result = await gateway.initialize(configWithAdditional);

      expect(result).toBe(true);
      expect(mockAxios.defaults.timeout).toBe(20000);
    });
  });

  describe("createPayment", () => {
    const paymentRequest: PaymentRequest = {
      amount: 5000,
      currency: "XOF",
      reference: "order-123",
      description: "Test payment",
      customerEmail: "test@example.com",
      customerName: "Test User",
      returnUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      webhookUrl: "https://example.com/webhook",
      metadata: { orderId: "123" },
    };

    beforeEach(async () => {
      // Initialize gateway before testing payment creation
      await gateway.initialize(config);
    });

    it("should create a payment successfully", async () => {
      // Mock successful payment creation response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: 1,
          redirect_url: "https://paytech.sn/payment/checkout/abc123",
          token: "abc123",
        },
      });

      const result = await gateway.createPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe(
        "https://paytech.sn/payment/checkout/abc123"
      );
      expect(result.token).toBe("abc123");
      expect(result.paymentId).toBe("abc123");
      expect(result.status).toBe(TransactionStatus.PENDING);

      // Verify the request was properly formatted
      expect(mockAxios.post).toHaveBeenCalledWith(
        PAYTECH_ENDPOINTS.REQUEST_PAYMENT,
        expect.objectContaining({
          item_name: paymentRequest.description,
          item_price: paymentRequest.amount.toString(),
          currency: paymentRequest.currency,
          ref_command: paymentRequest.reference,
          env: "test",
        }),
        expect.any(Object)
      );
    });

    it("should handle failed payment creation", async () => {
      // Mock failed payment creation response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: 0,
          error: "Invalid currency",
        },
      });

      const result = await gateway.createPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid currency");
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it("should handle network errors", async () => {
      // Mock network error
      mockAxios.post.mockRejectedValueOnce(new Error("Network error"));

      const result = await gateway.createPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Network error");
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it("should handle API errors", async () => {
      // Mock API error
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: "Bad request",
          },
        },
      };
      mockAxios.post.mockRejectedValueOnce(axiosError);

      const result = await gateway.createPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Bad request");
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it("should throw error if gateway is not initialized", async () => {
      // Create new uninitialized gateway
      const uninitializedGateway = new PaytechGateway();

      await expect(
        uninitializedGateway.createPayment(paymentRequest)
      ).rejects.toThrow("Gateway not initialized");
    });

    it("should throw error for invalid request", async () => {
      // Missing required fields
      const invalidRequest = {
        amount: 5000,
        // Missing currency, reference, description
      } as PaymentRequest;

      await expect(gateway.createPayment(invalidRequest)).rejects.toThrow(
        "Invalid payment request: missing required fields"
      );
    });

    it("should throw error for invalid amount", async () => {
      const invalidRequest = {
        ...paymentRequest,
        amount: 0,
      };

      await expect(gateway.createPayment(invalidRequest)).rejects.toThrow(
        "Invalid amount"
      );
    });

    it("should throw error for unsupported currency", async () => {
      const invalidRequest = {
        ...paymentRequest,
        currency: "INVALID",
      };

      await expect(gateway.createPayment(invalidRequest)).rejects.toThrow(
        "Unsupported currency"
      );
    });
  });

  describe("verifyPayment", () => {
    beforeEach(async () => {
      // Initialize gateway
      await gateway.initialize(config);
    });

    it("should verify a completed payment", async () => {
      // Mock successful status response
      mockAxios.get.mockResolvedValueOnce({
        data: {
          success: 1,
          status: "completed",
          ref_command: "order-123",
          amount: "5000",
          currency: "XOF",
        },
      });

      const status = await gateway.verifyPayment("payment-123");

      expect(status).toBe(TransactionStatus.COMPLETED);
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${PAYTECH_ENDPOINTS.CHECK_STATUS}/payment-123`,
        expect.any(Object)
      );
    });

    it("should verify a pending payment", async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          success: 1,
          status: "pending",
        },
      });

      const status = await gateway.verifyPayment("payment-123");

      expect(status).toBe(TransactionStatus.PENDING);
    });

    it("should handle payment not found", async () => {
      // Mock 404 response
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
        },
      };
      mockAxios.get.mockRejectedValueOnce(axiosError);

      const status = await gateway.verifyPayment("invalid-payment");

      expect(status).toBe(TransactionStatus.FAILED);
    });

    it("should throw error for network issues", async () => {
      mockAxios.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(gateway.verifyPayment("payment-123")).rejects.toThrow(
        "Failed to verify payment"
      );
    });

    it("should throw error if no payment ID is provided", async () => {
      await expect(gateway.verifyPayment("")).rejects.toThrow(
        "Payment ID is required"
      );
    });
  });

  describe("refundPayment", () => {
    beforeEach(async () => {
      // Initialize gateway
      await gateway.initialize(config);
    });

    it("should process a full refund successfully", async () => {
      // Mock successful refund response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: 1,
          refund_id: "refund-123",
          amount: "5000",
          status: "refunded",
          date: "2023-01-01T12:00:00Z",
        },
      });

      const result = await gateway.refundPayment("payment-123");

      expect(result.success).toBe(true);
      expect(result.refundId).toBe("refund-123");
      expect(result.status).toBe(TransactionStatus.REFUNDED);

      // Verify request
      expect(mockAxios.post).toHaveBeenCalledWith(
        PAYTECH_ENDPOINTS.REFUND,
        { token: "payment-123" },
        expect.any(Object)
      );
    });

    it("should process a partial refund", async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: 1,
          refund_id: "refund-123",
          amount: "2000",
          status: "refunded",
        },
      });

      const result = await gateway.refundPayment("payment-123", 2000);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(2000);

      // Verify request included amount
      expect(mockAxios.post).toHaveBeenCalledWith(
        PAYTECH_ENDPOINTS.REFUND,
        { token: "payment-123", amount: 2000 },
        expect.any(Object)
      );
    });

    it("should handle failed refund", async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: 0,
          error: "Payment already refunded",
        },
      });

      const result = await gateway.refundPayment("payment-123");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Payment already refunded");
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it("should handle API errors", async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: "Invalid payment ID",
          },
        },
      };
      mockAxios.post.mockRejectedValueOnce(axiosError);

      const result = await gateway.refundPayment("invalid-payment");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid payment ID");
    });
  });

  describe("webhook handling", () => {
    beforeEach(async () => {
      // Initialize gateway
      await gateway.initialize(config);
    });

    describe("validateWebhook", () => {
      it("should validate a valid webhook", async () => {
        const payload = {
          token: "payment-123",
          ref_command: "order-123",
          type: "payment_success",
          status: "completed",
        };

        const headers = {
          "x-paytech-signature": "valid-signature",
        };

        // Mock signature verification
        const utils = require("../../../../src/providers/paytech/utils");
        utils.verifyWebhookSignature.mockReturnValue(true);

        const result = await gateway.validateWebhook(payload, headers);

        expect(result.isValid).toBe(true);
        expect(utils.verifyWebhookSignature).toHaveBeenCalled();
      });

      it("should reject webhook with missing required fields", async () => {
        const payload = {
          // Missing required fields
          ref_command: "order-123",
        };

        const result = await gateway.validateWebhook(payload, {});

        expect(result.isValid).toBe(false);
        expect(result.reason).toContain("Missing required field");
      });

      it("should reject webhook with invalid signature", async () => {
        const payload = {
          token: "payment-123",
          ref_command: "order-123",
          type: "payment_success",
          status: "completed",
        };

        const headers = {
          "x-paytech-signature": "invalid-signature",
        };

        // Mock signature verification
        const utils = require("../../../../src/providers/paytech/utils");
        utils.verifyWebhookSignature.mockReturnValue(false);

        const result = await gateway.validateWebhook(payload, headers);

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe("Invalid signature");
      });
    });

    describe("processWebhook", () => {
      it("should process a payment success webhook", async () => {
        const payload = {
          type: "payment_success",
          token: "payment-123",
          ref_command: "order-123",
          amount: "5000",
          currency: "XOF",
          status: "completed",
          date: "2023-01-01T12:00:00Z",
          transaction_id: "txn-123",
          custom_field: JSON.stringify({ orderId: "123" }),
          customer_info: {
            name: "Test User",
            email: "test@example.com",
            phone: "+1234567890",
          },
        };

        const event = await gateway.processWebhook(payload);

        expect(event.type).toBe(WebhookEventType.PAYMENT_SUCCESS);
        expect(event.data.reference).toBe("order-123");
        expect(event.data.paymentId).toBe("payment-123");
        expect(event.data.amount).toBe(5000);
        expect(event.data.currency).toBe("XOF");
        expect(event.data.status).toBe(TransactionStatus.COMPLETED);
        expect(event.data.metadata).toEqual({ orderId: "123" });
        expect(event.data.customerEmail).toBe("test@example.com");
        expect(event.gatewayName).toBe("paytech");
      });

      it("should throw error for invalid payload", async () => {
        await expect(gateway.processWebhook(null)).rejects.toThrow(
          "Invalid webhook payload"
        );
      });
    });
  });
});
