import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPEG, PNG, and WebP images are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
}).single('image');

export const handleImageUploadMiddleware = (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const error = new Error('Image file is too large. Maximum allowed size is 5 MB.');
        error.statusCode = 400;
        return next(error);
      }
      const error = new Error(`File upload error: ${err.message}`);
      error.statusCode = 400;
      return next(error);
    } else if (err) {
      return next(err);
    }
    next();
  });
};
