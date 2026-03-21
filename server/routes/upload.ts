import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const router = Router();

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const uploadDir = isVercel ? '/tmp/uploads' : 'uploads/';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

router.post('/', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return relative URL so it works in both local and production
    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log(`[Upload Log] User ${((req as any).user).userId} uploaded file: ${req.file.filename}`);

    res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

export default router;