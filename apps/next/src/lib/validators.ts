import { z } from 'zod';

export const manualMatchSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
});

export const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export const updateProfileSchema = z.object({
  profession: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  about: z.string().max(120).optional(),
  mode: z.enum(['IN_PERSON', 'ONLINE', 'BOTH']).optional(),
  radiusKm: z.number().min(1).max(100).optional(),
  timezone: z.string().optional(),
  vibe: z.enum(['CASUAL', 'PROFESSIONAL', 'MIXED']).optional(),
  isPaused: z.boolean().optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timezone: z.string().min(1),
});

export const feedbackSchema = z.object({
  pairingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string()).max(5),
  comment: z.string().max(500).optional(),
  noShow: z.boolean().default(false),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export const dashboardFiltersSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'EXPIRED', 'DONE', 'NO_SHOW']).optional(),
  userId: z.string().optional(),
});

// Validation helper
export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}