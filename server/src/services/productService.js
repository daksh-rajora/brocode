import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { cloudinaryService } from './cloudinaryService.js';

export const productService = {
  async getProducts({
    category,
    search,
    vegOnly,
    inStockOnly,
    sort = 'recommended',
    limit = 100,
    includeInactive = false,
  }) {
    const query = {};

    if (!includeInactive) {
      query.isActive = { $ne: false };
      query.isAvailable = { $ne: false };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (vegOnly === 'true' || vegOnly === true) {
      query.isVeg = true;
    }

    if (inStockOnly === 'true' || inStockOnly === true) {
      query.stock = { $gt: 0 };
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    let sortOption = { hostelFavorite: -1, createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'prep_time') sortOption = { prepTimeMinutes: 1 };

    return Product.find(query).sort(sortOption).limit(Number(limit));
  },

  async getFeaturedProducts(limit = 10) {
    const featured = await Product.find({
      hostelFavorite: true,
      isActive: { $ne: false },
      isAvailable: { $ne: false },
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(Number(limit));

    if (featured.length > 0) {
      return featured;
    }

    // Fallback to top products if none explicitly marked as hostelFavorite
    return Product.find({
      isActive: { $ne: false },
      isAvailable: { $ne: false },
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(Number(limit));
  },

  async getProductById(id) {
    return Product.findById(id);
  },

  async getProductByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;

    if (mongoose.isValidObjectId(idOrSlug)) {
      const byId = await Product.findById(idOrSlug);
      if (byId) return byId;
    }

    // Search by slug
    const bySlug = await Product.findOne({ slug: idOrSlug });
    if (bySlug) return bySlug;

    // Search by name match
    const normalizedName = idOrSlug.replace(/-/g, ' ').trim();
    return Product.findOne({ name: { $regex: `^${normalizedName}$`, $options: 'i' } });
  },

  async createProduct(data) {
    try {
      if (data.price === undefined || data.price === null || isNaN(Number(data.price))) {
        const fallback = data.sellingPrice ?? data.selling_price;
        if (fallback !== undefined && fallback !== null && !isNaN(Number(fallback))) {
          data.price = Number(fallback);
        }
      } else {
        data.price = Number(data.price);
      }
      return await Product.create(data);
    } catch (error) {
      // If database creation fails, safely cleanup newly uploaded Cloudinary image to prevent orphans
      if (data.cloudinaryPublicId) {
        try {
          await cloudinaryService.deleteImage(data.cloudinaryPublicId);
        } catch (cleanupErr) {
          console.warn('[Cloudinary] Failed to cleanup orphaned asset on create failure:', cleanupErr.message);
        }
      }
      throw error;
    }
  },

  async updateProduct(id, updateData) {
    const existing = await Product.findById(id);
    if (!existing) {
      // If product not found and a new image was uploaded, delete it
      if (updateData.cloudinaryPublicId) {
        await cloudinaryService.deleteImage(updateData.cloudinaryPublicId);
      }
      return null;
    }

    const previousPublicId = existing.cloudinaryPublicId;
    const isReplacingImage =
      updateData.cloudinaryPublicId &&
      updateData.cloudinaryPublicId !== previousPublicId;

    try {
      if (updateData.price === undefined || updateData.price === null || isNaN(Number(updateData.price))) {
        const fallback = updateData.sellingPrice ?? updateData.selling_price;
        if (fallback !== undefined && fallback !== null && !isNaN(Number(fallback))) {
          updateData.price = Number(fallback);
        }
      } else if (updateData.price !== undefined) {
        updateData.price = Number(updateData.price);
      }

      const updated = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Once database update succeeds, check if old image should be deleted
      if (isReplacingImage && previousPublicId) {
        // Ensure no other product references this old asset
        const otherRef = await Product.countDocuments({
          _id: { $ne: id },
          cloudinaryPublicId: previousPublicId,
        });

        if (otherRef === 0) {
          await cloudinaryService.deleteImage(previousPublicId);
        }
      }

      return updated;
    } catch (error) {
      // If database update fails, cleanup newly uploaded image
      if (isReplacingImage && updateData.cloudinaryPublicId) {
        try {
          await cloudinaryService.deleteImage(updateData.cloudinaryPublicId);
        } catch (cleanupErr) {
          console.warn('[Cloudinary] Failed to cleanup orphaned asset on update failure:', cleanupErr.message);
        }
      }
      throw error;
    }
  },

  async updateStock(id, stock, isAvailable) {
    const updates = { stock };
    if (typeof isAvailable === 'boolean') {
      updates.isAvailable = isAvailable;
    } else {
      updates.isAvailable = stock > 0;
    }
    return Product.findByIdAndUpdate(id, updates, { new: true });
  },

  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      return null;
    }

    const deleted = await Product.findByIdAndDelete(id);

    // After deleting product, clean up Cloudinary asset if safe
    if (product.cloudinaryPublicId) {
      const otherRef = await Product.countDocuments({
        _id: { $ne: id },
        cloudinaryPublicId: product.cloudinaryPublicId,
      });

      if (otherRef === 0) {
        await cloudinaryService.deleteImage(product.cloudinaryPublicId);
      }
    }

    return deleted;
  },

  async getInventoryStats() {
    const total = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 5 } });
    const inStock = await Product.countDocuments({ stock: { $gt: 5 } });
    return { total, outOfStock, lowStock, inStock };
  },
};
