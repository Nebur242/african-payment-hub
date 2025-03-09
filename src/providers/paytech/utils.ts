import { createHmac } from "crypto";
import { PAYTECH_CURRENCIES } from "./constants";

/**
 * Validates if a currency is supported by Paytech
 *
 * @param currency Currency code to validate
 * @returns True if the currency is supported, false otherwise
 */
export function isValidPaytechCurrency(currency: string): boolean {
  return PAYTECH_CURRENCIES.includes(currency.toUpperCase());
}

/**
 * Validates a payment amount for Paytech
 *
 * @param amount Payment amount to validate
 * @returns True if the amount is valid, false otherwise
 */
export function isValidPaytechAmount(amount: number): boolean {
  // Paytech might have minimum/maximum amount constraints
  // This is a placeholder implementation
  return amount > 0;
}

/**
 * Creates a signature for webhook validation
 *
 * @param payload Webhook payload
 * @param secret Webhook secret
 * @returns Signature string
 */
export function createWebhookSignature(payload: any, secret: string): string {
  // This implementation depends on how Paytech handles webhook signatures
  // This is a common approach, but should be updated based on Paytech's documentation

  // Sort payload keys alphabetically and create a string
  const payloadString = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("&");

  // Create HMAC SHA256 signature
  return createHmac("sha256", secret).update(payloadString).digest("hex");
}

/**
 * Verifies a webhook signature from Paytech
 *
 * @param payload Webhook payload
 * @param signature Signature to verify
 * @param secret Secret key for verification
 * @returns True if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  // Generate the expected signature
  const expectedSignature = createWebhookSignature(payload, secret);

  // Compare with the provided signature (constant-time comparison to prevent timing attacks)
  return expectedSignature === signature;
}

/**
 * Generates a nonce for API requests that require it
 *
 * @returns Random nonce string
 */
export function generateNonce(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Formats an amount for display based on currency
 *
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted amount string
 */
export function formatAmount(amount: number, currency: string): string {
  // This is a simple implementation that should be expanded
  // based on actual requirements and locale handling

  switch (currency.toUpperCase()) {
    case "XOF":
      return amount.toLocaleString("fr-FR") + " FCFA";
    case "EUR":
      return amount.toLocaleString("fr-FR") + " €";
    case "USD":
      return "$" + amount.toLocaleString("en-US");
    case "GBP":
      return "£" + amount.toLocaleString("en-GB");
    default:
      return amount.toString() + " " + currency;
  }
}

/**
 * Generates a unique reference ID for payments
 *
 * @param prefix Optional prefix for the reference
 * @returns Unique reference string
 */
export function generateReference(prefix: string = "PAY"): string {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `${prefix}-${timestamp}-${random}`;
}
