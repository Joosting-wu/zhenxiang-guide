import { Router } from 'express';
import { getDashboardStats, getUsers, getMerchants } from '../controllers/admin.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

// Only admin users can access these routes
router.get('/dashboard', auth, requireRole('admin'), getDashboardStats);
router.get('/users', auth, requireRole('admin'), getUsers);
router.get('/merchants', auth, requireRole('admin'), getMerchants);

export default router;
