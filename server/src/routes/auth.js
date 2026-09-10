import { Router } from 'express'; import { register,login,me } from '../controllers/authController.js'; import { authenticateUser } from '../middleware/auth.js'; import { asyncHandler } from '../utils/errors.js';
const r=Router(); r.post('/register',asyncHandler(register)); r.post('/login',asyncHandler(login)); r.get('/me',authenticateUser,asyncHandler(me)); export default r;
