const Hotel = require('../models/Hotel');

exports.listAll = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { city: regex },
        { location: regex },
        { 'availability.status': regex },
      ];
    }

    const hotels = await Hotel.find(filter)
      .select('name description location city featureImage images collaborationTypes availability starRating')
      .sort({ createdAt: -1 });

    res.json({ hotels });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hosts' });
  }
};

exports.getById = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, isActive: true });
    if (!hotel) return res.status(404).json({ error: 'Host not found' });
    res.json({ hotel });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch host details' });
  }
};
