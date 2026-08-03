/**
 * Subscription Service — CloudEMS Platform v4.5
 *
 * Manages school subscriptions, plan details, and custom per-school pricing.
 *
 * @module services/subscription
 */

import { FeatureResolutionService, PLAN_FEATURE_CATALOG } from './feature-resolution.service'

export interface UpdateSubscriptionInput {
  currentPlan?: string
  monthlyPrice?: number
  yearlyPrice?: number
  status?: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
}

export class SubscriptionService {
  /**
   * Retrieves current subscription details for a school.
   * Auto-provisions a default BASE subscription if none exists.
   */
  static async getSubscriptionDetails(db: any, schoolId: string) {
    let subscription = await db.subscription.findFirst({
      where: { schoolId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    // If no active subscription exists, initialize a default BASE subscription
    if (!subscription) {
      const basePlan = PLAN_FEATURE_CATALOG.BASE
      subscription = await db.subscription.create({
        data: {
          schoolId,
          currentPlan: 'BASE',
          monthlyPrice: basePlan.monthlyPrice,
          yearlyPrice: basePlan.yearlyPrice,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      })
    }

    // Resolve active features
    const resolvedFeatures = await FeatureResolutionService.resolveSchoolFeatures(db, schoolId)

    // Check for pending upgrade requests
    const pendingUpgradeRequest = await db.upgradeRequest.findFirst({
      where: { schoolId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })

    return {
      subscription: {
        id: subscription.id,
        schoolId: subscription.schoolId,
        currentPlan: subscription.currentPlan,
        monthlyPrice: subscription.monthlyPrice,
        yearlyPrice: subscription.yearlyPrice,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
      catalog: PLAN_FEATURE_CATALOG,
      resolvedFeatures,
      hasPendingUpgradeRequest: !!pendingUpgradeRequest,
      pendingUpgradeRequest: pendingUpgradeRequest
        ? {
            id: pendingUpgradeRequest.id,
            requestedPlan: pendingUpgradeRequest.requestedPlan,
            status: pendingUpgradeRequest.status,
            createdAt: pendingUpgradeRequest.createdAt,
          }
        : null,
    }
  }

  /**
   * Updates pricing or plan for a school (supports custom per-school pricing).
   */
  static async updateSubscription(db: any, schoolId: string, data: UpdateSubscriptionInput) {
    const existing = await db.subscription.findFirst({
      where: { schoolId, status: 'ACTIVE' },
    })

    if (!existing) {
      return db.subscription.create({
        data: {
          schoolId,
          currentPlan: data.currentPlan || 'BASE',
          monthlyPrice: data.monthlyPrice ?? 1000,
          yearlyPrice: data.yearlyPrice ?? 10000,
          status: data.status || 'ACTIVE',
          startDate: new Date(),
        },
      })
    }

    return db.subscription.update({
      where: { id: existing.id },
      data: {
        ...(data.currentPlan && { currentPlan: data.currentPlan }),
        ...(data.monthlyPrice !== undefined && { monthlyPrice: data.monthlyPrice }),
        ...(data.yearlyPrice !== undefined && { yearlyPrice: data.yearlyPrice }),
        ...(data.status && { status: data.status }),
      },
    })
  }
}
