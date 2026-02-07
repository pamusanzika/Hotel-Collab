const fs = require('fs');
const path = require('path');
const InfluencerProfile = require('../models/InfluencerProfile');

exports.getProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.json({
        displayName: '',
        niche: '',
        location: '',
        bio: '',
        avatar: '',
        collaborationTypes: [],
        connectedPlatform: null,
      });
    }

    const linked = profile.linkedPlatforms?.[0] || null;
    const connectedPlatform = linked
      ? { id: linked.provider, label: linked.provider, username: linked.username }
      : null;

    res.json({
      displayName: profile.displayName,
      niche: profile.niche,
      location: profile.location,
      bio: profile.bio,
      avatar: profile.avatar,
      collaborationTypes: profile.collaborationTypes,
      connectedPlatform,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { displayName, niche, location, bio, collaborationTypes } = req.body;

    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          displayName: displayName || '',
          niche: niche || '',
          location: location || '',
          bio: bio || '',
          collaborationTypes: collaborationTypes || [],
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      displayName: profile.displayName,
      niche: profile.niche,
      location: profile.location,
      bio: profile.bio,
      collaborationTypes: profile.collaborationTypes,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save profile' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Remove old avatar file if it exists
    const existing = await InfluencerProfile.findOne({ userId: req.user._id });
    if (existing?.avatar) {
      const oldPath = path.join(__dirname, '../../', existing.avatar);
      fs.unlink(oldPath, () => {});
    }

    await InfluencerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { avatar: avatarUrl } },
      { upsert: true }
    );

    res.json({ url: avatarUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (profile?.avatar) {
      const filePath = path.join(__dirname, '../../', profile.avatar);
      fs.unlink(filePath, () => {});
      profile.avatar = '';
      await profile.save();
    }
    res.json({ message: 'Avatar removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove avatar' });
  }
};
