const { z } = require('zod');

const contactFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().max(30).optional().default(''),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(500),
});

module.exports = { contactFormSchema };
