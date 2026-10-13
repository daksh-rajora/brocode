import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    studentPhone: {
      type: String,
      required: [true, 'Student phone number is required'],
      trim: true,
    },
    hostelBlock: {
      type: String,
      required: [true, 'Hostel block is required'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [val => val.length > 0, 'Order must contain at least one snack item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'upi', 'upi_on_delivery', 'pay_at_room'],
      default: 'upi',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'pending_verification', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },
    orderType: {
      type: String,
      enum: ['delivery', 'pickup'],
      default: 'delivery',
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 20,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [
        {
          status: 'placed',
          timestamp: new Date(),
          note: 'Order placed by student and queued for preparation.',
          updatedBy: 'student',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ studentPhone: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
