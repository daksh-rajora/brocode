import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { StoreSetting } from '../models/StoreSetting.js';
import { generateToken } from '../utils/token.js';

let adminToken = '';
let studentToken = '';
let testProduct = null;
const createdOrderIds = [];

beforeAll(async () => {
  await connectDB();

  // Create or find Admin User
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Delivery Admin Tester',
      email: 'delivery_admin@brocode.hostel',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'admin',
    });
  }
  adminToken = generateToken(admin);

  // Create or find regular non-admin Student User
  let student = await User.findOne({ email: 'student_tester@brocode.hostel' });
  if (!student) {
    student = await User.create({
      name: 'Student Tester',
      email: 'student_tester@brocode.hostel',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'student',
    });
  }
  studentToken = generateToken(student);

  // Create test product with high stock
  testProduct = await Product.create({
    name: 'Delivery Test Snack Wafers',
    description: 'Crispy hostel snack for testing delivery calculation',
    price: 60,
    stock: 200,
    image: '/packs/lays.jpg',
    imageUrl: '/packs/lays.jpg',
    isActive: true,
    isAvailable: true,
  });
});

afterAll(async () => {
  if (testProduct?._id) {
    await Product.findByIdAndDelete(testProduct._id);
  }
  for (const ordId of createdOrderIds) {
    await Order.findByIdAndDelete(ordId);
  }
  await closeDB();
});

describe('Dynamic Delivery Charges Workflow Suite', () => {
  describe('1. Security & Authorization Controls', () => {
    it('should reject unauthenticated attempt to update delivery settings with 401', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .send({ deliveryFee: 25 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin student user attempt to update delivery settings with 403', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ deliveryFee: 25 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Administrator privileges required/i);
    });

    it('should reject negative delivery charge values with validation error (422)', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryFee: -10 });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-numeric delivery charge values with validation error (422)', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryFee: 'free_delivery' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Scenario: Delivery Charge = ₹10', () => {
    let order1Id = '';

    it('Admin sets delivery charge to ₹10 → Store settings updated and persisted in MongoDB', async () => {
      const updateRes = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryFee: 10, minOrderAmount: 0 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.deliveryFee).toBe(10);

      // Verify GET /settings reflects ₹10
      const getRes = await request(app).get('/api/v1/settings');
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.deliveryFee).toBe(10);
    });

    it('Customer places an order → backend uses ₹10 delivery charge (Subtotal = ₹120, Total = ₹130)', async () => {
      const orderPayload = {
        studentName: 'Aman Sharma',
        studentPhone: '9876543210',
        hostelBlock: 'BH1',
        roomNumber: '304',
        orderType: 'delivery',
        paymentMethod: 'upi_on_delivery',
        items: [{ productId: testProduct._id, quantity: 2 }],
      };

      const res = await request(app).post('/api/v1/orders').send(orderPayload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const orderData = res.body.data;
      order1Id = orderData._id;
      createdOrderIds.push(order1Id);

      expect(orderData.subtotal).toBe(120); // 2 * 60
      expect(orderData.deliveryFee).toBe(10);
      expect(orderData.totalAmount).toBe(130); // 120 + 10

      // Verify persisted snapshot in database
      const dbOrder = await Order.findById(order1Id);
      expect(dbOrder.subtotal).toBe(120);
      expect(dbOrder.deliveryFee).toBe(10);
      expect(dbOrder.totalAmount).toBe(130);
    });
  });

  describe('3. Scenario: Admin Changes Delivery Charge from ₹10 to ₹20', () => {
    let order2Id = '';

    it('Admin changes delivery charge to ₹20 → Store settings updated', async () => {
      const updateRes = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryFee: 20 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.deliveryFee).toBe(20);

      const getRes = await request(app).get('/api/v1/settings');
      expect(getRes.body.data.deliveryFee).toBe(20);
    });

    it('Existing order previously placed retains original ₹10 delivery charge and ₹130 total', async () => {
      const existingOrderId = createdOrderIds[0];
      const res = await request(app).get(`/api/v1/orders/${existingOrderId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deliveryFee).toBe(10);
      expect(res.body.data.totalAmount).toBe(130);
      expect(res.body.data.subtotal).toBe(120);
    });

    it('Subsequent new order automatically uses ₹20 delivery charge (Subtotal = ₹120, Total = ₹140)', async () => {
      const orderPayload = {
        studentName: 'Rohan Verma',
        studentPhone: '9876543211',
        hostelBlock: 'BH2',
        roomNumber: '102',
        orderType: 'delivery',
        paymentMethod: 'cash_on_delivery',
        items: [{ productId: testProduct._id, quantity: 2 }],
      };

      const res = await request(app).post('/api/v1/orders').send(orderPayload);
      expect(res.status).toBe(201);

      const orderData = res.body.data;
      order2Id = orderData._id;
      createdOrderIds.push(order2Id);

      expect(orderData.subtotal).toBe(120);
      expect(orderData.deliveryFee).toBe(20);
      expect(orderData.totalAmount).toBe(140); // 120 + 20

      // Verify persisted snapshot in database
      const dbOrder = await Order.findById(order2Id);
      expect(dbOrder.deliveryFee).toBe(20);
      expect(dbOrder.totalAmount).toBe(140);
    });
  });

  describe('4. Scenario: Admin Changes Delivery Charge from ₹20 to ₹0 (Free Delivery)', () => {
    let order3Id = '';

    it('Admin sets delivery charge to ₹0 → Store settings updated for free delivery', async () => {
      const updateRes = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryFee: 0 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.deliveryFee).toBe(0);

      const getRes = await request(app).get('/api/v1/settings');
      expect(getRes.body.data.deliveryFee).toBe(0);
    });

    it('Historical orders placed earlier retain original delivery fees (Order 1: ₹10, Order 2: ₹20)', async () => {
      const order1 = await Order.findById(createdOrderIds[0]);
      expect(order1.deliveryFee).toBe(10);
      expect(order1.totalAmount).toBe(130);

      const order2 = await Order.findById(createdOrderIds[1]);
      expect(order2.deliveryFee).toBe(20);
      expect(order2.totalAmount).toBe(140);
    });

    it('Subsequent new order receives FREE delivery (Subtotal = ₹120, Total = ₹120, Delivery = ₹0)', async () => {
      const orderPayload = {
        studentName: 'Priya Patel',
        studentPhone: '9876543212',
        hostelBlock: 'BH3-A',
        roomNumber: '405',
        orderType: 'delivery',
        paymentMethod: 'upi_on_delivery',
        items: [{ productId: testProduct._id, quantity: 2 }],
      };

      const res = await request(app).post('/api/v1/orders').send(orderPayload);
      expect(res.status).toBe(201);

      const orderData = res.body.data;
      order3Id = orderData._id;
      createdOrderIds.push(order3Id);

      expect(orderData.subtotal).toBe(120);
      expect(orderData.deliveryFee).toBe(0);
      expect(orderData.totalAmount).toBe(120); // 120 + 0

      // Verify persisted snapshot in database
      const dbOrder = await Order.findById(order3Id);
      expect(dbOrder.deliveryFee).toBe(0);
      expect(dbOrder.totalAmount).toBe(120);
    });
  });

  describe('5. Fulfillment & Security Protections', () => {
    it('Self-Pickup orders always calculate ₹0 delivery fee regardless of configured default', async () => {
      // First set delivery fee back to ₹25
      await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryFee: 25 });

      const pickupPayload = {
        studentName: 'Karan Mehra',
        studentPhone: '9876543213',
        hostelBlock: 'BH1',
        roomNumber: '101',
        orderType: 'pickup',
        paymentMethod: 'cash_on_delivery',
        items: [{ productId: testProduct._id, quantity: 2 }],
      };

      const res = await request(app).post('/api/v1/orders').send(pickupPayload);
      expect(res.status).toBe(201);

      const orderData = res.body.data;
      createdOrderIds.push(orderData._id);

      expect(orderData.orderType).toBe('pickup');
      expect(orderData.deliveryFee).toBe(0);
      expect(orderData.totalAmount).toBe(120);
    });

    it('Client manipulation resistance: backend ignores forged deliveryFee or totalAmount in request body', async () => {
      // Configured delivery fee is ₹25
      const forgedPayload = {
        studentName: 'Hacker Student',
        studentPhone: '9876543214',
        hostelBlock: 'BH2',
        roomNumber: '202',
        orderType: 'delivery',
        paymentMethod: 'upi_on_delivery',
        items: [{ productId: testProduct._id, quantity: 2 }],
        deliveryFee: 0, // Attempted tamper to bypass shipping
        totalAmount: 1, // Attempted tamper to pay ₹1
      };

      const res = await request(app).post('/api/v1/orders').send(forgedPayload);
      expect(res.status).toBe(201);

      const orderData = res.body.data;
      createdOrderIds.push(orderData._id);

      // Backend must calculate based on trusted product price (60 * 2 = 120) and StoreSetting deliveryFee (25)
      expect(orderData.subtotal).toBe(120);
      expect(orderData.deliveryFee).toBe(25);
      expect(orderData.totalAmount).toBe(145);
    });
  });
});
