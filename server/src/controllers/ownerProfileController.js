const HotelOwnerProfile = require('../models/HotelOwnerProfile');

exports.getProfile = async (req, res) => {
  try {
    const profile = await HotelOwnerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.json({
        companyName: '',
        phone: '',
        website: '',
        location: '',
        bio: '',
      });
    }

    res.json({
      companyName: profile.companyName,
      phone: profile.phone,
      website: profile.website,
      location: profile.location,
      bio: profile.bio,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { companyName, phone, website, location, bio } = req.body;

    const profile = await HotelOwnerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          companyName: companyName || '',
          phone: phone || '',
          website: website || '',
          location: location || '',
          bio: bio || '',
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      companyName: profile.companyName,
      phone: profile.phone,
      website: profile.website,
      location: profile.location,
      bio: profile.bio,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save profile' });
  }
};
