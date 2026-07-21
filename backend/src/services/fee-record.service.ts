import prisma from '../database/prisma'
import type { ListFeeRecordsInput, FeeSummaryInput } from '../validators/fee-record.validator'
import { ConflictError } from '../core/errors'
import { Prisma } from '../generated/prisma'

// Academic year fee months (Excluding May/5)
export const FEE_MONTHS = [
  { month: 4, label: 'April' },
  { month: 6, label: 'June' },
  { month: 7, label: 'July' },
  { month: 8, label: 'August' },
  { month: 9, label: 'September' },
  { month: 10, label: 'October' },
  { month: 11, label: 'November' },
  { month: 12, label: 'December' },
  { month: 1, label: 'January' },
  { month: 2, label: 'February' },
  { month: 3, label: 'March' },
]

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

  // Handle section filtering through relation
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
          ]
        }
      },
      { receiptNumber: { contains: search, mode: 'insensitive' } }
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

export async function generateFeeRecordsForStudent(studentId: string, tx: Prisma.TransactionClient = prisma) {
  const student = await tx.student.findUnique({
    where: { id: studentId },
    include: {
      session: true,
      feePlan: true
    }
  })

  if (!student || !student.feePlanId || !student.feePlan || !student.session || !student.sessionId || !student.classId) return

  // Basic assumption: session name is like "2026-27"
  const startYear = parseInt(student.session.name.substring(0, 4))
  if (isNaN(startYear)) return

  for (const { month } of FEE_MONTHS) {
    const year = month >= 4 ? startYear : startYear + 1
    
    // Check if record already exists
    const existing = await tx.feeRecord.findFirst({
      where: {
        studentId,
        sessionId: student.sessionId,
        month,
        year
      }
    })

    if (!existing) {
      let monthlyAmount = student.feePlan.monthlyAmount
      const category = student.feeCategory as string
      if (category === 'SIBLING' && student.siblingFeeAmount !== null) {
        monthlyAmount = student.siblingFeeAmount * 100 // convert to paise
      } else if (category === 'RTE' || category === 'STAFF_CHILD') {
        monthlyAmount = 0
      }

      await tx.feeRecord.create({
        data: {
          studentId,
          feePlanId: student.feePlanId,
          sessionId: student.sessionId,
          classId: student.classId,
          month,
          year,
          monthlyAmount,
          netAmount: monthlyAmount,
          balanceAmount: monthlyAmount,
          status: monthlyAmount === 0 ? 'PAID' : 'PENDING'
        }
      })
    }
  }
}

export async function addFeePayment(studentId: string, data: { amount: number, paymentMode: any, remarks?: string, transactionId?: string }, actorId: string) {
  // Amount in paise
  let remainingAmount = data.amount * 100

  if (remainingAmount <= 0) {
    throw new ConflictError("Payment amount must be greater than 0")
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Find all unpaid fee records for this student, ordered by year, then month
    // But since Academic year goes April to March, standard sorting by year and month doesn't perfectly align to academic order if we just sort by year asc, month asc. 
    // Wait, year ascending is correct because 2026 comes before 2027. So if we sort by year ASC, month ASC, April 2026 comes before Jan 2027. Yes, it perfectly aligns!
    
    const unpaidRecords = await tx.feeRecord.findMany({
      where: {
        studentId,
        status: { in: ['PENDING', 'PARTIAL'] },
        balanceAmount: { gt: 0 }
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    })

    if (unpaidRecords.length === 0) {
      throw new ConflictError("No pending fee records found for this student.")
    }

    // Need a receipt number
    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Generate a single FeePayment record
    const feePayment = await tx.feePayment.create({
      data: {
        feeRecordId: unpaidRecords[0].id, // Link to the oldest record as primary
        amount: remainingAmount,
        paymentDate: new Date(),
        paymentMode: data.paymentMode,
        transactionId: data.transactionId,
        receiptNumber,
        remarks: data.remarks,
        processedById: actorId
      }
    })

    // 2. Distribute amount across records
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
          lastPaymentDate: new Date(),
          lastPaymentMode: data.paymentMode,
          receiptNumber
        }
      })

      remainingAmount -= amountToPay
    }

    return feePayment
  })
}
