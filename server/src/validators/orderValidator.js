import { z } from 'zod';

export const createOrderSchema = z.object({
  studentName: z.string().min(2, 'Please enter your full name').max(100),
  studentPhone: z
    .string()
    .min(7, 'Please enter a valid phone number')
    .max(15, 'Phone number is too long'),
  hostelBlock: z.string().min(2, 'Please select or enter your hostel block'),
  roomNumber: z.string().min(1, 'Please enter your room number'),
  items: z
    .array(
      z.object({
        productId: z.string().min(10, 'Valid product ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'Cart cannot be empty. Please select at least one snack.'),
  paymentMethod: z
    .enum(['cash_on_delivery', 'upi', 'upi_on_delivery', 'pay_at_room'])
    .optional()
    .default('upi'),
  orderType: z.enum(['delivery', 'pickup']).optional().default('delivery'),
  deliveryNotes: z.string().max(300).optional().default(''),
});

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']).optional(),
    paymentStatus: z.enum(['pending', 'pending_verification', 'paid', 'failed']).optional(),
    note: z.string().max(250).optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.paymentStatus !== undefined,
    { message: 'Must provide either status or paymentStatus to update order' }
  );

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['pending', 'pending_verification', 'paid', 'failed']),
  note: z.string().max(250).optional(),
});

