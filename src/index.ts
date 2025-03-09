// src/index.ts

import {
  PaymentGateway,
  GatewayConfig,
  PaymentRequest,
  PaymentResponse,
} from "./types";
// Import other gateway implementations as they are developed
// import { CinetpayGateway } from './providers/cinetpay/CinetpayGateway';
// import { MoneyFusionGateway } from './providers/moneyfusion/MoneyFusionGateway';

/**
 * Supported payment gateway providers
 */
export enum PaymentProvider {
  PAYTECH = "paytech",
  CINETPAY = "cinetpay",
  MONEY_FUSION = "moneyfusion",
  // Add more providers as they are implemented
}

/**
 * Main class for the multi-payment gateway package
 */
export class MultiPaymentGateway {
  private gateway: PaymentGateway | null = null;
  private provider: PaymentProvider | null = null;

  /**
   * Initialize with a specific payment provider and configuration
   *
   * @param provider The payment provider to use
   * @param config Configuration for the selected provider
   * @returns Promise resolving to true if initialization is successful
   * @throws Error if provider is not supported or initialization fails
   */
  async initialize(
    provider: PaymentProvider,
    config: GatewayConfig
  ): Promise<boolean> {
    this.provider = provider;

    // Create the appropriate gateway instance based on the provider
    switch (provider) {
      case PaymentProvider.PAYTECH:
        // this.gateway = new PaytechGateway();
        throw new Error("Paytech provider not yet implemented");
        break;

      case PaymentProvider.CINETPAY:
        // this.gateway = new CinetpayGateway();
        throw new Error("CinetPay provider not yet implemented");

      case PaymentProvider.MONEY_FUSION:
        // this.gateway = new MoneyFusionGateway();
        throw new Error("MoneyFusion provider not yet implemented");

      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }

    // Initialize the gateway with the provided configuration
    // return await this.gateway.initialize(config);
  }

  /**
   * Get the current payment provider
   *
   * @returns The current payment provider or null if not initialized
   */
  getProvider(): PaymentProvider | null {
    return this.provider;
  }

  /**
   * Create a payment request
   *
   * @param request Payment request details
   * @returns Promise resolving to a payment response
   * @throws Error if gateway is not initialized
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.ensureInitialized();
    return await this.gateway!.createPayment(request);
  }

  /**
   * Verify the status of a payment
   *
   * @param paymentId ID of the payment to verify
   * @returns Promise resolving to the transaction status
   * @throws Error if gateway is not initialized
   */
  async verifyPayment(paymentId: string): Promise<string> {
    this.ensureInitialized();
    return await this.gateway!.verifyPayment(paymentId);
  }

  /**
   * Process a refund for a completed payment
   *
   * @param paymentId ID of the payment to refund
   * @param amount Optional amount to refund (default: full payment amount)
   * @returns Promise resolving to a refund response
   * @throws Error if gateway is not initialized
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    this.ensureInitialized();
    return await this.gateway!.refundPayment(paymentId, amount);
  }

  /**
   * Validate a webhook notification from the payment provider
   *
   * @param payload Webhook payload
   * @param headers HTTP headers from the webhook request
   * @returns Promise resolving to a validation result
   * @throws Error if gateway is not initialized
   */
  async validateWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<unknown> {
    this.ensureInitialized();
    return await this.gateway!.validateWebhook(payload, headers);
  }

  /**
   * Process a webhook notification
   *
   * @param payload Webhook payload
   * @returns Promise resolving to a standardized webhook event
   * @throws Error if gateway is not initialized
   */
  async processWebhook(payload: unknown): Promise<unknown> {
    this.ensureInitialized();
    return await this.gateway!.processWebhook(payload);
  }

  /**
   * Ensure that the gateway is initialized before use
   *
   * @throws Error if gateway is not initialized
   */
  private ensureInitialized(): void {
    if (!this.gateway) {
      throw new Error(
        "Payment gateway not initialized. Call initialize() first."
      );
    }
  }
}

export * from "./types";

// Create and export an instance of the MultiPaymentGateway
export default new MultiPaymentGateway();
