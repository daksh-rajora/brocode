import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { config } from './config/env.js';
import { initSocket } from './services/socketService.js';

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      },
    });

    initSocket(io);

    httpServer.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🌙 BRO CODE Backend Server Running with Socket.IO!`);
      console.log(`🚀 Port: ${config.port}`);
      console.log(`🌐 Health Check: http://localhost:${config.port}/api/v1/health`);
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
