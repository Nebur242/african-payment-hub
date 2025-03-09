export type Currency = "XOF" | "EUR" | "USD" | "CAD" | "GBP" | "MAD" | string;

export interface PaymentRequest {
  amount: number;
  currency: Currency;
  reference: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  paymentId?: string;
  token?: string;
  message?: string;
  status?: TransactionStatus;
  gatewayReference?: string;
  createdAt?: Date;
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount?: number;
  message?: string;
  status?: TransactionStatus;
  createdAt?: Date;
}
