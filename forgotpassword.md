# Forgot Password Feature

## Overview

Complete forgot password / reset password flow with real email delivery via **Nodemailer + Gmail SMTP**, with a dev-mode fallback that logs to the console when SMTP credentials are not configured.

---

## Files Created

| File | Purpose |
|------|---------|
| `server/src/models/PasswordResetToken.js` | Mongoose model for storing password reset tokens with 1-hour TTL and MongoDB auto-cleanup |
| `client/src/pages/ForgotPassword.js` | Frontend page where users enter their email to request a reset link |
| `client/src/pages/ResetPassword.js` | Frontend page where users set a new password using the token from the email link |

## Files Modified

| File | Change |
|------|--------|
| `server/src/services/emailService.js` | Added `sendPasswordResetEmail()`, integrated Nodemailer with Gmail SMTP, added HTML email templates for both verification and reset emails |
| `server/src/validators/authValidators.js` | Added `forgotPasswordSchema` and `resetPasswordSchema` (Zod) |
| `server/src/controllers/authController.js` | Added `forgotPassword` and `resetPassword` controller methods |
| `server/src/routes/auth.js` | Added `POST /forgot-password` and `POST /reset-password` routes |
| `server/src/config/env.js` | Added `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` environment variables |
| `client/src/pages/Login.js` | Added "Forgot password?" link below the password field |
| `client/src/App.js` | Registered `/forgot-password` and `/reset-password` routes |

---

## User Flow

1. User clicks **"Forgot password?"** on the Login page
2. Navigates to `/forgot-password` page
3. User enters their email and clicks **"Send Reset Link"**
4. Backend generates a secure token (32-byte random hex), stores it with 1-hour expiry, and sends an email with a reset link
5. User clicks the link in the email → navigates to `/reset-password?token=...`
6. User enters a new password + confirmation
7. Backend validates the token, hashes the new password, invalidates all sessions, and deletes the token
8. User sees a success message and clicks **"Go to Login"**

---

## API Endpoints

### POST `/api/auth/forgot-password`

**Body:**
```json
{ "email": "user@example.com" }
```

**Response (always 200):**
```json
{ "message": "If an account with that email exists, a password reset link has been sent." }
```

> Returns the same response regardless of whether the email exists (prevents email enumeration).

### POST `/api/auth/reset-password`

**Body:**
```json
{ "token": "abc123...", "password": "newpassword123" }
```

**Success Response (200):**
```json
{ "message": "Password reset successful. Please log in with your new password." }
```

**Error Response (400):**
```json
{ "error": "Invalid or expired reset token" }
```

---

## Email Setup (Gmail SMTP)

### Environment Variables

Add these to `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=yourgmail@gmail.com
```

### How to Get a Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Create a new app password (e.g. name it "Influspark")
5. Copy the 16-character code (without spaces)
6. Use it as `SMTP_PASS`

> **Important:** Your regular Gmail password will NOT work. You must use an App Password.

### Dev Mode (No SMTP Credentials)

When `SMTP_USER` and `SMTP_PASS` are empty, the service falls back to logging the reset URL to the server console:

```
[DEV] Password reset email for user@example.com: http://localhost:3000/reset-password?token=abc123...
```

---

## Security Features

| Feature | Details |
|---------|---------|
| **No email enumeration** | Same response returned whether email exists or not |
| **Token expiry** | Reset tokens expire after 1 hour |
| **Auto-cleanup** | MongoDB TTL index automatically deletes expired tokens |
| **Single-use tokens** | All tokens for the user are deleted after successful reset |
| **Old tokens invalidated** | When a new reset is requested, previous tokens are deleted first |
| **Session invalidation** | User's `refreshToken` is set to `null` on password reset, forcing re-login on all devices |
| **Rate limiting** | Covered by existing auth rate limiter (20 requests / 15 minutes) |
| **Input validation** | Zod schemas validate email format and password length (8-128 chars) |
| **Password hashing** | bcrypt with 12 salt rounds (same as registration) |

---

## PasswordResetToken Model

```javascript
{
  userId: ObjectId,     // Reference to User
  token: String,        // 32-byte random hex (unique)
  expiresAt: Date,      // 1 hour from creation
  createdAt: Date       // Auto-set
}
```

MongoDB TTL index on `expiresAt` ensures automatic cleanup of expired tokens.

---

## Frontend Pages

### ForgotPassword (`/forgot-password`)

- Email input form
- Calls `POST /api/auth/forgot-password`
- Shows success/error message
- "Back to Login" link

### ResetPassword (`/reset-password?token=...`)

- Reads `token` from URL query params
- Three states:
  - **No token** → shows "Invalid Link" with "Request a New Link" button
  - **Form** → new password + confirm password fields
  - **Success** → "Password Reset!" with "Go to Login" button
- Client-side validation: password match + minimum 8 characters
- Calls `POST /api/auth/reset-password`

### Login (`/login`)

- Added "Forgot password?" link below the password field
- Navigates to `/forgot-password`

---

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemailer` | latest | SMTP email sending |
