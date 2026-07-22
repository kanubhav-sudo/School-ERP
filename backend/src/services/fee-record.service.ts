import prisma from '../database/prisma'
import type { ListFeeRecordsInput, FeeSummaryInput } from '../validators/fee-record.validator'
import { ConflictError, NotFoundError } from '../core/errors'
import { Prisma, FeeRecordStatus } from '../generated/prisma'

// Full Academic year fee months (April to March)
export const ALL_ACADEMIC_MONTHS = [
  { month: 4, label: 'April', isVacation: false },
  { month: 5, label: 'May', isVacation: true }, // May: Vacation (No Fee)
  { month: 6, label: 'June', isVacation: false },
  { month: 7, label: 'July', isVacation: false },
  { month: 8, label: 'August', isVacation: false },
  { month: 9, label: 'September', isVacation: false },
  { month: 10, label: 'October', isVacation: false },
  { month: 11, label: 'November', isVacation: false },
  { month: 12, label: 'December', isVacation: false },
  { month: 1, label: 'January', isVacation: false },
  { month: 2, label: 'February', isVacation: false },
  { month: 3, label: 'March', isVacation: false },
]

export const FEE_MONTHS = ALL_ACADEMIC_MONTHS.filter((m) => !m.isVacation)

const feeRecordSelect = {
  id: true,
  studentId: true,
  feePlanId: true,
  sessionId: true,
  classId: true,
  month: true,
  year: true,
  monthlyAmount: true,
  lateFine: true,
  netAmount: true,
  paidAmount: true,
  balanceAmount: true,
  status: true,
  dueDate: true,
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
    },
  },
  session: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  feePlan: { select: { id: true, name: true } },
}

export async function listFeeRecords(filters: ListFeeRecordsInput) {
  const { page, limit, sessionId, classId, sectionId, month, status, studentId, search, sortBy } = filters
  const skip = (page - 1) * limit

  const where: any = {
    ...(sessionId ? { sessionId } : {}),
    ...(classId ? { classId } : {}),
    ...(month ? { month } : {}),
    ...(status ? { status } : {}),
    ...(studentId ? { studentId } : {}),
  }

  if (sectionId) {
    where.student = { ...where.student, sectionId }
  }

  if (search) {
    where.OR = [
      {
        student: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { admissionNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
      { receiptNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  let orderBy: any = [{ year: 'desc' }, { month: 'desc' }]
  if (sortBy === 'newest') orderBy = [{ year: 'desc' }, { month: 'desc' }]
  if (sortBy === 'oldest') orderBy = [{ year: 'asc' }, { month: 'asc' }]
  if (sortBy === 'highest') orderBy = { netAmount: 'desc' }
  if (sortBy === 'lowest') orderBy = { netAmount: 'asc' }
  if (sortBy === 'name') orderBy = { student: { firstName: 'asc' } }

  const [feeRecords, total] = await Promise.all([
    prisma.feeRecord.findMany({
      where,
      select: feeRecordSelect,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.feeRecord.count({ where }),
  ])

  return {
    feeRecords,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
  Redesigned Student Fee List (Class-only filter, no section filter required)
 */
export async function getStudentFeeList(filters: {
  sessionId?: string
  classId?: string
  search?: string
  page?: number
  limit?: number
}) {
  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    isActive: true,
    deletedAt: null,
    ...(filters.classId ? { classId: filters.classId } : {}),
    ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
  }

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { admissionNumber: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        feeCategory: true,
        siblingFeeAmount: true,
        advanceBalance: true,
        sessionId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        feePlan: {
          select: {
            id: true,
            name: true,
            monthlyAmount: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: [{ firstName: 'asc' }],
    }),
    prisma.student.count({ where }),
  ])

  const currentDate = new Date()
  const currentMonthNum = currentDate.getMonth() + 1
  const currentAcademicSeq = currentMonthNum >= 4 ? currentMonthNum - 3 : currentMonthNum + 9

  const studentRows = []

  for (const s of students) {
    if (s.id) {
      await generateFeeRecordsForStudent(s.id)
    }

    const records = await prisma.feeRecord.findMany({
      where: {
        studentId: s.id,
        ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    const feeCat = s.feeCategory as string
    let monthlyFee = s.feePlan?.monthlyAmount || 0
    if (feeCat === 'SIBLING' && s.siblingFeeAmount !== null) {
      monthlyFee = s.siblingFeeAmount * 100
    } else if (feeCat === 'RTE' || feeCat === 'STAFF_CHILD') {
      monthlyFee = 0
    }

    let totalFeeUpToCurrent = 0
    let paidAmount = 0
    let pendingAmount = 0
    let firstPendingLabel: string | null = null

    const timeline = ALL_ACADEMIC_MONTHS.map((mInfo) => {
      if (mInfo.isVacation) {
        return {
          month: mInfo.month,
          label: mInfo.label,
          status: 'VACATION',
          displayText: 'Vacation (No Fee)',
        }
      }

      const record = records.find((r) => r.month === mInfo.month)
      const acadSeq = mInfo.month >= 4 ? mInfo.month - 3 : mInfo.month + 9

      if (acadSeq <= currentAcademicSeq && record) {
        totalFeeUpToCurrent += record.netAmount
      }

      if (record) {
        paidAmount += record.paidAmount
        if (acadSeq <= currentAcademicSeq) {
          pendingAmount += record.balanceAmount
        }

        if (record.balanceAmount > 0 && !firstPendingLabel && acadSeq <= currentAcademicSeq) {
          firstPendingLabel = `${mInfo.label} ${record.year}`
        }

        let statusText = 'BLANK'
        if (record.status === 'PAID') statusText = 'PAID'
        else if (record.status === 'PARTIAL') statusText = 'PARTIAL'

        return {
          month: mInfo.month,
          label: mInfo.label,
          status: statusText,
          displayText: statusText === 'PAID' ? '✓' : statusText === 'PARTIAL' ? 'Partial' : '',
        }
      }

      return {
        month: mInfo.month,
        label: mInfo.label,
        status: 'BLANK',
        displayText: '',
      }
    })

    studentRows.push({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      admissionNumber: s.admissionNumber,
      className: s.class?.name || '',
      sectionName: s.section?.name || '',
      feeCategory: s.feeCategory || 'STANDARD',
      monthlyFee,
      currentTotalFee: totalFeeUpToCurrent,
      paidAmount,
      pendingAmount: Math.max(0, pendingAmount - (s.advanceBalance || 0)),
      advanceBalance: s.advanceBalance || 0,
      pendingFrom: firstPendingLabel || 'Cleared',
      timeline,
    })
  }

  return {
    students: studentRows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getFeeSummary(filters: FeeSummaryInput) {
  const { sessionId, month } = filters
  const where = {
    sessionId,
    month: { lte: month },
  }

  const result = await prisma.feeRecord.aggregate({
    where,
    _sum: {
      netAmount: true,
      paidAmount: true,
      balanceAmount: true,
    },
  })

  return {
    totalPending: result._sum.balanceAmount || 0,
    totalPaid: result._sum.paidAmount || 0,
  }
}

export async function generateFeeRecordsForStudent(studentId: string, tx: Prisma.TransactionClient = prisma) {
  const student = await tx.student.findUnique({
    where: { id: studentId },
    include: {
      session: true,
      feePlan: true,
    },
  })

  if (!student || !student.feePlanId || !student.feePlan || !student.session || !student.sessionId || !student.classId) return

  const startYear = parseInt(student.session.name.substring(0, 4))
  if (isNaN(startYear)) return

  const existingRecords = await tx.feeRecord.findMany({
    where: {
      studentId,
      sessionId: student.sessionId,
    },
    select: { month: true, year: true },
  })

  const existingSet = new Set(existingRecords.map((r) => `${r.month}-${r.year}`))
  const newRecordsData = []

  let monthlyAmount = student.feePlan.monthlyAmount
  const category = student.feeCategory as string
  if (category === 'SIBLING' && student.siblingFeeAmount !== null) {
    monthlyAmount = student.siblingFeeAmount * 100
  } else if (category === 'RTE' || category === 'STAFF_CHILD') {
    monthlyAmount = 0
  }

  for (const { month } of FEE_MONTHS) {
    const year = month >= 4 ? startYear : startYear + 1

    if (!existingSet.has(`${month}-${year}`)) {
      newRecordsData.push({
        studentId,
        feePlanId: student.feePlanId,
        sessionId: student.sessionId,
        classId: student.classId,
        month,
        year,
        monthlyAmount,
        netAmount: monthlyAmount,
        balanceAmount: monthlyAmount,
        status: monthlyAmount === 0 ? FeeRecordStatus.PAID : FeeRecordStatus.PENDING,
      })
    }
  }

  if (newRecordsData.length > 0) {
    await tx.feeRecord.createMany({
      data: newRecordsData,
      skipDuplicates: true,
    })
  }
}

export async function addFeePayment(
  studentId: string,
  data: {
    amount: number
    receiptNumber: string
    paymentDate?: string
    paymentMode: any
    remarks?: string
    transactionId?: string
  },
  actorId: string
) {
  let remainingAmount = Math.round(data.amount * 100)

  if (remainingAmount <= 0) {
    throw new ConflictError('Payment amount must be greater than 0')
  }

  if (!data.receiptNumber || !data.receiptNumber.trim()) {
    throw new ConflictError('Receipt number is mandatory')
  }

  return await prisma.$transaction(async (tx) => {
    // Unique receipt number validation
    const existingPayment = await tx.feePayment.findUnique({
      where: { receiptNumber: data.receiptNumber.trim() },
    })
    if (existingPayment) {
      throw new ConflictError('Receipt number already exists')
    }

    const unpaidRecords = await tx.feeRecord.findMany({
      where: {
        studentId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        balanceAmount: { gt: 0 },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    const paymentDateObj = data.paymentDate ? new Date(data.paymentDate) : new Date()

    let primaryFeeRecordId = unpaidRecords[0]?.id
    if (!primaryFeeRecordId) {
      const anyRecord = await tx.feeRecord.findFirst({ where: { studentId } })
      if (!anyRecord) {
        throw new NotFoundError('No fee record found for this student.')
      }
      primaryFeeRecordId = anyRecord.id
    }

    for (const record of unpaidRecords) {
      if (remainingAmount <= 0) break

      const amountToPay = Math.min(record.balanceAmount, remainingAmount)
      const newPaidAmount = record.paidAmount + amountToPay
      const newBalanceAmount = record.balanceAmount - amountToPay
      const newStatus = newBalanceAmount === 0 ? 'PAID' : 'PARTIAL'

      await tx.feeRecord.update({
        where: { id: record.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
          lastPaymentDate: paymentDateObj,
          lastPaymentMode: data.paymentMode,
          receiptNumber: data.receiptNumber.trim(),
        },
      })

      remainingAmount -= amountToPay
    }

    // Overpayment credit saved to advance balance
    if (remainingAmount > 0) {
      await tx.student.update({
        where: { id: studentId },
        data: { advanceBalance: { increment: remainingAmount } },
      })
    }

    const feePayment = await tx.feePayment.create({
      data: {
        feeRecordId: primaryFeeRecordId,
        studentId,
        amount: Math.round(data.amount * 100),
        paymentDate: paymentDateObj,
        paymentMode: data.paymentMode === 'ONLINE' || data.paymentMode === 'UPI' || data.paymentMode === 'CARD' ? 'ONLINE' : data.paymentMode,
        receiptNumber: data.receiptNumber.trim(),
        remarks: data.remarks || null,
        transactionRef: data.transactionId || null,
        collectedById: actorId,
      },
    })

    return feePayment
  })
}

export async function getStudentFeeProfile(studentId: string, sessionId?: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      session: true,
      class: true,
      section: true,
      feePlan: true,
    },
  })

  if (!student) throw new ConflictError('Student not found')

  const effectiveSessionId = sessionId || student.sessionId
  if (!effectiveSessionId) {
    return {
      student,
      records: [],
      payments: [],
      summary: { totalFees: 0, paidAmount: 0, pendingAmount: 0, pendingFrom: null },
    }
  }

  await generateFeeRecordsForStudent(studentId)

  const records = await prisma.feeRecord.findMany({
    where: { studentId, sessionId: effectiveSessionId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      feePlan: { select: { id: true, name: true } },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  })

  const allPayments = records
    .flatMap((r) =>
      r.payments.map((p) => ({
        ...p,
        month: r.month,
        year: r.year,
        monthLabel: ALL_ACADEMIC_MONTHS.find((m) => m.month === r.month)?.label || `Month ${r.month}`,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const currentDate = new Date()
  const currentMonthNum = currentDate.getMonth() + 1
  const currentAcademicSeq = currentMonthNum >= 4 ? currentMonthNum - 3 : currentMonthNum + 9

  let totalFeesUpToCurrent = 0
  let paidAmount = 0
  let pendingAmount = 0
  let firstPendingLabel: string | null = null

  records.forEach((r) => {
    const acadSeq = r.month >= 4 ? r.month - 3 : r.month + 9
    paidAmount += r.paidAmount
    if (acadSeq <= currentAcademicSeq) {
      totalFeesUpToCurrent += r.netAmount
      pendingAmount += r.balanceAmount
      if (r.balanceAmount > 0 && !firstPendingLabel) {
        firstPendingLabel = `${ALL_ACADEMIC_MONTHS.find((m) => m.month === r.month)?.label} ${r.year}`
      }
    }
  })

  const timeline = ALL_ACADEMIC_MONTHS.map((mInfo) => {
    if (mInfo.isVacation) {
      return {
        month: mInfo.month,
        label: mInfo.label,
        status: 'VACATION',
        displayText: 'Vacation (No Fee)',
      }
    }
    const r = records.find((rec) => rec.month === mInfo.month)
    return {
      month: mInfo.month,
      label: mInfo.label,
      status: r ? r.status : 'BLANK',
      displayText: r ? (r.status === 'PAID' ? '✓' : r.status === 'PARTIAL' ? 'Partial' : '') : '',
    }
  })

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      className: student.class?.name || null,
      sectionName: student.section?.name || null,
      sessionName: student.session?.name || null,
      feeCategory: student.feeCategory,
      advanceBalance: student.advanceBalance || 0,
      feePlan: student.feePlan
        ? {
            id: student.feePlan.id,
            name: student.feePlan.name,
            monthlyAmount: student.feePlan.monthlyAmount,
          }
        : null,
    },
    records: records.map((r) => ({
      id: r.id,
      month: r.month,
      year: r.year,
      monthLabel: ALL_ACADEMIC_MONTHS.find((m) => m.month === r.month)?.label || `Month ${r.month}`,
      monthlyAmount: r.monthlyAmount,
      netAmount: r.netAmount,
      paidAmount: r.paidAmount,
      balanceAmount: r.balanceAmount,
      status: r.status,
      lastPaymentDate: r.lastPaymentDate,
      lastPaymentMode: r.lastPaymentMode,
      receiptNumber: r.receiptNumber,
    })),
    payments: allPayments,
    timeline,
    summary: {
      totalFees: totalFeesUpToCurrent,
      paidAmount,
      pendingAmount: Math.max(0, pendingAmount - (student.advanceBalance || 0)),
      advanceBalance: student.advanceBalance || 0,
      pendingFrom: firstPendingLabel,
    },
  }
}
