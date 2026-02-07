const { Router } = require('express');
const admin = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const { inviteAdminSchema, setupAdminPasswordSchema } = require('../validators/adminValidators');

const router = Router();

// Public route — invited admin sets up their password (no auth required)
router.post('/setup-password', validate(setupAdminPasswordSchema), admin.setupAdminPassword);

// Protected admin routes
router.use(authenticate, roleGuard('admin'));

router.get('/stats', admin.getStats);
router.get('/users', admin.listUsers);
router.get('/users/:id', admin.getUserById);
router.post('/users/:id/ban', admin.banUser);
router.post('/users/:id/unban', admin.unbanUser);
router.post('/invite', validate(inviteAdminSchema), admin.inviteAdmin);
router.get('/invites', admin.listPendingInvites);
router.get('/admins', admin.listAdmins);
router.delete('/admins/:id', admin.removeAdmin);

router.get('/campaigns', admin.listCampaigns);
router.get('/campaigns/:id', admin.getCampaignById);

module.exports = router;
