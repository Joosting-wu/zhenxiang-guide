/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import merchantRoutes from './routes/merchants.js'
import reviewRoutes from './routes/reviews.js'
import uploadRoutes from './routes/upload.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'
import pool from './lib/db.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const uploadDir = path.join(__dirname, '../uploads');

if (!isVercel) {
  app.use('/uploads', express.static(uploadDir))
}

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

app.get('/api/db-health', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute('SELECT NOW() as now')
    res.status(200).json({
      ok: true,
      now: rows?.[0]?.now,
    })
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || 'DB error',
    })
  }
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/merchants', merchantRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
