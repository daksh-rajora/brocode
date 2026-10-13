import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { StoreSetting } from '../models/StoreSetting.js';
import { generateToken } from '../utils/token.js';

describe('UPI QR Payment Flow & Admin Verification Suite', () => {
  let adminToken;
  let testSnack;

  beforeAll(async () => {
    await connectDB();

    // Create an admin user for authorized testing
    let admin = await User.findOne({ email: 'admin-upi-test@brocode.test' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Bro Admin',
        email: 'admin-upi-test@brocode.test',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'admin',
      });
    }

    adminToken = generateToken(admin);
  });

  afterAll(async () => {
    await Order.deleteMany({ studentPhone: { $regex: /^9900/ } });
    await Product.deleteMany({ name: { $regex: /UPI Test Snack/ } });
    await User.deleteMany({ email: 'admin-upi-test@brocode.test' });
    await closeDB();
  });

  beforeEach(async () => {
    await Order.deleteMany({ studentPhone: { $regex: /^9900/ } });
    await Product.deleteMany({ name: { $regex: /UPI Test Snack/ } });

    // Ensure store is open with default delivery fee
    await StoreSetting.findOneAndUpdate(
      {},
      {
        isOpen: true,
        minOrderAmount: 20,
        deliveryFee: 15,
        announcement: 'Open for midnight testing',
      },
      { upsert: true, new: true }
    );

    testSnack = await Product.create({
      name: 'UPI Test Snack Bar',
      category: 'munchies',
      price: 40,
      costPrice: 20,
      stock: 50,
      image: '/packs/lays.jpg',
      description: 'Crunchy midnight snack for test suite',
      isAvailable: true,
      isActive: true,
    });
  });

  it('should create UPI order with paymentStatus "pending_verification" and deduct stock', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Aman Sharma',
        studentPhone: '9900112233',
        hostelBlock: 'BH1',
        roomNumber: '204',
        paymentMethod: 'upi',
        orderType: 'delivery',
        deliveryNotes: 'Call upon arrival',
        items: [{ productId: testSnack._id.toString(), quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const order = res.body.data;

    expect(order.orderNumber).toMatch(/^BRO-/);
    expect(order.studentName).toBe('Aman Sharma');
    expect(order.hostelBlock).toBe('BH1');
    expect(order.roomNumber).toBe('204');
    expect(order.paymentMethod).toBe('upi');
    expect(order.paymentStatus).toBe('pending_verification');
    expect(order.status).toBe('placed');
    expect(order.subtotal).toBe(80); // 40 * 2
    expect(order.deliveryFee).toBe(15);
    expect(order.totalAmount).toBe(95);

    // Verify stock was deducted atomically
    const updatedSnack = await Product.findById(testSnack._id);
    expect(updatedSnack.stock).toBe(48);

    // Verify persisted record directly in MongoDB
    const dbOrder = await Order.findOne({ orderNumber: order.orderNumber });
    expect(dbOrder).not.toBeNull();
    expect(dbOrder.paymentStatus).toBe('pending_verification');
    expect(dbOrder.paymentMethod).toBe('upi');
  });

  it('should create Cash on Delivery order with paymentStatus "pending"', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Rohan Verma',
        studentPhone: '9900223344',
        hostelBlock: 'BH2',
        roomNumber: '112',
        paymentMethod: 'cash_on_delivery',
        orderType: 'delivery',
        items: [{ productId: testSnack._id.toString(), quantity: 1 }],
      });

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.paymentMethod).toBe('cash_on_delivery');
    expect(order.paymentStatus).toBe('pending');
    expect(order.totalAmount).toBe(55); // 40 + 15
  });

  it('should accept legacy "upi_on_delivery" and map to "pending_verification"', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Vikram Singh',
        studentPhone: '9900334455',
        hostelBlock: 'BH3-A',
        roomNumber: '315',
        paymentMethod: 'upi_on_delivery',
        orderType: 'delivery',
        items: [{ productId: testSnack._id.toString(), quantity: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentStatus).toBe('pending_verification');
  });

  it('should reject order if insufficient stock is available', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Kunal Dixit',
        studentPhone: '9900445566',
        hostelBlock: 'BH3-B',
        roomNumber: '402',
        paymentMethod: 'upi',
        items: [{ productId: testSnack._id.toString(), quantity: 999 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Insufficient stock/i);

    // Product stock remains unaffected
    const snackCheck = await Product.findById(testSnack._id);
    expect(snackCheck.stock).toBe(50);
  });

  it('admin: should filter orders by paymentMethod and paymentStatus', async () => {
    // Create 1 UPI order and 1 COD order
    await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Student One',
        studentPhone: '9900556677',
        hostelBlock: 'BH1',
        roomNumber: '101',
        paymentMethod: 'upi',
        items: [{ productId: testSnack._id.toString(), quantity: 1 }],
      });

    await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Student Two',
        studentPhone: '9900556688',
        hostelBlock: 'BH2',
        roomNumber: '102',
        paymentMethod: 'cash_on_delivery',
        items: [{ productId: testSnack._id.toString(), quantity: 1 }],
      });

    // Query UPI orders
    const upiRes = await request(app)
      .get('/api/v1/orders/admin/all?paymentMethod=upi')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(upiRes.status).toBe(200);
    const upiOrders = upiRes.body.data.orders.filter((o) =>
      o.studentPhone.startsWith('990055')
    );
    expect(upiOrders.length).toBe(1);
    expect(upiOrders[0].paymentMethod).toBe('upi');
    expect(upiOrders[0].paymentStatus).toBe('pending_verification');

    // Query Pending Verification orders
    const pendingVerifRes = await request(app)
      .get('/api/v1/orders/admin/all?paymentStatus=pending_verification')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingVerifRes.status).toBe(200);
    const verifOrders = pendingVerifRes.body.data.orders.filter((o) =>
      o.studentPhone.startsWith('990055')
    );
    expect(verifOrders.length).toBe(1);
    expect(verifOrders[0].paymentStatus).toBe('pending_verification');
  });

  it('admin: authorized admin can verify UPI payment and update paymentStatus to "paid"', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Deepak Rao',
        studentPhone: '9900667788',
        hostelBlock: 'BH3-A',
        roomNumber: '220',
        paymentMethod: 'upi',
        items: [{ productId: testSnack._id.toString(), quantity: 1 }],
      });

    const orderId = orderRes.body.data._id;

    // Verify payment via PATCH /orders/:id/payment-status
    const updateRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/payment-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentStatus: 'paid',
        note: 'UPI payment verified against bank statement (UTR confirmed)',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.paymentStatus).toBe('paid');

    // Check database record
    const updatedDb = await Order.findById(orderId);
    expect(updatedDb.paymentStatus).toBe('paid');
    const latestHistory = updatedDb.statusHistory[updatedDb.statusHistory.length - 1];
    expect(latestHistory.note).toMatch(/UTR confirmed|Payment status updated to paid/i);
  });

  it('security: rejects unauthorized users attempting to update payment status', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Hacker Attempt',
        studentPhone: '9900778899',
        hostelBlock: 'BH1',
        roomNumber: '100',
        paymentMethod: 'upi',
        items: [{ productId: testSnack._id.toString(), quantity: 1 }],
      });

    const orderId = orderRes.body.data._id;

    // Attempt without token
    const noAuthRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/payment-status`)
      .send({ paymentStatus: 'paid' });

    expect(noAuthRes.status).toBe(401);

    // Attempt with invalid token
    const badAuthRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/payment-status`)
      .set('Authorization', 'Bearer invalid-fake-jwt-token')
      .send({ paymentStatus: 'paid' });

    expect(badAuthRes.status).toBe(401);

    // Confirm database record was NOT altered
    const dbOrder = await Order.findById(orderId);
    expect(dbOrder.paymentStatus).toBe('pending_verification');
  });

  describe('Zero Minimum Order Restriction & Dynamic Amounts (₹12, ₹32, >₹50)', () => {
    let snack12;
    let snack22;

    beforeEach(async () => {
      snack12 = await Product.create({
        name: 'UPI Test Snack ₹12 Mini Stick',
        category: 'munchies',
        price: 12,
        costPrice: 6,
        stock: 25,
        image: '/packs/lays.jpg',
        description: 'Affordable mini snack',
        isAvailable: true,
        isActive: true,
      });

      snack22 = await Product.create({
        name: 'UPI Test Snack ₹22 Munch',
        category: 'munchies',
        price: 22,
        costPrice: 12,
        stock: 30,
        image: '/packs/lays.jpg',
        description: 'Snack munch for testing',
        isAvailable: true,
        isActive: true,
      });
    });

    it('should successfully place an order with total amount = ₹12 (below legacy ₹50 minimum)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          studentName: 'Mini Buyer',
          studentPhone: '9900881122',
          hostelBlock: 'BH2',
          roomNumber: '105',
          paymentMethod: 'upi',
          orderType: 'pickup', // Pickup has ₹0 delivery fee -> total = ₹12
          customerConfirmedPayment: true,
          items: [{ productId: snack12._id.toString(), quantity: 1 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const order = res.body.data;

      expect(order.subtotal).toBe(12);
      expect(order.deliveryFee).toBe(0);
      expect(order.totalAmount).toBe(12);
      expect(order.paymentMethod).toBe('upi');
      expect(order.paymentStatus).toBe('pending_verification');
      expect(order.customerConfirmedPayment).toBe(true);

      // Verify appearance in admin portal
      const adminRes = await request(app)
        .get('/api/v1/orders/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      const found = adminRes.body.data.orders.find((o) => o.orderNumber === order.orderNumber);
      expect(found).toBeDefined();
      expect(found.totalAmount).toBe(12);
      expect(found.studentName).toBe('Mini Buyer');
      expect(found.paymentMethod).toBe('upi');
      expect(found.paymentStatus).toBe('pending_verification');
    });

    it('should successfully place an order with total amount = ₹32 (e.g. ₹22 + ₹10 delivery)', async () => {
      // Set delivery fee to ₹10
      await StoreSetting.findOneAndUpdate({}, { deliveryFee: 10 });

      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          studentName: 'Mid Buyer',
          studentPhone: '9900883344',
          hostelBlock: 'BH3-A',
          roomNumber: '302',
          paymentMethod: 'cash_on_delivery',
          orderType: 'delivery',
          items: [{ productId: snack22._id.toString(), quantity: 1 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const order = res.body.data;

      expect(order.subtotal).toBe(22);
      expect(order.deliveryFee).toBe(10);
      expect(order.totalAmount).toBe(32);
      expect(order.paymentMethod).toBe('cash_on_delivery');
      expect(order.paymentStatus).toBe('pending');
      expect(order.customerConfirmedPayment).toBe(false);

      // Verify appearance in admin portal
      const adminRes = await request(app)
        .get('/api/v1/orders/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      const found = adminRes.body.data.orders.find((o) => o.orderNumber === order.orderNumber);
      expect(found).toBeDefined();
      expect(found.totalAmount).toBe(32);
      expect(found.paymentMethod).toBe('cash_on_delivery');
      expect(found.paymentStatus).toBe('pending');
    });

    it('should successfully place an order with total amount above ₹50 (e.g. ₹95) and display in admin portal', async () => {
      await StoreSetting.findOneAndUpdate({}, { deliveryFee: 15 });

      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          studentName: 'Large Order Buyer',
          studentPhone: '9900885566',
          hostelBlock: 'BH1',
          roomNumber: '410',
          paymentMethod: 'upi',
          orderType: 'delivery',
          customerConfirmedPayment: true,
          items: [{ productId: testSnack._id.toString(), quantity: 2 }],
        });

      expect(res.status).toBe(201);
      const order = res.body.data;
      expect(order.subtotal).toBe(80);
      expect(order.deliveryFee).toBe(15);
      expect(order.totalAmount).toBe(95);
      expect(order.totalAmount).toBeGreaterThan(50);
      expect(order.paymentMethod).toBe('upi');
      expect(order.paymentStatus).toBe('pending_verification');
      expect(order.customerConfirmedPayment).toBe(true);

      // Verify admin portal orders ledger returns all order details
      const adminRes = await request(app)
        .get('/api/v1/orders/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      const found = adminRes.body.data.orders.find((o) => o.orderNumber === order.orderNumber);
      expect(found).toBeDefined();
      expect(found.studentName).toBe('Large Order Buyer');
      expect(found.hostelBlock).toBe('BH1');
      expect(found.roomNumber).toBe('410');
      expect(found.studentPhone).toBe('9900885566');
      expect(found.items.length).toBe(1);
      expect(found.items[0].quantity).toBe(2);
      expect(found.subtotal).toBe(80);
      expect(found.deliveryFee).toBe(15);
      expect(found.totalAmount).toBe(95);
      expect(found.paymentMethod).toBe('upi');
      expect(found.paymentStatus).toBe('pending_verification');
      expect(found.status).toBe('placed');
      expect(found.createdAt).toBeDefined();
    });
  });
});
