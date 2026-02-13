const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { CLIENT_URL, EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = require('../config/env');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const AdminInviteToken = require('../models/AdminInviteToken');

// Create reusable transporter (falls back to console log when SMTP creds missing)
let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

const sendMail = async ({ to, subject, html }) => {
  if (transporter) {
    await transporter.sendMail({ from: `Influspark <${EMAIL_FROM}>`, to, subject, html });
  } else {
    console.log(`[DEV] Email to ${to} | Subject: ${subject}`);
  }
};

/**
 * Generates a verification token, stores it, and sends a verification email.
 */
const sendVerificationEmail = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await EmailVerificationToken.create({
    userId: user._id,
    token,
    expiresAt,
  });

  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;

  await sendMail({
    to: user.email,
    subject: 'Verify your email - Influspark',
    html: `
      <h2>Welcome to Influspark!</h2>
      <p>Hi ${user.name},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#14B8A6;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  if (!transporter) {
    console.log(`[DEV] Verification email for ${user.email}: ${verifyUrl}`);
  }

  return { token, verifyUrl };
};

/**
 * Generates a password-reset token, stores it, and sends a reset email.
 */
const sendPasswordResetEmail = async (user) => {
  // Delete any existing reset tokens for this user (single-use enforcement)
  await PasswordResetToken.deleteMany({ userId: user._id });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({
    userId: user._id,
    token,
    expiresAt,
  });

  const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: 'Reset your password - Influspark',
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#14B8A6;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (!transporter) {
    console.log(`[DEV] Password reset email for ${user.email}: ${resetUrl}`);
  }

  return { token, resetUrl };
};

/**
 * Generates an invite token, stores it, and sends an admin invitation email.
 */
const sendAdminInviteEmail = async (user, invitedByUserId) => {
  // Delete any existing invite tokens for this user (single-use enforcement)
  await AdminInviteToken.deleteMany({ userId: user._id });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await AdminInviteToken.create({
    userId: user._id,
    token,
    invitedBy: invitedByUserId,
    expiresAt,
  });

  const setupUrl = `${CLIENT_URL}/admin/setup-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: 'You have been invited as an Admin - Influspark',
    html: `
      <h2>Admin Invitation</h2>
      <p>Hi there,</p>
      <p>You have been invited to join Influspark as an administrator.</p>
      <p>Click the link below to set up your account:</p>
      <p><a href="${setupUrl}" style="display:inline-block;padding:12px 24px;background:#14B8A6;color:#fff;text-decoration:none;border-radius:6px;">Set Up Your Account</a></p>
      <p>Or copy this link: ${setupUrl}</p>
      <p>This link expires in 48 hours.</p>
    `,
  });

  if (!transporter) {
    console.log(`[DEV] Admin invite email for ${user.email}: ${setupUrl}`);
  }

  return { token, setupUrl };
};

/**
 * Sends a contact-form submission to all active admin users.
 */
const sendContactFormEmail = async ({ fullName, email, phone, message }, adminEmails) => {
  if (!adminEmails.length) {
    console.log('[WARN] No admin emails found – contact form submission not delivered.');
    return;
  }

  const phoneRow = phone
    ? `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;">Phone</td><td style="padding:8px 12px;color:#1F2937;">${phone}</td></tr>`
    : '';

  const html = `
    <h2>New Contact Form Submission</h2>
    <table style="border-collapse:collapse;width:100%;max-width:560px;">
      <tr><td style="padding:8px 12px;font-weight:600;color:#374151;">Name</td><td style="padding:8px 12px;color:#1F2937;">${fullName}</td></tr>
      <tr style="background:#F9FAFB;"><td style="padding:8px 12px;font-weight:600;color:#374151;">Email</td><td style="padding:8px 12px;color:#1F2937;"><a href="mailto:${email}">${email}</a></td></tr>
      ${phoneRow}
      <tr style="background:#F9FAFB;"><td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;">Message</td><td style="padding:8px 12px;color:#1F2937;white-space:pre-line;">${message}</td></tr>
    </table>
    <hr style="margin:24px 0;border:none;border-top:1px solid #E5E7EB;" />
    <p style="font-size:12px;color:#9CA3AF;">This message was sent via the Influspark contact form.</p>
  `;

  await sendMail({
    to: adminEmails.join(','),
    subject: `Contact Form from ${fullName}`,
    html,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendAdminInviteEmail, sendContactFormEmail };
