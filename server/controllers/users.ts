import { Request, Response } from 'express';
import pool from '../lib/db.js';

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { name, avatar_url } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    await pool.execute(
      'UPDATE users SET name = ?, avatar_url = ? WHERE id = ?',
      [name, avatar_url || null, userId]
    );

    // Fetch updated user to return
    const [users]: any = await pool.execute('SELECT id, email, name, role, phone, avatar_url FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Profile updated successfully', user: users[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
