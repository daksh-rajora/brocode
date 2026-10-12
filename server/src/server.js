import http from 'http';
import { Server } from 'socket.io';
import app, { isOriginAllowed } from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { config } from './config/env.js';
import { initSocket } from './services/socketService.js';

const startServer = async () => {
  try {
    try {
      await connectDB();
    } catch (dbError) {
      console.error(`[Server Database Notice] Database connection error during startup: ${dbError.message}`);
      console.warn('[Server Database Notice] HTTP server will start in degraded mode. Database-dependent endpoints will return 503 until connection is restored.');
    }

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || isOriginAllowed(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Socket origin ${origin} not allowed by CORS`));
          }
        },
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true,
      },
    });

    initSocket(io);

    httpServer.listen(config.port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🌙 BRO CODE Backend Server Running with Socket.IO!`);
      console.log(`🚀 Port: ${config.port}`);
      console.log(`🌐 Health Check: /api/v1/health`);
      console.log(`⚡ Environment: ${config.nodeEnv}`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      httpServer.close(async () => {
        console.log('[Server] HTTP server closed.');
        await closeDB();
        console.log('[Server] Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return httpServer;
  } catch (error) {
    console.error(`[Server Fatal Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
