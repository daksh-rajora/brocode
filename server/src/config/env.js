import dotenv from 'dotenv';

dotenv.config();

const isProduction =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: isProduction ? 'production' : (process.env.NODE_ENV || 'development'),
  isProduction,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bro_code',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_bro_code_hostel_midnight_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@brocode.hostel',
    password: process.env.ADMIN_PASSWORD || 'BroCodeAdmin2026!',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

