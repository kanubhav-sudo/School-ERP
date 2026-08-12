/**
 * Platform Administration Validators — CloudEMS v4
 *
 * Zod schemas for validating all platform-level request bodies.
 *
 * @module validators/platform
 */

import { z } from 'zod'

// ─── School Provisioning ──────────────────────────────────────

const classTemplateSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  sections: z.array(z.string().min(1)).min(1, 'At least one section is required'),
})

export const provisionSchoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters').max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
    .min(2)
    .max(50)
    .optional(),
  schoolType: z
    .enum(['PRIMARY', 'SECONDARY', 'SENIOR_SECONDARY', 'K12', 'COLLEGE', 'OTHER'])
    .optional(),
  contactEmail: z.string().email('Invalid contact email').optional(),
  contactPhone: z.string().min(10).max(15).optional(),
  website: z.string().url('Invalid website URL').optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  customDomain: z.string().min(3).max(253).optional(),

  branding: z
    .object({
      logoUrl: z.string().url().optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
        .optional(),
      accentColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
        .optional(),
    })
    .optional(),

  settings: z
    .object({
      principalName: z.string().max(100).optional(),
      sessionStartMonth: z.number().int().min(1).max(12).optional(),
      workingDays: z
        .array(
          z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
        )
        .optional(),
      dateFormat: z.string().max(20).optional(),
      timeZone: z.string().max(50).optional(),
      currency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional(),
    })
    .optional(),

  features: z
    .object({
      transportModule: z.boolean().optional(),
      libraryModule: z.boolean().optional(),
      hostelModule: z.boolean().optional(),
      inventoryModule: z.boolean().optional(),
      payrollModule: z.boolean().optional(),
      onlineExamModule: z.boolean().optional(),
    })
    .optional(),

  classTemplate: z.array(classTemplateSchema).max(50, 'Cannot exceed 50 classes').optional(),

  adminUser: z.object({
    firstName: z.string().min(1, 'Admin first name is required').max(50),
    lastName: z.string().min(1, 'Admin last name is required').max(50),
    email: z.string().email('Invalid admin email'),
    phone: z.string().min(10).max(15).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
})

export type ProvisionSchoolInput = z.infer<typeof provisionSchoolSchema>

// ─── Update School ────────────────────────────────────────────

export const updateSchoolSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  schoolType: z
    .enum(['PRIMARY', 'SECONDARY', 'SENIOR_SECONDARY', 'K12', 'COLLEGE', 'OTHER'])
    .optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(10).max(15).optional(),
  website: z.string().url().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  customDomain: z.string().min(3).max(253).nullable().optional(),
  logoUrl: z.string().url().optional(),
})

export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>

// ─── Update Settings ──────────────────────────────────────────

export const updateSettingsSchema = z.object({
  principalName: z.string().max(100).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  sessionStartMonth: z.number().int().min(1).max(12).optional(),
  workingDays: z.array(z.string()).optional(),
  attendanceRules: z.record(z.string(), z.unknown()).optional(),
  gradingRules: z.record(z.string(), z.unknown()).optional(),
  dateFormat: z.string().max(20).optional(),
  timeZone: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

// ─── Update Features ──────────────────────────────────────────

export const updateFeaturesSchema = z.object({
  attendanceModule: z.boolean().optional(),
  feesModule: z.boolean().optional(),
  examModule: z.boolean().optional(),
  homeworkModule: z.boolean().optional(),
  noticeModule: z.boolean().optional(),
  transportModule: z.boolean().optional(),
  libraryModule: z.boolean().optional(),
  hostelModule: z.boolean().optional(),
  inventoryModule: z.boolean().optional(),
  payrollModule: z.boolean().optional(),
  onlineExamModule: z.boolean().optional(),
})

export type UpdateFeaturesInput = z.infer<typeof updateFeaturesSchema>

// ─── Status Transition ────────────────────────────────────────

export const changeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED', 'FAILED']),
  reason: z.string().max(500).optional(),
})

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>

// ─── Audit Logs Filter ────────────────────────────────────────

export const auditLogFilterSchema = z.object({
  schoolId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  module: z.string().optional(),
  result: z.enum(['SUCCESS', 'FAILURE']).optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  fromDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  toDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 50)),
})

// ─── Global Search ────────────────────────────────────────────

export const globalSearchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(100),
})

// ─── Reset School Admin Password ──────────────────────────────

export const resetSchoolAdminPasswordSchema = z.object({
  adminUserId: z.string().uuid('Invalid admin user ID'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ResetSchoolAdminPasswordInput = z.infer<typeof resetSchoolAdminPasswordSchema>
