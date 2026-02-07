const { Router } = require('express');
const chat = require('../controllers/chatController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const { createConversationSchema } = require('../validators/chatValidators');

const router = Router();

router.use(authenticate, roleGuard('hotel_owner', 'influencer'));

router.get('/conversations', chat.getConversations);
router.post('/conversations', validate(createConversationSchema), chat.createConversation);
router.get('/conversations/:id/messages', chat.getMessages);
router.get('/unread-count', chat.getUnreadCount);

module.exports = router;
