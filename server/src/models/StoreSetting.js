import mongoose from 'mongoose';

const storeSettingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'Bro Code',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Hostel Ki Bhook, Bro Code Ke Naam!',
      trim: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    midnightHours: {
      type: String,
      default: '10:00 PM - 04:30 AM',
    },
    deliveryFee: {
      type: Number,
      default: 10,
      min: [0, 'Delivery fee cannot be negative'],
    },
    freeDeliveryAbove: {
      type: Number,
      default: 150,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    announcementBanner: {
      type: String,
      default: '⚡ Midnight Hostel Delivery Active! Hot Maggi & energy drinks delivered directly to your room.',
    },
    hostelBlocks: {
      type: [String],
      default: ['BH1', 'BH2', 'BH3-A', 'BH3-B'],
    },
    supportPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    supportEmail: {
      type: String,
      default: 'help@brocode.hostel',
    },
  },
  {
    timestamps: true,
  }
);

export const StoreSetting = mongoose.model('StoreSetting', storeSettingSchema);
