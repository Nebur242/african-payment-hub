import {
  PaymentRequest,
  PaymentResponse,
  RefundResponse,
  TransactionStatus,
  WebhookEvent,
  WebhookEventType,
} from "../../types";
import {
  PaytechPaymentRequest,
  PaytechPaymentResponse,
  PaytechStatusResponse,
  PaytechRefundResponse,
  PaytechWebhookPayload,
} from "./types";
import { PAYTECH_ENVIRONMENT, PAYTECH_WEBHOOK_EVENT } from "./constants";

/**
 * Maps the unified PaymentRequest to Paytech's specific request format
 *
 * @param request Unified payment request
 * @param environment Paytech environment (test or production)
 * @returns Paytech-formatted payment request
 */
export function mapToPaytechRequest(
  request: PaymentRequest,
  environment: "test" | "production"
): PaytechPaymentRequest {
  return {
    item_name: request.description,
    item_price: request.amount.toString(),
    currency: request.currency,
    ref_command: request.reference,
    command_name: request.description,
    env:
      environment === "production"
        ? PAYTECH_ENVIRONMENT.PRODUCTION
        : PAYTECH_ENVIRONMENT.TEST,
    ipn_url: request.webhookUrl,
    success_url: request.returnUrl,
    cancel_url: request.cancelUrl,
    custom_field: request.metadata
      ? JSON.stringify(request.metadata)
      : undefined,
  };
}

/**
 * Maps Paytech's payment response to the unified PaymentResponse format
 *
 * @param response Paytech payment response
 * @returns Unified payment response
 */
export function mapFromPaytechResponse(
  response: PaytechPaymentResponse
): PaymentResponse {
  if (response.success === 1) {
    return {
      success: true,
      redirectUrl: response.redirect_url,
      token: response.token,
      paymentId: response.token, // Using token as paymentId
      status: TransactionStatus.PENDING,
      createdAt: new Date(),
    };
  } else {
    return {
      success: false,
      message: response.error || "Unknown error occurred",
      status: TransactionStatus.FAILED,
      createdAt: new Date(),
    };
  }
}

/**
 * Maps Paytech's payment status to the unified TransactionStatus
 *
 * @param statusResponse Paytech status response
 * @returns Unified transaction status
 */
export function mapPaytechStatus(
  statusResponse: PaytechStatusResponse
): TransactionStatus {
  if (!statusResponse.success) {
    return TransactionStatus.FAILED;
  }

  switch (statusResponse.status?.toLowerCase()) {
    case "completed":
    case "success":
      return TransactionStatus.COMPLETED;
    case "pending":
    case "waiting":
      return TransactionStatus.PENDING;
    case "canceled":
    case "cancelled":
      return TransactionStatus.CANCELED;
    case "refunded":
      return TransactionStatus.REFUNDED;
    default:
      return TransactionStatus.FAILED;
  }
}

/**
 * Maps Paytech's refund response to the unified RefundResponse format
 *
 * @param response Paytech refund response
 * @param requestedAmount The amount requested for refund
 * @returns Unified refund response
 */
export function mapFromPaytechRefundResponse(
  response: PaytechRefundResponse,
  requestedAmount?: number
): RefundResponse {
  if (response.success === 1) {
    return {
      success: true,
      refundId: response.refund_id,
      amount:
        requestedAmount ||
        (response.amount ? parseFloat(response.amount) : undefined),
      status: TransactionStatus.REFUNDED,
      createdAt: response.date ? new Date(response.date) : new Date(),
    };
  } else {
    return {
      success: false,
      message: response.error || "Refund failed",
      status: TransactionStatus.FAILED,
      createdAt: new Date(),
    };
  }
}

/**
 * Maps Paytech's webhook notification to the unified WebhookEvent format
 *
 * @param payload Paytech webhook payload
 * @returns Unified webhook event
 */
export function mapFromPaytechWebhook(
  payload: PaytechWebhookPayload
): WebhookEvent {
  // Determine event type
  let eventType: WebhookEventType;

  switch (payload.type) {
    case PAYTECH_WEBHOOK_EVENT.PAYMENT_SUCCESS:
      eventType = WebhookEventType.PAYMENT_SUCCESS;
      break;
    case PAYTECH_WEBHOOK_EVENT.PAYMENT_FAILED:
      eventType = WebhookEventType.PAYMENT_FAILED;
      break;
    case PAYTECH_WEBHOOK_EVENT.PAYMENT_CANCELED:
      eventType = WebhookEventType.PAYMENT_FAILED;
      break;
    case PAYTECH_WEBHOOK_EVENT.REFUND_SUCCESS:
      eventType = WebhookEventType.REFUND_SUCCESS;
      break;
    case PAYTECH_WEBHOOK_EVENT.REFUND_FAILED:
      eventType = WebhookEventType.REFUND_FAILED;
      break;
    default:
      eventType = WebhookEventType.PAYMENT_SUCCESS;
  }

  // Determine transaction status
  let status: TransactionStatus;

  switch (payload.status.toLowerCase()) {
    case "completed":
    case "success":
      status = TransactionStatus.COMPLETED;
      break;
    case "pending":
    case "waiting":
      status = TransactionStatus.PENDING;
      break;
    case "canceled":
    case "cancelled":
      status = TransactionStatus.CANCELED;
      break;
    case "refunded":
      status = TransactionStatus.REFUNDED;
      break;
    default:
      status = TransactionStatus.FAILED;
  }

  // Parse metadata if present
  let metadata = {};
  if (payload.custom_field) {
    try {
      metadata = JSON.parse(payload.custom_field);
    } catch (e) {
      console.log(e);
      // If custom_field is not valid JSON, use it as a string
      metadata = { raw: payload.custom_field };
    }
  }

  return {
    type: eventType,
    data: {
      reference: payload.ref_command,
      paymentId: payload.token,
      amount: parseFloat(payload.amount),
      currency: payload.currency,
      status: status,
      gatewayReference: payload.transaction_id,
      metadata: metadata,
      customerEmail: payload.customer_info?.email,
      customerName: payload.customer_info?.name,
      customerPhone: payload.customer_info?.phone,
    },
    createdAt: payload.date ? new Date(payload.date) : new Date(),
    gatewayName: "paytech",
  };
}
