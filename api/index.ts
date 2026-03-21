/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import app from '../server/app.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Add a debug health check directly in the handler
  if (req.url === '/api/vercel-health') {
    return res.status(200).json({ status: 'ok', message: 'Vercel handler is working' });
  }
  
  return app(req as any, res as any);
}