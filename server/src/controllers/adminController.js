const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const BanLog = require('../models/BanLog');
const AdminInviteToken = require('../models/AdminInviteToken');
const Campaign = require('../models/Campaign');
const Payment = require('../models/Payment');
const InfluencerProfile = require('../models/InfluencerProfile');
const Hotel = require('../models/Hotel');
const HotelOwnerProfile = require('../models/HotelOwnerProfile');
const Review = require('../models/Review');
const CollabOpportunity = require('../models/CollabOpportunity');
const { sendAdminInviteEmail } = require('../services/emailService');

const SALT_ROUNDS = 12;

exports.getStats = async (req, res) => {
  try {
    const [
      total, hotelOwners, influencers, admins, banned,
      totalCampaigns, pendingCampaigns, ongoingCampaigns, doneCampaigns,
      totalPayments, paymentRevenue,
      totalOpportunities, openOpportunities, bannedOpportunities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'hotel_owner' }),
      User.countDocuments({ role: 'influencer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'banned' }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'pending' }),
      Campaign.countDocuments({ status: { $in: ['upcoming', 'ongoing'] } }),
      Campaign.countDocuments({ status: 'done' }),
      Payment.countDocuments({ status: 'succeeded' }),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      CollabOpportunity.countDocuments(),
      CollabOpportunity.countDocuments({ status: 'open' }),
      CollabOpportunity.countDocuments({ status: 'banned' }),
    ]);

    res.json({
      total, hotelOwners, influencers, admins, banned,
      totalCampaigns, pendingCampaigns, ongoingCampaigns, doneCampaigns,
      totalPayments,
      totalRevenue: paymentRevenue[0]?.total || 0,
      totalOpportunities, openOpportunities, bannedOpportunities,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = { user: user.toObject() };

    // Role-specific profile data
    if (user.role === 'hotel_owner') {
      const ownerProfile = await HotelOwnerProfile.findOne({ userId: user._id })
        .select('companyName phone bio website location');
      const hotels = await Hotel.find({ ownerId: user._id })
        .select('name city starRating isActive featureImage location')
        .sort({ createdAt: -1 });
      result.ownerProfile = ownerProfile;
      result.hotels = hotels;
    } else if (user.role === 'influencer') {
      const influencerProfile = await InfluencerProfile.findOne({ userId: user._id })
        .select('displayName bio niche location avatar collaborationTypes linkedPlatforms');
      result.influencerProfile = influencerProfile;
    }

    // Recent campaigns
    let campaignFilter;
    if (user.role === 'hotel_owner') {
      const hotelIds = (await Hotel.find({ ownerId: user._id }).select('_id')).map((h) => h._id);
      campaignFilter = { hotelId: { $in: hotelIds } };
    } else if (user.role === 'influencer') {
      campaignFilter = { influencerId: user._id };
    }

    if (campaignFilter) {
      result.campaigns = await Campaign.find(campaignFilter)
        .populate('hotelId', 'name city')
        .populate('influencerId', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
    } else {
      result.campaigns = [];
    }

    // Reviews received
    result.reviews = await Review.find({ revieweeId: user._id })
      .populate('reviewerId', 'name')
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 });

    // Ban history
    result.banHistory = await BanLog.find({ userId: user._id })
      .populate('adminId', 'name')
      .sort({ createdAt: -1 });

    res.json(result);
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot ban an admin' });
    if (user.status === 'banned') return res.status(400).json({ error: 'User is already banned' });

    user.status = 'banned';
    user.refreshToken = null; // Invalidate sessions
    await user.save();

    await BanLog.create({
      adminId: req.user._id,
      userId: user._id,
      action: 'ban',
      reason: reason || '',
    });

    res.json({ message: 'User banned', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'banned') return res.status(400).json({ error: 'User is not banned' });

    user.status = user.isEmailVerified ? 'active' : 'pending_verification';
    await user.save();

    await BanLog.create({
      adminId: req.user._id,
      userId: user._id,
      action: 'unban',
      reason: '',
    });

    res.json({ message: 'User unbanned', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

exports.inviteAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'admin' && existing.isEmailVerified) {
        return res.status(409).json({ error: 'This email already belongs to an active admin' });
      }
      if (existing.role === 'admin' && !existing.isEmailVerified) {
        // Re-send invite for pending admin
        await sendAdminInviteEmail(existing, req.user._id);
        return res.json({ message: 'Invitation re-sent to pending admin' });
      }
      return res.status(409).json({ error: 'This email is already registered with a different role' });
    }

    const tempPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    const user = await User.create({
      name: 'Pending Admin',
      email,
      passwordHash,
      role: 'admin',
      status: 'pending_verification',
      isEmailVerified: false,
    });

    await sendAdminInviteEmail(user, req.user._id);

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (err) {
    console.error('Invite admin error:', err);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

exports.setupAdminPassword = async (req, res) => {
  try {
    const { token, name, password } = req.body;

    const record = await AdminInviteToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    user.name = name;
    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user.status = 'active';
    user.isEmailVerified = true;
    await user.save();

    // Delete all invite tokens for this user (single-use)
    await AdminInviteToken.deleteMany({ userId: record.userId });

    res.json({ message: 'Account set up successfully. Please log in.' });
  } catch (err) {
    console.error('Setup admin password error:', err);
    res.status(500).json({ error: 'Account setup failed' });
  }
};

exports.listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isEmailVerified: true, status: 'active' })
      .select('name email createdAt')
      .sort({ createdAt: 1 });

    res.json({ admins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'admin') return res.status(400).json({ error: 'User is not an admin' });

    await AdminInviteToken.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(id);

    res.json({ message: 'Admin removed successfully' });
  } catch (err) {
    console.error('Remove admin error:', err);
    res.status(500).json({ error: 'Failed to remove admin' });
  }
};

exports.listPendingInvites = async (req, res) => {
  try {
    const pendingAdmins = await User.find({
      role: 'admin',
      isEmailVerified: false,
      status: 'pending_verification',
    })
      .select('email createdAt')
      .sort({ createdAt: -1 });

    const invites = await Promise.all(
      pendingAdmins.map(async (admin) => {
        const tokenRecord = await AdminInviteToken.findOne({ userId: admin._id })
          .populate('invitedBy', 'name email')
          .select('expiresAt invitedBy');
        return {
          _id: admin._id,
          email: admin.email,
          invitedAt: admin.createdAt,
          invitedBy: tokenRecord?.invitedBy || null,
          expiresAt: tokenRecord?.expiresAt || null,
          expired: tokenRecord ? tokenRecord.expiresAt < new Date() : true,
        };
      })
    );

    res.json({ invites });
  } catch (err) {
    console.error('List pending invites error:', err);
    res.status(500).json({ error: 'Failed to fetch pending invites' });
  }
};

exports.listCampaigns = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const campaigns = await Campaign.find(filter)
      .populate('hotelId', 'name city location featureImage')
      .populate('influencerId', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Enrich with influencer profile data
    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        const obj = c.toObject();
        const profile = await InfluencerProfile.findOne({ userId: c.influencerId?._id }).select(
          'displayName avatar niche location'
        );
        if (profile) {
          obj.influencerDisplayName = profile.displayName;
          obj.influencerAvatar = profile.avatar;
          obj.influencerNiche = profile.niche;
          obj.influencerLocation = profile.location;
        }
        return obj;
      })
    );

    // Apply search filter on enriched data (title, hotel name, influencer name)
    let results = enriched;
    if (search) {
      const regex = new RegExp(search, 'i');
      results = enriched.filter(
        (c) =>
          regex.test(c.title) ||
          regex.test(c.hotelId?.name) ||
          regex.test(c.influencerDisplayName) ||
          regex.test(c.influencerId?.name)
      );
    }

    const total = search
      ? results.length
      : await Campaign.countDocuments(filter);

    res.json({ campaigns: search ? results : results, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Admin list campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('hotelId', 'name city location featureImage')
      .populate('influencerId', 'name email')
      .populate('createdBy', 'name');

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const obj = campaign.toObject();
    const profile = await InfluencerProfile.findOne({ userId: campaign.influencerId?._id }).select(
      'displayName avatar niche location'
    );
    if (profile) {
      obj.influencerDisplayName = profile.displayName;
      obj.influencerAvatar = profile.avatar;
      obj.influencerNiche = profile.niche;
      obj.influencerLocation = profile.location;
    }

    // Attach payment info
    const payment = await Payment.findOne({ campaignId: campaign._id })
      .sort({ createdAt: -1 })
      .select('amount currency status stripePaymentIntentId refundId createdAt updatedAt')
      .lean();
    obj.payment = payment || null;

    // Attach reviews
    const reviews = await Review.find({ campaignId: campaign._id })
      .populate('reviewerId', 'name role')
      .lean();
    obj.reviews = reviews;

    res.json({ campaign: obj });
  } catch (err) {
    console.error('Admin get campaign error:', err);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('campaignId', 'title campaignType status')
        .populate('payerId', 'name email')
        .populate('recipientId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.json({ payments, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Admin list payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

exports.listOpportunities = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const [opportunities, total] = await Promise.all([
      CollabOpportunity.find(filter)
        .populate('hotelId', 'name city featureImage location')
        .populate('createdBy', 'name email')
        .populate('bannedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      CollabOpportunity.countDocuments(filter),
    ]);

    res.json({ opportunities, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Admin list opportunities error:', err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

exports.getOpportunityById = async (req, res) => {
  try {
    const opportunity = await CollabOpportunity.findById(req.params.id)
      .populate('hotelId', 'name city featureImage location starRating')
      .populate('createdBy', 'name email')
      .populate('bannedBy', 'name')
      .populate('applicants.userId', 'name email');

    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

    const obj = opportunity.toObject();

    const enrichedApplicants = await Promise.all(
      obj.applicants.map(async (a) => {
        const profile = await InfluencerProfile.findOne({ userId: a.userId?._id })
          .select('displayName avatar niche location');
        return { ...a, influencerProfile: profile || null };
      })
    );
    obj.applicants = enrichedApplicants;

    res.json({ opportunity: obj });
  } catch (err) {
    console.error('Admin get opportunity error:', err);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
};

exports.banOpportunity = async (req, res) => {
  try {
    const { reason } = req.body;
    const opportunity = await CollabOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (opportunity.status === 'banned') {
      return res.status(400).json({ error: 'Opportunity is already banned' });
    }

    opportunity.status = 'banned';
    opportunity.banReason = reason || '';
    opportunity.bannedBy = req.user._id;
    await opportunity.save();

    res.json({ message: 'Opportunity banned', opportunityId: opportunity._id });
  } catch (err) {
    console.error('Admin ban opportunity error:', err);
    res.status(500).json({ error: 'Failed to ban opportunity' });
  }
};

exports.unbanOpportunity = async (req, res) => {
  try {
    const opportunity = await CollabOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (opportunity.status !== 'banned') {
      return res.status(400).json({ error: 'Opportunity is not banned' });
    }

    opportunity.status = 'open';
    opportunity.banReason = '';
    opportunity.bannedBy = null;
    await opportunity.save();

    res.json({ message: 'Opportunity unbanned', opportunityId: opportunity._id });
  } catch (err) {
    console.error('Admin unban opportunity error:', err);
    res.status(500).json({ error: 'Failed to unban opportunity' });
  }
};
