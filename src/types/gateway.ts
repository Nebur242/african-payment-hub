import { RefundResponse, TransactionStatus } from "./payment";
import { SubscriptionRequest, SubscriptionResponse } from "./subscription";
import { WebhookEvent, WebhookValidationResult } from "./webhook";

export interface GatewayConfig {
  apiKey: string;
  apiSecret: string;
  environment: "test" | "production";
  webhookSecret?: string;
  additionalConfig?: Record<string, unknown>;
}

export interface PaymentGateway {
  /**
   * Initialize the payment gateway with configuration
   */
  initialize(config: GatewayConfig): Promise<boolean>;

  /**
   * Create a payment request and return checkout information
   */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify the status of a payment
   */
  verifyPayment(paymentId: string): Promise<TransactionStatus>;

  /**
   * Process a refund for a completed payment
   */
  refundPayment(paymentId: string, amount?: number): Promise<RefundResponse>;

  /**
   * Validate a webhook notification from the payment provider
   */
  validateWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<WebhookValidationResult>;

  /**
   * Process a webhook notification
   */
  processWebhook(payload: unknown): Promise<WebhookEvent>;

  /**
   * Create a subscription for recurring payments
   */
  createSubscription?(
    subscriptionRequest: SubscriptionRequest
  ): Promise<SubscriptionResponse>;

  /**
   * Cancel an active subscription
   */
  cancelSubscription?(subscriptionId: string): Promise<boolean>;
}
