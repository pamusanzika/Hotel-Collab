const Payment = require('../models/Payment');
const Campaign = require('../models/Campaign');
const { constructWebhookEvent } = require('../services/stripeService');
const { STRIPE_WEBHOOK_SECRET } = require('../config/env');

exports.handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (payment) {
          payment.status = 'succeeded';
          await payment.save();

          const campaign = await Campaign.findById(payment.campaignId);
          if (campaign) {
            campaign.paymentStatus = 'paid';
            campaign.status = 'upcoming';
            await campaign.save();
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (payment) {
          payment.status = 'failed';
          payment.failureReason = pi.last_payment_error?.message || 'Payment failed';
          await payment.save();

          const campaign = await Campaign.findById(payment.campaignId);
          if (campaign) {
            campaign.paymentStatus = 'failed';
            await campaign.save();
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const piId = charge.payment_intent;
        const payment = await Payment.findOne({ stripePaymentIntentId: piId });
        if (payment && payment.status !== 'refunded') {
          payment.status = 'refunded';
          await payment.save();

          const campaign = await Campaign.findById(payment.campaignId);
          if (campaign) {
            campaign.paymentStatus = 'refunded';
            await campaign.save();
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ received: true });
};
