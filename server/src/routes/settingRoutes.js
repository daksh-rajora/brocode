import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { updateStoreSettingSchema } from '../validators/settingValidator.js';

const router = Router();

router.get('/', getSettings);
router.put('/', requireAuth, requireAdmin, validateBody(updateStoreSettingSchema), updateSettings);

export default router;
