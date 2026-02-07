const { Router } = require('express');
const ownerProfile = require('../controllers/ownerProfileController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = Router();

router.use(authenticate, roleGuard('hotel_owner'));

router.get('/profile', ownerProfile.getProfile);
router.put('/profile', ownerProfile.updateProfile);

module.exports = router;
