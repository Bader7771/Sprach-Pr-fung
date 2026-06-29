import { env } from '../config/env.js';

export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error('Request failed', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl
  });

  res.status(statusCode).json({
    message: env.NODE_ENV === 'production' && statusCode >= 500
      ? 'Server error'
      : err.message || 'Server error',
    details: env.NODE_ENV === 'production' ? undefined : err.stack
  });
}
