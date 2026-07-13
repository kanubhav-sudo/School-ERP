import prisma from '../database/prisma'
import type { ListFeeRecordsInput, FeeSummaryInput } from '../validators/fee-record.validator'

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
  const { page, limit, sessionId, classId, month, status, studentId } = filters
  const skip = (page - 1) * limit

  const where = {
    ...(sessionId ? { sessionId } : {}),
    ...(classId ? { classId } : {}),
    ...(month ? { month } : {}),
    ...(status ? { status } : {}),
    ...(studentId ? { studentId } : {}),
  }

  const [feeRecords, total] = await Promise.all([
    prisma.feeRecord.findMany({
      where,
      select: feeRecordSelect,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { student: { firstName: 'asc' } }],
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

export async function getFeeSummary(filters: FeeSummaryInput) {
  const { sessionId, month } = filters

  // Summary logic:
  // 1. Calculate pending fees: all records where month <= selected month AND status != 'PAID'
  // 2. Calculate paid fees: all records where month <= selected month, sum of paidAmount

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

  // Alternatively, we can calculate based on current active year, but assuming session filters year implicitly
  return {
    totalPending: result._sum.balanceAmount || 0,
    totalPaid: result._sum.paidAmount || 0,
  }
}
