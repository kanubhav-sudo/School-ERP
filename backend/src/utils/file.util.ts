import fs from 'fs'
import path from 'path'
import { logger } from '../core'

export function deleteFile(fileUrl: string) {
  try {
    // Assuming fileUrl is something like '/uploads/filename.ext'
    if (!fileUrl.startsWith('/uploads/')) return

    const filename = fileUrl.replace('/uploads/', '')
    const filepath = path.join(__dirname, '../../uploads', filename)

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    logger.error(`Failed to delete file: ${(error as Error).message || String(error)}`)
  }
}

export function deleteFiles(fileUrls: string[]) {
  for (const url of fileUrls) {
    deleteFile(url)
  }
}
