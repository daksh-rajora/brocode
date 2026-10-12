import { productService } from '../services/productService.js';
import { cloudinaryService } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { emitEvent } from '../services/socketService.js';

export const getProducts = async (req, res, next) => {
  try {
    const { category, search, vegOnly, inStockOnly, sort, limit, includeInactive } = req.query;
    const shouldIncludeInactive =
      includeInactive === 'true' || (req.user && req.user.role === 'admin' && includeInactive !== 'false');

    const products = await productService.getProducts({
      category,
      search,
      vegOnly,
      inStockOnly,
      sort,
      limit,
      includeInactive: shouldIncludeInactive,
    });
    return sendSuccess(res, products, 'Snack catalog retrieved');
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const products = await productService.getFeaturedProducts(limit);
    return sendSuccess(res, products, 'Featured snacks retrieved');
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const idOrSlug = req.params.idOrSlug || req.params.id;
    const product = await productService.getProductByIdOrSlug(idOrSlug);
    if (!product) {
      return sendError(res, 'Snack item not found', 404);
    }
    return sendSuccess(res, product, 'Snack item retrieved');
  } catch (error) {
    next(error);
  }
};

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file uploaded. Please upload a JPEG, PNG, or WebP image.', 400);
    }

    const uploadResult = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
      folder: 'brocode/products',
    });

    return sendSuccess(
      res,
      {
        imageUrl: uploadResult.secure_url,
        secure_url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        public_id: uploadResult.public_id,
        bytes: uploadResult.bytes,
        format: uploadResult.format,
      },
      'Product image uploaded successfully to Cloudinary',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    // If an image file was attached via multipart form, upload it to Cloudinary first
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
        folder: 'brocode/products',
      });
      req.body.imageUrl = uploadResult.secure_url;
      req.body.image = uploadResult.secure_url;
      req.body.cloudinaryPublicId = uploadResult.public_id;
    }

    const newProduct = await productService.createProduct(req.body);
    emitEvent('inventory:updated', { action: 'create', product: newProduct });
    emitEvent('analytics:updated');
    return sendSuccess(res, newProduct, 'Snack added to catalog', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    // If a new image file was attached via multipart form, upload to Cloudinary first
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
        folder: 'brocode/products',
      });
      req.body.imageUrl = uploadResult.secure_url;
      req.body.image = uploadResult.secure_url;
      req.body.cloudinaryPublicId = uploadResult.public_id;
    }

    const updated = await productService.updateProduct(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'Snack item not found', 404);
    }
    emitEvent('inventory:updated', { action: 'update', product: updated });
    emitEvent('analytics:updated');
    return sendSuccess(res, updated, 'Snack item updated');
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { stock, isAvailable } = req.body;
    const updated = await productService.updateStock(req.params.id, stock, isAvailable);
    if (!updated) {
      return sendError(res, 'Snack item not found', 404);
    }
    emitEvent('inventory:updated', { action: 'stock', product: updated });
    emitEvent('analytics:updated');
    return sendSuccess(res, updated, 'Inventory updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return sendError(res, 'Snack item not found', 404);
    }
    emitEvent('inventory:updated', { action: 'delete', id: req.params.id });
    emitEvent('analytics:updated');
    return sendSuccess(res, { id: req.params.id }, 'Snack removed from catalog');
  } catch (error) {
    next(error);
  }
};

export const getInventoryStats = async (req, res, next) => {
  try {
    const stats = await productService.getInventoryStats();
    return sendSuccess(res, stats, 'Inventory statistics retrieved');
  } catch (error) {
    next(error);
  }
};

