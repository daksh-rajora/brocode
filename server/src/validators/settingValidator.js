import { z } from 'zod';

export const updateStoreSettingSchema = z.object({
  isOpen: z.boolean().optional(),
  midnightHours: z.string().min(3).optional(),
  deliveryFee: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  announcementBanner: z.string().optional(),
  hostelBlocks: z.array(z.string()).optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().email().optional(),
});
