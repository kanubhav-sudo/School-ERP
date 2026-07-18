import prisma from '../database/prisma'
import { CreatePeriodMasterInput } from '../validators/period-master.validator'

export async function getPeriodMastersBySession(sessionId: string) {
  return await prisma.periodMaster.findMany({
    where: { sessionId },
    orderBy: { periodNumber: 'asc' },
  })
}

export async function setPeriodMasters(data: CreatePeriodMasterInput) {
  const { sessionId, periods } = data

  // Replace all periods for the session within a transaction
  return await prisma.$transaction(async (tx) => {
    await tx.periodMaster.deleteMany({
      where: { sessionId },
    })

    if (periods.length > 0) {
      await tx.periodMaster.createMany({
        data: periods.map((p) => ({
          sessionId,
          periodNumber: p.periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
        })),
      })
    }

    return await tx.periodMaster.findMany({
      where: { sessionId },
      orderBy: { periodNumber: 'asc' },
    })
  })
}
