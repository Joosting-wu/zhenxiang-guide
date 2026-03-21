import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../lib/db.js';

export const register = async (req: Request, res: Response) => {
  const { email, password, name, phone, role = 'user' } = req.body;

  try {
    const [existingUsers]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result]: any = await pool.execute(
      'INSERT INTO users (email, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, name, role, phone || null]
    );

    const userId = result.insertId;
    const token = jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: { userId, token, name, email, role },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [users]: any = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`[Login Error] User not found for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log(`[Login Info] Found user: ${user.email}, Role: ${user.role}`);
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`[Login Info] Password match result: ${isMatch}`);

    if (!isMatch) {
      console.log(`[Login Error] Password mismatch for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });

    res.json({
      message: 'Login successful',
      data: {
        userId: user.id,
        token,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
