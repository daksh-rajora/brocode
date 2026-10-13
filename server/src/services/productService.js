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
      stock: { $gt: 0 },
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
      if (data.stock !== undefined && data.stock !== null && !isNaN(Number(data.stock))) {
        data.stock = Math.max(0, parseInt(data.stock, 10) || 0);
        data.isAvailable = data.stock > 0;
      }
      return await Product.create(data);
    } catch (error) {
      // If database creation fails, safely cleanup newly uploaded Cloudinary image(s) to prevent orphans
      const publicIdsToClean = new Set();
      if (data.cloudinaryPublicId) publicIdsToClean.add(data.cloudinaryPublicId);
      if (Array.isArray(data.images)) {
        data.images.forEach((img) => {
          if (img && (img.publicId || img.cloudinaryPublicId)) {
            publicIdsToClean.add(img.publicId || img.cloudinaryPublicId);
          }
        });
      }
      for (const pid of publicIdsToClean) {
        try {
          await cloudinaryService.deleteImage(pid);
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
      // If product not found and new images were uploaded, clean them up
      const publicIdsToClean = new Set();
      if (updateData.cloudinaryPublicId) publicIdsToClean.add(updateData.cloudinaryPublicId);
      if (Array.isArray(updateData.images)) {
        updateData.images.forEach((img) => {
          if (img && (img.publicId || img.cloudinaryPublicId)) {
            publicIdsToClean.add(img.publicId || img.cloudinaryPublicId);
          }
        });
      }
      for (const pid of publicIdsToClean) {
        await cloudinaryService.deleteImage(pid).catch(() => {});
      }
      return null;
    }

    // Collect existing public IDs
    const existingPublicIds = new Set();
    if (existing.cloudinaryPublicId) existingPublicIds.add(existing.cloudinaryPublicId);
    if (Array.isArray(existing.images)) {
      existing.images.forEach((img) => {
        if (img && (img.publicId || img.cloudinaryPublicId)) {
          existingPublicIds.add(img.publicId || img.cloudinaryPublicId);
        }
      });
    }

    // Collect new public IDs passed in updateData
    const newPublicIds = new Set();
    if (updateData.cloudinaryPublicId) newPublicIds.add(updateData.cloudinaryPublicId);
    if (Array.isArray(updateData.images)) {
      updateData.images.forEach((img) => {
        if (img && (img.publicId || img.cloudinaryPublicId)) {
          newPublicIds.add(img.publicId || img.cloudinaryPublicId);
        }
      });
    }

    // Newly added public IDs (that did not exist previously)
    const newlyAddedPublicIds = [...newPublicIds].filter((pid) => !existingPublicIds.has(pid));

    // Public IDs removed from this product
    const imagesExplicitlyModified =
      updateData.images !== undefined ||
      (updateData.cloudinaryPublicId && updateData.cloudinaryPublicId !== existing.cloudinaryPublicId);

    const removedPublicIds = imagesExplicitlyModified
      ? [...existingPublicIds].filter((pid) => !newPublicIds.has(pid))
      : [];

    try {
      if (updateData.price === undefined || updateData.price === null || isNaN(Number(updateData.price))) {
        const fallback = updateData.sellingPrice ?? updateData.selling_price;
        if (fallback !== undefined && fallback !== null && !isNaN(Number(fallback))) {
          updateData.price = Number(fallback);
        }
      } else if (updateData.price !== undefined) {
        updateData.price = Number(updateData.price);
      }

      if (updateData.stock !== undefined && updateData.stock !== null && !isNaN(Number(updateData.stock))) {
        updateData.stock = Math.max(0, parseInt(updateData.stock, 10) || 0);
        updateData.isAvailable = updateData.stock > 0;
      }

      // Sync image fields if images array was updated
      if (Array.isArray(updateData.images) && updateData.images.length > 0) {
        updateData.images = updateData.images.map((img, idx) => {
          if (typeof img === 'string') {
            return { url: img, publicId: null, isCover: idx === 0, order: idx };
          }
          return {
            url: img.url || img.imageUrl || img.image,
            publicId: img.publicId || img.cloudinaryPublicId || null,
            isCover: Boolean(img.isCover),
            order: img.order !== undefined && !isNaN(Number(img.order)) ? Number(img.order) : idx,
          };
        }).filter((img) => Boolean(img.url));

        updateData.images.sort((a, b) => (Number(a.order ?? 0)) - (Number(b.order ?? 0)));
        const hasCover = updateData.images.some((img) => img.isCover);
        if (!hasCover && updateData.images.length > 0) {
          updateData.images[0].isCover = true;
        }
        const cover = updateData.images.find((img) => img.isCover) || updateData.images[0];
        if (cover) {
          updateData.image = cover.url;
          updateData.imageUrl = cover.url;
          if (cover.publicId) {
            updateData.cloudinaryPublicId = cover.publicId;
          }
        }
      }

      const updated = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Once database update succeeds, check if removed assets should be deleted
      for (const removedId of removedPublicIds) {
        // Ensure no other product references this old asset
        const otherRef = await Product.countDocuments({
          _id: { $ne: id },
          $or: [
            { cloudinaryPublicId: removedId },
            { 'images.publicId': removedId },
          ],
        });

        if (otherRef === 0) {
          try {
            await cloudinaryService.deleteImage(removedId);
          } catch (cleanupErr) {
            console.warn('[Cloudinary] Failed to delete removed asset:', cleanupErr.message);
          }
        }
      }

      return updated;
    } catch (error) {
      // If database update fails, cleanup only the newly added images so we do not lose existing assets
      for (const pid of newlyAddedPublicIds) {
        try {
          await cloudinaryService.deleteImage(pid);
        } catch (cleanupErr) {
          console.warn('[Cloudinary] Failed to cleanup orphaned asset on update failure:', cleanupErr.message);
        }
      }
      throw error;
    }
  },

  async updateStock(id, stock, isAvailable) {
    const cleanStock = Math.max(0, parseInt(stock, 10) || 0);
    const updates = {
      stock: cleanStock,
      isAvailable: cleanStock > 0,
    };
    return Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  },

  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      return null;
    }

    const deleted = await Product.findByIdAndDelete(id);

    // After deleting product, clean up Cloudinary assets if safe
    const publicIdsToClean = new Set();
    if (product.cloudinaryPublicId) publicIdsToClean.add(product.cloudinaryPublicId);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && (img.publicId || img.cloudinaryPublicId)) {
          publicIdsToClean.add(img.publicId || img.cloudinaryPublicId);
        }
      });
    }

    for (const pid of publicIdsToClean) {
      const otherRef = await Product.countDocuments({
        _id: { $ne: id },
        $or: [
          { cloudinaryPublicId: pid },
          { 'images.publicId': pid },
        ],
      });

      if (otherRef === 0) {
        try {
          await cloudinaryService.deleteImage(pid);
        } catch (cleanupErr) {
          console.warn('[Cloudinary] Failed to delete asset on product removal:', cleanupErr.message);
        }
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
