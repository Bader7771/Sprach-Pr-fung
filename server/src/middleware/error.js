import { env } from '../config/env.js';

export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: req.originalUrl.startsWith('/api') ? 'API route not found' : 'Route not found'
  });
}

export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProduction = env.NODE_ENV === 'production';
  const isValidationError = err.name === 'ZodError' || err.name === 'ValidationError' || err.name === 'CastError';
  const isConfigError = err.message?.startsWith('Missing required environment variable');
  const responseStatus = isValidationError ? 400 : statusCode;

  console.error('Request failed', {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    method: req.method,
    url: req.originalUrl
  });

  res.status(responseStatus).json({
    success: false,
    message: isConfigError
      ? 'Server configuration error'
      : isProduction && responseStatus >= 500
        ? 'Server error'
        : err.message || 'Server error',
    details: isProduction ? undefined : err.stack
  });
}
