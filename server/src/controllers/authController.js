const bcrypt = require('bcrypt');
const User = require('../models/User');
const HotelOwnerProfile = require('../models/HotelOwnerProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/tokenService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const PasswordResetToken = require('../models/PasswordResetToken');

const SALT_ROUNDS = 12;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      status: 'pending_verification',
    });

    // Create role-specific profile
    if (role === 'hotel_owner') {
      await HotelOwnerProfile.create({ userId: user._id });
    } else if (role === 'influencer') {
      await InfluencerProfile.create({ userId: user._id });
    }

    await sendVerificationEmail(user);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      userId: user._id,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const record = await EmailVerificationToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    await User.findByIdAndUpdate(record.userId, {
      isEmailVerified: true,
      status: 'active',
    });
    await EmailVerificationToken.deleteMany({ userId: record.userId });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Account is banned' });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.sub);
    if (!user || user.refreshToken !== refreshToken || user.status === 'banned') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

exports.me = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      isEmailVerified: req.user.isEmailVerified,
    },
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return the same response to prevent email enumeration
    const user = await User.findOne({ email });
    if (user) {
      await sendPasswordResetEmail(user);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Password reset request failed' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const record = await PasswordResetToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password and invalidate sessions
    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user.refreshToken = null;
    await user.save();

    // Delete all reset tokens for this user (single-use)
    await PasswordResetToken.deleteMany({ userId: record.userId });

    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
};
