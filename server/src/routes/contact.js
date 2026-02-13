const { Router } = require('express');
const validate = require('../middleware/validate');
const { contactFormSchema } = require('../validators/contactValidators');
const { submitContactForm } = require('../controllers/contactController');

const router = Router();

router.post('/', validate(contactFormSchema), submitContactForm);

module.exports = router;
