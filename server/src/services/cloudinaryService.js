import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export const cloudinaryService = {
  isConfigured() {
    return isCloudinaryConfigured();
  },

  async uploadImageBuffer(buffer, { folder = 'brocode/products', publicId } = {}) {
    if (!isCloudinaryConfigured()) {
      const error = new Error(
        'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env'
      );
      error.statusCode = 503;
      throw error;
    }

    if (!buffer || !Buffer.isBuffer(buffer)) {
      const error = new Error('Invalid image buffer provided for Cloudinary upload.');
      error.statusCode = 400;
      throw error;
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload stream failed:', error.message);
          const err = new Error(error.message || 'Failed to upload image to Cloudinary.');
          err.statusCode = 502;
          return reject(err);
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      });

      stream.end(buffer);
    });
  },

  async deleteImage(publicId) {
    if (!publicId || !isCloudinaryConfigured()) {
      return null;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.warn(`[Cloudinary] Failed to delete asset with public_id "${publicId}":`, error.message);
      return null;
    }
  },
};
