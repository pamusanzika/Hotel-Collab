const { Router } = require('express');
const listing = require('../controllers/influencerListingController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = Router();

router.use(authenticate, roleGuard('hotel_owner'));

router.get('/', listing.listAll);
router.get('/:id', listing.getById);

module.exports = router;
