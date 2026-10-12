import mongoose from 'mongoose';

/**
 * Middleware that guards routes requiring an active database connection.
 * If MongoDB is disconnected, returns 503 immediately rather than buffering commands
 * and timing out after 10000ms.
 */
export const requireDatabase = (req, res, next) => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.',
      error: 'DATABASE_DISCONNECTED',
      timestamp: new Date().toISOString(),
    });
  }
  next();
};
