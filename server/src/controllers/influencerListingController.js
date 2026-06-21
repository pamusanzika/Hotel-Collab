const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');

exports.listAll = async (req, res) => {
  try {
    const { search } = req.query;

    // Only show profiles for active influencer users
    const activeUsers = await User.find({ role: 'influencer', status: 'active' }).select('_id');
    const activeUserIds = activeUsers.map((u) => u._id);

    const filter = { userId: { $in: activeUserIds } };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { displayName: regex },
        { niche: regex },
        { location: regex },
      ];
    }

    const profiles = await InfluencerProfile.find(filter)
      .select('userId displayName bio niche location avatar collaborationTypes linkedPlatforms portfolio')
      .sort({ createdAt: -1 });

    res.json({ influencers: profiles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content creators' });
  }
};

exports.getById = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Content Creator not found' });

    const user = await User.findById(profile.userId).select('name email status');
    if (!user || user.status !== 'active') {
      return res.status(404).json({ error: 'Content Creator not found' });
    }

    res.json({
      influencer: {
        ...profile.toObject(),
        userName: user.name,
        userEmail: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content creator details' });
  }
};
