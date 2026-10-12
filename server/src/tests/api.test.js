import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { generateToken } from '../utils/token.js';

let adminToken = '';

beforeAll(async () => {
  await connectDB();
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin Test',
      email: 'admin_test@brocode.hostel',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'admin',
    });
  }
  adminToken = generateToken(admin);
});

afterAll(async () => {
  await closeDB();
});


describe('Bro Code Backend API Suite', () => {
  describe('GET /api/v1/health', () => {
    it('should return health status with accurate database status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('service', 'Bro Code Backend API');
      expect(res.body.data).toHaveProperty('database');
      expect(res.body.data.database).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/settings', () => {
    it('should retrieve store settings including hostel blocks and timings', async () => {
      const res = await request(app).get('/api/v1/settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isOpen');
      expect(res.body.data).toHaveProperty('hostelBlocks');
    });
  });

  describe('GET /api/v1/products', () => {
    it('should fetch snack catalog as an array', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should block unauthorized snack creation with 401', async () => {
      const res = await request(app).post('/api/v1/products').send({
        name: 'Midnight Maggi',
        price: 40,
        category: 'instant_noodles',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/orders - Delivery vs Pickup & Stock Logic', () => {
    it('should reject order with missing required fields with 422', async () => {
      const res = await request(app).post('/api/v1/orders').send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should properly calculate pickup fee as 0 and deduct stock', async () => {
      // Find a real product from database
      const productsRes = await request(app).get('/api/v1/products');
      const testProduct = productsRes.body.data?.[0];
      if (!testProduct) return;

      const settingsRes = await request(app).get('/api/v1/settings');
      const minAmount = settingsRes.body.data?.minOrderAmount || 0;
      const qty = Math.max(1, Math.ceil(minAmount / testProduct.price));

      const initialStock = testProduct.stock;

      // Place a pickup order
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .send({
          studentName: 'Test Student',
          studentPhone: '9988776655',
          hostelBlock: 'Block A (Boys Hostel)',
          roomNumber: '101',
          orderType: 'pickup',
          paymentMethod: 'cash_on_delivery',
          items: [{ productId: testProduct._id, quantity: qty }],
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.data.orderType).toBe('pickup');
      expect(orderRes.body.data.deliveryFee).toBe(0);
      expect(orderRes.body.data.totalAmount).toBe(testProduct.price * qty);

      // Verify stock was deducted
      const updatedProductRes = await request(app).get(`/api/v1/products/${testProduct._id}`);
      expect(updatedProductRes.body.data.stock).toBe(initialStock - qty);

      // Cancel order and verify stock is safely restored
      const createdOrderId = orderRes.body.data._id;
      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled', note: 'Test cancellation' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('cancelled');
      expect(cancelRes.body.data.stockRestored).toBe(true);

      const restoredProductRes = await request(app).get(`/api/v1/products/${testProduct._id}`);
      expect(restoredProductRes.body.data.stock).toBe(initialStock);

      // Verify cancelling again does NOT double-restore stock
      await request(app)
        .patch(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled', note: 'Second cancel attempt' });

      const finalProductRes = await request(app).get(`/api/v1/products/${testProduct._id}`);
      expect(finalProductRes.body.data.stock).toBe(initialStock);
    });
  });

  describe('GET /api/v1/orders/admin/analytics', () => {
    it('should return analytics with 7-day sales breakdown and status breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/orders/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalOrders');
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('salesOverview');
      expect(Array.isArray(res.body.data.salesOverview)).toBe(true);
      expect(res.body.data.salesOverview.length).toBe(7);
      expect(res.body.data).toHaveProperty('statusBreakdown');
    });
  });



  describe('POST /api/v1/auth/login', () => {
    it('should reject invalid credentials with 401', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'invalid_nonexistent@brocode.hostel',
        password: 'wrong_password_123',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('404 Route Handler', () => {
    it('should return standardized 404 error for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Resource not found');
    });
  });
});
