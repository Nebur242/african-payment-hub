import axios, { AxiosError, AxiosInstance } from "axios";
import {
  PaymentGateway,
  GatewayConfig,
  PaymentRequest,
  PaymentResponse,
  TransactionStatus,
  RefundResponse,
  WebhookValidationResult,
  WebhookEvent,
} from "../../types";
import {
  PaytechConfig,
  PaytechPaymentResponse,
  PaytechStatusResponse,
  PaytechRefundRequest,
  PaytechRefundResponse,
  PaytechWebhookPayload,
} from "./types";
import {
  mapToPaytechRequest,
  mapFromPaytechResponse,
  mapPaytechStatus,
  mapFromPaytechRefundResponse,
} from "./mappers";
import { isValidPaytechCurrency, isValidPaytechAmount } from "./utils";
import { validatePaytechWebhook, processPaytechWebhook } from "./webhooks";
import { PAYTECH_API_BASE_URL, PAYTECH_ENDPOINTS } from "./constants";

/**
 * Implementation of the PaymentGateway interface for Paytech
 */
export class PaytechGateway implements PaymentGateway {
  private config: PaytechConfig;
  private initialized: boolean = false;
  private client: AxiosInstance;

  /**
   * Creates a new instance of PaytechGateway
   */
  constructor() {
    this.config = {
      apiKey: "",
      apiSecret: "",
      environment: "test",
    };

    // Initialize axios instance
    this.client = axios.create({
      baseURL: PAYTECH_API_BASE_URL,
      timeout: 10000, // 10 seconds default timeout
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Initialize the gateway with configuration
   *
   * @param config Gateway configuration
   * @returns Promise resolving to true if initialization is successful
   */
  async initialize(config: GatewayConfig): Promise<boolean> {
    this.config = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      environment: config.environment,
      webhookSecret: config.webhookSecret,
      timeout: (config.additionalConfig?.timeout as number) || 10000,
      merchantId: config.additionalConfig?.merchantId as string,
      defaultIpnUrl: config.additionalConfig?.defaultIpnUrl as string,
      defaultSuccessUrl: config.additionalConfig?.defaultSuccessUrl as string,
      defaultCancelUrl: config.additionalConfig?.defaultCancelUrl as string,
    };

    // Update axios instance with new configuration
    this.client.defaults.timeout = this.config.timeout;

    // Validate credentials with a lightweight API call if possible
    try {
      // This is a placeholder - you might want to make a test API call
      // to verify credentials if Paytech provides such an endpoint
      // For now, we'll just mark as initialized
      this.initialized = true;
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to initialize Paytech gateway: ${errorMessage}`);
    }
  }

  /**
   * Get headers for Paytech API requests
   *
   * @returns Headers object with auth credentials
   */
  private getHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      API_KEY: this.config.apiKey,
      API_SECRET: this.config.apiSecret,
    };
  }

  /**
   * Create a payment request
   *
   * @param request Payment request details
   * @returns Promise resolving to payment response
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.initialized) {
      throw new Error("Gateway not initialized. Call initialize() first.");
    }

    // Validate request
    if (!request.reference || !request.description) {
      throw new Error("Invalid payment request: missing required fields");
    }

    if (!isValidPaytechAmount(request.amount)) {
      throw new Error("Invalid amount");
    }

    if (!isValidPaytechCurrency(request.currency)) {
      throw new Error(`Unsupported currency: ${request.currency}`);
    }

    try {
      // Map to Paytech request format
      const paytechRequest = mapToPaytechRequest(
        request,
        this.config.environment
      );

      // Add default URLs if not provided in the request
      if (!paytechRequest.ipn_url && this.config.defaultIpnUrl) {
        paytechRequest.ipn_url = this.config.defaultIpnUrl;
      }
      if (!paytechRequest.success_url && this.config.defaultSuccessUrl) {
        paytechRequest.success_url = this.config.defaultSuccessUrl;
      }
      if (!paytechRequest.cancel_url && this.config.defaultCancelUrl) {
        paytechRequest.cancel_url = this.config.defaultCancelUrl;
      }

      // Make API request
      const response = await this.client.post(
        PAYTECH_ENDPOINTS.REQUEST_PAYMENT,
        paytechRequest,
        { headers: this.getHeaders() }
      );

      const paytechResponse: PaytechPaymentResponse = response.data;

      // Map response to unified format
      return mapFromPaytechResponse(paytechResponse);
    } catch (err) {
      const error = err as any;
      // Handle API errors
      if ((axios.isAxiosError(error) || error.isAxiosError) && error.response) {
        // API returned an error response
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.error || error.message || "Payment request failed",
          status: TransactionStatus.FAILED,
          createdAt: new Date(),
        };
      } else {
        // Network or other error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          message: `Payment request failed: ${errorMessage}`,
          status: TransactionStatus.FAILED,
          createdAt: new Date(),
        };
      }
    }
  }

  /**
   * Verify the status of a payment
   *
   * @param paymentId Payment ID (token) to verify
   * @returns Promise resolving to transaction status
   */
  async verifyPayment(paymentId: string): Promise<TransactionStatus> {
    if (!this.initialized) {
      throw new Error("Gateway not initialized. Call initialize() first.");
    }

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    try {
      // Make API request to check payment status
      const response = await this.client.get(
        `${PAYTECH_ENDPOINTS.CHECK_STATUS}/${paymentId}`,
        { headers: this.getHeaders() }
      );

      const statusResponse: PaytechStatusResponse = response.data;

      // Map Paytech status to unified status
      return mapPaytechStatus(statusResponse);
    } catch (err) {
      const error = err as any;
      // Handle API errors
      if (
        (axios.isAxiosError(error) || error.isAxiosError) &&
        error.response &&
        error.response.status === 404
      ) {
        // Payment not found
        return TransactionStatus.FAILED;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to verify payment: ${errorMessage}`);
    }
  }

  /**
   * Process a refund for a completed payment
   *
   * @param paymentId Payment ID (token) to refund
   * @param amount Optional amount to refund (defaults to full payment amount)
   * @returns Promise resolving to refund response
   */
  async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<RefundResponse> {
    if (!this.initialized) {
      throw new Error("Gateway not initialized. Call initialize() first.");
    }

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    try {
      // Prepare refund request
      const refundRequest: PaytechRefundRequest = {
        token: paymentId,
      };

      // Add amount if specified
      if (amount && amount > 0) {
        refundRequest.amount = amount;
      }

      // Make API request
      const response = await this.client.post(
        PAYTECH_ENDPOINTS.REFUND,
        refundRequest,
        { headers: this.getHeaders() }
      );

      const refundResponse: PaytechRefundResponse = response.data;

      // Map response to unified format
      return mapFromPaytechRefundResponse(refundResponse, amount);
    } catch (err) {
      const error = err as any;
      // Handle API errors
      if ((axios.isAxiosError(error) || error.isAxiosError) && error.response) {
        // API returned an error response
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.error || error.message || "Refund request failed",
          status: TransactionStatus.FAILED,
          createdAt: new Date(),
        };
      } else {
        // Network or other error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          message: `Refund request failed: ${errorMessage}`,
          status: TransactionStatus.FAILED,
          createdAt: new Date(),
        };
      }
    }
  }

  /**
   * Validate a webhook notification from Paytech
   *
   * @param payload Webhook payload
   * @param headers HTTP headers from the webhook request
   * @returns Promise resolving to webhook validation result
   */
  async validateWebhook(
    payload: any,
    headers: Record<string, string>
  ): Promise<WebhookValidationResult> {
    return validatePaytechWebhook(payload, headers, this.config.webhookSecret);
  }

  /**
   * Process a webhook notification from Paytech
   *
   * @param payload Webhook payload
   * @returns Promise resolving to webhook event
   */
  async processWebhook(payload: any): Promise<WebhookEvent> {
    if (!payload) {
      throw new Error("Invalid webhook payload");
    }

    return processPaytechWebhook(payload as PaytechWebhookPayload);
  }
}
