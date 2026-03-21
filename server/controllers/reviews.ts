import { Request, Response } from 'express';
import pool from '../lib/db.js';

export const postReview = async (req: Request, res: Response) => {
  const { merchantId, rating, content, images } = req.body;
  const { userId, role } = (req as any).user;

  try {
    const [result]: any = await pool.execute(
      'INSERT INTO reviews (user_id, merchant_id, rating, content, images) VALUES (?, ?, ?, ?, ?)',
      [userId, merchantId, rating, content, images ? JSON.stringify(images) : null]
    );

    // Update merchant's avg_rating and review_count
    const [reviews]: any = await pool.execute(
      'SELECT rating FROM reviews WHERE merchant_id = ?',
      [merchantId]
    );

    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews;

    await pool.execute(
      'UPDATE merchants SET avg_rating = ?, review_count = ? WHERE id = ?',
      [avgRating, totalReviews, merchantId]
    );

    // Get updated merchant data
    const [merchantRows]: any = await pool.execute(
      'SELECT * FROM merchants WHERE id = ?',
      [merchantId]
    );

    const updatedMerchant = merchantRows[0];

    // Get the newly created review with user info
    const [newReviewRows]: any = await pool.execute(
      'SELECT r.*, u.name as user_name, u.avatar_url FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = ?',
      [result.insertId]
    );

    const newReview = newReviewRows[0];
    if (newReview && typeof newReview.images === 'string') {
      try {
        newReview.images = JSON.parse(newReview.images);
      } catch (e) {
        newReview.images = [];
      }
    }

    res.status(201).json({
      message: 'Review posted successfully',
      data: { 
        id: result.insertId, 
        userId, 
        merchantId, 
        rating, 
        content, 
        images 
      },
      merchant: {
        avg_rating: avgRating,
        review_count: totalReviews
      },
      review: newReview
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReviewsByMerchantId = async (req: Request, res: Response) => {
  const { merchantId } = req.params;
  const { page = '1', limit = '10' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  try {
    const [rows]: any = await pool.execute(
      'SELECT r.*, u.name as user_name, u.avatar_url FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.merchant_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
      [merchantId, parseInt(limit as string), offset]
    );

    const [totalRows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM reviews WHERE merchant_id = ?',
      [merchantId]
    );

    // Parse images if stored as JSON string in sqlite
    const parsedRows = rows.map((row: any) => ({
      ...row,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
    }));

    res.json({
      data: parsedRows,
      total: totalRows[0].count,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const replyToReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { reply_content } = req.body;
  const userId = (req as any).user.userId;

  try {
    // Verify ownership of the merchant
    const [reviews]: any = await pool.execute(
      'SELECT r.id, m.owner_id FROM reviews r JOIN merchants m ON r.merchant_id = m.id WHERE r.id = ?',
      [reviewId]
    );

    if (reviews.length === 0) return res.status(404).json({ message: 'Review not found' });
    if (reviews[0].owner_id !== userId) return res.status(403).json({ message: 'Only store owner can reply' });

    await pool.execute(
      'UPDATE reviews SET reply_content = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?',
      [reply_content, reviewId]
    );

    res.json({ message: 'Reply posted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
