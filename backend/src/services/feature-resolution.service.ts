/**
 * Feature Resolution Service — CloudEMS Platform v4.5
 *
 * Centralized feature permission system.
 * Resolves active features based on subscription plans and custom school overrides.
 *
 * ARCHITECTURAL RULE: Business logic MUST NOT depend on plan names (e.g. `if (plan === "PREMIUM")`).
 * Instead, modules query whether a feature key is enabled.
 *
 * @module services/feature-resolution
 */

export interface FeatureMeta {
  key: string
  name: string
  description: string
  category: 'CORE' | 'PREMIUM'
  isPlaceholder?: boolean
}

export interface PlanCatalogItem {
  code: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  annualSavings: number
  features: FeatureMeta[]
}

export const PLAN_FEATURE_CATALOG: Record<string, PlanCatalogItem> = {
  BASE: {
    code: 'BASE',
    name: 'Base Plan',
    description: 'Essential ERP tools for complete school management',
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    annualSavings: 2000,
    features: [
      { key: 'attendance', name: 'Attendance', description: 'Daily student and teacher attendance tracking', category: 'CORE' },
      { key: 'fees', name: 'Fees & Finance', description: 'Fee structure management and payment recording', category: 'CORE' },
      { key: 'homework', name: 'Homework', description: 'Homework assignments and student submission portal', category: 'CORE' },
      { key: 'exams', name: 'Exams & Marks', description: 'Exam scheduling, marks entry, and admit card release', category: 'CORE' },
      { key: 'results', name: 'Results & Report Cards', description: 'Report card generation and result publication', category: 'CORE' },
      { key: 'timetable', name: 'Timetable', description: 'Class and teacher weekly schedule management', category: 'CORE' },
      { key: 'notices', name: 'Noticeboard', description: 'Circulars, announcements, and school notices', category: 'CORE' },
    ],
  },
  PREMIUM: {
    code: 'PREMIUM',
    name: 'Premium Plan',
    description: 'Advanced AI insights, transport tracking, and automated workflows',
    monthlyPrice: 2500,
    yearlyPrice: 25000,
    annualSavings: 5000,
    features: [
      { key: 'attendance', name: 'Attendance', description: 'Daily student and teacher attendance tracking', category: 'CORE' },
      { key: 'fees', name: 'Fees & Finance', description: 'Fee structure management and payment recording', category: 'CORE' },
      { key: 'homework', name: 'Homework', description: 'Homework assignments and student submission portal', category: 'CORE' },
      { key: 'exams', name: 'Exams & Marks', description: 'Exam scheduling, marks entry, and admit card release', category: 'CORE' },
      { key: 'results', name: 'Results & Report Cards', description: 'Report card generation and result publication', category: 'CORE' },
      { key: 'timetable', name: 'Timetable', description: 'Class and teacher weekly schedule management', category: 'CORE' },
      { key: 'notices', name: 'Noticeboard', description: 'Circulars, announcements, and school notices', category: 'CORE' },
      { key: 'transport', name: 'Transport Module', description: 'Bus route, driver, and vehicle management', category: 'PREMIUM', isPlaceholder: true },
      { key: 'ai_remarks', name: 'AI Remarks', description: 'AI-assisted personalized student report card remarks', category: 'PREMIUM', isPlaceholder: true },
      { key: 'ai_homework', name: 'AI Homework Assistant', description: 'Automated homework generation and grading hints', category: 'PREMIUM', isPlaceholder: true },
      { key: 'ai_analytics', name: 'AI Analytics & Insights', description: 'Predictive performance analytics and risk detection', category: 'PREMIUM', isPlaceholder: true },
    ],
  },
}

export class FeatureResolutionService {
  /**
   * Resolves the complete map of enabled features for a given school.
   * Priority order:
   * 1. Active Subscription currentPlan base features
   * 2. SchoolFeatures overrides (if present in school_features table)
   */
  static async resolveSchoolFeatures(db: any, schoolId: string) {
    // 1. Fetch active subscription
    const subscription = await db.subscription.findFirst({
      where: { schoolId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    const currentPlanCode = subscription?.currentPlan || 'BASE'
    const planCatalog = PLAN_FEATURE_CATALOG[currentPlanCode] || PLAN_FEATURE_CATALOG.BASE

    // Build base feature map from plan catalog
    const featureMap: Record<string, boolean> = {}
    for (const f of planCatalog.features) {
      featureMap[f.key] = true
    }

    // 2. Overlay explicit toggle overrides from SchoolFeatures if present
    const schoolFeatures = await db.schoolFeatures.findUnique({
      where: { schoolId },
    })

    if (schoolFeatures) {
      if (schoolFeatures.attendanceModule !== undefined) featureMap['attendance'] = schoolFeatures.attendanceModule
      if (schoolFeatures.feesModule !== undefined) featureMap['fees'] = schoolFeatures.feesModule
      if (schoolFeatures.examModule !== undefined) featureMap['exams'] = schoolFeatures.examModule
      if (schoolFeatures.homeworkModule !== undefined) featureMap['homework'] = schoolFeatures.homeworkModule
      if (schoolFeatures.noticeModule !== undefined) featureMap['notices'] = schoolFeatures.noticeModule
      if (schoolFeatures.transportModule !== undefined) featureMap['transport'] = schoolFeatures.transportModule
    }

    const activeFeatureKeys = Object.keys(featureMap).filter((k) => featureMap[k] === true)

    return {
      schoolId,
      currentPlan: currentPlanCode,
      planName: planCatalog.name,
      features: featureMap,
      activeFeatureKeys,
    }
  }

  /**
   * Checks whether a specific feature key is enabled for a given school.
   */
  static async hasFeature(db: any, schoolId: string, featureKey: string): Promise<boolean> {
    const resolved = await this.resolveSchoolFeatures(db, schoolId)
    return !!resolved.features[featureKey]
  }

  /**
   * Returns all available plan catalogs and their features (consumed by UI for comparison).
   */
  static getPlanCatalog() {
    return PLAN_FEATURE_CATALOG
  }
}
