import { GatewayConfig } from "../../types";
import { PAYTECH_ENVIRONMENT } from "./constants";

/**
 * Paytech specific configuration
 */
export interface PaytechConfig extends GatewayConfig {
  /**
   * Optional merchant identifier if different from API key
   */
  merchantId?: string;

  /**
   * Optional timeout for API requests in milliseconds
   */
  timeout?: number;

  /**
   * Optional callback URL for IPN notifications (can be overridden per payment)
   */
  defaultIpnUrl?: string;

  /**
   * Optional default success URL (can be overridden per payment)
   */
  defaultSuccessUrl?: string;

  /**
   * Optional default cancel URL (can be overridden per payment)
   */
  defaultCancelUrl?: string;
}

/**
 * Paytech payment request parameters
 */
export interface PaytechPaymentRequest {
  /**
   * Name of the item or service being purchased
   */
  item_name: string;

  /**
   * Price of the item/service (as string)
   */
  item_price: string;

  /**
   * Payment currency code
   */
  currency: string;

  /**
   * Unique order reference from merchant system
   */
  ref_command: string;

  /**
   * Description of the order
   */
  command_name: string;

  /**
   * Environment to use (test or prod)
   */
  env: PAYTECH_ENVIRONMENT.TEST | PAYTECH_ENVIRONMENT.PRODUCTION;

  /**
   * URL for Instant Payment Notification (IPN) callbacks
   */
  ipn_url?: string;

  /**
   * URL to redirect customer after successful payment
   */
  success_url?: string;

  /**
   * URL to redirect customer if payment is canceled
   */
  cancel_url?: string;

  /**
   * Additional data to pass through the payment process (JSON string)
   */
  custom_field?: string;
}

/**
 * Paytech payment response structure
 */
export interface PaytechPaymentResponse {
  /**
   * Success indicator (1 for success, 0 for failure)
   */
  success: number;

  /**
   * URL to redirect the customer to complete payment
   */
  redirect_url?: string;

  /**
   * Payment token
   */
  token?: string;

  /**
   * Error message if success is 0
   */
  error?: string;
}

/**
 * Paytech payment status response
 */
export interface PaytechStatusResponse {
  /**
   * Success indicator (1 for success, 0 for failure)
   */
  success: number;

  /**
   * Payment status
   */
  status?: string;

  /**
   * Error message if success is 0
   */
  error?: string;

  /**
   * Payment reference
   */
  ref_command?: string;

  /**
   * Payment amount
   */
  amount?: string;

  /**
   * Payment currency
   */
  currency?: string;

  /**
   * Payment creation date
   */
  date?: string;

  /**
   * Paytech transaction ID
   */
  transaction_id?: string;

  /**
   * Customer information
   */
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * Paytech refund request parameters
 */
export interface PaytechRefundRequest {
  /**
   * Payment token to refund
   */
  token: string;

  /**
   * Amount to refund (optional, defaults to full payment amount)
   */
  amount?: number;

  /**
   * Reason for the refund
   */
  reason?: string;
}

/**
 * Paytech refund response
 */
export interface PaytechRefundResponse {
  /**
   * Success indicator (1 for success, 0 for failure)
   */
  success: number;

  /**
   * Refund ID
   */
  refund_id?: string;

  /**
   * Refunded amount
   */
  amount?: string;

  /**
   * Error message if success is 0
   */
  error?: string;

  /**
   * Refund status
   */
  status?: string;

  /**
   * Refund creation date
   */
  date?: string;
}

/**
 * Paytech webhook notification payload
 */
export interface PaytechWebhookPayload {
  /**
   * Type of event
   */
  type: string;

  /**
   * Payment token
   */
  token: string;

  /**
   * Payment reference
   */
  ref_command: string;

  /**
   * Payment amount
   */
  amount: string;

  /**
   * Payment currency
   */
  currency: string;

  /**
   * Payment status
   */
  status: string;

  /**
   * Payment creation date
   */
  date: string;

  /**
   * Paytech transaction ID
   */
  transaction_id: string;

  /**
   * Additional data passed during payment creation
   */
  custom_field?: string;

  /**
   * Customer information
   */
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}
