import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import settingRoutes from './settingRoutes.js';
import { requireDatabase } from '../middleware/dbMiddleware.js';

const apiV1Router = Router();

// Health route is accessible even if DB is disconnected (reports degraded status)
apiV1Router.use('/health', healthRoutes);

// Database-backed routes require an active database connection
apiV1Router.use('/auth', requireDatabase, authRoutes);
apiV1Router.use('/products', requireDatabase, productRoutes);
apiV1Router.use('/admin/products', requireDatabase, productRoutes);
apiV1Router.use('/orders', requireDatabase, orderRoutes);
apiV1Router.use('/settings', requireDatabase, settingRoutes);

export default apiV1Router;
