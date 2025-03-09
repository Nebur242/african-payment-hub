# Paytech Integration Guide

This guide covers how to integrate Paytech payment gateway using the Multi-Payment Gateway package.

## Overview

[Paytech](https://paytech.sn) is a payment service provider that allows merchants to process online payments in multiple currencies with a focus on West African markets.

## Prerequisites

Before you begin, you'll need:

1. A Paytech merchant account
2. API Key and API Secret from your Paytech dashboard
3. Multi-Payment Gateway package installed in your project

## Configuration

To use Paytech with the Multi-Payment Gateway package, you need to initialize it with your credentials:

```typescript
import MultiPaymentGateway, { PaymentProvider } from "multi-payment-gateway";

await MultiPaymentGateway.initialize(PaymentProvider.PAYTECH, {
  apiKey: "your_paytech_api_key",
  apiSecret: "your_paytech_api_secret",
  environment: "test", // Use 'production' for live payments
  webhookSecret: "your_webhook_secret", // Optional, but recommended for security
  additionalConfig: {
    // Optional Paytech-specific settings
    timeout: 15000, // Request timeout in milliseconds
    defaultIpnUrl: "https://yoursite.com/api/webhooks/paytech",
    defaultSuccessUrl: "https://yoursite.com/payment/success",
    defaultCancelUrl: "https://yoursite.com/payment/cancel",
  },
});
```

## Creating a Payment

To create a payment request with Paytech:

```typescript
const paymentResult = await MultiPaymentGateway.createPayment({
  amount: 5000, // Amount in the smallest currency unit (e.g., 5000 XOF = 5,000 FCFA)
  currency: "XOF", // Supported currencies: XOF, EUR, USD, CAD, GBP, MAD
  reference: "order-123", // Your unique order reference
  description: "Order #123 - Premium Package",
  customerEmail: "customer@example.com", // Optional
  customerName: "John Doe", // Optional
  customerPhone: "+221700000000", // Optional
  metadata: {
    // Optional additional data
    orderId: "order-123",
    productId: "premium-package",
  },
  returnUrl: "https://yoursite.com/payment/success", // Redirect after successful payment
  cancelUrl: "https://yoursite.com/payment/cancel", // Redirect after canceled payment
  webhookUrl: "https://yoursite.com/api/webhooks/paytech", // For payment notifications
});

if (paymentResult.success) {
  // Redirect the customer to the payment page
  redirectToUrl(paymentResult.redirectUrl);

  // Store the payment ID for later reference
  const paymentId = paymentResult.paymentId;
} else {
  // Handle the error
  console.error("Payment creation failed:", paymentResult.message);
}
```

## Verifying Payment Status

To check the status of a payment:

```typescript
const status = await MultiPaymentGateway.verifyPayment(paymentId);

if (status === TransactionStatus.COMPLETED) {
  // Payment was successful
  // Update your database, fulfill the order, etc.
} else if (status === TransactionStatus.PENDING) {
  // Payment is still pending
} else {
  // Payment failed or was canceled
}
```

## Processing Refunds

To refund a payment:

```typescript
// Full refund
const refundResult = await MultiPaymentGateway.refundPayment(paymentId);

// Partial refund
const partialRefundResult = await MultiPaymentGateway.refundPayment(
  paymentId,
  1000
); // Refund 1,000 XOF

if (refundResult.success) {
  console.log("Refund processed successfully");
  console.log("Refund ID:", refundResult.refundId);
} else {
  console.error("Refund failed:", refundResult.message);
}
```

## Handling Webhooks

Paytech sends webhook notifications to inform your application about payment events. Here's how to set up webhook handling:

```typescript
// Express example
app.post("/api/webhooks/paytech", async (req, res) => {
  try {
    // 1. Validate the webhook
    const validationResult = await MultiPaymentGateway.validateWebhook(
      req.body,
      req.headers
    );

    if (!validationResult.isValid) {
      return res.status(400).json({ error: "Invalid webhook" });
    }

    // 2. Process the webhook
    const event = await MultiPaymentGateway.processWebhook(req.body);

    // 3. Handle different event types
    switch (event.type) {
      case WebhookEventType.PAYMENT_SUCCESS:
        // Update order status in database
        await updateOrderStatus(event.data.reference, "paid");
        break;

      case WebhookEventType.PAYMENT_FAILED:
        await updateOrderStatus(event.data.reference, "failed");
        break;

      case WebhookEventType.REFUND_SUCCESS:
        await processRefundInDatabase(event.data.paymentId);
        break;
    }

    // 4. Acknowledge receipt
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Securing Webhooks

To enhance security, you should set a webhook secret in your Paytech dashboard (if supported) and provide the same secret during gateway initialization. This allows the package to validate that webhooks are actually coming from Paytech.

## Supported Currencies

Paytech supports the following currencies:

- XOF (West African CFA franc)
- EUR (Euro)
- USD (US Dollar)
- CAD (Canadian Dollar)
- GBP (British Pound)
- MAD (Moroccan Dirham)

## Testing

Paytech provides a sandbox environment for testing. Use `environment: 'test'` during initialization to use the sandbox.

For testing, you can use the following test card:

- Card Number: 5555 5555 5555 4444
- Expiry Date: Any future date
- CVV: Any 3 digits

## Troubleshooting

### Common Issues

1. **Payment creation fails**

   - Check that your API Key and API Secret are correct
   - Ensure you're using a supported currency
   - Verify that your amount is valid (greater than zero)

2. **Webhook validation fails**

   - Verify that the webhook secret matches what you configured in Paytech
   - Check that your webhook endpoint is accessible from the internet
   - Ensure you're passing all request headers to the validateWebhook method

3. **Refund fails**
   - Ensure the payment was completed successfully before attempting a refund
   - Check that you're not trying to refund more than the original payment amount
   - Verify the payment is not already fully refunded

### Debugging

For debugging purposes, you can enable more detailed logging:

```typescript
// Enable debug logging
process.env.DEBUG = "multi-payment-gateway:paytech";
```

## Additional Resources

- [Paytech API Documentation](https://paytech.sn/api-docs)
- [Paytech Dashboard](https://paytech.sn/dashboard)
- [Multi-Payment Gateway Documentation](../../README.md)
