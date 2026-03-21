import { Router } from 'express';
import { updateProfile } from '../controllers/users.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.put('/profile', auth, updateProfile);

export default router;
