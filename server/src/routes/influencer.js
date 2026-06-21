const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const influencer = require('../controllers/influencerController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = Router();

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('Only JPEG, PNG, and WebP images are allowed'), ext && mime);
  },
});

// Portfolio upload config
const portfolioStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/portfolios'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const portfolioUpload = multer({
  storage: portfolioStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|mov|avi|webm|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf',
    ];
    const mime = allowedMimes.includes(file.mimetype);
    cb(ext && mime ? null : new Error('Unsupported file type'), ext && mime);
  },
});

router.use(authenticate, roleGuard('influencer'));

router.get('/profile', influencer.getProfile);
router.put('/profile', influencer.updateProfile);
router.post('/avatar', upload.single('avatar'), influencer.uploadAvatar);
router.delete('/avatar', influencer.deleteAvatar);
router.post('/portfolio', portfolioUpload.array('files', 10), influencer.uploadPortfolio);
router.delete('/portfolio/:itemId', influencer.deletePortfolioItem);
router.put('/portfolio/:itemId', influencer.updatePortfolioItem);

module.exports = router;
