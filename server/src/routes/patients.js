import { Router } from 'express';

import {
  authenticateUser,
  authorizeRoles,
} from '../middleware/auth.js';

import { asyncHandler } from '../utils/errors.js';

import {
  getProfile,
  updateProfile,
  addContact,
  updateContact,
  deleteContact,
  history,
} from '../controllers/patientController.js';

const r = Router();

// Authentication and Role Authorization
r.use(
  authenticateUser,
  authorizeRoles('patient')
);

// Get Patient Profile
r.get(
  '/profile',
  asyncHandler(getProfile)
);

// Update Patient Profile
r.put(
  '/profile',
  asyncHandler(updateProfile)
);

// Add Emergency Contact
r.post(
  '/emergency-contact',
  asyncHandler(addContact)
);

// Update Emergency Contact
r.patch(
  '/emergency-contact/:contactId',
  asyncHandler(updateContact)
);

// Delete Emergency Contact
r.delete(
  '/emergency-contact/:contactId',
  asyncHandler(deleteContact)
);

// Get Emergency History
r.get(
  '/emergency-history',
  asyncHandler(history)
);

export default r;
