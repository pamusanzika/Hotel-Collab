const Campaign = require('../models/Campaign');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIO } = require('../socket');

// ─── Notification helper ────────────────────────────────────────────────────────

const CAMPAIGN_TYPE_LABELS = {
  free_stay: 'Free Stay',
  paid_collaboration: 'Paid Collaboration',
  discount_stay: 'Discount Stay',
};

async function sendCampaignNotification(senderId, recipientId, text) {
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

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function getUserIdForHotel(hotelId) {
  const hotel = await Hotel.findById(hotelId).select('ownerId').lean();
  return hotel ? hotel.ownerId : null;
}

async function enrichCampaigns(campaigns) {
  const influencerIds = [...new Set(campaigns.map((c) => c.influencerId.toString()))];
  const profiles = await InfluencerProfile.find({ userId: { $in: influencerIds } })
    .select('userId displayName avatar')
    .lean();
  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.userId.toString()] = p;
  });

  return campaigns.map((c) => {
    const obj = c.toObject ? c.toObject() : c;
    const profile = profileMap[obj.influencerId?.toString()] || {};
    return {
      ...obj,
      influencerDisplayName: profile.displayName || '',
      influencerAvatar: profile.avatar || '',
    };
  });
}

// ─── Controller ─────────────────────────────────────────────────────────────────

exports.create = async (req, res) => {
  try {
    const { hotelId, influencerId, campaignType, title, description, startDate, endDate } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    // Ownership validation
    if (role === 'hotel_owner') {
      const hotel = await Hotel.findOne({ _id: hotelId, ownerId: userId });
      if (!hotel) {
        return res.status(403).json({ error: 'You do not own this hotel' });
      }
      const influencer = await User.findOne({ _id: influencerId, role: 'influencer', status: 'active' });
      if (!influencer) {
        return res.status(404).json({ error: 'Influencer not found or inactive' });
      }
    } else if (role === 'influencer') {
      if (influencerId !== userId.toString()) {
        return res.status(403).json({ error: 'influencerId must be your own user ID' });
      }
      const hotel = await Hotel.findOne({ _id: hotelId, isActive: true });
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found or inactive' });
      }
    }

    const campaign = await Campaign.create({
      hotelId,
      influencerId,
      createdBy: userId,
      creatorRole: role,
      campaignType,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'pending',
    });

    // Determine recipient
    let recipientId;
    if (role === 'hotel_owner') {
      recipientId = influencerId;
    } else {
      const ownerId = await getUserIdForHotel(hotelId);
      recipientId = ownerId;
    }

    // Send chat notification
    const typeLabel = CAMPAIGN_TYPE_LABELS[campaignType] || campaignType;
    const notifText = `New campaign proposal: "${title}" (${typeLabel}). Check your applications tab to review it.`;
    await sendCampaignNotification(userId, recipientId, notifText);

    // Emit campaign socket event
    try {
      const io = getIO();
      io.to(recipientId.toString()).emit('campaignCreated', {
        campaignId: campaign._id.toString(),
        title,
        campaignType,
        createdBy: userId.toString(),
      });
    } catch (_) {
      // Socket not critical
    }

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

exports.listMine = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { status, tab } = req.query;

    let filter = {};

    if (role === 'hotel_owner') {
      const hotels = await Hotel.find({ ownerId: userId }).select('_id').lean();
      const hotelIds = hotels.map((h) => h._id);
      filter.hotelId = { $in: hotelIds };
    } else {
      filter.influencerId = userId;
    }

    if (status) {
      filter.status = status;
    }

    if (tab === 'applications') {
      // Incoming proposals (created by the other party) that are pending
      filter.createdBy = { $ne: userId };
      filter.status = 'pending';
    } else if (tab === 'campaigns') {
      // Active campaigns + own pending proposals (waiting for approval)
      filter.$or = [
        { status: { $in: ['upcoming', 'ongoing'] } },
        { status: 'pending', createdBy: userId },
      ];
    } else if (tab === 'history') {
      filter.status = { $in: ['done', 'cancelled', 'rejected'] };
    }

    const campaigns = await Campaign.find(filter)
      .populate('hotelId', 'name featureImage city location')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with influencer profile data
    const enriched = await enrichCampaigns(campaigns);

    res.json({ campaigns: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

exports.getById = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const campaign = await Campaign.findById(req.params.id)
      .populate('hotelId', 'name featureImage city location description starRating ownerId')
      .populate('createdBy', 'name role')
      .lean();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify user is a participant
    const isInfluencer = campaign.influencerId.toString() === userId.toString();
    const isOwner =
      role === 'hotel_owner' && campaign.hotelId?.ownerId?.toString() === userId.toString();

    if (!isInfluencer && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to view this campaign' });
    }

    // Enrich with influencer profile data
    const profile = await InfluencerProfile.findOne({ userId: campaign.influencerId })
      .select('displayName avatar niche location')
      .lean();

    const influencerUser = await User.findById(campaign.influencerId).select('name').lean();

    const enriched = {
      ...campaign,
      influencerDisplayName: profile?.displayName || influencerUser?.name || '',
      influencerAvatar: profile?.avatar || '',
      influencerNiche: profile?.niche || '',
      influencerLocation: profile?.location || '',
    };

    // Fetch reviews for this campaign
    const Review = require('../models/Review');
    const reviews = await Review.find({ campaignId: campaign._id })
      .populate('reviewerId', 'name role')
      .lean();

    res.json({ campaign: enriched, reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { status: newStatus, cancelReason } = req.body;

    const campaign = await Campaign.findById(req.params.id).populate(
      'hotelId',
      'name ownerId'
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify user is a participant
    const isInfluencer = campaign.influencerId.toString() === userId.toString();
    const isOwner =
      role === 'hotel_owner' && campaign.hotelId?.ownerId?.toString() === userId.toString();

    if (!isInfluencer && !isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const isCreator = campaign.createdBy.toString() === userId.toString();
    const currentStatus = campaign.status;

    // Transition validation
    const validTransitions = {
      pending: ['upcoming', 'rejected'],
      upcoming: ['ongoing', 'cancelled'],
      ongoing: ['done', 'cancelled'],
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return res
        .status(400)
        .json({ error: `Cannot transition from "${currentStatus}" to "${newStatus}"` });
    }

    // Approve/reject only by recipient (non-creator)
    if (currentStatus === 'pending' && isCreator) {
      return res.status(403).json({ error: 'Only the recipient can approve or reject a campaign' });
    }

    campaign.status = newStatus;
    if (newStatus === 'cancelled' && cancelReason) {
      campaign.cancelReason = cancelReason;
    }
    await campaign.save();

    // Determine the other party for notification
    let recipientId;
    if (isOwner) {
      recipientId = campaign.influencerId;
    } else {
      recipientId = campaign.hotelId.ownerId;
    }

    // Chat notification
    const statusMessages = {
      upcoming: `Campaign "${campaign.title}" has been approved! Status is now Upcoming.`,
      rejected: `Campaign "${campaign.title}" has been declined.`,
      ongoing: `Campaign "${campaign.title}" is now Ongoing.`,
      done: `Campaign "${campaign.title}" is now marked as Done. You can now leave a review!`,
      cancelled: `Campaign "${campaign.title}" has been cancelled.${cancelReason ? ` Reason: ${cancelReason}` : ''}`,
    };

    const notifText = statusMessages[newStatus];
    if (notifText) {
      await sendCampaignNotification(userId, recipientId, notifText);
    }

    // Socket event
    try {
      const io = getIO();
      const rooms = [userId.toString(), recipientId.toString()];
      rooms.forEach((room) => {
        io.to(room).emit('campaignStatusUpdated', {
          campaignId: campaign._id.toString(),
          title: campaign.title,
          newStatus,
          updatedBy: userId.toString(),
        });
      });
    } catch (_) {
      // Socket not critical
    }

    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let filter = {};

    if (role === 'hotel_owner') {
      const hotels = await Hotel.find({ ownerId: userId }).select('_id').lean();
      const hotelIds = hotels.map((h) => h._id);
      filter.hotelId = { $in: hotelIds };
    } else {
      filter.influencerId = userId;
    }

    const campaigns = await Campaign.find(filter).select('status createdBy').lean();

    const stats = {
      pending: 0,
      upcoming: 0,
      ongoing: 0,
      done: 0,
      cancelled: 0,
      rejected: 0,
      total: campaigns.length,
      pendingApplications: 0,
      waitingForApproval: 0,
    };

    campaigns.forEach((c) => {
      if (stats[c.status] !== undefined) {
        stats[c.status]++;
      }
      if (c.status === 'pending') {
        if (c.createdBy.toString() !== userId.toString()) {
          // Incoming applications (pending + created by someone else)
          stats.pendingApplications++;
        } else {
          // Own proposals waiting for the other party to approve
          stats.waitingForApproval++;
        }
      }
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
};
