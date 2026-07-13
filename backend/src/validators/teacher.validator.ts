/**
 * Teacher Validators
 *
 * Zod schemas for validating incoming teacher request bodies.
 *
 * @module validators/teacher
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────

const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER'])
const EmploymentStatusEnum = z.enum([
  'PERMANENT',
  'CONTRACT',
  'PROBATION',
  'RESIGNED',
  'TERMINATED',
])

const TeacherDesignationEnum = z.enum([
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'COORDINATOR',
  'SENIOR_TEACHER',
  'TEACHER',
  'ASSISTANT_TEACHER',
])

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

// ─── Create ──────────────────────────────────────────────────

export const createTeacherSchema = z.object({
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .max(50, 'Employee ID must be 50 characters or fewer')
    .trim(),
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
  phone: z.string().max(20).trim().optional(),
  email: z.string().email('Invalid email address').trim(),
  qualification: z.string().max(200).trim().optional(),
  experienceYears: z.number().int().min(0).optional().default(0),
  department: z.string().max(100).trim().optional(),
  joiningDate: z.string().date('joiningDate must be a valid date (YYYY-MM-DD)'),
  employmentStatus: EmploymentStatusEnum.optional().default('PERMANENT'),
  address: z.string().max(500).trim().optional(),
  bloodGroup: BloodGroupEnum.optional(),
  emergencyContact: z.string().max(100).trim().optional(),
  emergencyPhone: z.string().max(20).trim().optional(),
  photoUrl: z.string().url().optional(),
  designation: TeacherDesignationEnum.optional().default('TEACHER'),
  notes: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>

// ─── Update ──────────────────────────────────────────────────

export const updateTeacherSchema = z.object({
  employeeId: z.string().min(1).max(50).trim().optional(),
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  gender: GenderEnum.optional(),
  dateOfBirth: z.string().date().optional(),
  phone: z.string().max(20).trim().optional(),
  email: z.string().email().trim().optional(),
  qualification: z.string().max(200).trim().optional(),
  experienceYears: z.number().int().min(0).optional(),
  department: z.string().max(100).trim().optional(),
  joiningDate: z.string().date().optional(),
  employmentStatus: EmploymentStatusEnum.optional(),
  address: z.string().max(500).trim().optional(),
  bloodGroup: BloodGroupEnum.optional(),
  emergencyContact: z.string().max(100).trim().optional(),
  emergencyPhone: z.string().max(20).trim().optional(),
  photoUrl: z.string().url().optional(),
  designation: TeacherDesignationEnum.optional(),
  notes: z.string().max(1000).trim().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>

// ─── Assignment ───────────────────────────────────────────────

export const createTeacherAssignmentSchema = z.object({
  sessionId: z.string().uuid('sessionId must be a valid UUID'),
  classId: z.string().uuid('classId must be a valid UUID'),
  sectionId: z.string().uuid('sectionId must be a valid UUID'),
  subjectId: z.string().uuid('subjectId must be a valid UUID'),
  isClassTeacher: z.boolean().optional().default(false),
})

export type CreateTeacherAssignmentInput = z.infer<typeof createTeacherAssignmentSchema>

// ─── Query / Filters ─────────────────────────────────────────

export const listTeachersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  employmentStatus: EmploymentStatusEnum.optional(),
  sessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
})

export type ListTeachersInput = z.infer<typeof listTeachersSchema>
