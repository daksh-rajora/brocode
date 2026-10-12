import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import settingRoutes from './settingRoutes.js';

const apiV1Router = Router();

apiV1Router.use('/health', healthRoutes);
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/products', productRoutes);
apiV1Router.use('/admin/products', productRoutes);
apiV1Router.use('/orders', orderRoutes);
apiV1Router.use('/settings', settingRoutes);

export default apiV1Router;
