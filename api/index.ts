/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import app from '../server/app.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}