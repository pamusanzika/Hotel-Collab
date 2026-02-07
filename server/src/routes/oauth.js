const { Router } = require('express');
const oauth = require('../controllers/oauthController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = Router();

// All OAuth routes require authenticated influencer
router.get('/:provider/start', authenticate, roleGuard('influencer'), oauth.startOAuth);
router.get('/:provider/callback', oauth.oauthCallback); // Callback is unauthenticated (redirect from provider)
router.delete('/:provider/unlink', authenticate, roleGuard('influencer'), oauth.unlinkPlatform);

module.exports = router;
