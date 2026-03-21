import { Router } from 'express';
import { getMerchants, getMerchantById, getCategories, createMerchant, updateMerchant, checkMerchantOwner, toggleFavorite, getFavorites } from '../controllers/merchants.js';
import { auth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getMerchants);
router.get('/categories', getCategories);
router.get('/favorites', auth, getFavorites);
router.get('/:id', optionalAuth, getMerchantById);
router.post('/:id/favorite', auth, toggleFavorite);

// Merchant management routes - require 'merchant' role
router.post('/', auth, requireRole('merchant'), createMerchant);
router.put('/:id', auth, requireRole('merchant'), updateMerchant);
router.get('/:id/owner/check', auth, requireRole('merchant'), checkMerchantOwner);

export default router;
