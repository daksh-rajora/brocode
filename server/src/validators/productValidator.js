import { z } from 'zod';

const validCategories = [
  'chips',
  'chocolates',
  'noodles',
  'drinks',
  'biscuits',
  'munchies',
  'essentials',
  'instant_noodles',
  'munchies_chips',
  'midnight_combos',
  'beverages',
  'sweets_chocolates',
  'quick_bites',
  'hostel_essentials',
];

const parseBool = (val, defaultVal = true) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'string') return val === 'true' || val === '1';
  return Boolean(val);
};

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  category: z.string().optional().default('general'),
  brand: z.string().optional().default('Bro Code'),
  weight: z.string().optional().default('50g'),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  cloudinaryPublicId: z.string().nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  isAvailable: z.preprocess((val) => parseBool(val, true), z.boolean()).optional().default(true),
  isActive: z.preprocess((val) => parseBool(val, true), z.boolean()).optional().default(true),
  isVeg: z.preprocess((val) => parseBool(val, true), z.boolean()).optional().default(true),
  spiceLevel: z.enum(['none', 'mild', 'medium', 'fire']).optional().default('none'),
  prepTimeMinutes: z.coerce.number().int().min(1).optional().default(5),
  tags: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',').map((t) => t.trim()).filter(Boolean) : val),
    z.array(z.string()).optional().default([])
  ),
  hostelFavorite: z.preprocess((val) => parseBool(val, false), z.boolean()).optional().default(false),
  rating: z.coerce.number().min(1).max(5).optional().default(4.8),
  reviewCount: z.coerce.number().int().optional().default(120),
}).refine((data) => Boolean(data.image || data.imageUrl), {
  message: 'Product image URL is required',
  path: ['image'],
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(5).max(500).optional(),
  price: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  weight: z.string().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  cloudinaryPublicId: z.string().nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isAvailable: z.preprocess((val) => parseBool(val, undefined), z.boolean().optional()).optional(),
  isActive: z.preprocess((val) => parseBool(val, undefined), z.boolean().optional()).optional(),
  isVeg: z.preprocess((val) => parseBool(val, undefined), z.boolean().optional()).optional(),
  spiceLevel: z.enum(['none', 'mild', 'medium', 'fire']).optional(),
  prepTimeMinutes: z.coerce.number().int().min(1).optional(),
  tags: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',').map((t) => t.trim()).filter(Boolean) : val),
    z.array(z.string()).optional()
  ),
  hostelFavorite: z.preprocess((val) => parseBool(val, undefined), z.boolean().optional()).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  reviewCount: z.coerce.number().int().optional(),
});


export const updateStockSchema = z.object({
  stock: z.number().int().min(0, 'Stock must be 0 or greater'),
  isAvailable: z.boolean().optional(),
});
