import { StoreSetting } from '../models/StoreSetting.js';

export const storeSettingService = {
  async getSettings() {
    let setting = await StoreSetting.findOne();
    if (!setting) {
      setting = await StoreSetting.create({});
    }
    return setting;
  },

  async updateSettings(updateData) {
    let setting = await StoreSetting.findOne();
    if (!setting) {
      setting = await StoreSetting.create(updateData);
      return setting;
    }
    return StoreSetting.findByIdAndUpdate(setting._id, updateData, {
      new: true,
      runValidators: true,
    });
  },
};
