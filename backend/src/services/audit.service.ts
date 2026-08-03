/**
 * Audit Service — CloudEMS Platform v4
 *
 * Centralised, platform-wide audit logging.
 * Writes to the `audit_logs` table.
 * Used by both SUPER_ADMIN platform routes and tenant-scoped routes.
 *
 * @module services/audit
 */

import { Request } from 'express'
import prisma from '../database/prisma'
import { Role } from '../generated/prisma'

// ─── Types ────────────────────────────────────────────────────

export interface AuditPayload {
  /** The user performing the action (null for system-initiated events) */
  userId?: string
  /** The role of the acting user */
  role: Role
  /** Which module/subsystem emits this event */
  module: 'PLATFORM' | 'SCHOOL' | 'AUTH' | 'FEES' | 'EXAM' | 'ATTENDANCE' | 'PEOPLE' | 'SYSTEM'
  /** Short verb describing the action, e.g. SCHOOL_CREATED, USER_SUSPENDED */
  action: string
  /** Entity type, e.g. School, User, Teacher */
  entity: string
  /** Primary key of the affected entity */
  entityId?: string
  /** Result of the action */
  result?: 'SUCCESS' | 'FAILURE'
  /** schoolId for tenant-scoped events; undefined for platform-level events */
  schoolId?: string
  /** Snapshot of the entity before the action */
  oldValue?: Record<string, unknown>
  /** Snapshot of the entity after the action */
  newValue?: Record<string, unknown>
  /** Client IP address */
  ipAddress?: string
  /** User-Agent header string */
  userAgent?: string
  /** Device identifier */
  device?: string
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Extracts audit metadata (IP, user agent, device) from an Express request.
 */
export function extractAuditMeta(
  req: Request
): Pick<AuditPayload, 'ipAddress' | 'userAgent' | 'device'> {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  const userAgent = req.headers['user-agent'] || undefined
  const device = req.headers['x-device-id'] as string | undefined

  return { ipAddress, userAgent, device }
}

// ─── Core Logging Function ────────────────────────────────────

/**
 * Write a single audit log entry.
 * Never throws — failures are swallowed to avoid disrupting the main request.
 */
export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId ?? null,
        schoolId: payload.schoolId ?? null,
        role: payload.role,
        module: payload.module,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId ?? null,
        result: payload.result ?? 'SUCCESS',
        oldValue: (payload.oldValue as object) ?? undefined,
        newValue: (payload.newValue as object) ?? undefined,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
        device: payload.device ?? null,
      },
    })
  } catch (err) {
    // Audit failures must never crash the application
    console.error('[AuditService] Failed to write audit log:', err)
  }
}

/**
 * Convenience: log a SUPER_ADMIN platform-level event from an Express request.
 */
export async function auditPlatformEvent(
  req: Request,
  action: string,
  entity: string,
  entityId?: string,
  extra?: Partial<AuditPayload>
): Promise<void> {
  const meta = extractAuditMeta(req)
  await writeAuditLog({
    userId: req.user?.sub,
    role: (req.user?.role as Role) ?? Role.SUPER_ADMIN,
    module: 'PLATFORM',
    action,
    entity,
    entityId,
    result: 'SUCCESS',
    ...meta,
    ...extra,
  })
}

// ─── Query Helpers ────────────────────────────────────────────

export interface AuditLogFilter {
  schoolId?: string
  userId?: string
  module?: string
  result?: string
  action?: string
  entity?: string
  fromDate?: Date
  toDate?: Date
  page?: number
  limit?: number
}

/**
 * Paginated retrieval of audit logs for the platform dashboard.
 */
export async function getAuditLogs(filter: AuditLogFilter) {
  const {
    schoolId,
    userId,
    module,
    result,
    action,
    entity,
    fromDate,
    toDate,
    page = 1,
    limit = 50,
  } = filter

  const where = {
    ...(schoolId && { schoolId }),
    ...(userId && { userId }),
    ...(module && { module }),
    ...(result && { result }),
    ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
    ...(entity && { entity: { contains: entity, mode: 'insensitive' as const } }),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: toDate }),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
        school: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}
