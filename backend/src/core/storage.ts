/**
 * Storage Abstraction Interface
 *
 * Defines the contract for file storage.
 * Currently backed by local filesystem, but designed to be swapped with:
 * - Amazon S3
 * - Google Cloud Storage
 * - Azure Blob Storage
 * - MinIO
 *
 * Business logic should only depend on this interface.
 *
 * @module core/storage
 */

export interface StorageProvider {
  /** Upload a file and return the storage path/URL */
  upload(bucket: string, filename: string, data: Buffer): Promise<string>

  /** Download a file as a Buffer */
  download(bucket: string, filename: string): Promise<Buffer>

  /** Delete a file */
  delete(bucket: string, filename: string): Promise<void>

  /** Check if a file exists */
  exists(bucket: string, filename: string): Promise<boolean>

  /** Get a public or signed URL for a file */
  getUrl(bucket: string, filename: string): string
}

/**
 * Storage buckets used across the application.
 * Each bucket corresponds to a directory in local storage
 * or a container/prefix in cloud storage.
 */
export const STORAGE_BUCKETS = {
  STUDENT_PHOTOS: 'student-photos',
  TEACHER_PHOTOS: 'teacher-photos',
  HOMEWORK: 'homework',
  CLASSWORK: 'classwork',
  NOTICE: 'notice',
  REPORT_CARDS: 'report-cards',
  ADMIT_CARDS: 'admit-cards',
  FEE_RECEIPTS: 'fee-receipts',
  SCHOOL_LOGO: 'school-logo',
} as const

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]
