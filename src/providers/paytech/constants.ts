/**
 * Paytech API base URL
 */
export const PAYTECH_API_BASE_URL = "https://paytech.sn/api";

/**
 * Paytech API endpoints
 */
export const PAYTECH_ENDPOINTS = {
  REQUEST_PAYMENT: "/payment/request-payment",
  CHECK_STATUS: "/payment/check-status", // Add the appropriate endpoint from Paytech docs
  REFUND: "/payment/refund", // Add the appropriate endpoint from Paytech docs
};

/**
 * Paytech supported currencies
 */
export const PAYTECH_CURRENCIES = [
  "XOF", // West African CFA franc
  "EUR", // Euro
  "USD", // US Dollar
  "CAD", // Canadian Dollar
  "GBP", // British Pound
  "MAD", // Moroccan Dirham
];

/**
 * Paytech environment options
 */
export enum PAYTECH_ENVIRONMENT {
  TEST = "test",
  PRODUCTION = "prod",
}

/**
 * Paytech payment status mappings
 */
export const PAYTECH_STATUS_MAPPING = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",
};

/**
 * Paytech webhook event types
 */
export enum PAYTECH_WEBHOOK_EVENT {
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED = "payment_failed",
  PAYMENT_CANCELED = "payment_canceled",
  REFUND_SUCCESS = "refund_success",
  REFUND_FAILED = "refund_failed",
}
