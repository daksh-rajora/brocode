import { z } from 'zod';

export const updateStoreSettingSchema = z.object({
  isOpen: z.boolean().optional(),
  midnightHours: z.string().min(3).optional(),
  deliveryFee: z
    .number({ invalid_type_error: 'Delivery charge must be a valid number' })
    .min(0, 'Delivery charge cannot be negative. Enter 0 for free delivery.')
    .optional(),
  minOrderAmount: z.number().min(0).optional(),
  freeDeliveryAbove: z.number().min(0).optional(),
  announcementBanner: z.string().optional(),
  hostelBlocks: z.array(z.string()).optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().email().optional(),
  storeName: z.string().optional(),
  tagline: z.string().optional(),
});
