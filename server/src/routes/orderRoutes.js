import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  getDashboardAnalytics,
} from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/orderValidator.js';

const router = Router();

// Public routes for student ordering and live status tracking
router.post('/', validateBody(createOrderSchema), createOrder);
router.get('/track', trackOrder);
router.get('/:id', getOrderById);

// Admin-protected order fulfillment and business analytics
router.get('/admin/all', requireAuth, requireAdmin, getAllOrders);
router.get('/admin/analytics', requireAuth, requireAdmin, getDashboardAnalytics);
router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  validateBody(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
