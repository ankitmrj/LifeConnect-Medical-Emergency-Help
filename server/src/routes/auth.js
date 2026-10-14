import { Router } from 'express';

import {
  register,
  login,
  me,
} from '../controllers/authController.js';

import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const r = Router();

// Register a New User
r.post(
  '/register',
  asyncHandler(register)
);

// Login User
r.post(
  '/login',
  asyncHandler(login)
);

// Get Current Authenticated User
r.get(
  '/me',
  authenticateUser,
  asyncHandler(me)
);

export default r;
