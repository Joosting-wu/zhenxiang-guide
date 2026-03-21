import { Router } from 'express';
import { postReview, getReviewsByMerchantId, replyToReview } from '../controllers/reviews.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', auth, postReview);
router.get('/merchant/:merchantId', auth, getReviewsByMerchantId);
router.post('/:reviewId/reply', auth, requireRole('merchant'), replyToReview);

export default router;
