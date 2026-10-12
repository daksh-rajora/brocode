import mongoose from 'mongoose';
import { config } from './env.js';

// Disable Mongoose command buffering when disconnected to prevent 10000ms buffering timeouts
mongoose.set('bufferCommands', false);

/**
 * Return a sanitized URI for safe console logging without exposing passwords
 */
export const getSanitizedUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '(empty-uri)';
  try {
    const parsed = new URL(uri);
    const authPart = parsed.username ? '***:***@' : '';
    return `${parsed.protocol}//${authPart}${parsed.host}${parsed.pathname || ''}`;
  } catch {
    return '(invalid-uri)';
  }
};

/**
 * Connect to MongoDB database
 * @param {string} [customUri] Optional custom MongoDB URI (e.g. for testing)
 */
export const connectDB = async (customUri) => {
  const primaryUri = customUri || config.mongodbUri;
  const sanitized = getSanitizedUri(primaryUri);
  const isCloudOrProd = config.isProduction || Boolean(process.env.RENDER);

  try {
    console.log(`[Database] Connecting to ${sanitized}...`);
    const conn = await mongoose.connect(primaryUri, {
      autoIndex: !config.isProduction,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    if (conn.connection.name === 'test' && !primaryUri.includes('/test')) {
      console.warn(
        `[Database Notice] Connected to default database 'test'. If you intend to use a dedicated database, add '/brocode' to MONGODB_URI in Render dashboard.`
      );
    }
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed to ${sanitized}: ${error.message}`);

    // Fall back to local MongoDB ONLY in local development and NEVER on Render or in production
    const isLocalFallbackAllowed =
      !isCloudOrProd &&
      !primaryUri.includes('127.0.0.1') &&
      !primaryUri.includes('localhost') &&
      !process.env.CI;

    if (isLocalFallbackAllowed) {
      try {
        console.log('[Database] Attempting local development MongoDB fallback at mongodb://127.0.0.1:27017/brocode...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/brocode', {
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`[Database] Local MongoDB Connected: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (fallbackError) {
        console.warn(`[Database] Local fallback unavailable: ${fallbackError.message}`);
      }
    }

    if (isCloudOrProd) {
      console.error(
        `[Database Fatal] MongoDB connection failure in production environment (${sanitized}). ` +
        `Action Required: In Render Dashboard, ensure MONGODB_URI is configured with valid MongoDB Atlas credentials and that Atlas Network Access allows 0.0.0.0/0.`
      );
    }

    throw error;
  }
};

export const getDBConnectionStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  return {
    state: stateMap[readyState] || 'unknown',
    readyState,
    isConnected: readyState === 1,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
  };
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
