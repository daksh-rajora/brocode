import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { storeSettingService } from './storeSettingService.js';
import { emitEvent } from './socketService.js';

const generateOrderNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `BRO-${dateStr}-${randomCode}`;
};

export const orderService = {
  async createOrder({
    studentName,
    studentPhone,
    hostelBlock,
    roomNumber,
    items,
    paymentMethod = 'upi_on_delivery',
    orderType = 'delivery',
    deliveryNotes = '',
  }) {
    const settings = await storeSettingService.getSettings();
    if (!settings.isOpen) {
      const err = new Error('Bro Code is currently closed for orders. Check midnight timings!');
      err.statusCode = 400;
      throw err;
    }

    if (!items || items.length === 0) {
      const err = new Error('Cart cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    // Validate and fetch each product
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        const err = new Error('Invalid item quantity: must be a positive integer.');
        err.statusCode = 400;
        throw err;
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        const err = new Error(`Snack item not found (ID: ${item.productId})`);
        err.statusCode = 404;
        throw err;
      }

      if (product.isActive === false || product.isAvailable === false) {
        const err = new Error(`"${product.name}" is currently unavailable for order.`);
        err.statusCode = 400;
        throw err;
      }

      if (product.stock < item.quantity) {
        const err = new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
        err.statusCode = 400;
        throw err;
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.imageUrl || product.image,
      });
    }

    if (subtotal < settings.minOrderAmount) {
      const err = new Error(
        `Minimum order amount is ₹${settings.minOrderAmount}. Current subtotal: ₹${subtotal}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Deduct stock atomically with rollback safeguard
    const deductedItems = [];
    try {
      for (const item of items) {
        // Atomic decrement ensuring stock >= quantity concurrently
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
            isActive: { $ne: false },
            isAvailable: { $ne: false },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { new: true }
        );

        if (!updatedProduct) {
          const currentProd = await Product.findById(item.productId);
          const currentStock = currentProd ? currentProd.stock : 0;
          const err = new Error(
            `Insufficient stock for "${currentProd ? currentProd.name : 'item'}". Only ${currentStock} remaining in inventory.`
          );
          err.statusCode = 400;
          throw err;
        }

        deductedItems.push({ productId: item.productId, quantity: item.quantity });
      }

      // Delivery fee: ₹0 for Self Pickup, configured fee for Delivery
      const deliveryFee = orderType === 'pickup' ? 0 : (settings.deliveryFee || 0);
      const totalAmount = subtotal + deliveryFee;
      const orderNumber = generateOrderNumber();

      const order = await Order.create({
        orderNumber,
        studentName,
        studentPhone,
        hostelBlock,
        roomNumber,
        items: orderItems,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod,
        orderType,
        deliveryNotes,
        status: 'placed',
        estimatedDeliveryMinutes: orderType === 'pickup' ? 10 : 20,
        stockRestored: false,
        statusHistory: [
          {
            status: 'placed',
            timestamp: new Date(),
            note: `Order received (${orderType === 'pickup' ? 'Self Pickup' : 'Hostel Delivery'}) for ${hostelBlock}, ${roomNumber}.`,
            updatedBy: 'student',
          },
        ],
      });

      // Real-time synchronization
      emitEvent('order:created', order);
      emitEvent('inventory:updated', { reason: 'order_created', orderNumber: order.orderNumber });
      emitEvent('analytics:updated');

      return order;
    } catch (error) {
      // Rollback any successfully deducted items if deduction or Order.create failed
      for (const deducted of deductedItems) {
        try {
          await Product.findByIdAndUpdate(deducted.productId, {
            $inc: { stock: deducted.quantity },
          });
        } catch (rollbackErr) {
          console.error('[Inventory Rollback Error]:', rollbackErr.message);
        }
      }
      throw error;
    }
  },

  async getOrderById(id) {
    return Order.findById(id).populate('items.product', 'name price image imageUrl stock isAvailable');
  },

  async getOrderByNumber(orderNumber) {
    return Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
  },

  async getOrdersByPhone(phone) {
    return Order.find({ studentPhone: phone.trim() }).sort({ createdAt: -1 });
  },

  async getAllOrders({ status, search, limit = 100, page = 1 }) {
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      query.$or = [
        { orderNumber: { $regex: cleanSearch, $options: 'i' } },
        { studentName: { $regex: cleanSearch, $options: 'i' } },
        { studentPhone: { $regex: cleanSearch, $options: 'i' } },
        { roomNumber: { $regex: cleanSearch, $options: 'i' } },
        { hostelBlock: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  },

  async updateOrderStatus(id, status, note = '', updatedBy = 'admin') {
    const order = await Order.findById(id);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    // Handle cancellation: restore stock once and safely
    if (status === 'cancelled' && !order.stockRestored) {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
      order.stockRestored = true;
      emitEvent('inventory:updated', { reason: 'order_cancelled', orderNumber: order.orderNumber });
    }

    order.status = status;
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order marked as ${status.replace(/_/g, ' ')}.`,
      updatedBy,
    });

    const savedOrder = await order.save();

    // Real-time synchronization
    emitEvent('order:updated', savedOrder);
    emitEvent('analytics:updated');

    return savedOrder;
  },

  async getDashboardAnalytics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 7-day range for real trend calculation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      activeOrders,
      todayOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenueResult,
      todayRevenueResult,
      statusCounts,
      totalProducts,
      activeProducts,
      outOfStockCount,
      lowStockCount,
      lowStockItems,
      recentOrders,
      dailyStatsResult,
      bestSellersResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['placed', 'preparing', 'out_for_delivery'] } }),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, todayRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Product.countDocuments(),
      Product.countDocuments({ isAvailable: true }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.find({ stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(10)
        .select('name stock price image imageUrl isAvailable isActive'),
      Order.find().sort({ createdAt: -1 }).limit(6),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
    const todayRevenue = todayRevenueResult[0]?.todayRevenue || 0;

    // Map the 7-day stats ensuring all 7 dates exist
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = {};
    dailyStatsResult.forEach((item) => {
      dailyMap[item._id] = item;
    });

    const salesOverview = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const found = dailyMap[dateKey];
      salesOverview.push({
        date: dateKey,
        dayName: dayNames[d.getDay()],
        orders: found ? found.orders : 0,
        revenue: found ? found.revenue : 0,
      });
    }

    const pendingOrders = await Order.countDocuments({ status: { $in: ['placed', 'preparing'] } });

    return {
      totalOrders,
      activeOrders,
      todayOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayRevenue,
      totalProducts,
      activeProducts,
      outOfStockCount,
      lowStockCount,
      lowStockItems,
      recentOrders,
      salesOverview,
      bestSellers: bestSellersResult,
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    };
  },
};

