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

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

export const uploadSingleImage = upload.single('image');

export const uploadMultipleImages = upload.array('images', 50);

const multiFieldUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 50 },
]);

export const handleImageUploadMiddleware = (req, res, next) => {
  multiFieldUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const error = new Error('Image file is too large. Maximum allowed size is 5 MB per image.');
        error.statusCode = 400;
        return next(error);
      }
      const error = new Error(`File upload error: ${err.message}`);
      error.statusCode = 400;
      return next(error);
    } else if (err) {
      return next(err);
    }

    // Normalize files for downstream consumers
    const collectedFiles = [];
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        collectedFiles.push(...req.files.image);
      }
      if (req.files.images && req.files.images.length > 0) {
        collectedFiles.push(...req.files.images);
      }
    }
    if (req.file) {
      if (!collectedFiles.includes(req.file)) {
        collectedFiles.push(req.file);
      }
    } else if (collectedFiles.length > 0) {
      req.file = collectedFiles[0];
    }
    req.allImageFiles = collectedFiles;

    next();
  });
};
