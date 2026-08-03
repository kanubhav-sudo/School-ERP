import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Prisma } from '../generated/prisma'
import { AccountAuditAction } from '../generated/prisma'
import { NotFoundError, ValidationError } from '../core/errors'

export const TEMP_PASSWORD_LENGTH = 16

/**
 * Log an account action in the audit trail.
 */
export async function logAccountAction(
  db: any,
  userId: string,
  action: AccountAuditAction,
  performedBy?: string,
  remarks?: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? db
  void client
  await db.accountAuditLog.create({
    data: {
      userId,
      performedBy: performedBy || null,
      action,
      remarks,
    },
  })
}

/**
 * Generate a secure temporary password.
 */
export function generateTemporaryPassword(): string {
  // Generates 16 random bytes and converts to base64, removing non-alphanumeric chars for readability
  return crypto
    .randomBytes(16)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, TEMP_PASSWORD_LENGTH)
}

/**
 * Generate the next Teacher username sequentially (e.g. TCH000001).
 */
export async function generateTeacherUsername(
  db: any,
  tx?: Prisma.TransactionClient
): Promise<string> {
  const client = tx ?? db
  void client
  const prefix = 'TCH'

  const seq = await db.usernameSequence.upsert({
    where: { prefix },
    update: { lastSeq: { increment: 1 } },
    create: { prefix, lastSeq: 1 },
  })

  return `${prefix}${String(seq.lastSeq).padStart(6, '0')}`
}

/**
 * Generate the next Student username sequentially (e.g. STU2026000001).
 */
export async function generateStudentUsername(
  db: any,
  admissionYear: number,
  tx?: Prisma.TransactionClient
): Promise<string> {
  const client = tx ?? db
  void client
  const prefix = `STU${admissionYear}`

  const seq = await db.usernameSequence.upsert({
    where: { prefix },
    update: { lastSeq: { increment: 1 } },
    create: { prefix, lastSeq: 1 },
  })

  return `${prefix}${String(seq.lastSeq).padStart(6, '0')}`
}

/**
 * Creates a User account for a teacher. Must be called inside a transaction.
 */
export async function createUserForTeacher(
  db: any,
  teacherId: string,
  tx?: any
): Promise<{ username: string; temporaryPassword: string }> {
  const client = tx ?? db
  const teacher = await client.teacher.findUnique({ where: { id: teacherId } })
  if (!teacher) throw new NotFoundError('Teacher not found')
  if (teacher.userId) throw new ValidationError('Teacher already has an account')

  const username = await generateTeacherUsername(db, client)
  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await bcrypt.hash(temporaryPassword, 12)

  const user = await client.user.create({
    data: {
      username,
      email: teacher.email, // Use teacher's email
      passwordHash,
      role: 'TEACHER',
      accountStatus: 'ACTIVE',
      mustChangePassword: true,
    },
  })

  await client.teacher.update({
    where: { id: teacherId },
    data: { userId: user.id },
  })

  await logAccountAction(
    db,
    user.id,
    'ACCOUNT_CREATED' as AccountAuditAction,
    undefined,
    'Account auto-created for teacher',
    client
  )
  await logAccountAction(
    db,
    user.id,
    'CREDENTIALS_ISSUED' as AccountAuditAction,
    undefined,
    'Initial credentials issued for teacher',
    client
  )

  return { username, temporaryPassword }
}

/**
 * Creates a User account for a student. Must be called inside a transaction.
 */
export async function createUserForStudent(
  db: any,
  studentId: string,
  tx?: any
): Promise<{ username: string; temporaryPassword: string }> {
  const client = tx ?? db
  const student = await client.student.findUnique({
    where: { id: studentId },
    include: { session: true },
  })
  if (!student) throw new NotFoundError('Student not found')
  if (student.userId) throw new ValidationError('Student already has an account')

  const admissionYear = student.admissionDate
    ? new Date(student.admissionDate).getFullYear()
    : new Date().getFullYear()

  const username = await generateStudentUsername(db, admissionYear, client)
  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await bcrypt.hash(temporaryPassword, 12)

  const user = await client.user.create({
    data: {
      username,
      email: student.email || null,
      passwordHash,
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      mustChangePassword: true,
    },
  })

  await client.student.update({
    where: { id: studentId },
    data: { userId: user.id },
  })

  await logAccountAction(
    db,
    user.id,
    'ACCOUNT_CREATED' as AccountAuditAction,
    undefined,
    'Account auto-created for student',
    client
  )
  await logAccountAction(
    db,
    user.id,
    'CREDENTIALS_ISSUED' as AccountAuditAction,
    undefined,
    'Initial credentials issued for student',
    client
  )

  return { username, temporaryPassword }
}

/**
 * Admin action: Resets a user's password, unlocks their account, and forces password change.
 * Invalidates current password immediately.
 */
export async function resetPassword(
  db: any,
  userId: string,
  adminId: string,
  remarks?: string
): Promise<{ temporaryPassword: string }> {
  return await db.$transaction(async (tx: any) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User not found')

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        lockedUntil: null,
        failedLoginAttempts: 0,
        refreshTokenVersion: { increment: 1 }, // Invalidate sessions
      },
    })

    await logAccountAction(db, userId, 'PASSWORD_RESET', adminId, remarks, tx)
    await logAccountAction(
      db,
      userId,
      'CREDENTIALS_ISSUED',
      adminId,
      'New temporary credentials issued',
      tx
    )

    return { temporaryPassword }
  })
}

/**
 * Admin action: Reissues credentials. Generates a new temp password without full reset semantics
 * (although technically it overwrites the password hash, the business semantic is "lost password").
 */
export async function reissueCredentials(
  db: any,
  userId: string,
  adminId: string,
  remarks?: string
): Promise<{ temporaryPassword: string }> {
  return await db.$transaction(async (tx: any) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User not found')

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        refreshTokenVersion: { increment: 1 },
      },
    })

    await logAccountAction(db, userId, 'CREDENTIALS_REISSUED', adminId, remarks, tx)

    return { temporaryPassword }
  })
}

/**
 * Admin action: Activates a suspended/disabled account.
 */
export async function activateAccount(db: any, userId: string, adminId: string, remarks?: string) {
  await db.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: { accountStatus: 'ACTIVE' },
    })
    await logAccountAction(db, userId, 'ACCOUNT_ACTIVATED', adminId, remarks, tx)
  })
}

/**
 * Admin action: Suspends an account.
 */
export async function suspendAccount(db: any, userId: string, adminId: string, remarks?: string) {
  await db.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: { accountStatus: 'SUSPENDED', refreshTokenVersion: { increment: 1 } },
    })
    await logAccountAction(db, userId, 'ACCOUNT_SUSPENDED', adminId, remarks, tx)
  })
}

/**
 * Admin action: Disables an account (INACTIVE).
 */
export async function disableAccount(db: any, userId: string, adminId: string, remarks?: string) {
  await db.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: { accountStatus: 'INACTIVE', refreshTokenVersion: { increment: 1 } },
    })
    await logAccountAction(db, userId, 'ACCOUNT_DISABLED', adminId, remarks, tx)
  })
}
/**
 * User action: Change their own password (self-service).
 */
export async function changePassword(
  db: any,
  userId: string,
  _currentPasswordHash: string, // passed from controller after comparing
  newPasswordHash: string
) {
  await db.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        refreshTokenVersion: { increment: 1 },
      },
    })
    await logAccountAction(
      db,
      userId,
      'PASSWORD_CHANGED',
      undefined,
      'User changed their own password',
      tx
    )
  })
}

/**
 * Admin action: Unlocks an account that was locked due to failed logins.
 */
export async function unlockAccount(db: any, userId: string, adminId: string, remarks?: string) {
  await db.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    })
    await logAccountAction(db, userId, 'ACCOUNT_UNLOCKED', adminId, remarks, tx)
  })
}

/**
 * Admin action: Forces the user to change their password on next login.
 */
export async function forcePasswordChange(
  db: any,
  userId: string,
  adminId: string,
  remarks?: string
) {
  await db.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    })
    await logAccountAction(db, userId, 'FORCE_PASSWORD_CHANGE', adminId, remarks, tx)
  })
}

/**
 * Fetch detailed account info including audit logs.
 */
export async function getAccountDetails(db: any, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      accountStatus: true,
      mustChangePassword: true,
      failedLoginAttempts: true,
      lastFailedLoginAt: true,
      lockedUntil: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      accountAuditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          remarks: true,
          createdAt: true,
          actor: {
            select: { username: true, role: true },
          },
        },
      },
    },
  })

  if (!user) throw new NotFoundError('User not found')
  return user
}
