const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const opp = require('../controllers/opportunityController');
const authenticate = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const {
  createOpportunitySchema,
  updateOpportunitySchema,
  applyOpportunitySchema,
} = require('../validators/opportunityValidators');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/opportunities'),
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

const router = Router();

router.get('/browse', authenticate, opp.browse);
router.post('/:id/apply', authenticate, roleGuard('influencer'), validate(applyOpportunitySchema), opp.apply);
router.get('/:id', authenticate, opp.getById);

router.use(authenticate, roleGuard('hotel_owner'));

router.post('/', upload.array('images', 5), opp.create);
router.get('/', opp.getMyOpportunities);
router.put('/:id', upload.array('images', 5), opp.update);
router.delete('/:id', opp.remove);
router.patch('/:id/applicants/:applicantId', opp.handleApplicant);

module.exports = router;
