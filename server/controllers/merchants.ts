import { Request, Response } from 'express';
import pool from '../lib/db.js';

export const getMerchants = async (req: Request, res: Response) => {
  const { keyword, category, city, sort = 'rating', page = '1', limit = '10' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const user = (req as any).user;

  try {
    let query = `
      SELECT 
        m.*, 
        c.name as category_name,
        (SELECT COUNT(*) FROM reviews r WHERE r.merchant_id = m.id AND r.rating >= 3.0) as good_reviews_count,
        m.review_count as total_reviews,
        (SELECT COUNT(*) FROM favorites f WHERE f.merchant_id = m.id) as total_favorites
        ${user ? `, (SELECT COUNT(*) FROM favorites f WHERE f.merchant_id = m.id AND f.user_id = ${Number(user.userId)}) as is_favorite` : ''}
      FROM merchants m 
      LEFT JOIN categories c ON m.category_id = c.id 
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (category) {
      query += ' AND m.category_id = ?';
      queryParams.push(category);
    }

  if (keyword) {
      query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (city) {
      query += ' AND m.city = ?';
      queryParams.push(city);
    }

    if (sort === 'rating') {
      query += ' ORDER BY m.avg_rating DESC';
    } else {
      query += ' ORDER BY m.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit as string), offset);

    const [rows]: any = await pool.execute(query, queryParams);
    
    // Auto-fill logic for "Featured" (Home page)
    if (rows.length < 9 && sort === 'rating' && !keyword && !category) {
      const needed = 9 - rows.length;
      const excludeIds = rows.map((r: any) => r.id);
      
      let fillQuery = `
        SELECT 
          m.*, 
          c.name as category_name,
          (SELECT COUNT(*) FROM reviews r WHERE r.merchant_id = m.id AND r.rating >= 3.0) as good_reviews_count,
          m.review_count as total_reviews,
          (SELECT COUNT(*) FROM favorites f WHERE f.merchant_id = m.id) as total_favorites
          ${user ? `, (SELECT COUNT(*) FROM favorites f WHERE f.merchant_id = m.id AND f.user_id = ${user.userId}) as is_favorite` : ''}
        FROM merchants m 
        JOIN categories c ON m.category_id = c.id 
        WHERE m.avg_rating >= 4.0 AND m.city = ?
      `;
      const fillParams: any[] = [city || '广州市'];
      
      if (excludeIds.length > 0) {
        fillQuery += ` AND m.id NOT IN (${excludeIds.map(() => '?').join(',')})`;
        fillParams.push(...excludeIds);
      }
      
      fillQuery += ' ORDER BY m.review_count DESC LIMIT ?';
      fillParams.push(needed);
      
      const [fillRows]: any = await pool.execute(fillQuery, fillParams);
      
      if (fillRows.length > 0) {
        console.log(`[Alert] Auto-filled ${fillRows.length} merchants for city ${city || '广州市'}`);
        // Mark as auto-filled
        const markedFillRows = fillRows.map((r: any) => ({ ...r, is_auto_filled: true }));
        rows.push(...markedFillRows);
      }
    }

    const [totalRows]: any = await pool.execute('SELECT COUNT(*) as count FROM merchants WHERE 1=1' + (category ? ' AND category_id = ?' : '') + (city ? ' AND city = ?' : ''), 
      [...(category ? [category] : []), ...(city ? [city] : [])]
    );

    res.json({
      data: rows,
      total: totalRows[0].count,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMerchantById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    // 1. Get Merchant Info
    const [merchantRows]: any = await pool.execute(
      `SELECT m.*, c.name as category_name, 
       (SELECT COUNT(*) FROM favorites f WHERE f.merchant_id = m.id) as total_favorites 
       FROM merchants m JOIN categories c ON m.category_id = c.id WHERE m.id = ?`,
      [id]
    );

    if (merchantRows.length === 0) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    let merchant = merchantRows[0];

    // Check favorite status
    let is_favorite = false;
    if (user) {
      const [favs]: any = await pool.execute(
        'SELECT id FROM favorites WHERE merchant_id = ? AND user_id = ?',
        [id, user.userId]
      );
      if (favs.length > 0) is_favorite = true;
    }

    // 2. Get comments (fetch all if they want to see all, but initially just return them and let frontend handle or we return all)
    // To support "show all" easily without another API call right now, let's fetch more if requested, 
    // or just return all and let frontend slice it. For now, returning up to 50 for simplicity.
    const [reviewRows]: any = await pool.execute(
      'SELECT r.id, r.user_id, u.name as user_name, u.avatar_url, r.content, r.rating, r.created_at, r.reply_content, r.replied_at ' +
      'FROM reviews r JOIN users u ON r.user_id = u.id ' +
      'WHERE r.merchant_id = ? ORDER BY r.created_at DESC LIMIT 50',
      [id]
    );

    let hasCommented = false;
    let needLogin = true;

    // Access control & state check
    if (user) {
      needLogin = false;
    } else {
      // Mask phone number if not logged in
      if (merchant.phone) {
        merchant.phone = merchant.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      }
    }

    res.json({
      merchant: {
        ...merchant,
        is_favorite
      },
      recentComments: reviewRows,
      needLogin,
      hasCommented: false // We no longer restrict repeated comments
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const checkMerchantOwner = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;

  try {
    const [merchants]: any = await pool.execute('SELECT owner_id FROM merchants WHERE id = ?', [id]);
    if (merchants.length === 0) return res.status(404).json({ message: 'Merchant not found' });
    
    if (merchants[0].owner_id !== userId) {
      return res.status(403).json({ message: 'Forbidden. You are not the owner of this merchant.' });
    }

    res.status(200).json({ isOwner: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createMerchant = async (req: Request, res: Response) => {
  try {
    const { name, description, address, city, phone, business_hours, images, category_id, status } = req.body;
    const userId = (req as any).user.userId;

    const imagesStr = JSON.stringify(images || []);

    const [result]: any = await pool.execute(
      `INSERT INTO merchants (
        name, description, address, city, phone, category_id, business_hours, status, images, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        address || '',
        city || '广州市',
        phone || null,
        category_id || null,
        business_hours || null,
        status || '营业',
        imagesStr,
        userId
      ]
    );

    res.status(201).json({
      message: 'Merchant created successfully',
      data: { id: result.insertId, name, city: city || '广州市', status: status || '营业' }
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateMerchant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, address, city, phone, category_id, business_hours, status, images } = req.body;
  const userId = (req as any).user.userId;

  try {
    // Check ownership
    const [merchants]: any = await pool.execute('SELECT owner_id FROM merchants WHERE id = ?', [id]);
    if (merchants.length === 0) return res.status(404).json({ message: 'Merchant not found' });
    if (merchants[0].owner_id !== userId) return res.status(403).json({ message: 'You can only edit your own stores' });

    let imagesStr = null;
    if (images) {
      if (Array.isArray(images)) {
        imagesStr = JSON.stringify(images);
      } else if (typeof images === 'string') {
        try {
          JSON.parse(images);
          imagesStr = images;
        } catch (e) {
          imagesStr = JSON.stringify([images]);
        }
      }
    }

    await pool.execute(
      'UPDATE merchants SET name = ?, description = ?, address = ?, city = ?, phone = ?, category_id = ?, business_hours = ?, status = ?, images = ? WHERE id = ?',
      [name, description || null, address, city || '广州市', phone || null, category_id, business_hours || null, status || '营业', imagesStr, id]
    );

    res.json({ message: 'Merchant updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;

  try {
    // Check if favorite exists
    const [favs]: any = await pool.execute(
      'SELECT id FROM favorites WHERE user_id = ? AND merchant_id = ?',
      [userId, id]
    );

    if (favs.length > 0) {
      // Remove favorite
      await pool.execute(
        'DELETE FROM favorites WHERE user_id = ? AND merchant_id = ?',
        [userId, id]
      );
      res.json({ message: 'Removed from favorites', is_favorite: false });
    } else {
      // Add favorite
      await pool.execute(
        'INSERT INTO favorites (user_id, merchant_id) VALUES (?, ?)',
        [userId, id]
      );
      res.json({ message: 'Added to favorites', is_favorite: true });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { page = '1', limit = '10' } = req.query;

  try {
    const query = `
      SELECT 
        m.*, 
        c.name as category_name,
        (SELECT COUNT(*) FROM reviews r WHERE r.merchant_id = m.id AND r.rating >= 3.0) as good_reviews_count,
        m.review_count as total_reviews,
        1 as is_favorite
      FROM favorites f
      JOIN merchants m ON f.merchant_id = m.id
      JOIN categories c ON m.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    
    const [rows]: any = await pool.execute(query, [userId]);
    
    res.json({
      data: rows,
      total: rows.length,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
