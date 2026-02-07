const Hotel = require('../models/Hotel');

exports.create = async (req, res) => {
  try {
    const images = req.files
      ? req.files.map((f) => `/uploads/hotels/${f.filename}`)
      : [];

    const { featureImage, collaborationTypes, availability, ...rest } = req.body;

    const parsedCollabTypes =
      typeof collaborationTypes === 'string'
        ? JSON.parse(collaborationTypes)
        : collaborationTypes || [];

    const parsedAvailability =
      typeof availability === 'string'
        ? JSON.parse(availability)
        : availability || {};

    const hotel = await Hotel.create({
      ...rest,
      images,
      featureImage: images[Number(featureImage)] || images[0] || '',
      collaborationTypes: parsedCollabTypes,
      availability: parsedAvailability,
      ownerId: req.user._id,
    });
    res.status(201).json({ hotel });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create hotel' });
  }
};

exports.listMine = async (req, res) => {
  try {
    const hotels = await Hotel.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ hotels });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};

exports.getById = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ hotel });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await Hotel.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!existing) return res.status(404).json({ error: 'Hotel not found' });

    const { featureImage, collaborationTypes, availability, existingImages, ...rest } = req.body;

    // Keep existing images the owner chose to retain + add newly uploaded ones
    const kept = existingImages
      ? (typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages)
      : existing.images;

    const newUploads = req.files
      ? req.files.map((f) => `/uploads/hotels/${f.filename}`)
      : [];

    const images = [...kept, ...newUploads].slice(0, 5);

    const parsedCollabTypes =
      typeof collaborationTypes === 'string'
        ? JSON.parse(collaborationTypes)
        : collaborationTypes || existing.collaborationTypes;

    const parsedAvailability =
      typeof availability === 'string'
        ? JSON.parse(availability)
        : availability || existing.availability;

    const resolvedFeature = featureImage !== undefined
      ? (images[Number(featureImage)] || images[0] || '')
      : existing.featureImage;

    Object.assign(existing, {
      ...rest,
      images,
      featureImage: resolvedFeature,
      collaborationTypes: parsedCollabTypes,
      availability: parsedAvailability,
    });

    await existing.save();
    res.json({ hotel: existing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hotel' });
  }
};

exports.remove = async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hotel' });
  }
};
