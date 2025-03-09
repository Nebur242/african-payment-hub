# Multi-Payment Gateway

[![npm version](https://img.shields.io/npm/v/multi-payment-gateway.svg)](https://www.npmjs.com/package/multi-payment-gateway)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/yourusername/multi-payment-gateway/actions/workflows/test.yml/badge.svg)](https://github.com/yourusername/multi-payment-gateway/actions)

A unified interface for multiple payment gateways in Node.js, written in TypeScript.

## Features

- 🏦 **Multi-Gateway Support**: Integrate with popular payment gateways through a single package.
- 🔄 **Unified API**: Use a common interface for all payment services.
- 💰 **Transaction Management**: Process payments, refunds, and subscriptions easily.
- 📈 **Logging & Monitoring**: Keep track of payment activities.
- ⚡ **Extensibility**: Add new gateways with minimal effort.

## Supported Payment Gateways

- [Paytech](https://paytech.sn)
- Cinetpay (coming soon)
- Money Fusion (coming soon)

## Installation

```bash
npm install multi-payment-gateway
```

## Quick Start

```typescript
import MultiPaymentGateway, { PaymentProvider } from "multi-payment-gateway";

// Initialize the gateway
await MultiPaymentGateway.initialize(PaymentProvider.PAYTECH, {
  apiKey: "your_api_key",
  apiSecret: "your_api_secret",
  environment: "test", // Use 'production' for live payments
});

// Create a payment
const paymentResult = await MultiPaymentGateway.createPayment({
  amount: 5000,
  currency: "XOF",
  reference: "order-123",
  description: "Order #123",
  customerEmail: "customer@example.com",
  returnUrl: "https://yoursite.com/success",
  cancelUrl: "https://yoursite.com/cancel",
  webhookUrl: "https://yoursite.com/webhook",
});

if (paymentResult.success) {
  // Redirect the customer to complete payment
  console.log(`Redirect to: ${paymentResult.redirectUrl}`);
}
```

## Handling Webhooks

```typescript
app.post("/webhook", async (req, res) => {
  // Validate webhook
  const validation = await MultiPaymentGateway.validateWebhook(
    req.body,
    req.headers
  );

  if (validation.isValid) {
    // Process the webhook
    const event = await MultiPaymentGateway.processWebhook(req.body);

    // Handle the event based on its type
    if (event.type === "payment.success") {
      // Update your database, fulfill order, etc.
    }

    // Acknowledge receipt
    res.status(200).send("OK");
  } else {
    res.status(400).send("Invalid webhook");
  }
});
```

## Documentation

Detailed documentation can be found in the [docs](./docs) directory:

- [Getting Started](./docs/guides/getting-started.md)
- [API Reference](./docs/api/index.html)
- Provider Guides:
  - [Paytech](./docs/guides/providers/paytech.md)
  - [Cinetpay](./docs/guides/providers/cinetpay.md)
  - [Money Fusion](./docs/guides/providers/moneyfusion.md)
- [Webhook Handling](./docs/guides/webhooks.md)

## Development

### Prerequisites

- Node.js 14+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/multi-payment-gateway.git
cd multi-payment-gateway

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
