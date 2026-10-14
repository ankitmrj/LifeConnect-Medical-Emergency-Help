import { Router } from 'express';

import {
  authenticateUser,
  authorizeRoles,
} from '../middleware/auth.js';

import { asyncHandler } from '../utils/errors.js';
import * as c from '../controllers/ambulanceController.js';

const r = Router();

// Authentication Middleware
r.use(authenticateUser);

// Get All Ambulances
r.get(
  '/',
  authorizeRoles('hospital', 'ambulance', 'admin'),
  asyncHandler(c.list)
);

// Create Ambulance
r.post(
  '/',
  authorizeRoles('hospital', 'admin'),
  asyncHandler(c.create)
);

// Update Ambulance Details
r.put(
  '/:id',
  authorizeRoles('hospital', 'ambulance', 'admin'),
  asyncHandler(c.update)
);

// Update Ambulance Location
r.patch(
  '/:id/location',
  authorizeRoles('ambulance', 'hospital', 'admin'),
  asyncHandler(c.location)
);

// Update Ambulance Status
r.patch(
  '/:id/status',
  authorizeRoles('ambulance', 'hospital', 'admin'),
  asyncHandler(c.status)
);

// Simulate Ambulance Movement
r.post(
  '/:id/simulate',
  authorizeRoles('ambulance', 'admin'),
  asyncHandler(c.simulate)
);

export default r;
