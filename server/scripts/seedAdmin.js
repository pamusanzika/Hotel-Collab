/**
 * Seeds an admin user into the database.
 * Usage: node scripts/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MONGO_URI } = require('../src/config/env');
const User = require('../src/models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@influspark.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Pamuda2003';
const ADMIN_NAME = 'Platform Admin';

(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
  });

  console.log(`Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
})();
