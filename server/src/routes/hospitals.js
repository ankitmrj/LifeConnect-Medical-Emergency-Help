import { Router } from 'express';

import {
  authenticateUser,
  authorizeRoles,
} from '../middleware/auth.js';

import { asyncHandler } from '../utils/errors.js';
import * as c from '../controllers/hospitalController.js';

const r = Router();

// Get All Hospitals
r.get(
  '/',
  asyncHandler(c.list)
);

// Find Nearby Hospitals
r.get(
  '/nearby',
  asyncHandler(c.nearby)
);

// Get Hospital Dashboard
r.get(
  '/dashboard/me',
  authenticateUser,
  authorizeRoles('hospital'),
  asyncHandler(c.dashboard)
);

// Create Hospital
r.post(
  '/',
  authenticateUser,
  authorizeRoles('hospital', 'admin'),
  asyncHandler(c.create)
);

// Update Hospital Resources
r.put(
  '/:id/resources',
  authenticateUser,
  authorizeRoles('hospital', 'admin'),
  asyncHandler(c.resources)
);

// Get Hospital Details
r.get(
  '/:id',
  asyncHandler(c.details)
);

export default r;
