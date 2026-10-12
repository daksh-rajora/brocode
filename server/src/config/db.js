import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async (customUri) => {
  const primaryUri = customUri || config.mongodbUri;
  try {
    const conn = await mongoose.connect(primaryUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // If remote connection failed with auth/network error in dev/test, fallback to local mongo
    if (config.nodeEnv !== 'production' && !primaryUri.includes('127.0.0.1') && !primaryUri.includes('localhost')) {
      try {
        console.log('[Database] Attempting local MongoDB fallback at mongodb://127.0.0.1:27017/brocode...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/brocode', {
          autoIndex: true,
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`[Database] Local MongoDB Connected: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (fallbackError) {
        console.warn(`[Database] Local fallback also unavailable: ${fallbackError.message}`);
      }
    }
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
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
