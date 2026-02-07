const { z } = require('zod');

const inviteAdminSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

const setupAdminPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  name: z.string().min(2).max(100).trim(),
  password: z.string().min(8).max(128),
});

module.exports = { inviteAdminSchema, setupAdminPasswordSchema };
