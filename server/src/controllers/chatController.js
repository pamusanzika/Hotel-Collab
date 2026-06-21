const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name role')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          readBy: { $ne: req.user._id },
        });
        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const otherUser = await User.findById(participantId).select('role status');
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (otherUser.status === 'banned') {
      return res.status(400).json({ error: 'Cannot message this user' });
    }

    const myRole = req.user.role;
    const theirRole = otherUser.role;

    const validPair =
      (myRole === 'hotel_owner' && theirRole === 'influencer') ||
      (myRole === 'influencer' && theirRole === 'hotel_owner');

    if (!validPair) {
      return res.status(403).json({
        error: 'Messaging is only available between hotels and content creators.',
      });
    }

    const existing = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 },
    }).populate('participants', 'name role');

    if (existing) {
      return res.json({ conversation: existing, isNew: false });
    }

    const conversation = await Conversation.create({
      participants: [req.user._id, participantId],
    });

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'name role'
    );

    res.status(201).json({ conversation: populated, isNew: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 50 } = req.query;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const filter = { conversationId: id };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10), 100))
      .populate('senderId', 'name role')
      .lean();

    // Normalize so senderId is a plain string and senderRole is a top-level field
    const normalized = messages.reverse().map((msg) => ({
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId._id ? msg.senderId._id.toString() : msg.senderId.toString(),
      senderName: msg.senderId.name || '',
      senderRole: msg.senderId.role || '',
      text: msg.text,
      readBy: (msg.readBy || []).map((r) => r.toString()),
      createdAt: msg.createdAt,
    }));

    res.json({ messages: normalized });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    }).select('_id');

    const conversationIds = conversations.map((c) => c._id);

    const unreadCount = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      readBy: { $ne: req.user._id },
    });

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};
