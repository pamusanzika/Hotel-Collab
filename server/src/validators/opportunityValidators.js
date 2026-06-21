const { z } = require('zod');

const createOpportunitySchema = z
  .object({
    hotelId: z.string().min(1, 'hotelId is required'),
    title: z.string().min(2).max(200).trim(),
    description: z.string().max(3000).optional().default(''),
    eventType: z.enum([
      'grand_opening', 'seasonal_event', 'festival', 'product_launch',
      'anniversary', 'holiday_special', 'food_wine', 'wellness_retreat', 'other',
    ]),
    compensationType: z.enum(['free_stay', 'paid', 'commission', 'discount_stay', 'mixed']),
    compensationDetails: z.string().max(500).optional().default(''),
    eventStartDate: z.string().min(1, 'eventStartDate is required'),
    eventEndDate: z.string().min(1, 'eventEndDate is required'),
    applicationDeadline: z.string().min(1, 'applicationDeadline is required'),
    requirements: z
      .object({
        minFollowers: z.coerce.number().int().min(0).optional().default(0),
        niches: z.array(z.string().trim()).optional().default([]),
        deliverables: z.string().max(1000).optional().default(''),
      })
      .optional()
      .default({}),
    maxApplicants: z.coerce.number().int().min(1).optional().default(10),
  })
  .refine((data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(data.eventStartDate) >= today;
  }, {
    message: 'eventStartDate cannot be in the past',
    path: ['eventStartDate'],
  })
  .refine((data) => new Date(data.eventEndDate) > new Date(data.eventStartDate), {
    message: 'eventEndDate must be after eventStartDate',
    path: ['eventEndDate'],
  })
  .refine((data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(data.applicationDeadline) >= today;
  }, {
    message: 'applicationDeadline cannot be in the past',
    path: ['applicationDeadline'],
  })
  .refine((data) => new Date(data.applicationDeadline) <= new Date(data.eventStartDate), {
    message: 'applicationDeadline must be on or before eventStartDate',
    path: ['applicationDeadline'],
  });

const updateOpportunitySchema = z.object({
  title: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(3000).optional(),
  compensationType: z.enum(['free_stay', 'paid', 'commission', 'discount_stay', 'mixed']).optional(),
  compensationDetails: z.string().max(500).optional(),
  requirements: z
    .object({
      minFollowers: z.number().int().min(0).optional(),
      niches: z.array(z.string().trim()).optional(),
      deliverables: z.string().max(1000).optional(),
    })
    .optional(),
  maxApplicants: z.number().int().min(1).optional(),
  status: z.enum(['open', 'closed']).optional(),
});

const applyOpportunitySchema = z.object({
  message: z.string().max(500).optional().default(''),
});

module.exports = { createOpportunitySchema, updateOpportunitySchema, applyOpportunitySchema };
