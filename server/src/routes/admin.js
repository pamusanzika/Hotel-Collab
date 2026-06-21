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
router.get('/payments', admin.listPayments);

router.get('/opportunities', admin.listOpportunities);
router.get('/opportunities/:id', admin.getOpportunityById);
router.post('/opportunities/:id/ban', admin.banOpportunity);
router.post('/opportunities/:id/unban', admin.unbanOpportunity);

module.exports = router;
