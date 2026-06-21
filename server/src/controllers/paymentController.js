const Payment = require('../models/Payment');
const Campaign = require('../models/Campaign');
const Hotel = require('../models/Hotel');
const { createPaymentIntent, cancelPaymentIntent, refundPayment } = require('../services/stripeService');
const { sendCampaignNotification } = require('./campaignController');

exports.createCampaignPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId).populate('hotelId', 'ownerId name');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.campaignType !== 'paid_collaboration') {
      return res.status(400).json({ error: 'Payment only applies to paid collaborations' });
    }

    if (!campaign.amount || campaign.amount <= 0) {
      return res.status(400).json({ error: 'Campaign has no payment amount set' });
    }

    // Only the payer (hotel owner) can initiate payment when approving
    const isOwner = campaign.hotelId?.ownerId?.toString() === userId.toString();
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the hotel owner can make payments' });
    }

    if (campaign.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Check for existing payment intent and verify it's still usable
    const existingPayment = await Payment.findOne({
      campaignId: campaign._id,
      status: { $in: ['pending', 'requires_payment', 'processing'] },
    });
    if (existingPayment) {
      try {
        const { confirmPaymentIntent } = require('../services/stripeService');
        const pi = await confirmPaymentIntent(existingPayment.stripePaymentIntentId);
        if (pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation') {
          return res.json({
            clientSecret: existingPayment.stripeClientSecret,
            paymentId: existingPayment._id,
          });
        }
        if (pi.status === 'succeeded') {
          existingPayment.status = 'succeeded';
          await existingPayment.save();
          campaign.paymentStatus = 'paid';
          campaign.status = 'upcoming';
          await campaign.save();
          return res.status(400).json({ error: 'Payment already completed' });
        }
        // Stale/cancelled — mark old payment and create new one
        existingPayment.status = 'failed';
        existingPayment.failureReason = `Stripe status: ${pi.status}`;
        await existingPayment.save();
      } catch (stripeErr) {
        existingPayment.status = 'failed';
        existingPayment.failureReason = stripeErr.message;
        await existingPayment.save();
      }
    }

    const paymentIntent = await createPaymentIntent({
      amount: campaign.amount,
      metadata: {
        campaignId: campaign._id.toString(),
        payerId: userId.toString(),
        recipientId: campaign.influencerId.toString(),
      },
    });

    const payment = await Payment.create({
      campaignId: campaign._id,
      payerId: userId,
      recipientId: campaign.influencerId,
      amount: campaign.amount,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      status: 'requires_payment',
    });

    campaign.paymentStatus = 'requires_payment';
    campaign.paymentId = payment._id;
    await campaign.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const payment = await Payment.findOne({ campaignId }).sort({ createdAt: -1 }).lean();
    if (!payment) {
      return res.json({ payment: null });
    }
    res.json({
      payment: {
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

exports.refundCampaignPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId).populate('hotelId', 'ownerId');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const isOwner = campaign.hotelId?.ownerId?.toString() === userId.toString();
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the hotel owner can request refunds' });
    }

    const payment = await Payment.findOne({ campaignId: campaign._id, status: 'succeeded' });
    if (!payment) {
      return res.status(400).json({ error: 'No successful payment to refund' });
    }

    const refund = await refundPayment(payment.stripePaymentIntentId);
    payment.status = 'refunded';
    payment.refundId = refund.id;
    await payment.save();

    campaign.paymentStatus = 'refunded';
    await campaign.save();

    res.json({ message: 'Payment refunded successfully' });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
};

exports.getStripeConfig = async (req, res) => {
  const { STRIPE_PUBLISHABLE_KEY } = require('../config/env');
  res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
};
