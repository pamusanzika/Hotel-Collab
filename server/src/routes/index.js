const { Router } = require('express');
const authRoutes = require('./auth');
const oauthRoutes = require('./oauth');
const hotelRoutes = require('./hotels');
const adminRoutes = require('./admin');
const influencerRoutes = require('./influencer');
const hostRoutes = require('./hosts');
const influencerListingRoutes = require('./influencerListing');
const chatRoutes = require('./chat');
const ownerProfileRoutes = require('./ownerProfile');
const campaignRoutes = require('./campaigns');
const reviewRoutes = require('./reviews');
const contactRoutes = require('./contact');
const paymentRoutes = require('./payments');
const opportunityRoutes = require('./opportunities');

const router = Router();

router.use('/auth', authRoutes);
router.use('/oauth', oauthRoutes);
router.use('/hotels', hotelRoutes);
router.use('/admin', adminRoutes);
router.use('/influencer', influencerRoutes);
router.use('/owner', ownerProfileRoutes);
router.use('/hosts', hostRoutes);
router.use('/influencer-listing', influencerListingRoutes);
router.use('/chat', chatRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/reviews', reviewRoutes);
router.use('/contact', contactRoutes);
router.use('/payments', paymentRoutes);
router.use('/opportunities', opportunityRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
