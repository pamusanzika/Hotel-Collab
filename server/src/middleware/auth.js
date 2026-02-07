const jwt = require('jsonwebtoken');
const { JWT_ACCESS_SECRET } = require('../config/env');
const User = require('../models/User');

/**
 * Verifies JWT access token and attaches user to req.
 * Rejects banned users.
 */
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.sub).select('-passwordHash -refreshToken');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Account is banned' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
