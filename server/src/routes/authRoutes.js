import { Router } from 'express';
import { login, getProfile, checkAdminExists, bootstrapAdmin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { loginSchema, setupAdminSchema } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', requireAuth, getProfile);
router.get('/status', checkAdminExists);
router.post('/setup', authLimiter, validateBody(setupAdminSchema), bootstrapAdmin);

export default router;
