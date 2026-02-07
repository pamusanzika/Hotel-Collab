const { Router } = require('express');
const hosts = require('../controllers/hostController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = Router();

router.use(authenticate, roleGuard('influencer'));

router.get('/', hosts.listAll);
router.get('/:id', hosts.getById);

module.exports = router;
