import { storeSettingService } from '../services/storeSettingService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { emitEvent } from '../services/socketService.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await storeSettingService.getSettings();
    return sendSuccess(res, settings, 'Store settings retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const updated = await storeSettingService.updateSettings(req.body);
    emitEvent('settings:updated', updated);
    return sendSuccess(res, updated, 'Store settings updated successfully');
  } catch (error) {
    next(error);
  }
};

