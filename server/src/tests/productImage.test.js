import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { generateToken } from '../utils/token.js';

let adminToken = '';
let studentToken = '';

beforeAll(async () => {
  await connectDB();

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin Tester',
      email: 'admin_image_test@brocode.hostel',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'admin',
    });
  }
  adminToken = generateToken(admin);

  // Generate a non-admin token to test requireAdmin rejection
  studentToken = generateToken({
    id: new mongoose.Types.ObjectId(),
    email: 'student_tester@brocode.hostel',
    role: 'student',
  });
});

afterAll(async () => {
  await closeDB();
});

describe('Cloudinary & Product Endpoints Suite', () => {
  describe('Authentication & Protection', () => {
    it('should reject unauthenticated upload requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/products/upload-image')
        .attach('image', Buffer.from('fake-image-content'), 'test.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin users from uploading with 401 or 403', async () => {
      const res = await request(app)
        .post('/api/v1/products/upload-image')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('image', Buffer.from('fake-image-content'), 'test.jpg');

      expect([401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid non-image file formats with 400', async () => {
      const res = await request(app)
        .post('/api/v1/products/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('console.log("hello")'), {
          filename: 'malicious.js',
          contentType: 'application/javascript',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only JPEG, PNG, and WebP');
    });
  });

  describe('Product Catalogue & Featured Endpoints', () => {
    it('GET /api/v1/products/featured returns featured products', async () => {
      const res = await request(app).get('/api/v1/products/featured');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/products/:idOrSlug retrieves product by ID and by slug', async () => {
      const productsRes = await request(app).get('/api/v1/products?limit=1');
      const testItem = productsRes.body.data?.[0];
      expect(testItem).toBeDefined();

      // Retrieve by _id
      const byIdRes = await request(app).get(`/api/v1/products/${testItem._id}`);
      expect(byIdRes.status).toBe(200);
      expect(byIdRes.body.data.name).toBe(testItem.name);
      expect(byIdRes.body.data).toHaveProperty('imageUrl');

      // Retrieve by slug
      if (testItem.slug) {
        const bySlugRes = await request(app).get(`/api/v1/products/${testItem.slug}`);
        expect(bySlugRes.status).toBe(200);
        expect(bySlugRes.body.data._id).toBe(testItem._id);
      }
    });
  });

  describe('Product Lifecycle with Cloudinary Metadata', () => {
    let createdProductId = '';
    const mockCloudinaryUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v12345/brocode/products/snack_sample.jpg';
    const mockCloudinaryPublicId = 'brocode/products/snack_sample';

    it('POST /api/v1/admin/products should create product and store secure_url and public_id', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Super Crunch Nachos Test',
          description: 'Spicy salsa nachos for midnight gaming sessions',
          price: 45,
          category: 'chips',
          brand: 'Doritos',
          weight: '60g',
          imageUrl: mockCloudinaryUrl,
          cloudinaryPublicId: mockCloudinaryPublicId,
          stock: 30,
          hostelFavorite: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.imageUrl).toBe(mockCloudinaryUrl);
      expect(res.body.data.cloudinaryPublicId).toBe(mockCloudinaryPublicId);
      expect(res.body.data.slug).toBeDefined();

      createdProductId = res.body.data._id;
    });

    it('PATCH /api/v1/admin/products/:id should update product and replace image metadata', async () => {
      const updatedUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v67890/brocode/products/snack_replaced.jpg';
      const updatedPublicId = 'brocode/products/snack_replaced';

      const res = await request(app)
        .patch(`/api/v1/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 50,
          imageUrl: updatedUrl,
          cloudinaryPublicId: updatedPublicId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(50);
      expect(res.body.data.imageUrl).toBe(updatedUrl);
      expect(res.body.data.cloudinaryPublicId).toBe(updatedPublicId);
    });

    it('DELETE /api/v1/admin/products/:id should delete product record', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion from DB
      const checkRes = await request(app).get(`/api/v1/products/${createdProductId}`);
      expect(checkRes.status).toBe(404);
    });
  });
});
