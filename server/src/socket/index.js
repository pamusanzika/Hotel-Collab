const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_ACCESS_SECRET, CLIENT_URL } = require('../config/env');
const User = require('../models/User');
const { handleChatEvents } = require('./chatHandler');

let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:3000', CLIENT_URL],
      credentials: true,
    },
  });

  // JWT authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.sub).select('-passwordHash -refreshToken');
      if (!user) return next(new Error('User not found'));
      if (user.status === 'banned') return next(new Error('Account is banned'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a personal room keyed by user ID for targeted messages
    socket.join(socket.user._id.toString());
    handleChatEvents(io, socket);
  });
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initializeSocket, getIO };
