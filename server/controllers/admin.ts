import { Request, Response } from 'express';
import pool from '../lib/db.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Basic stats
    const [userCountRows]: any = await pool.execute('SELECT COUNT(*) as count FROM users');
    const totalUsers = userCountRows[0].count;

    const [merchantCountRows]: any = await pool.execute('SELECT COUNT(*) as count FROM merchants');
    const totalMerchants = merchantCountRows[0].count;

    // Calculate real new users/merchants for today from DB
    const [newUsersRows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURRENT_DATE"
    );
    const newUsersToday = newUsersRows[0].count;

    const [newMerchantsRows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM merchants WHERE DATE(created_at) = CURRENT_DATE"
    );
    const newMerchantsToday = newMerchantsRows[0].count;

    // Simulate DAU, MAU, PV, UV
    const dau = Math.floor(totalUsers * (0.2 + Math.random() * 0.3)); // 20-50% of total users
    const mau = Math.floor(totalUsers * (0.6 + Math.random() * 0.3)); // 60-90% of total users
    const pv = dau * (3 + Math.floor(Math.random() * 10)); // 3-12 pages per active user
    const uv = dau + Math.floor(Math.random() * 100);

    // Real 7 days trend data for cumulative totals
    const trendData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const isoDate = targetDate.toISOString().split('T')[0];
      
      // Get count of users created on or before this date
      const [histUserRows]: any = await pool.execute(
        "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) <= CAST(? AS DATE)",
        [isoDate]
      );

      // Get count of merchants created on or before this date
      const [histMerchantRows]: any = await pool.execute(
        "SELECT COUNT(*) as count FROM merchants WHERE DATE(created_at) <= CAST(? AS DATE)",
        [isoDate]
      );
      
      trendData.push({
        date: dateStr,
        newUsers: histUserRows[0].count,
        newMerchants: histMerchantRows[0].count,
      });
    }

    res.json({
      totalUsers,
      newUsersToday,
      totalMerchants,
      newMerchantsToday,
      dau,
      mau,
      pv,
      uv,
      trendData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [users]: any = await pool.execute(
      'SELECT id, email, name, role, phone, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [totalRows]: any = await pool.execute('SELECT COUNT(*) as count FROM users');

    res.json({
      data: users,
      total: totalRows[0].count,
      page,
      limit
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMerchants = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        m.id, 
        m.name, 
        c.name as category_name, 
        m.city, 
        m.avg_rating, 
        m.status, 
        m.created_at,
        m.owner_id
      FROM merchants m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM merchants';
    
    const [rows] = await pool.execute(query, [limit, offset]);
    const [countRows] = await pool.execute(countQuery);
    
    const total = (countRows as any)[0].total;

    res.json({
      data: rows,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
