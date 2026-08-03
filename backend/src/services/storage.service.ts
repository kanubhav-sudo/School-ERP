/**
 * Storage Service
 *
 * Implements tenant-isolated object key hierarchy for uploads and storage preparation.
 * All object storage keys start with `schoolId/category/filename`.
 *
 * @module services/storage
 */

import path from 'path'

export type StorageCategory =
  | 'students'
  | 'teachers'
  | 'profile'
  | 'logos'
  | 'homework'
  | 'announcements'
  | 'fees'
  | 'results'
  | 'admitcards'
  | 'exams'
  | 'documents'
  | 'temp'

export class StorageService {
  /**
   * Generates a tenant-isolated storage key.
   * Format: `${schoolId}/${category}/${timestamp}_${cleanFilename}`
   */
  static getStorageKey(schoolId: string, category: StorageCategory, filename: string): string {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_')
    return `${schoolId}/${category}/${Date.now()}_${cleanFilename}`
  }

  /**
   * Resolves a storage key to local filesystem path for dev fallback.
   */
  static getLocalPath(storageKey: string): string {
    return path.join(process.cwd(), 'uploads', storageKey)
  }

  /**
   * Placeholder for AWS S3 / Cloud Storage presigned upload URL generation.
   * Ready for Phase 4 cloud integration.
   */
  static async getPresignedUploadUrl(
    storageKey: string,
    _contentType: string
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    // In dev / pre-S3 phase, return static uploads path
    const fileUrl = `/uploads/${storageKey}`
    return {
      uploadUrl: fileUrl,
      fileUrl,
    }
  }
}
