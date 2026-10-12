import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import apiV1Router from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting client origin and local development
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development for smooth local preview
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in non-test environment
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting on API v1
app.use('/api/v1', apiLimiter);

// API v1 route mounting
app.use('/api/v1', apiV1Router);

// Root greeting / API overview
app.get('/', (req, res) => {
  res.json({
    service: 'Bro Code Midnight Snack Delivery API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    status: 'Operational',
  });
});

// Central 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

export default app;
