const { Router } = require('express');
const payments = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = Router();

router.get('/config', payments.getStripeConfig);

router.use(authenticate, roleGuard('hotel_owner', 'influencer'));

router.post('/campaigns/:campaignId', payments.createCampaignPayment);
router.get('/campaigns/:campaignId', payments.getPaymentStatus);
router.post('/campaigns/:campaignId/refund', payments.refundCampaignPayment);

module.exports = router;
