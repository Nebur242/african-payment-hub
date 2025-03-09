import { Currency, TransactionStatus } from "./payment";

export interface WebhookValidationResult {
  isValid: boolean;
  reason?: string;
}

export enum WebhookEventType {
  PAYMENT_SUCCESS = "payment.success",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_PENDING = "payment.pending",
  REFUND_SUCCESS = "refund.success",
  REFUND_FAILED = "refund.failed",
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_CANCELED = "subscription.canceled",
  SUBSCRIPTION_PAYMENT = "subscription.payment",
  SUBSCRIPTION_FAILED = "subscription.failed",
}

export interface WebhookEvent {
  type: WebhookEventType;
  data: {
    reference: string;
    paymentId?: string;
    amount?: number;
    currency?: Currency;
    status: TransactionStatus;
    metadata?: Record<string, unknown>;
    gatewayReference?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  gatewayName: string;
}
