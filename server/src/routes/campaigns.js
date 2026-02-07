const { Router } = require('express');
const campaigns = require('../controllers/campaignController');
const reviews = require('../controllers/reviewController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const {
  createCampaignSchema,
  updateCampaignStatusSchema,
  createReviewSchema,
} = require('../validators/campaignValidators');

const router = Router();

router.use(authenticate, roleGuard('hotel_owner', 'influencer'));

// Campaign CRUD
router.post('/', validate(createCampaignSchema), campaigns.create);
router.get('/', campaigns.listMine);
router.get('/stats', campaigns.getStats);
router.get('/:id', campaigns.getById);
router.patch('/:id/status', validate(updateCampaignStatusSchema), campaigns.updateStatus);

// Reviews (nested under campaigns)
router.post('/:id/reviews', validate(createReviewSchema), reviews.create);
router.get('/:id/reviews', reviews.getByCampaign);

module.exports = router;
