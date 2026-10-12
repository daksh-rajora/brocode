import { sendError } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Resource not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID format for resource: ${err.value}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Data validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle SyntaxError in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request payload';
  }

  // Handle MongoDB connection errors, server selection timeouts, and bad auth
  if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    (err.name === 'MongoServerError' && (err.code === 8000 || err.message?.includes('auth')))
  ) {
    statusCode = 503;
    message = 'Database service is currently unavailable. Please verify MongoDB Atlas connection string and user credentials.';
  }

  if (config.nodeEnv !== 'test') {
    console.error(`[Error] [${req.method} ${req.originalUrl}]:`, err.message);
    if (statusCode === 500) {
      console.error(err.stack);
    }
  }

  const responsePayload = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    responsePayload.errors = errors;
  }

  if (config.nodeEnv === 'development' && statusCode === 500) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};
