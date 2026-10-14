import { Router } from 'express';

import {
  authenticateUser,
  authorizeRoles,
} from '../middleware/auth.js';

import { asyncHandler } from '../utils/errors.js';
import * as c from '../controllers/adminController.js';

const r = Router();

// Authentication and Role Authorization
r.use(
  authenticateUser,
  authorizeRoles('admin')
);

// Admin Statistics
r.get(
  '/stats',
  asyncHandler(c.stats)
);

// User Management
r.get(
  '/users',
  asyncHandler(c.users)
);

r.patch(
  '/users/:id/disable',
  asyncHandler(c.disableUser)
);

// Hospital Management
r.get(
  '/hospitals',
  asyncHandler(c.hospitals)
);

r.patch(
  '/hospitals/:id/verify',
  asyncHandler(c.verifyHospital)
);

// Emergency Management
r.get(
  '/emergencies',
  asyncHandler(c.emergencies)
);

// Ambulance Management
r.get(
  '/ambulances',
  asyncHandler(c.ambulances)
);

export default r;
