/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import app from '../server/app.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../server/lib/db.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Add a debug health check directly in the handler
  if (req.url === '/api/vercel-health') {
    return res.status(200).json({ status: 'ok', message: 'Vercel handler is working' });
  }

  if (req.url === '/api/db-health') {
    return (async () => {
      try {
        const [rows]: any = await pool.execute('SELECT NOW() as now')
        return res.status(200).json({ ok: true, now: rows?.[0]?.now })
      } catch (error: any) {
        return res.status(500).json({ ok: false, error: error?.message || 'DB error' })
      }
    })() as any
  }
  
  return app(req as any, res as any);
}
