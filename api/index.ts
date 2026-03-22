/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import app from '../server/app.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../server/lib/db.js';
import { getSupabaseStorageDebugInfo, listSupabaseBuckets } from '../server/lib/storage.js';

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

  if (req.url === '/api/storage-health') {
    return (async () => {
      try {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads'
        const debug = getSupabaseStorageDebugInfo()
        const buckets = await listSupabaseBuckets()
        const exists = buckets.some((b: any) => b?.name === bucket)
        return res.status(200).json({
          ok: true,
          bucket,
          bucket_exists: exists,
          supabase_url: debug.supabase_url,
          key_role: debug.key_role,
          key_ref: debug.key_ref,
          buckets: buckets.map((b: any) => ({ name: b?.name, public: b?.public })),
        })
      } catch (error: any) {
        return res.status(500).json({ ok: false, error: error?.message || 'Storage error' })
      }
    })() as any
  }
  
  return app(req as any, res as any);
}
