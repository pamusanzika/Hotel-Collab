const Review = require('../models/Review');
const Campaign = require('../models/Campaign');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIO } = require('../socket');

async function sendReviewNotification(senderId, recipientId, text) {
  const io = getIO();

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, recipientId],
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    text,
    readBy: [senderId],
  });

  conversation.lastMessage = {
    text,
    senderId,
    createdAt: message.createdAt,
  };
  await conversation.save();

  const sender = await User.findById(senderId).select('name role').lean();

  const messageData = {
    _id: message._id.toString(),
    conversationId: conversation._id.toString(),
    senderId: senderId.toString(),
    senderName: sender?.name || '',
    senderRole: sender?.role || '',
    text,
    readBy: message.readBy.map((id) => id.toString()),
    createdAt: message.createdAt,
  };

  [senderId, recipientId].forEach((uid) => {
    io.to(uid.toString()).emit('newMessage', messageData);
  });
}

exports.create = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { rating, comment } = req.body;
    const campaignId = req.params.id;

    const campaign = await Campaign.findById(campaignId).populate('hotelId', 'ownerId name');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'done') {
      return res.status(400).json({ error: 'Reviews can only be left for completed campaigns' });
    }

    // Verify user is a participant
    const isInfluencer = campaign.influencerId.toString() === userId.toString();
    const isOwner =
      role === 'hotel_owner' && campaign.hotelId?.ownerId?.toString() === userId.toString();

    if (!isInfluencer && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to review this campaign' });
    }

    // Check for existing review
    const existing = await Review.findOne({ campaignId, reviewerId: userId });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this campaign' });
    }

    // Determine reviewee
    let revieweeId;
    if (isOwner) {
      revieweeId = campaign.influencerId;
    } else {
      revieweeId = campaign.hotelId.ownerId;
    }

    const review = await Review.create({
      campaignId,
      reviewerId: userId,
      revieweeId,
      reviewerRole: role,
      rating,
      comment,
    });

    // Notify the other party
    const notifText = `A review has been submitted for campaign "${campaign.title}".`;
    try {
      await sendReviewNotification(userId, revieweeId, notifText);
    } catch (_) {
      // Notification failure is non-critical
    }

    // Socket event
    try {
      const io = getIO();
      io.to(revieweeId.toString()).emit('reviewCreated', {
        campaignId: campaignId.toString(),
        reviewerId: userId.toString(),
      });
    } catch (_) {
      // Socket not critical
    }

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create review' });
  }
};

exports.getByCampaign = async (req, res) => {
  try {
    const reviews = await Review.find({ campaignId: req.params.id })
      .populate('reviewerId', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name role')
      .populate('campaignId', 'title campaignType')
      .sort({ createdAt: -1 })
      .lean();

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

    res.json({ reviews, averageRating, totalReviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
