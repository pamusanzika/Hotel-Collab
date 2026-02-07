const { Router } = require('express');
const auth = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidators');

const router = Router();

router.post('/register', validate(registerSchema), auth.register);
router.get('/verify-email', auth.verifyEmail);
router.post('/login', validate(loginSchema), auth.login);
router.post('/refresh', validate(refreshSchema), auth.refresh);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.me);

// Password reset
router.post('/forgot-password', validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), auth.resetPassword);

module.exports = router;
