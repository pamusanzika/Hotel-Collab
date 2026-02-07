const { z } = require('zod');

const createHotelSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).optional().default(''),
  location: z.string().max(200).optional().default(''),
  city: z.string().max(200).optional().default(''),
  starRating: z.number().int().min(1).max(5).optional().default(3),
  amenities: z.array(z.string().trim()).optional().default([]),
  contactEmail: z.string().email().optional().default(''),
  featureImage: z.string().optional().default(''),
  collaborationTypes: z
    .array(z.enum(['free_stay', 'discount_stay', 'paid_collaboration']))
    .optional()
    .default([]),
  availability: z
    .object({
      status: z.enum(['available', 'unavailable']).optional().default('available'),
      startDate: z.string().nullable().optional().default(null),
      endDate: z.string().nullable().optional().default(null),
    })
    .optional()
    .default({}),
});

const updateHotelSchema = createHotelSchema.partial();

module.exports = { createHotelSchema, updateHotelSchema };
