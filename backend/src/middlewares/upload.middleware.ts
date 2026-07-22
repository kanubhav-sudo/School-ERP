import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

const UPLOAD_DIR = path.join(__dirname, '../../uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename using crypto
    const uniqueSuffix = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueSuffix}-${Date.now()}${ext}`)
  },
})

// Optional: Add file filter for basic security (deny .exe, .sh, etc.)
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const forbiddenExts = ['.exe', '.sh', '.bat', '.cmd', '.js', '.ts']
  
  if (forbiddenExts.includes(ext)) {
    return cb(new Error('File type not allowed'))
  }
  
  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
})
