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
      let productsRes = await request(app).get('/api/v1/products?limit=1');
      let testItem = productsRes.body.data?.[0];
      if (!testItem) {
        const created = await Product.create({
          name: 'Catalogue Test Snack',
          description: 'Delicious midnight crispy snack',
          price: 40,
          stock: 10,
          category: 'Snacks',
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        });
        testItem = created.toObject();
      }
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
        expect(bySlugRes.body.data._id).toBe(String(testItem._id));
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

  describe('Multiple Product Images Management & Gallery Suite', () => {
    let multiProdId = '';
    const img1 = {
      url: 'https://res.cloudinary.com/test-cloud/image/upload/v111/brocode/products/chips_front.jpg',
      publicId: 'brocode/products/chips_front',
      isCover: true,
      order: 0,
    };
    const img2 = {
      url: 'https://res.cloudinary.com/test-cloud/image/upload/v222/brocode/products/chips_back.jpg',
      publicId: 'brocode/products/chips_back',
      isCover: false,
      order: 1,
    };
    const img3 = {
      url: 'https://res.cloudinary.com/test-cloud/image/upload/v333/brocode/products/chips_nutrition.jpg',
      publicId: 'brocode/products/chips_nutrition',
      isCover: false,
      order: 2,
    };

    it('should create product with multiple ordered images and sync primary cover image', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Multi-Image Nachos Platter',
          description: 'Spicy salsa nachos with cheese dip and jalapenos',
          price: 75,
          category: 'chips',
          stock: 20,
          images: [img1, img2],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.images.length).toBe(2);

      // Verify images are stored with correct metadata
      expect(res.body.data.images[0].url).toBe(img1.url);
      expect(res.body.data.images[0].isCover).toBe(true);
      expect(res.body.data.images[1].url).toBe(img2.url);

      // Verify backward compatibility sync: image and imageUrl point to cover image
      expect(res.body.data.image).toBe(img1.url);
      expect(res.body.data.imageUrl).toBe(img1.url);
      expect(res.body.data.cloudinaryPublicId).toBe(img1.publicId);

      multiProdId = res.body.data._id;
    });

    it('should update product: add more images, reorder, and set a new cover image', async () => {
      // Reorder and make img3 the new cover
      const updatedImages = [
        { ...img3, isCover: true, order: 0 },
        { ...img1, isCover: false, order: 1 },
        { ...img2, isCover: false, order: 2 },
      ];

      const res = await request(app)
        .patch(`/api/v1/admin/products/${multiProdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          images: updatedImages,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images.length).toBe(3);

      // Verify new cover is img3
      const cover = res.body.data.images.find((i) => i.isCover);
      expect(cover).toBeDefined();
      expect(cover.url).toBe(img3.url);

      // Verify backward compatible sync fields point to img3
      expect(res.body.data.image).toBe(img3.url);
      expect(res.body.data.imageUrl).toBe(img3.url);
      expect(res.body.data.cloudinaryPublicId).toBe(img3.publicId);
    });

    it('should remove an image and preserve remaining images in order', async () => {
      // Remove img2
      const remainingImages = [
        { ...img3, isCover: true, order: 0 },
        { ...img1, isCover: false, order: 1 },
      ];

      const res = await request(app)
        .patch(`/api/v1/admin/products/${multiProdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          images: remainingImages,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.images.length).toBe(2);
      expect(res.body.data.images.some((i) => i.url === img2.url)).toBe(false);
    });

    it('should normalize old products with single image into images array for backward compatibility', async () => {
      // Create a legacy product with single imageUrl only
      const legacyProd = await Product.create({
        name: 'Legacy Single Image Wafer',
        description: 'Classic salted wafer single image',
        price: 30,
        stock: 12,
        category: 'chips',
        image: 'https://res.cloudinary.com/test-cloud/image/upload/v999/brocode/products/legacy_wafer.jpg',
        cloudinaryPublicId: 'brocode/products/legacy_wafer',
      });

      const res = await request(app).get(`/api/v1/products/${legacyProd._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.imageUrl).toBe(legacyProd.image);
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.images.length).toBe(1);
      expect(res.body.data.images[0].url).toBe(legacyProd.image);
      expect(res.body.data.images[0].isCover).toBe(true);
      expect(res.body.data.images[0].order).toBe(0);

      await Product.findByIdAndDelete(legacyProd._id);
    });

    it('DELETE /api/v1/admin/products/:id cleanly removes multi-image product', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/products/${multiProdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
