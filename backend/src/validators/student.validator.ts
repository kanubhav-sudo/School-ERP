/**
 * Student Validators
 *
 * Zod schemas for validating incoming student request bodies.
 *
 * @module validators/student
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────

const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER'])
const BloodGroupEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
])
const StudentStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'EXPELLED'])
const FeeCategoryEnum = z.enum(['STANDARD', 'SIBLING'])

// ─── Create ──────────────────────────────────────────────────

export const createStudentSchema = z.object({
  admissionNumber: z
    .string()
    .min(1, 'Admission number is required')
    .max(50, 'Admission number must be 50 characters or fewer')
    .trim(),
  rollNumber: z.string().max(50).trim().optional(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or fewer')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or fewer')
    .trim(),
  gender: GenderEnum,
  dateOfBirth: z.string().date('dateOfBirth must be a valid date (YYYY-MM-DD)').optional(),
  bloodGroup: BloodGroupEnum.optional(),
  phone: z.string().max(20).trim().optional(),
  email: z.string().email('Invalid email address').trim().optional(),

  // Parent Info
  fatherName: z.string().max(200).trim().optional(),
  fatherPhone: z.string().max(20).trim().optional(),
  motherName: z.string().max(200).trim().optional(),
  motherPhone: z.string().max(20).trim().optional(),

  // Guardian Info
  guardianName: z.string().max(200).trim().optional(),
  guardianPhone: z.string().max(20).trim().optional(),
  guardianRelation: z.string().max(100).trim().optional(),

  // Emergency Contact
  emergencyContact: z.string().max(200).trim().optional(),
  emergencyPhone: z.string().max(20).trim().optional(),

  address: z.string().max(500).trim().optional(),

  // Academic Assignment
  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),

  // Finance Assignment
  feeCategory: FeeCategoryEnum.optional(),
  feePlanId: z.string().uuid().optional(),
  siblingStudentId: z.string().uuid().optional(),
  siblingFeeAmount: z.coerce.number().int().nonnegative().optional(),

  admissionDate: z.string().date('admissionDate must be a valid date (YYYY-MM-DD)'),
  status: StudentStatusEnum.optional().default('ACTIVE'),
  notes: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateStudentSchema = z.object({
  admissionNumber: z.string().min(1).max(50).trim().optional(),
  rollNumber: z.string().max(50).trim().optional(),
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  gender: GenderEnum.optional(),
  dateOfBirth: z.string().date().optional(),
  bloodGroup: BloodGroupEnum.optional(),
  phone: z.string().max(20).trim().optional(),
  email: z.string().email().trim().optional(),

  fatherName: z.string().max(200).trim().optional(),
  fatherPhone: z.string().max(20).trim().optional(),
  motherName: z.string().max(200).trim().optional(),
  motherPhone: z.string().max(20).trim().optional(),

  guardianName: z.string().max(200).trim().optional(),
  guardianPhone: z.string().max(20).trim().optional(),
  guardianRelation: z.string().max(100).trim().optional(),

  emergencyContact: z.string().max(200).trim().optional(),
  emergencyPhone: z.string().max(20).trim().optional(),

  address: z.string().max(500).trim().optional(),

  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),

  feeCategory: FeeCategoryEnum.optional(),
  feePlanId: z.string().uuid().optional(),
  siblingStudentId: z.string().uuid().optional(),
  siblingFeeAmount: z.coerce.number().int().nonnegative().optional(),

  admissionDate: z.string().date().optional(),
  status: StudentStatusEnum.optional(),
  notes: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listStudentsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  status: StudentStatusEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
})

export type ListStudentsInput = z.infer<typeof listStudentsSchema>
