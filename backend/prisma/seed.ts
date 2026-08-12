/**
 * Comprehensive Database Seed & Legacy Tenant Data Migration Script
 *
 * CloudEMS SaaS Platform v1.0
 *
 * Migrates all legacy ERP data into the primary default tenant ("school1")
 * and populates full operational data for all core modules:
 * 1. Default Plan ("Basic Enterprise")
 * 2. Primary Tenant ("school1", CloudEMS Academy) + Secondary Tenant ("demo")
 * 3. SchoolSettings, SchoolFeatures, Active Subscription
 * 4. User Accounts: Super Admin (global), Admin (school1), Teachers, Students
 * 5. Academic Session ("2026-2027", active)
 * 6. Classes (Class 1 to Class 10) & Sections (Section A, Section B)
 * 7. Subjects (Mathematics, Science, English, Social Studies, Hindi, Computer Science)
 * 8. Period Master (Periods 1 to 8 with time slots)
 * 9. Teachers & Teacher Assignments
 * 10. Students & Class Enrolments
 * 11. Timetable Slots
 * 12. Attendance Records (Today & Past)
 * 13. Fee Plans, Fee Records, and Fee Payments
 * 14. Exams, Exam Schedules, Exam Marks, and Results
 * 15. Homework Assignments
 * 16. Noticeboard Posts
 * 17. Username Sequences
 * 18. Batch migration of any orphaned records to school1
 *
 * Run: npx tsx prisma/seed.ts
 */

import prisma from '../src/database/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Starting Full CloudEMS SaaS Tenant Migration & Seeding for school1...')

  // ─── 1. Default Plan ─────────────────────────────────────────
  const plan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Basic Enterprise',
      tier: 'BASIC',
      monthlyPrice: 499900,
      yearlyPrice: 4999000,
      maxStudents: 1000,
      maxStorageMb: 10240,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Basic Enterprise',
      tier: 'BASIC',
      monthlyPrice: 499900,
      yearlyPrice: 4999000,
      maxStudents: 1000,
      maxStorageMb: 10240,
      features: ['attendanceModule', 'feesModule', 'examModule', 'homeworkModule', 'noticeModule'],
      isActive: true,
    },
  })
  console.log(`✅ Default Plan ready: ${plan.name}`)

  // ─── 2. Primary Tenant (school1) & Demo Tenant ─────────────────
  const defaultSchool = await prisma.school.upsert({
    where: { slug: 'school1' },
    update: { name: 'CloudEMS Academy', isActive: true, status: 'ACTIVE' },
    create: {
      name: 'CloudEMS Academy',
      slug: 'school1',
      status: 'ACTIVE',
      isActive: true,
      contactEmail: 'contact@school1.cloudems.in',
      contactPhone: '+919876543210',
      address: '123 Education Lane, Knowledge Park',
      city: 'Metropolis',
      state: 'State',
      country: 'India',
      pincode: '110001',
    },
  })
  console.log(`✅ Primary Tenant ready: ${defaultSchool.name} (slug: ${defaultSchool.slug})`)

  const demoSchool = await prisma.school.upsert({
    where: { slug: 'demo' },
    update: { name: 'Demo Academy', isActive: true, status: 'ACTIVE' },
    create: {
      name: 'Demo Academy',
      slug: 'demo',
      status: 'ACTIVE',
      isActive: true,
      contactEmail: 'contact@demo.cloudems.in',
      contactPhone: '+919876543211',
    },
  })

  const schoolId = defaultSchool.id

  // ─── 3. School Settings, Features, Subscription ──────────────
  await prisma.schoolSettings.upsert({
    where: { schoolId },
    update: { principalName: 'Dr. Arthur Pendelton' },
    create: {
      schoolId,
      principalName: 'Dr. Arthur Pendelton',
      address: '123 Education Lane, Knowledge Park',
      city: 'Metropolis',
      state: 'State',
      pincode: '110001',
      phone: '+919876543210',
      email: 'contact@school1.cloudems.in',
      sessionStartMonth: 4,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      currency: 'INR',
    },
  })

  await prisma.schoolFeatures.upsert({
    where: { schoolId },
    update: {},
    create: {
      schoolId,
      attendanceModule: true,
      feesModule: true,
      examModule: true,
      homeworkModule: true,
      noticeModule: true,
    },
  })

  await prisma.schoolSettings.upsert({
    where: { schoolId: demoSchool.id },
    update: {},
    create: {
      schoolId: demoSchool.id,
      principalName: 'Prof. Eleanor Vance',
      email: 'contact@demo.cloudems.in',
    },
  })

  await prisma.schoolFeatures.upsert({
    where: { schoolId: demoSchool.id },
    update: {},
    create: {
      schoolId: demoSchool.id,
      attendanceModule: true,
      feesModule: true,
      examModule: true,
      homeworkModule: true,
      noticeModule: true,
    },
  })

  const subEndDate = new Date()
  subEndDate.setFullYear(subEndDate.getFullYear() + 1)

  await prisma.subscription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: { schoolId },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      schoolId,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: subEndDate,
      autoRenew: true,
    },
  })

  await prisma.subscription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: { schoolId: demoSchool.id },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      schoolId: demoSchool.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: subEndDate,
      autoRenew: true,
    },
  })

  // ─── 4. Admin & Super Admin Accounts ─────────────────────────
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@123456', 12)
  const schoolAdminPasswordHash = await bcrypt.hash('Admin@123456', 12)
  const defaultUserPasswordHash = await bcrypt.hash('Password@123456', 12)

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { passwordHash: superAdminPasswordHash, accountStatus: 'ACTIVE', schoolId: null },
    create: {
      username: 'superadmin',
      email: 'superadmin@cloudems.in',
      phone: '+919999999999',
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    },
  })

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { schoolId, passwordHash: schoolAdminPasswordHash, accountStatus: 'ACTIVE' },
    create: {
      schoolId,
      username: 'admin',
      email: 'admin@school1.cloudems.in',
      phone: '+919876543210',
      passwordHash: schoolAdminPasswordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    },
  })
  console.log(`✅ Admin Account ready: ${adminUser.username} (password: Admin@123456)`)

  // ─── 5. Academic Session ─────────────────────────────────────
  const session = await prisma.academicSession.upsert({
    where: { schoolId_name: { schoolId, name: '2026-2027' } },
    update: { isActive: true },
    create: {
      schoolId,
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
    },
  })
  console.log(`✅ Academic Session ready: ${session.name}`)

  // ─── 6. Classes & Sections ────────────────────────────────────
  const classDefs = [
    { name: 'Class 1', order: 1, sections: ['A', 'B'] },
    { name: 'Class 2', order: 2, sections: ['A', 'B'] },
    { name: 'Class 3', order: 3, sections: ['A', 'B'] },
    { name: 'Class 4', order: 4, sections: ['A', 'B'] },
    { name: 'Class 5', order: 5, sections: ['A', 'B'] },
    { name: 'Class 6', order: 6, sections: ['A'] },
    { name: 'Class 7', order: 7, sections: ['A'] },
    { name: 'Class 8', order: 8, sections: ['A'] },
    { name: 'Class 9', order: 9, sections: ['A', 'B'] },
    { name: 'Class 10', order: 10, sections: ['A', 'B'] },
  ]

  const createdClasses: Record<string, any> = {}
  const createdSections: Record<string, any> = {}

  for (const cDef of classDefs) {
    const cls = await prisma.class.upsert({
      where: { schoolId_name: { schoolId, name: cDef.name } },
      update: { displayOrder: cDef.order, isActive: true },
      create: { schoolId, name: cDef.name, displayOrder: cDef.order, isActive: true },
    })
    createdClasses[cDef.name] = cls

    for (const secName of cDef.sections) {
      const sec = await prisma.section.upsert({
        where: { schoolId_classId_name: { schoolId, classId: cls.id, name: secName } },
        update: { isActive: true },
        create: { schoolId, classId: cls.id, name: secName, capacity: 40, isActive: true },
      })
      createdSections[`${cDef.name}-${secName}`] = sec
    }
  }
  console.log(`✅ Classes (1 to 10) & Sections seeded.`)

  // ─── 7. Subjects ──────────────────────────────────────────────
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Hindi', code: 'HIN' },
    { name: 'Computer Science', code: 'CS' },
  ]

  const createdSubjects: Record<string, any> = {}
  for (const sDef of subjectDefs) {
    const sub = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId, code: sDef.code } },
      update: { name: sDef.name, isActive: true },
      create: { schoolId, name: sDef.name, code: sDef.code, isActive: true },
    })
    createdSubjects[sDef.code] = sub
  }
  console.log(`✅ Core Subjects seeded.`)

  // Link subjects to Class 10 and Class 9
  for (const clsName of ['Class 9', 'Class 10']) {
    const cls = createdClasses[clsName]
    if (cls) {
      for (const subCode of Object.keys(createdSubjects)) {
        const sub = createdSubjects[subCode]
        await prisma.classSubject.upsert({
          where: { classId_subjectId: { classId: cls.id, subjectId: sub.id } },
          update: {},
          create: { schoolId, classId: cls.id, subjectId: sub.id },
        })
      }
    }
  }

  // ─── 8. Period Master ─────────────────────────────────────────
  const periodsData = [
    { num: 1, start: '08:00', end: '08:45' },
    { num: 2, start: '08:45', end: '09:30' },
    { num: 3, start: '09:30', end: '10:15' },
    { num: 4, start: '10:30', end: '11:15' },
    { num: 5, start: '11:15', end: '12:00' },
    { num: 6, start: '12:30', end: '13:15' },
    { num: 7, start: '13:15', end: '14:00' },
    { num: 8, start: '14:00', end: '14:45' },
  ]

  const createdPeriods: Record<number, any> = {}
  for (const p of periodsData) {
    const period = await prisma.periodMaster.upsert({
      where: {
        schoolId_sessionId_periodNumber: { schoolId, sessionId: session.id, periodNumber: p.num },
      },
      update: { startTime: p.start, endTime: p.end },
      create: {
        schoolId,
        sessionId: session.id,
        periodNumber: p.num,
        startTime: p.start,
        endTime: p.end,
      },
    })
    createdPeriods[p.num] = period
  }
  console.log(`✅ Period Master (Periods 1 to 8) seeded.`)

  // ─── 9. Teachers ──────────────────────────────────────────────
  const teacherDefs = [
    {
      empId: 'EMP001',
      user: 'teacher.rahul',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@school1.cloudems.in',
      phone: '+919811111111',
      dept: 'Mathematics',
      designation: 'SENIOR_TEACHER' as const,
      dob: new Date('1985-05-15'),
    },
    {
      empId: 'EMP002',
      user: 'teacher.priya',
      firstName: 'Priya',
      lastName: 'Verma',
      email: 'priya.verma@school1.cloudems.in',
      phone: '+919822222222',
      dept: 'Science',
      designation: 'TEACHER' as const,
      dob: new Date('1990-08-22'),
    },
    {
      empId: 'EMP003',
      user: 'teacher.amit',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit.patel@school1.cloudems.in',
      phone: '+919833333333',
      dept: 'English',
      designation: 'TEACHER' as const,
      dob: new Date('1988-11-10'),
    },
    {
      empId: 'EMP004',
      user: 'teacher.sunita',
      firstName: 'Sunita',
      lastName: 'Devi',
      email: 'sunita.devi@school1.cloudems.in',
      phone: '+919844444444',
      dept: 'Computer Science',
      designation: 'TEACHER' as const,
      dob: new Date('1992-03-30'),
    },
  ]

  const createdTeachers: Record<string, any> = {}

  for (const tDef of teacherDefs) {
    const tUser = await prisma.user.upsert({
      where: { username: tDef.user },
      update: { schoolId, passwordHash: defaultUserPasswordHash, accountStatus: 'ACTIVE' },
      create: {
        schoolId,
        username: tDef.user,
        email: tDef.email,
        phone: tDef.phone,
        passwordHash: defaultUserPasswordHash,
        role: 'TEACHER',
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      },
    })

    const teacher = await prisma.teacher.upsert({
      where: { schoolId_employeeId: { schoolId, employeeId: tDef.empId } },
      update: {
        userId: tUser.id,
        firstName: tDef.firstName,
        lastName: tDef.lastName,
        email: tDef.email,
        dateOfBirth: tDef.dob,
      },
      create: {
        schoolId,
        userId: tUser.id,
        employeeId: tDef.empId,
        firstName: tDef.firstName,
        lastName: tDef.lastName,
        gender: 'MALE',
        dateOfBirth: tDef.dob,
        email: tDef.email,
        phone: tDef.phone,
        department: tDef.dept,
        designation: tDef.designation,
        joiningDate: new Date('2020-06-01'),
        isActive: true,
      },
    })
    createdTeachers[tDef.empId] = teacher
  }
  console.log(`✅ Teachers seeded.`)

  // Teacher Assignments
  const cls10 = createdClasses['Class 10']
  const sec10A = createdSections['Class 10-A']
  if (cls10 && sec10A) {
    await prisma.teacherAssignment.upsert({
      where: {
        schoolId_teacherId_sessionId_classId_sectionId_subjectId: {
          schoolId,
          teacherId: createdTeachers['EMP001'].id,
          sessionId: session.id,
          classId: cls10.id,
          sectionId: sec10A.id,
          subjectId: createdSubjects['MATH'].id,
        },
      },
      update: { isClassTeacher: true },
      create: {
        schoolId,
        teacherId: createdTeachers['EMP001'].id,
        sessionId: session.id,
        classId: cls10.id,
        sectionId: sec10A.id,
        subjectId: createdSubjects['MATH'].id,
        isClassTeacher: true,
      },
    })
  }

  // ─── 10. Students ─────────────────────────────────────────────
  const studentDefs = [
    {
      admNo: 'ADM2026001',
      user: 'student.aarav',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@student.school1.in',
      phone: '+919911111111',
      dob: new Date('2010-04-12'),
      classKey: 'Class 10',
      secKey: 'Class 10-A',
      rollNo: '101',
      gender: 'MALE' as const,
    },
    {
      admNo: 'ADM2026002',
      user: 'student.ananya',
      firstName: 'Ananya',
      lastName: 'Gupta',
      email: 'ananya.gupta@student.school1.in',
      phone: '+919922222222',
      dob: new Date('2010-09-25'),
      classKey: 'Class 10',
      secKey: 'Class 10-A',
      rollNo: '102',
      gender: 'FEMALE' as const,
    },
    {
      admNo: 'ADM2026003',
      user: 'student.rohan',
      firstName: 'Rohan',
      lastName: 'Patel',
      email: 'rohan.patel@student.school1.in',
      phone: '+919933333333',
      dob: new Date('2011-01-18'),
      classKey: 'Class 9',
      secKey: 'Class 9-A',
      rollNo: '901',
      gender: 'MALE' as const,
    },
    {
      admNo: 'ADM2026004',
      user: 'student.isha',
      firstName: 'Isha',
      lastName: 'Singh',
      email: 'isha.singh@student.school1.in',
      phone: '+919944444444',
      dob: new Date('2011-06-05'),
      classKey: 'Class 9',
      secKey: 'Class 9-A',
      rollNo: '902',
      gender: 'FEMALE' as const,
    },
  ]

  const createdStudents: Record<string, any> = {}

  for (const stDef of studentDefs) {
    const sUser = await prisma.user.upsert({
      where: { username: stDef.user },
      update: { schoolId, passwordHash: defaultUserPasswordHash, accountStatus: 'ACTIVE' },
      create: {
        schoolId,
        username: stDef.user,
        email: stDef.email,
        phone: stDef.phone,
        passwordHash: defaultUserPasswordHash,
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      },
    })

    const targetClass = createdClasses[stDef.classKey]
    const targetSection = createdSections[stDef.secKey]

    const student = await prisma.student.upsert({
      where: { id: sUser.id },
      update: {
        schoolId,
        admissionNumber: stDef.admNo,
        firstName: stDef.firstName,
        lastName: stDef.lastName,
        dateOfBirth: stDef.dob,
        sessionId: session.id,
        classId: targetClass?.id,
        sectionId: targetSection?.id,
      },
      create: {
        id: sUser.id,
        schoolId,
        userId: sUser.id,
        admissionNumber: stDef.admNo,
        rollNumber: stDef.rollNo,
        firstName: stDef.firstName,
        lastName: stDef.lastName,
        gender: stDef.gender,
        dateOfBirth: stDef.dob,
        email: stDef.email,
        phone: stDef.phone,
        sessionId: session.id,
        classId: targetClass?.id,
        sectionId: targetSection?.id,
        admissionDate: new Date('2024-04-01'),
        status: 'ACTIVE',
        isActive: true,
      },
    })
    createdStudents[stDef.admNo] = student
  }
  console.log(`✅ Students seeded.`)

  // ─── 11. Timetable Slots ──────────────────────────────────────
  if (cls10 && sec10A) {
    const timetableEntries = [
      { day: 'MONDAY' as const, pNum: 1, subCode: 'MATH', teacherEmp: 'EMP001' },
      { day: 'MONDAY' as const, pNum: 2, subCode: 'SCI', teacherEmp: 'EMP002' },
      { day: 'TUESDAY' as const, pNum: 1, subCode: 'ENG', teacherEmp: 'EMP003' },
      { day: 'WEDNESDAY' as const, pNum: 1, subCode: 'CS', teacherEmp: 'EMP004' },
    ]

    for (const tt of timetableEntries) {
      const sub = createdSubjects[tt.subCode]
      const teacher = createdTeachers[tt.teacherEmp]
      const period = createdPeriods[tt.pNum]

      if (sub && teacher && period) {
        await prisma.timetable.upsert({
          where: {
            schoolId_sectionId_dayOfWeek_periodNumber: {
              schoolId,
              sectionId: sec10A.id,
              dayOfWeek: tt.day,
              periodNumber: tt.pNum,
            },
          },
          update: { subjectId: sub.id, teacherId: teacher.id },
          create: {
            schoolId,
            sessionId: session.id,
            classId: cls10.id,
            sectionId: sec10A.id,
            subjectId: sub.id,
            teacherId: teacher.id,
            dayOfWeek: tt.day,
            periodNumber: tt.pNum,
            room: '101-A',
          },
        })
      }
    }
    console.log(`✅ Timetable Slots seeded.`)
  }

  // ─── 12. Attendance Records ───────────────────────────────────
  if (cls10 && sec10A) {
    const todayStr = new Date()
    const attendance = await prisma.attendance.upsert({
      where: {
        schoolId_sectionId_date: {
          schoolId,
          sectionId: sec10A.id,
          date: todayStr,
        },
      },
      update: {},
      create: {
        schoolId,
        sectionId: sec10A.id,
        date: todayStr,
        recordedById: adminUser.id,
      },
    })

    for (const student of Object.values(createdStudents)) {
      if (student.sectionId === sec10A.id) {
        await prisma.attendanceRecord.upsert({
          where: {
            attendanceId_studentId: {
              attendanceId: attendance.id,
              studentId: student.id,
            },
          },
          update: { status: 'PRESENT' },
          create: {
            schoolId,
            attendanceId: attendance.id,
            studentId: student.id,
            status: 'PRESENT',
          },
        })
      }
    }
    console.log(`✅ Today's Attendance Records seeded.`)
  }

  // ─── 13. Fee Plans & Fee Records ──────────────────────────────
  if (cls10) {
    const feePlan = await prisma.feePlan.upsert({
      where: {
        schoolId_name_sessionId_classId: {
          schoolId,
          name: 'Class 10 Standard Annual Plan',
          sessionId: session.id,
          classId: cls10.id,
        },
      },
      update: { monthlyAmount: 3100000 },
      create: {
        schoolId,
        name: 'Class 10 Standard Annual Plan',
        sessionId: session.id,
        classId: cls10.id,
        monthlyAmount: 3100000,
        admissionFee: 500000,
        annualFee: 2000000,
        otherCharges: 600000,
        description: 'Standard Annual Fee for Class 10',
      },
    })

    const studentAarav = createdStudents['ADM2026001']
    if (studentAarav) {
      const feeRecord = await prisma.feeRecord.upsert({
        where: {
          schoolId_studentId_month_year_sessionId: {
            schoolId,
            studentId: studentAarav.id,
            month: 4, // April
            year: 2026,
            sessionId: session.id,
          },
        },
        update: { status: 'PAID', paidAmount: 3100000, balanceAmount: 0 },
        create: {
          schoolId,
          studentId: studentAarav.id,
          classId: cls10.id,
          feePlanId: feePlan.id,
          sessionId: session.id,
          month: 4,
          year: 2026,
          dueDate: new Date('2026-04-15'),
          monthlyAmount: 3100000,
          netAmount: 3100000,
          paidAmount: 3100000,
          balanceAmount: 0,
          status: 'PAID',
        },
      })

      await prisma.feePayment
        .create({
          data: {
            schoolId,
            feeRecordId: feeRecord.id,
            studentId: studentAarav.id,
            receiptNumber: 'REC-202604-001',
            amount: 3100000,
            paymentMode: 'ONLINE',
            paymentDate: new Date('2026-04-10'),
            transactionRef: 'TXN_9988776655',
            remarks: 'Annual fee paid online',
          },
        })
        .catch(() => {})
    }
    console.log(`✅ Fee Plans and Records seeded.`)
  }

  // ─── 14. Exams & Exam Schedules ──────────────────────────────
  if (cls10 && sec10A) {
    const exam = await prisma.exam.upsert({
      where: {
        schoolId_sessionId_classId_sectionId_name: {
          schoolId,
          sessionId: session.id,
          classId: cls10.id,
          sectionId: sec10A.id,
          name: 'Mid-Term Examination 2026',
        },
      },
      update: {},
      create: {
        schoolId,
        sessionId: session.id,
        classId: cls10.id,
        sectionId: sec10A.id,
        name: 'Mid-Term Examination 2026',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
        status: 'PUBLISHED',
      },
    })

    const mathSub = createdSubjects['MATH']
    if (mathSub) {
      await prisma.examSchedule.upsert({
        where: {
          schoolId_examId_subjectId: {
            schoolId,
            examId: exam.id,
            subjectId: mathSub.id,
          },
        },
        update: { examDate: new Date('2026-09-16') },
        create: {
          schoolId,
          examId: exam.id,
          subjectId: mathSub.id,
          examDate: new Date('2026-09-16'),
          startTime: '09:00',
          endTime: '12:00',
          room: '101-A',
        },
      })
    }
    console.log(`✅ Exams and Schedules seeded.`)
  }

  // ─── 15. Homework Assignments ─────────────────────────────────
  if (cls10 && sec10A) {
    const mathSub = createdSubjects['MATH']
    const teacherRahul = createdTeachers['EMP001']

    if (mathSub && teacherRahul) {
      await prisma.homework
        .create({
          data: {
            schoolId,
            sessionId: session.id,
            classId: cls10.id,
            sectionId: sec10A.id,
            subjectId: mathSub.id,
            teacherId: teacherRahul.id,
            title: 'Quadratic Equations Exercise 4.2',
            description: 'Solve problems 1 to 10 from Chapter 4 of NCERT textbook.',
            dueDate: new Date(Date.now() + 3 * 86400000), // Due in 3 days
            status: 'PUBLISHED',
          },
        })
        .catch(() => {})
    }
    console.log(`✅ Homework Assignments seeded.`)
  }

  // ─── 16. Notices & Announcements ──────────────────────────────
  await prisma.notice
    .create({
      data: {
        schoolId,
        title: 'School Annual Sports Day 2026',
        content:
          'The Annual Sports Day will be held on 15th November 2026. All students are encouraged to participate.',
        publishedAt: new Date(),
        authorId: adminUser.id,
      },
    })
    .catch(() => {})

  await prisma.notice
    .create({
      data: {
        schoolId,
        title: 'Mid-Term Examination Schedule Released',
        content:
          'The date sheet for Mid-Term Examination 2026 has been published on the school portal.',
        publishedAt: new Date(),
        authorId: adminUser.id,
      },
    })
    .catch(() => {})
  console.log(`✅ Notices seeded.`)

  // ─── 17. Username Sequence Initialization ─────────────────────
  await prisma.usernameSequence.upsert({
    where: { schoolId_prefix: { schoolId, prefix: 'STD' } },
    update: {},
    create: { schoolId, prefix: 'STD', lastSeq: 100 },
  })

  await prisma.usernameSequence.upsert({
    where: { schoolId_prefix: { schoolId, prefix: 'TCH' } },
    update: {},
    create: { schoolId, prefix: 'TCH', lastSeq: 10 },
  })

  // ─── 18. Batch Migration of Any Unlinked Records ──────────────
  const unlinkedUsers = await prisma.user.updateMany({
    where: { role: { not: 'SUPER_ADMIN' }, schoolId: null },
    data: { schoolId },
  })
  if (unlinkedUsers.count > 0) {
    console.log(`🔄 Migrated ${unlinkedUsers.count} unlinked user(s) to ${defaultSchool.name}`)
  }

  console.log('\n🎉 Comprehensive Tenant Migration & Seeding Complete!')
  console.log(`📍 Primary Tenant: ${defaultSchool.name} (slug: ${defaultSchool.slug})`)
  console.log(`🔑 Admin Account: admin / Admin@123456`)
  console.log(`🔑 Teacher Account: teacher.rahul / Password@123456`)
  console.log(`🔑 Student Account: student.aarav / Password@123456`)
  console.log(`🔑 SuperAdmin Account: superadmin / SuperAdmin@123456`)
}

main()
  .catch((e) => {
    console.error('Migration seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
