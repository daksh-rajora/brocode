import { Router } from 'express';
import {
  getProducts,
  getFeaturedProducts,
  getProductById,
  uploadProductImage,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getInventoryStats,
} from '../controllers/productController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { handleImageUploadMiddleware } from '../middleware/uploadMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../validators/productValidator.js';

const router = Router();

// Public routes (with optional auth for admin previews of inactive products)
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:idOrSlug', optionalAuth, getProductById);

// Admin-protected image upload
router.post(
  '/upload-image',
  requireAuth,
  requireAdmin,
  handleImageUploadMiddleware,
  uploadProductImage
);
router.post(
  '/upload',
  requireAuth,
  requireAdmin,
  handleImageUploadMiddleware,
  uploadProductImage
);

// Admin-protected product management routes
router.get('/admin/stats', requireAuth, requireAdmin, getInventoryStats);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  handleImageUploadMiddleware,
  validateBody(createProductSchema),
  createProduct
);
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  handleImageUploadMiddleware,
  validateBody(updateProductSchema),
  updateProduct
);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  handleImageUploadMiddleware,
  validateBody(updateProductSchema),
  updateProduct
);
router.patch(
  '/:id/stock',
  requireAuth,
  requireAdmin,
  validateBody(updateStockSchema),
  updateStock
);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
