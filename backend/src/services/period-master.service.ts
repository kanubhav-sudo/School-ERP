import { CreatePeriodMasterInput } from '../validators/period-master.validator'

export async function getPeriodMastersBySession(db: any, sessionId: string) {
  return await db.periodMaster.findMany({
    where: { sessionId },
    orderBy: { periodNumber: 'asc' },
  })
}

export async function setPeriodMasters(db: any, data: CreatePeriodMasterInput) {
  const { sessionId, periods } = data

  // Delete existing periods for the session, then recreate
  await db.periodMaster.deleteMany({ where: { sessionId } })

  if (periods.length > 0) {
    await db.periodMaster.createMany({
      data: periods.map((p) => ({
        sessionId,
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
    })
  }

  return await db.periodMaster.findMany({
    where: { sessionId },
    orderBy: { periodNumber: 'asc' },
  })
}
