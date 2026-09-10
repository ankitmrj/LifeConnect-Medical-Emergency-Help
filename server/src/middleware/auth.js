import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

export async function authenticateUser(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('-password');
    if (!user || !user.isActive) throw new AppError('Account unavailable', 401, 'UNAUTHORIZED');
    req.user = user;
    next();
  } catch (err) { next(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' ? new AppError('Invalid or expired token', 401, 'INVALID_TOKEN') : err); }
}

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  next();
};
