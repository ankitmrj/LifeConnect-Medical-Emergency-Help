import mongoose from 'mongoose';
export function notFound(_req, _res, next) { next(Object.assign(new Error('Route not found'), { statusCode: 404, code: 'NOT_FOUND' })); }
export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || (err instanceof mongoose.Error.ValidationError ? 422 : err.code === 11000 ? 409 : 500);
  const code = err.code || (err instanceof mongoose.Error.ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  const message = status >= 500 ? (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message) : err.message;
  res.status(status).json({ success: false, message, error: code });
}
