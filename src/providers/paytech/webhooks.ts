// src/providers/paytech/webhooks.ts

import { WebhookValidationResult, WebhookEvent } from "../../types";
import { PaytechWebhookPayload } from "./types";
import { mapFromPaytechWebhook } from "./mappers";
import { verifyWebhookSignature } from "./utils";

/**
 * Validates a webhook notification from Paytech
 *
 * @param payload The webhook payload from Paytech
 * @param headers The HTTP headers from the webhook request
 * @param webhookSecret The secret used to validate the webhook
 * @returns Validation result indicating if the webhook is valid
 */
export function validatePaytechWebhook(
  payload: any,
  headers: Record<string, string>,
  webhookSecret?: string
): WebhookValidationResult {
  // Basic payload validation
  if (!payload) {
    return { isValid: false, reason: "Empty payload" };
  }

  // Required fields validation
  const requiredFields = ["token", "ref_command", "type", "status"];
  for (const field of requiredFields) {
    if (!payload[field]) {
      return { isValid: false, reason: `Missing required field: ${field}` };
    }
  }

  // If webhook secret is provided, validate signature
  if (webhookSecret) {
    // Get signature from headers
    const signature =
      headers["x-paytech-signature"] || headers["X-Paytech-Signature"];

    if (!signature) {
      return { isValid: false, reason: "Missing signature header" };
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return { isValid: false, reason: "Invalid signature" };
    }
  }

  return { isValid: true };
}

/**
 * Processes a webhook notification from Paytech and converts it to a standardized format
 *
 * @param payload The webhook payload from Paytech
 * @returns Standardized webhook event
 */
export function processPaytechWebhook(
  payload: PaytechWebhookPayload
): WebhookEvent {
  return mapFromPaytechWebhook(payload);
}

/**
 * Generates a webhook response for Paytech
 *
 * @param success Whether the webhook processing was successful
 * @param message Optional message to include in the response
 * @returns Response object to send back to Paytech
 */
export function generatePaytechWebhookResponse(
  success: boolean,
  message?: string
): any {
  return {
    status: success ? "success" : "error",
    message:
      message ||
      (success
        ? "Webhook processed successfully"
        : "Failed to process webhook"),
  };
}
