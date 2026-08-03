/**
 * Upgrade Request Service — CloudEMS Platform v4.5
 *
 * Handles creation and tracking of subscription upgrade requests.
 * Clicking "Request Upgrade" in the UI submits a request for callback from the CloudEMS team.
 *
 * @module services/upgrade-request
 */

import { ConflictError, ValidationError } from '../core/errors'
import { writeAuditLog } from './audit.service'

export interface CreateUpgradeRequestInput {
  schoolId: string
  requestedPlan?: string
  requestedById?: string
  notes?: string
}

export class UpgradeRequestService {
  /**
   * Submits an upgrade request for a school.
   */
  static async createUpgradeRequest(db: any, input: CreateUpgradeRequestInput) {
    const { schoolId, requestedPlan = 'PREMIUM', requestedById, notes } = input

    // Check if school already has a pending upgrade request
    const existing = await db.upgradeRequest.findFirst({
      where: { schoolId, status: 'PENDING' },
    })

    if (existing) {
      throw new ConflictError(
        'An upgrade request is already pending. A CloudEMS representative will call you shortly.'
      )
    }

    // Get current subscription plan
    const sub = await db.subscription.findFirst({
      where: { schoolId, status: 'ACTIVE' },
    })

    const currentPlan = sub?.currentPlan || 'BASE'

    if (currentPlan === requestedPlan) {
      throw new ValidationError(`Your school is already subscribed to the ${requestedPlan} plan.`)
    }

    const upgradeReq = await db.upgradeRequest.create({
      data: {
        schoolId,
        currentPlan,
        requestedPlan,
        status: 'PENDING',
        requestedBy: requestedById,
        notes,
      },
    })

    // Log audit event
    await writeAuditLog({
      userId: requestedById,
      schoolId,
      role: 'ADMIN',
      module: 'SCHOOL',
      action: 'UPGRADE_REQUEST_CREATED',
      entity: 'UpgradeRequest',
      entityId: upgradeReq.id,
      result: 'SUCCESS',
      newValue: { currentPlan, requestedPlan, status: 'PENDING' },
    })

    return upgradeReq
  }

  /**
   * Lists upgrade requests for a school or platform admin.
   */
  static async listUpgradeRequests(db: any, schoolId?: string) {
    return db.upgradeRequest.findMany({
      where: {
        ...(schoolId && { schoolId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: { id: true, name: true, slug: true, contactEmail: true, contactPhone: true },
        },
      },
    })
  }
}
