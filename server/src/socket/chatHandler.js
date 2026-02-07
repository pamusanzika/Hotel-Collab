const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const handleChatEvents = (io, socket) => {
  // Send a message
  socket.on('sendMessage', async ({ conversationId, text }, callback) => {
    try {
      if (!conversationId || !text || !text.trim()) {
        return callback?.({ error: 'conversationId and text are required' });
      }

      const trimmedText = text.trim().slice(0, 2000);

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return callback?.({ error: 'Conversation not found' });
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === socket.user._id.toString()
      );
      if (!isParticipant) {
        return callback?.({ error: 'Not a participant' });
      }

      // Re-check banned status (could have been banned since connection)
      const freshUser = await User.findById(socket.user._id).select('status');
      if (freshUser.status === 'banned') {
        return callback?.({ error: 'Account is banned' });
      }

      const message = await Message.create({
        conversationId,
        senderId: socket.user._id,
        text: trimmedText,
        readBy: [socket.user._id],
      });

      // Update conversation's lastMessage
      conversation.lastMessage = {
        text: trimmedText,
        senderId: socket.user._id,
        createdAt: message.createdAt,
      };
      await conversation.save();

      const messageData = {
        _id: message._id.toString(),
        conversationId: conversationId.toString(),
        senderId: socket.user._id.toString(),
        senderName: socket.user.name,
        senderRole: socket.user.role,
        text: trimmedText,
        readBy: message.readBy.map((id) => id.toString()),
        createdAt: message.createdAt,
      };

      // Emit to all participants
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit('newMessage', messageData);
      });

      callback?.({ success: true, message: messageData });
    } catch (err) {
      callback?.({ error: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('markAsRead', async ({ conversationId }, callback) => {
    try {
      if (!conversationId) return callback?.({ error: 'conversationId required' });

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return callback?.({ error: 'Conversation not found' });

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === socket.user._id.toString()
      );
      if (!isParticipant) return callback?.({ error: 'Not a participant' });

      await Message.updateMany(
        {
          conversationId,
          readBy: { $ne: socket.user._id },
        },
        { $addToSet: { readBy: socket.user._id } }
      );

      // Notify the other participant that messages were read
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== socket.user._id.toString()
      );
      if (otherParticipant) {
        io.to(otherParticipant.toString()).emit('messagesRead', {
          conversationId: conversationId.toString(),
          readBy: socket.user._id.toString(),
        });
      }

      callback?.({ success: true });
    } catch (err) {
      callback?.({ error: 'Failed to mark as read' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, isTyping }) => {
    if (!conversationId) return;

    Conversation.findById(conversationId).then((conversation) => {
      if (!conversation) return;
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== socket.user._id.toString()
      );
      if (otherParticipant) {
        io.to(otherParticipant.toString()).emit('userTyping', {
          conversationId,
          userId: socket.user._id,
          isTyping,
        });
      }
    });
  });
};

module.exports = { handleChatEvents };
