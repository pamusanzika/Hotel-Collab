const { Router } = require('express');
const reviews = require('../controllers/reviewController');
const authenticate = require('../middleware/auth');

const router = Router();

// Get reviews for any user (authenticated)
router.get('/user/:userId', authenticate, reviews.getByUser);

module.exports = router;
