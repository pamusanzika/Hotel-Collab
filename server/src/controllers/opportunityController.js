const CollabOpportunity = require('../models/CollabOpportunity');
const Campaign = require('../models/Campaign');
const Hotel = require('../models/Hotel');
const InfluencerProfile = require('../models/InfluencerProfile');

exports.create = async (req, res) => {
  try {
    const body = req.body;

    if (typeof body.requirements === 'string') {
      try { body.requirements = JSON.parse(body.requirements); } catch (e) {}
    }
    if (typeof body.maxApplicants === 'string') body.maxApplicants = Number(body.maxApplicants);

    const hotel = await Hotel.findById(body.hotelId);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    if (hotel.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not own this hotel' });
    }

    const images = req.files
      ? req.files.map((f) => `/uploads/opportunities/${f.filename}`)
      : [];

    const opportunity = await CollabOpportunity.create({
      ...body,
      images,
      createdBy: req.user._id,
    });

    res.status(201).json({ opportunity });
  } catch (err) {
    console.error('Create opportunity error:', err);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
};

exports.update = async (req, res) => {
  try {
    const opportunity = await CollabOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (opportunity.status === 'banned') {
      return res.status(400).json({ error: 'Cannot edit a banned opportunity' });
    }

    if (typeof req.body.requirements === 'string') {
      try { req.body.requirements = JSON.parse(req.body.requirements); } catch (e) {}
    }
    if (typeof req.body.maxApplicants === 'string') req.body.maxApplicants = Number(req.body.maxApplicants);

    Object.assign(opportunity, req.body);

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => `/uploads/opportunities/${f.filename}`);
      opportunity.images = [...(opportunity.images || []), ...newImages];
    }
    await opportunity.save();

    res.json({ opportunity });
  } catch (err) {
    console.error('Update opportunity error:', err);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
};

exports.remove = async (req, res) => {
  try {
    const opportunity = await CollabOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await CollabOpportunity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Opportunity deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
};

exports.getMyOpportunities = async (req, res) => {
  try {
    const opportunities = await CollabOpportunity.find({ createdBy: req.user._id })
      .populate('hotelId', 'name city featureImage location')
      .sort({ createdAt: -1 });

    res.json({ opportunities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

exports.getById = async (req, res) => {
  try {
    const opportunity = await CollabOpportunity.findById(req.params.id)
      .populate('hotelId', 'name city featureImage location starRating amenities description')
      .populate('createdBy', 'name')
      .populate('applicants.userId', 'name email');

    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

    const obj = opportunity.toObject();

    const enrichedApplicants = await Promise.all(
      obj.applicants.map(async (a) => {
        const profile = await InfluencerProfile.findOne({ userId: a.userId?._id })
          .select('displayName avatar niche location linkedPlatforms');
        return { ...a, influencerProfile: profile || null };
      })
    );
    obj.applicants = enrichedApplicants;

    res.json({ opportunity: obj });
  } catch (err) {
    console.error('Get opportunity error:', err);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
};

exports.browse = async (req, res) => {
  try {
    const { eventType, compensationType, search, page = 1, limit = 20 } = req.query;

    const filter = { status: 'open', applicationDeadline: { $gte: new Date() } };
    if (eventType) filter.eventType = eventType;
    if (compensationType) filter.compensationType = compensationType;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const [opportunities, total] = await Promise.all([
      CollabOpportunity.find(filter)
        .populate('hotelId', 'name city featureImage location starRating')
        .populate('createdBy', 'name')
        .sort({ applicationDeadline: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      CollabOpportunity.countDocuments(filter),
    ]);

    res.json({ opportunities, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to browse opportunities' });
  }
};

exports.apply = async (req, res) => {
  try {
    const opportunity = await CollabOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (opportunity.status !== 'open') {
      return res.status(400).json({ error: 'This opportunity is no longer accepting applications' });
    }
    if (new Date() > opportunity.applicationDeadline) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    const alreadyApplied = opportunity.applicants.some(
      (a) => a.userId.toString() === req.user._id.toString()
    );
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied' });
    }

    const acceptedCount = opportunity.applicants.filter((a) => a.status === 'accepted').length;
    if (acceptedCount >= opportunity.maxApplicants) {
      return res.status(400).json({ error: 'Maximum applicants reached' });
    }

    opportunity.applicants.push({
      userId: req.user._id,
      message: req.body.message || '',
    });
    await opportunity.save();

    res.json({ message: 'Application submitted' });
  } catch (err) {
    console.error('Apply opportunity error:', err);
    res.status(500).json({ error: 'Failed to apply' });
  }
};

exports.handleApplicant = async (req, res) => {
  try {
    const { id, applicantId } = req.params;
    const { action } = req.body;

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'action must be accepted or rejected' });
    }

    const opportunity = await CollabOpportunity.findById(id);
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const applicant = opportunity.applicants.id(applicantId);
    if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

    applicant.status = action;
    await opportunity.save();

    let campaignId = null;
    if (action === 'accepted') {
      const compMap = {
        free_stay: 'free_stay',
        paid: 'paid_collaboration',
        commission: 'paid_collaboration',
        discount_stay: 'discount_stay',
        mixed: 'paid_collaboration',
      };

      const campaign = await Campaign.create({
        hotelId: opportunity.hotelId,
        influencerId: applicant.userId,
        createdBy: req.user._id,
        creatorRole: 'hotel_owner',
        campaignType: compMap[opportunity.compensationType] || 'free_stay',
        title: opportunity.title,
        description: opportunity.description,
        startDate: opportunity.eventStartDate,
        endDate: opportunity.eventEndDate,
        status: 'upcoming',
      });
      campaignId = campaign._id;
    }

    res.json({ message: `Applicant ${action}`, campaignId });
  } catch (err) {
    console.error('Handle applicant error:', err);
    res.status(500).json({ error: 'Failed to update applicant status' });
  }
};
