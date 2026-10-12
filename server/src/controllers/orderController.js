import { orderService } from '../services/orderService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    return sendSuccess(res, order, 'Order placed successfully! Bro is preparing your snacks.', 201);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    return sendSuccess(res, order, 'Order details retrieved');
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return sendError(res, 'Please provide an Order Number or Phone Number to track', 400);
    }

    const trimmed = query.trim();
    // Check if query looks like an order number (e.g., BRO-...)
    if (trimmed.toUpperCase().startsWith('BRO') || trimmed.includes('-')) {
      const order = await orderService.getOrderByNumber(trimmed);
      if (!order) {
        return sendError(res, 'No order found with this Order ID.', 404);
      }
      return sendSuccess(res, [order], 'Order found');
    }

    // Otherwise search by phone number
    const orders = await orderService.getOrdersByPhone(trimmed);
    if (!orders || orders.length === 0) {
      return sendError(res, 'No orders found matching this phone number.', 404);
    }

    return sendSuccess(res, orders, `Found ${orders.length} order(s)`);
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, limit, page } = req.query;
    const result = await orderService.getAllOrders({ status, search, limit, page });
    return sendSuccess(res, result, 'Orders list retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const updatedOrder = await orderService.updateOrderStatus(
      req.params.id,
      status,
      note,
      req.user ? req.user.name : 'admin'
    );
    return sendSuccess(res, updatedOrder, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const stats = await orderService.getDashboardAnalytics();
    return sendSuccess(res, stats, 'Dashboard analytics retrieved');
  } catch (error) {
    next(error);
  }
};
