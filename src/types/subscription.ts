import { Currency } from "./payment";

export interface SubscriptionRequest {
  planName: string;
  amount: number;
  currency: Currency;
  interval: "daily" | "weekly" | "monthly" | "yearly";
  intervalCount?: number;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  startDate?: Date;
  endDate?: Date;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  redirectUrl?: string;
  status?: "active" | "pending" | "canceled" | "expired";
  message?: string;
  gatewayReference?: string;
  createdAt?: Date;
  nextBillingDate?: Date;
}
