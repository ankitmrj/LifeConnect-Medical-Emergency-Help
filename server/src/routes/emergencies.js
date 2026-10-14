import { Router } from 'express';

import {
  authenticateUser,
  authorizeRoles,
} from '../middleware/auth.js';

import { asyncHandler } from '../utils/errors.js';
import * as c from '../controllers/emergencyController.js';

import EmergencyRequest from '../models/EmergencyRequest.js';

const r = Router();

// Authentication Middleware
r.use(authenticateUser);

// Create SOS Emergency Request
r.post(
  '/sos',
  authorizeRoles('patient'),
  asyncHandler(c.sos)
);

// Get Emergency Details
r.get(
  '/:id',
  asyncHandler(c.getEmergency)
);

// Accept Emergency Request
r.post(
  '/:id/accept',
  authorizeRoles('hospital'),
  asyncHandler(c.accept)
);

// Admin Accepts Hospital Assignment
r.post(
  '/:id/accept-admin',
  authorizeRoles('admin'),
  asyncHandler(c.hospitalAccept)
);

// Assign Ambulance
r.post(
  '/:id/assign-ambulance',
  authorizeRoles('hospital', 'admin'),
  asyncHandler(c.assign)
);

// Cancel Emergency Request
r.post(
  '/:id/cancel',
  authorizeRoles('patient'),
  asyncHandler(c.cancel)
);

// Update Emergency Status
r.patch(
  '/:id/status',
  authorizeRoles('hospital', 'ambulance', 'admin'),
  asyncHandler(c.updateStatus)
);

export default r;
