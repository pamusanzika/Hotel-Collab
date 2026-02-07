const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const hotels = require('../controllers/hotelController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const router = Router();

// Multer config for hotel image uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/hotels'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('Only JPEG, PNG, and WebP images are allowed'), ext && mime);
  },
});

router.use(authenticate, roleGuard('hotel_owner'));

router.post('/', upload.array('images', 5), hotels.create);
router.get('/', hotels.listMine);
router.get('/:id', hotels.getById);
router.put('/:id', upload.array('images', 5), hotels.update);
router.delete('/:id', hotels.remove);

module.exports = router;
