import { getDBConnectionStatus } from '../config/db.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const checkHealth = (req, res) => {
  const dbStatus = getDBConnectionStatus();
  const uptime = process.uptime();

  const healthData = {
    service: 'Bro Code Backend API',
    status: dbStatus.isConnected ? 'ok' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      name: dbStatus.dbName,
    },
    environment: process.env.NODE_ENV || 'development',
    memoryUsage: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };

  const statusCode = dbStatus.isConnected ? 200 : 503;
  return res.status(statusCode).json({
    success: dbStatus.isConnected,
    message: dbStatus.isConnected
      ? 'Bro Code backend is healthy and database is connected'
      : 'Bro Code backend is running but database is disconnected',
    data: healthData,
  });
};
