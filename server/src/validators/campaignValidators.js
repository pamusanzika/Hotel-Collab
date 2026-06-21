const { z } = require('zod');

const createCampaignSchema = z
  .object({
    hotelId: z.string().min(1, 'hotelId is required'),
    influencerId: z.string().min(1, 'influencerId is required'),
    campaignType: z.enum(['free_stay', 'paid_collaboration', 'discount_stay']),
    title: z.string().min(2).max(200).trim(),
    description: z.string().max(2000).optional().default(''),
    startDate: z.string().min(1, 'startDate is required'),
    endDate: z.string().min(1, 'endDate is required'),
    amount: z.number().positive('Amount must be positive').optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

const updateCampaignStatusSchema = z.object({
  status: z.enum(['upcoming', 'ongoing', 'done', 'cancelled', 'rejected']),
  cancelReason: z.string().max(500).optional(),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(''),
});

module.exports = { createCampaignSchema, updateCampaignStatusSchema, createReviewSchema };
