const Stripe = require('stripe');
const { STRIPE_SECRET_KEY } = require('../config/env');

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

async function confirmPaymentIntent(paymentIntentId) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

async function cancelPaymentIntent(paymentIntentId) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

async function refundPayment(paymentIntentId) {
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}

function constructWebhookEvent(payload, signature, secret) {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

module.exports = {
  stripe,
  createPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  refundPayment,
  constructWebhookEvent,
};
