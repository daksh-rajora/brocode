import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import apiV1Router from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Trust the single nearest reverse proxy (Render edge router/load balancer)
// Resolves ERR_ERL_UNEXPECTED_X_FORWARDED_FOR and enables accurate client IP rate limiting
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Parse configured client URLs from CLIENT_URL (supports comma-separated list or single URL)
const configuredClientOrigins = (config.clientUrl || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const staticAllowedOrigins = [
  ...configuredClientOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
];

export const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server, curl, Postman, mobile webviews
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (staticAllowedOrigins.includes(cleanOrigin)) return true;
  // Allow Netlify production & deploy previews (*.netlify.app)
  if (/\.netlify\.app$/.test(cleanOrigin)) return true;
  // Allow local development ports
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
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
