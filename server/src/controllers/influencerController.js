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
        portfolio: [],
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
      portfolio: profile.portfolio || [],
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

const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'pdf';
  return 'other';
};

exports.uploadPortfolio = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const profile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please save your profile first.' });
    }

    const currentCount = profile.portfolio?.length || 0;
    if (currentCount + req.files.length > 20) {
      req.files.forEach((f) => fs.unlink(f.path, () => {}));
      return res.status(400).json({ message: `Portfolio limit is 20 items. You have ${currentCount} already.` });
    }

    const newItems = req.files.map((file) => ({
      url: `/uploads/portfolios/${file.filename}`,
      originalName: file.originalname,
      fileType: getFileType(file.mimetype),
      mimeType: file.mimetype,
      size: file.size,
      title: req.body.title || '',
    }));

    profile.portfolio.push(...newItems);
    await profile.save();

    res.json({ items: newItems });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload portfolio items' });
  }
};

exports.deletePortfolioItem = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const item = profile.portfolio.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Portfolio item not found' });

    const filePath = path.join(__dirname, '../../', item.url);
    fs.unlink(filePath, () => {});

    item.deleteOne();
    await profile.save();

    res.json({ message: 'Portfolio item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove portfolio item' });
  }
};

exports.updatePortfolioItem = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const item = profile.portfolio.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Portfolio item not found' });

    if (req.body.title !== undefined) item.title = req.body.title;
    await profile.save();

    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update portfolio item' });
  }
};
