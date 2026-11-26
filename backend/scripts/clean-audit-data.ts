/**
 * Safe Audit / Test Data Cleanup Script
 *
 * Identifies and removes ONLY test/audit records created by previous automated test runs:
 * - Academic Sessions: matching pattern "AUDIT-*"
 * - Classes: matching pattern "AuditClass-*"
 * - Sections: matching pattern "AuditSec-*" or associated with audit classes
 * - Audit Students, Audit Teachers, Audit Exams, Audit Timetables created during audit test runs.
 *
 * Deletes in strict foreign-key dependency order so no legitimate school data is affected.
 */

import { prisma } from '../src/database/prisma'

async function cleanAuditData() {
  console.log('🔍 Inspecting audit / test records across database...\n')

  // 1. Audit Academic Sessions
  const auditSessions = await prisma.academicSession.findMany({
    where: { name: { startsWith: 'AUDIT-' } },
  })
  const auditSessionIds = auditSessions.map((s) => s.id)
  console.log(`Found ${auditSessions.length} audit Academic Sessions:`, auditSessions.map((s) => s.name))

  // 2. Audit Classes
  const auditClasses = await prisma.class.findMany({
    where: { OR: [{ name: { startsWith: 'AuditClass-' } }, { name: { startsWith: 'AUDIT' } }] },
    include: { sections: true },
  })
  const auditClassIds = auditClasses.map((c) => c.id)
  console.log(`Found ${auditClasses.length} audit Classes:`, auditClasses.map((c) => c.name))

  // 3. Audit Sections
  const auditSections = await prisma.section.findMany({
    where: { OR: [{ classId: { in: auditClassIds } }, { name: { startsWith: 'AuditSec-' } }] },
  })
  const auditSectionIds = auditSections.map((s) => s.id)
  console.log(`Found ${auditSections.length} audit Sections.`)

  // 4. Audit Students
  const auditStudents = await prisma.student.findMany({
    where: {
      OR: [
        { sessionId: { in: auditSessionIds } },
        { classId: { in: auditClassIds } },
        { firstName: { startsWith: 'Audit' } },
        { admissionNumber: { startsWith: 'AUDIT' } },
        { admissionNumber: { startsWith: 'ADM-178' } },
      ],
    },
  })
  const auditStudentIds = auditStudents.map((s) => s.id)
  const auditUserIds = auditStudents.map((s) => s.userId).filter(Boolean) as string[]
  console.log(`Found ${auditStudents.length} audit Students:`, auditStudents.map((s) => `${s.firstName} (${s.admissionNumber})`))

  // 5. Audit Teachers
  const auditTeachers = await prisma.teacher.findMany({
    where: {
      OR: [
        { firstName: { startsWith: 'Audit' } },
        { email: { contains: 'test.teacher' } },
        { employeeId: { startsWith: 'AUDIT' } },
      ],
    },
  })
  const auditTeacherIds = auditTeachers.map((t) => t.id)
  const auditTeacherUserIds = auditTeachers.map((t) => t.userId).filter(Boolean) as string[]
  console.log(`Found ${auditTeachers.length} audit Teachers:`, auditTeachers.map((t) => `${t.firstName} (${t.employeeId})`))

  // 6. Audit Exams
  const auditExams = await prisma.exam.findMany({
    where: {
      OR: [
        { sessionId: { in: auditSessionIds } },
        { classId: { in: auditClassIds } },
        { name: { startsWith: 'Audit' } },
      ],
    },
  })
  const auditExamIds = auditExams.map((e) => e.id)
  console.log(`Found ${auditExams.length} audit Exams.`)

  // 7. Audit Timetables
  const auditTimetables = await prisma.timetable.findMany({
    where: {
      OR: [
        { sessionId: { in: auditSessionIds } },
        { classId: { in: auditClassIds } },
        { sectionId: { in: auditSectionIds } },
      ],
    },
  })
  const auditTimetableIds = auditTimetables.map((t) => t.id)
  console.log(`Found ${auditTimetables.length} audit Timetables.`)

  console.log('\n🗑️ Executing safe deletion in strict foreign-key order...')

  // Step A: Timetables
  if (auditTimetableIds.length > 0) {
    const res = await prisma.timetable.deleteMany({ where: { id: { in: auditTimetableIds } } })
    console.log(`  - Deleted ${res.count} audit Timetables.`)
  }

  // Step B: Homework
  await prisma.homeworkSubmission.deleteMany({
    where: {
      OR: [
        { studentId: { in: auditStudentIds } },
        { homework: { teacherId: { in: auditTeacherIds } } },
        { homework: { sessionId: { in: auditSessionIds } } },
      ],
    },
  })
  await prisma.homework.deleteMany({
    where: {
      OR: [
        { teacherId: { in: auditTeacherIds } },
        { sessionId: { in: auditSessionIds } },
        { classId: { in: auditClassIds } },
      ],
    },
  })

  // Step C: Exams (and schedules/marks/reportCards/admitCards)
  if (auditExamIds.length > 0) {
    await prisma.examSchedule.deleteMany({ where: { examId: { in: auditExamIds } } })
    await prisma.examMark.deleteMany({ where: { examId: { in: auditExamIds } } })
    await prisma.reportCard.deleteMany({ where: { examId: { in: auditExamIds } } })
    await prisma.admitCard.deleteMany({ where: { examId: { in: auditExamIds } } })
    const res = await prisma.exam.deleteMany({ where: { id: { in: auditExamIds } } })
    console.log(`  - Deleted ${res.count} audit Exams.`)
  }

  // Step D: Students (and User records)
  if (auditStudentIds.length > 0) {
    await prisma.attendanceRecord.deleteMany({ where: { studentId: { in: auditStudentIds } } })
    await prisma.feeRecord.deleteMany({ where: { studentId: { in: auditStudentIds } } })
    const res = await prisma.student.deleteMany({ where: { id: { in: auditStudentIds } } })
    console.log(`  - Deleted ${res.count} audit Students.`)
    if (auditUserIds.length > 0) {
      await prisma.accountAuditLog.deleteMany({ where: { OR: [{ userId: { in: auditUserIds } }, { performedBy: { in: auditUserIds } }] } })
      await prisma.auditLog.deleteMany({ where: { userId: { in: auditUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: auditUserIds } } })
    }
  }

  // Step E: Teacher Assignments & Teachers
  if (auditTeacherIds.length > 0) {
    await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: auditTeacherIds } } })
    const res = await prisma.teacher.deleteMany({ where: { id: { in: auditTeacherIds } } })
    console.log(`  - Deleted ${res.count} audit Teachers.`)
    if (auditTeacherUserIds.length > 0) {
      await prisma.accountAuditLog.deleteMany({ where: { OR: [{ userId: { in: auditTeacherUserIds } }, { performedBy: { in: auditTeacherUserIds } }] } })
      await prisma.auditLog.deleteMany({ where: { userId: { in: auditTeacherUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: auditTeacherUserIds } } })
    }
  }

  // Delete remaining teacher assignments linked to audit classes/sessions
  await prisma.teacherAssignment.deleteMany({
    where: {
      OR: [{ sessionId: { in: auditSessionIds } }, { classId: { in: auditClassIds } }],
    },
  })

  // Step F: Sections (first clean out attendance & homework for those sections)
  if (auditSectionIds.length > 0) {
    await prisma.attendanceRecord.deleteMany({ where: { attendance: { sectionId: { in: auditSectionIds } } } })
    await prisma.attendance.deleteMany({ where: { sectionId: { in: auditSectionIds } } })
    await prisma.homeworkSubmission.deleteMany({ where: { homework: { sectionId: { in: auditSectionIds } } } })
    await prisma.homework.deleteMany({ where: { sectionId: { in: auditSectionIds } } })
    const res = await prisma.section.deleteMany({ where: { id: { in: auditSectionIds } } })
    console.log(`  - Deleted ${res.count} audit Sections.`)
  }


  // Step G: Classes (first clean fee plans and subjects linked to them)
  if (auditClassIds.length > 0) {
    await prisma.feePlan.deleteMany({ where: { classId: { in: auditClassIds } } })
    await prisma.classSubject.deleteMany({ where: { classId: { in: auditClassIds } } })
    const res = await prisma.class.deleteMany({ where: { id: { in: auditClassIds } } })
    console.log(`  - Deleted ${res.count} audit Classes.`)
  }


  // Step H: Academic Sessions (first clean period master and any remaining session-linked data)
  if (auditSessionIds.length > 0) {
    await prisma.periodMaster.deleteMany({ where: { sessionId: { in: auditSessionIds } } })
    await prisma.feePlan.deleteMany({ where: { sessionId: { in: auditSessionIds } } })
    const res = await prisma.academicSession.deleteMany({ where: { id: { in: auditSessionIds } } })
    console.log(`  - Deleted ${res.count} audit Academic Sessions.`)
  }


  console.log('\n✨ Audit data cleanup completed successfully!')
}

cleanAuditData()
  .catch((err) => {
    console.error('❌ Cleanup failed:', err)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
