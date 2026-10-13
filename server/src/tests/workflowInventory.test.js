import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { generateToken } from '../utils/token.js';
import { orderService } from '../services/orderService.js';

let adminToken = '';
let testProductId = '';

beforeAll(async () => {
  await connectDB();
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin Tester',
      email: 'workflow_admin@brocode.hostel',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'admin',
    });
  }
  adminToken = generateToken(admin);
});

afterAll(async () => {
  if (testProductId) {
    await Product.findByIdAndDelete(testProductId);
  }
  await closeDB();
});

describe('Requirement 8: Complete Customer-to-Admin Workflow & Real Inventory Test', () => {
  it('Step 1 & 2: Add a new snack via admin with Cloudinary image, price ₹50, and stock 10 (no category required)', async () => {
    const newSnack = {
      name: 'Hostel Masala Peri Peri Crunchies',
      description: 'Late night spicy potato wafers crisped to perfection',
      price: 50,
      stock: 10,
      image: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/peri_peri.jpg',
      imageUrl: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/peri_peri.jpg',
      cloudinaryPublicId: 'brocode/products/peri_peri_test',
      isActive: true,
      isAvailable: true,
    };

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newSnack);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.price).toBe(50);
    expect(res.body.data.stock).toBe(10);
    expect(res.body.data.name).toBe(newSnack.name);
    testProductId = res.body.data._id;
  });

  it('Step 3: Verify the saved product and image appear on the customer storefront', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const found = res.body.data.find((p) => p._id.toString() === testProductId.toString());
    expect(found).toBeDefined();
    expect(found.stock).toBe(10);
    expect(found.price).toBe(50);
    expect(found.imageUrl || found.image).toContain('cloudinary.com');
  });

  it('Step 4 & 5: Place an order for 3 units; verify order succeeds and stock changes from 10 to 7', async () => {
    const orderPayload = {
      studentName: 'Aarav Sharma',
      studentPhone: '9876543210',
      hostelBlock: 'BH1',
      roomNumber: '304',
      items: [
        {
          productId: testProductId,
          quantity: 3,
        },
      ],
      paymentMethod: 'cash_on_delivery',
      orderType: 'delivery',
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].quantity).toBe(3);

    // Verify stock in database is now 7
    const productInDb = await Product.findById(testProductId);
    expect(productInDb.stock).toBe(7);
  });

  it('Step 6: Refresh customer storefront and verify stock is accurately reflected as 7', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    const found = res.body.data.find((p) => p._id.toString() === testProductId.toString());
    expect(found).toBeDefined();
    expect(found.stock).toBe(7);
  });

  it('Step 7: Try to order 8 units when only 7 remain; backend must reject without changing stock', async () => {
    const excessiveOrderPayload = {
      studentName: 'Dev Patel',
      studentPhone: '9876543211',
      hostelBlock: 'BH2',
      roomNumber: '112',
      items: [
        {
          productId: testProductId,
          quantity: 8,
        },
      ],
      paymentMethod: 'cash_on_delivery',
      orderType: 'delivery',
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(excessiveOrderPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Insufficient stock/i);

    // Verify stock did NOT change
    const productInDb = await Product.findById(testProductId);
    expect(productInDb.stock).toBe(7);
  });

  it('Step 8: Test an out-of-stock product and an inactive product', async () => {
    // Create an out-of-stock product (stock 0, active)
    const outOfStockSnack = await Product.create({
      name: 'Out of Stock Test Wafers',
      description: 'Temporarily finished inventory',
      price: 30,
      stock: 0,
      image: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/oos.jpg',
      imageUrl: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/oos.jpg',
      isActive: true,
      isAvailable: true,
    });

    // Create an inactive product (stock 20, isActive false)
    const inactiveSnack = await Product.create({
      name: 'Hidden Inactive Test Snack',
      description: 'Hidden unlisted inventory',
      price: 45,
      stock: 20,
      image: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/inactive.jpg',
      imageUrl: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/inactive.jpg',
      isActive: false,
      isAvailable: false,
    });

    // Customer storefront request (public guest without token)
    const publicRes = await request(app).get('/api/v1/products');
    expect(publicRes.status).toBe(200);

    const publicIds = publicRes.body.data.map((p) => p._id.toString());

    // Out of stock product SHOULD be visible on customer side
    expect(publicIds).toContain(outOfStockSnack._id.toString());

    // Inactive product must NOT be visible on customer side
    expect(publicIds).not.toContain(inactiveSnack._id.toString());

    // Attempting to order the out of stock product must fail
    const oosOrderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        studentName: 'Kunal Verma',
        studentPhone: '9876543212',
        hostelBlock: 'BH3-A',
        roomNumber: '201',
        items: [{ productId: outOfStockSnack._id, quantity: 1 }],
      });

    expect(oosOrderRes.status).toBe(400);

    // Clean up temporary test items
    await Product.findByIdAndDelete(outOfStockSnack._id);
    await Product.findByIdAndDelete(inactiveSnack._id);
  });

  it('Step 9: Test order cancellation restores stock exactly once', async () => {
    // Order 2 units of testProductId (stock 7 -> 5)
    const order = await orderService.createOrder({
      studentName: 'Rohan Mehra',
      studentPhone: '9876543214',
      hostelBlock: 'BH3-B',
      roomNumber: '404',
      items: [{ productId: testProductId, quantity: 2 }],
      paymentMethod: 'cash_on_delivery',
    });

    let productNow = await Product.findById(testProductId);
    expect(productNow.stock).toBe(5);

    // Cancel order -> stock restored (5 -> 7)
    await orderService.updateOrderStatus(order._id, 'cancelled', 'Student cancelled');
    productNow = await Product.findById(testProductId);
    expect(productNow.stock).toBe(7);

    // Updating status again must NOT double-restore stock
    await orderService.updateOrderStatus(order._id, 'cancelled', 'Duplicate cancel event');
    productNow = await Product.findById(testProductId);
    expect(productNow.stock).toBe(7);
  });

  it('Step 9 (Concurrency): Simultaneous orders competing for remaining stock prevent negative inventory', async () => {
    // Current stock is 7. Try to place 3 concurrent orders of 3 units each (total 9 requested)
    const orderPromises = [1, 2, 3].map((idx) =>
      request(app)
        .post('/api/v1/orders')
        .send({
          studentName: `Competitor ${idx}`,
          studentPhone: `987654329${idx}`,
          hostelBlock: 'BH1',
          roomNumber: `10${idx}`,
          items: [{ productId: testProductId, quantity: 3 }],
        })
    );

    const results = await Promise.all(orderPromises);
    const successfulOrders = results.filter((r) => r.status === 201);
    const rejectedOrders = results.filter((r) => r.status === 400);

    // Exactly 2 orders can succeed (2 * 3 = 6 units), the 3rd must fail because only 1 unit remains!
    expect(successfulOrders.length).toBe(2);
    expect(rejectedOrders.length).toBe(1);

    // Final stock must be exactly 1, NEVER negative!
    const finalProduct = await Product.findById(testProductId);
    expect(finalProduct.stock).toBe(1);
    expect(finalProduct.stock).toBeGreaterThanOrEqual(0);
  });

  describe('Product Pricing & ₹25 Price Persistence Flow', () => {
    let createdPricingProductId = '';
    let sellingPriceProductId = '';

    afterAll(async () => {
      if (createdPricingProductId) {
        await Product.findByIdAndDelete(createdPricingProductId);
      }
      if (sellingPriceProductId) {
        await Product.findByIdAndDelete(sellingPriceProductId);
      }
    });

    it('should create product with price of 25 and save 25 as a valid number in MongoDB', async () => {
      const payload = {
        name: 'Kurkure Solid Masti 25',
        description: 'Iconic crunchy midnight snack priced at exactly 25 rupees',
        price: 25,
        sellingPrice: 25,
        selling_price: 25,
        stock: 30,
        image: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/kurkure_25.jpg',
        imageUrl: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/kurkure_25.jpg',
        isAvailable: true,
        isActive: true,
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(25);
      expect(res.body.data.sellingPrice).toBe(25);
      expect(res.body.data.selling_price).toBe(25);
      expect(typeof res.body.data.price).toBe('number');
      expect(res.body.data.stock).toBe(30);

      createdPricingProductId = res.body.data._id;

      // Verify directly in MongoDB database
      const dbProduct = await Product.findById(createdPricingProductId);
      expect(dbProduct).toBeDefined();
      expect(dbProduct.price).toBe(25);
      expect(typeof dbProduct.price).toBe('number');
      expect(dbProduct.sellingPrice).toBe(25);
      expect(dbProduct.selling_price).toBe(25);
      expect(dbProduct.stock).toBe(30);
    });

    it('should create product when payload uses sellingPrice without price', async () => {
      const payload = {
        name: 'Choco Delight Bar 25',
        description: 'Sweet bar priced with sellingPrice property',
        sellingPrice: 25,
        stock: 15,
        image: 'https://res.cloudinary.com/dkuteotny/image/upload/v1791802344/brocode/products/choco_25.jpg',
        isAvailable: true,
        isActive: true,
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(25);
      expect(res.body.data.sellingPrice).toBe(25);
      expect(res.body.data.selling_price).toBe(25);
      expect(res.body.data.stock).toBe(15);

      sellingPriceProductId = res.body.data._id;

      const dbProduct = await Product.findById(sellingPriceProductId);
      expect(dbProduct.price).toBe(25);
      expect(typeof dbProduct.price).toBe('number');
      expect(dbProduct.stock).toBe(15);
    });

    it('should display saved price of 25 after fetching product from catalog and by ID', async () => {
      // 1. Fetch from public catalog
      const listRes = await request(app).get('/api/v1/products');
      expect(listRes.status).toBe(200);

      const found = listRes.body.data.find(
        (p) => p._id.toString() === createdPricingProductId.toString()
      );
      expect(found).toBeDefined();
      expect(found.price).toBe(25);
      expect(found.sellingPrice).toBe(25);
      expect(found.selling_price).toBe(25);
      expect(found.stock).toBe(30);

      // 2. Fetch by ID
      const singleRes = await request(app).get(`/api/v1/products/${createdPricingProductId}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.data.price).toBe(25);
      expect(singleRes.body.data.sellingPrice).toBe(25);
      expect(singleRes.body.data.selling_price).toBe(25);
      expect(singleRes.body.data.stock).toBe(30);
    });
  });
});
