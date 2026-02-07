const { z } = require('zod');

const createConversationSchema = z.object({
  participantId: z.string().min(1, 'participantId is required'),
});

module.exports = { createConversationSchema };
