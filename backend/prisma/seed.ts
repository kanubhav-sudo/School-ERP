/**
 * Master Idempotent Database Seed Script
 *
 * CloudEMS SaaS Platform v2.0
 *
 * Full Demonstration & Testing Data Seeding for Tenant "school1" (CloudEMS Academy):
 * 1. Default Plan ("Basic Enterprise")
 * 2. Primary Tenant ("school1") & Demo Tenant ("demo")
 * 3. SchoolSettings, SchoolFeatures, Active Subscription
 * 4. User Accounts: Super Admin, Admin, Teachers, Students
 * 5. Academic Session ("2026-2027", active)
 * 6. Clean Active Classes (Play Group to Class 6) & Sections (A & B)
 * 7. Subjects (Early Primary & Core Subjects)
 * 8. Period Master (Periods 1 to 5)
 * 9. Complete Teachers & Teacher Assignments (12 Teachers with 100% complete profile data & class teacher assignments)
 * 10. Complete Students & Class Enrolments (120 Students with 100% complete profile data: Blood Groups, Parents, Addresses, Fee Plans)
 * 11. Timetables (Mon-Fri 5-period conflict-free schedule for all 20 sections)
 * 12. Attendance Records (Today's attendance for all 20 sections)
 * 13. Fee Plans (Standard, Sibling Discount, Concession), Fee Records & Fee Payments
 * 14. Mid-Term Examination 2026, Schedules, Sample Marks, Admit Cards, Report Cards & Document Engine Generation
 * 15. Homework Assignments & Submissions
 * 16. Professional School Notices & Announcements
 * 17. Cleanup of obsolete/test data & safely deactivating Classes 7-12
 *
 * Run: npx tsx prisma/seed.ts
 */

import prisma from '../src/database/prisma'
import bcrypt from 'bcryptjs'
import { DocumentEngineService } from '../src/services/document-engine/document-engine.service'
import { BloodGroup, Gender, FeeCategory } from '../src/generated/prisma'

async function main() {
  console.log('🌱 Starting Master Idempotent CloudEMS Tenant Migration & Seeding for school1...\n')

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

  // ─── 4. User Accounts: Admin & Super Admin ─────────────────────
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@123456', 10)
  const schoolAdminPasswordHash = await bcrypt.hash('Admin@123456', 10)
  const defaultUserPasswordHash = await bcrypt.hash('Password@123456', 10)

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

  // ─── 6. Clean Active Classes & Sections (Play Group to Class 6) ─
  const activeClassDefs = [
    { name: 'Play Group', order: 1, birthYear: 2023 },
    { name: 'Nursery', order: 2, birthYear: 2022 },
    { name: 'LKG', order: 3, birthYear: 2021 },
    { name: 'UKG', order: 4, birthYear: 2020 },
    { name: 'Class 1', order: 5, birthYear: 2019 },
    { name: 'Class 2', order: 6, birthYear: 2018 },
    { name: 'Class 3', order: 7, birthYear: 2017 },
    { name: 'Class 4', order: 8, birthYear: 2016 },
    { name: 'Class 5', order: 9, birthYear: 2015 },
    { name: 'Class 6', order: 10, birthYear: 2014 },
  ]

  const createdClasses: Record<string, any> = {}
  const createdSections: Record<string, any> = {}

  for (const cDef of activeClassDefs) {
    const cls = await prisma.class.upsert({
      where: { schoolId_name: { schoolId, name: cDef.name } },
      update: { displayOrder: cDef.order, isActive: true },
      create: { schoolId, name: cDef.name, displayOrder: cDef.order, isActive: true },
    })
    createdClasses[cDef.name] = cls

    for (const secName of ['A', 'B']) {
      const sec = await prisma.section.upsert({
        where: { schoolId_classId_name: { schoolId, classId: cls.id, name: secName } },
        update: { isActive: true, capacity: 40 },
        create: { schoolId, classId: cls.id, name: secName, capacity: 40, isActive: true },
      })
      createdSections[`${cDef.name}-${secName}`] = sec
    }
  }

  // Safely reassign any existing students in Class 7-12 to Classes 3-6 before deactivating Class 7-12
  const obsoleteClasses = await prisma.class.findMany({
    where: {
      schoolId,
      name: { in: ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'] },
    },
  })

  const targetMapping: Record<string, string> = {
    'Class 10': 'Class 6',
    'Class 9': 'Class 5',
    'Class 8': 'Class 4',
    'Class 7': 'Class 3',
    'Class 11': 'Class 6',
    'Class 12': 'Class 6',
  }

  for (const obsClass of obsoleteClasses) {
    const targetClassName = targetMapping[obsClass.name] || 'Class 6'
    const targetClass = createdClasses[targetClassName]
    const targetSec = createdSections[`${targetClassName}-A`]

    if (targetClass && targetSec) {
      await prisma.student.updateMany({
        where: { classId: obsClass.id },
        data: { classId: targetClass.id, sectionId: targetSec.id },
      })
    }

    await prisma.section.updateMany({
      where: { classId: obsClass.id },
      data: { isActive: false },
    })
    await prisma.class.update({
      where: { id: obsClass.id },
      data: { isActive: false },
    })
  }

  console.log(`✅ Clean active structure (Play Group to Class 6, Sec A & B) ready.`)

  // ─── 7. Subjects ──────────────────────────────────────────────
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Hindi', code: 'HIN' },
    { name: 'Computer Science', code: 'CS' },
    { name: 'English & Rhymes', code: 'ENG-RHY' },
    { name: 'Number Work', code: 'NUM-WORK' },
    { name: 'Environmental Studies', code: 'EVS' },
    { name: 'Art & Craft', code: 'ART' },
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

  for (const cDef of activeClassDefs) {
    const cls = createdClasses[cDef.name]
    if (!cls) continue

    const codesToLink =
      cDef.order <= 4
        ? ['ENG-RHY', 'NUM-WORK', 'EVS', 'ART']
        : ['MATH', 'SCI', 'ENG', 'SST', 'HIN', 'CS']

    for (const code of codesToLink) {
      const sub = createdSubjects[code]
      if (sub) {
        await prisma.classSubject.upsert({
          where: { classId_subjectId: { classId: cls.id, subjectId: sub.id } },
          update: {},
          create: { schoolId, classId: cls.id, subjectId: sub.id },
        })
      }
    }
  }
  console.log(`✅ Subjects & Class-Subject links seeded.`)

  // ─── 8. Period Master (5 Periods/Day) ─────────────────────────
  const periodsData = [
    { num: 1, start: '08:30', end: '09:15' },
    { num: 2, start: '09:15', end: '10:00' },
    { num: 3, start: '10:15', end: '11:00' },
    { num: 4, start: '11:00', end: '11:45' },
    { num: 5, start: '12:15', end: '13:00' },
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
  console.log(`✅ Period Master (Periods 1 to 5) seeded.`)

  // ─── 9. Teachers & Class Teacher Assignments ──────────────────
  const bloodGroupPool: BloodGroup[] = [
    'A_POSITIVE',
    'B_POSITIVE',
    'O_POSITIVE',
    'AB_POSITIVE',
    'A_NEGATIVE',
    'B_NEGATIVE',
    'O_NEGATIVE',
    'AB_NEGATIVE',
  ]

  const teacherDefs = [
    { empId: 'EMP-2026-001', user: 'teacher.rajesh', firstName: 'Rajesh', lastName: 'Sharma', gender: 'MALE' as const, email: 'rajesh.sharma@school1.cloudems.in', phone: '+919811111111', dept: 'Mathematics', designation: 'SENIOR_TEACHER' as const, qual: 'M.Sc. Mathematics, B.Ed.', exp: 12, dob: new Date('1985-05-15'), bg: 'A_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-002', user: 'teacher.priya', firstName: 'Priya', lastName: 'Verma', gender: 'FEMALE' as const, email: 'priya.verma@school1.cloudems.in', phone: '+919822222222', dept: 'Science', designation: 'TEACHER' as const, qual: 'M.Sc. Physics, B.Ed.', exp: 8, dob: new Date('1990-08-12'), bg: 'B_POSITIVE' as BloodGroup }, // TODAY's Birthday (Aug 12)
    { empId: 'EMP-2026-003', user: 'teacher.amit', firstName: 'Amit', lastName: 'Patel', gender: 'MALE' as const, email: 'amit.patel@school1.cloudems.in', phone: '+919833333333', dept: 'English', designation: 'TEACHER' as const, qual: 'M.A. English, B.Ed.', exp: 9, dob: new Date('1988-08-14'), bg: 'O_POSITIVE' as BloodGroup }, // Upcoming Birthday (Aug 14)
    { empId: 'EMP-2026-004', user: 'teacher.sunita', firstName: 'Sunita', lastName: 'Devi', gender: 'FEMALE' as const, email: 'sunita.devi@school1.cloudems.in', phone: '+919844444444', dept: 'Computer Science', designation: 'TEACHER' as const, qual: 'MCA, B.Tech CS', exp: 6, dob: new Date('1992-08-18'), bg: 'AB_POSITIVE' as BloodGroup }, // Upcoming Birthday (Aug 18)
    { empId: 'EMP-2026-005', user: 'teacher.meenakshi', firstName: 'Meenakshi', lastName: 'Sundaram', gender: 'FEMALE' as const, email: 'meenakshi.s@school1.cloudems.in', phone: '+919855555555', dept: 'Hindi', designation: 'SENIOR_TEACHER' as const, qual: 'M.A. Hindi Literature', exp: 15, dob: new Date('1982-11-10'), bg: 'A_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-006', user: 'teacher.vikram', firstName: 'Vikramaditya', lastName: 'Rao', gender: 'MALE' as const, email: 'vikram.rao@school1.cloudems.in', phone: '+919866666666', dept: 'Social Studies', designation: 'TEACHER' as const, qual: 'M.A. History, B.Ed.', exp: 10, dob: new Date('1987-03-25'), bg: 'O_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-007', user: 'teacher.kavita', firstName: 'Kavita', lastName: 'Reddy', gender: 'FEMALE' as const, email: 'kavita.reddy@school1.cloudems.in', phone: '+919877777777', dept: 'English & Rhymes', designation: 'TEACHER' as const, qual: 'B.A. Literature, ECE', exp: 7, dob: new Date('1991-01-30'), bg: 'B_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-008', user: 'teacher.anjali', firstName: 'Anjali', lastName: 'Gupta', gender: 'FEMALE' as const, email: 'anjali.gupta@school1.cloudems.in', phone: '+919888888888', dept: 'Number Work', designation: 'ASSISTANT_TEACHER' as const, qual: 'B.Sc. Mathematics', exp: 4, dob: new Date('1994-07-04'), bg: 'AB_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-009', user: 'teacher.suresh', firstName: 'Suresh', lastName: 'Kulkarni', gender: 'MALE' as const, email: 'suresh.k@school1.cloudems.in', phone: '+919899999999', dept: 'Environmental Studies', designation: 'TEACHER' as const, qual: 'M.Sc. Environmental Science', exp: 11, dob: new Date('1986-09-12'), bg: 'A_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-010', user: 'teacher.deepika', firstName: 'Deepika', lastName: 'Nair', gender: 'FEMALE' as const, email: 'deepika.nair@school1.cloudems.in', phone: '+919800000000', dept: 'Art & Craft', designation: 'TEACHER' as const, qual: 'Bachelor of Fine Arts (BFA)', exp: 5, dob: new Date('1993-04-18'), bg: 'B_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-011', user: 'teacher.ramesh', firstName: 'Ramesh', lastName: 'Joshi', gender: 'MALE' as const, email: 'ramesh.joshi@school1.cloudems.in', phone: '+919811223344', dept: 'Mathematics', designation: 'TEACHER' as const, qual: 'M.Sc. Mathematics, B.Ed.', exp: 9, dob: new Date('1989-12-05'), bg: 'O_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-012', user: 'teacher.nidhi', firstName: 'Nidhi', lastName: 'Saxena', gender: 'FEMALE' as const, email: 'nidhi.saxena@school1.cloudems.in', phone: '+919822334455', dept: 'Science', designation: 'TEACHER' as const, qual: 'M.Sc. Chemistry, B.Ed.', exp: 6, dob: new Date('1995-02-14'), bg: 'A_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-013', user: 'teacher.alok', firstName: 'Alok', lastName: 'Mishra', gender: 'MALE' as const, email: 'alok.mishra@school1.cloudems.in', phone: '+919833445566', dept: 'Mathematics', designation: 'TEACHER' as const, qual: 'M.Sc. Mathematics', exp: 7, dob: new Date('1991-04-10'), bg: 'B_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-014', user: 'teacher.pooja', firstName: 'Pooja', lastName: 'Sharma', gender: 'FEMALE' as const, email: 'pooja.sharma@school1.cloudems.in', phone: '+919844556677', dept: 'English', designation: 'TEACHER' as const, qual: 'M.A. English, B.Ed.', exp: 8, dob: new Date('1990-09-22'), bg: 'O_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-015', user: 'teacher.manish', firstName: 'Manish', lastName: 'Verma', gender: 'MALE' as const, email: 'manish.verma@school1.cloudems.in', phone: '+919855667788', dept: 'Social Studies', designation: 'TEACHER' as const, qual: 'M.A. Geography', exp: 10, dob: new Date('1987-11-18'), bg: 'AB_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-016', user: 'teacher.shweta', firstName: 'Shweta', lastName: 'Singh', gender: 'FEMALE' as const, email: 'shweta.singh@school1.cloudems.in', phone: '+919866778899', dept: 'Hindi', designation: 'TEACHER' as const, qual: 'M.A. Hindi, B.Ed.', exp: 5, dob: new Date('1993-06-30'), bg: 'A_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-017', user: 'teacher.rohit', firstName: 'Rohit', lastName: 'Kumar', gender: 'MALE' as const, email: 'rohit.kumar@school1.cloudems.in', phone: '+919877889900', dept: 'Computer Science', designation: 'TEACHER' as const, qual: 'B.Tech IT', exp: 6, dob: new Date('1994-01-12'), bg: 'B_NEGATIVE' as BloodGroup },
    { empId: 'EMP-2026-018', user: 'teacher.neha', firstName: 'Neha', lastName: 'Bhatia', gender: 'FEMALE' as const, email: 'neha.bhatia@school1.cloudems.in', phone: '+919888990011', dept: 'Environmental Studies', designation: 'TEACHER' as const, qual: 'M.Sc. Zoology', exp: 8, dob: new Date('1992-03-05'), bg: 'O_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-019', user: 'teacher.sanjay', firstName: 'Sanjay', lastName: 'Dutt', gender: 'MALE' as const, email: 'sanjay.dutt@school1.cloudems.in', phone: '+919899001122', dept: 'Art & Craft', designation: 'TEACHER' as const, qual: 'BFA', exp: 9, dob: new Date('1988-10-25'), bg: 'A_POSITIVE' as BloodGroup },
    { empId: 'EMP-2026-020', user: 'teacher.archana', firstName: 'Archana', lastName: 'Puran', gender: 'FEMALE' as const, email: 'archana.puran@school1.cloudems.in', phone: '+919800112233', dept: 'Science', designation: 'SENIOR_TEACHER' as const, qual: 'M.Sc. Biology, B.Ed.', exp: 14, dob: new Date('1984-12-14'), bg: 'AB_NEGATIVE' as BloodGroup },
  ]

  const createdTeachersList: any[] = []
  const createdTeachersMap: Record<string, any> = {}

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

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: tUser.id },
          { schoolId, employeeId: tDef.empId },
        ],
      },
    })

    let teacher
    if (existingTeacher) {
      teacher = await prisma.teacher.update({
        where: { id: existingTeacher.id },
        data: {
          schoolId,
          userId: tUser.id,
          employeeId: tDef.empId,
          firstName: tDef.firstName,
          lastName: tDef.lastName,
          gender: tDef.gender,
          email: tDef.email,
          phone: tDef.phone,
          dateOfBirth: tDef.dob,
          bloodGroup: tDef.bg,
          qualification: tDef.qual,
          experienceYears: tDef.exp,
          department: tDef.dept,
          designation: tDef.designation,
          joiningDate: new Date('2020-06-01'),
          employmentStatus: 'PERMANENT',
          address: '45 Faculty Quarters, Knowledge Park, Metropolis',
          emergencyContact: `${tDef.firstName}'s Spouse`,
          emergencyPhone: `+91989${tDef.phone.slice(-7)}`,
          isActive: true,
        },
      })
    } else {
      teacher = await prisma.teacher.create({
        data: {
          schoolId,
          userId: tUser.id,
          employeeId: tDef.empId,
          firstName: tDef.firstName,
          lastName: tDef.lastName,
          gender: tDef.gender,
          dateOfBirth: tDef.dob,
          bloodGroup: tDef.bg,
          email: tDef.email,
          phone: tDef.phone,
          qualification: tDef.qual,
          experienceYears: tDef.exp,
          department: tDef.dept,
          designation: tDef.designation,
          joiningDate: new Date('2020-06-01'),
          employmentStatus: 'PERMANENT',
          address: '45 Faculty Quarters, Knowledge Park, Metropolis',
          emergencyContact: `${tDef.firstName}'s Spouse`,
          emergencyPhone: `+91989${tDef.phone.slice(-7)}`,
          isActive: true,
        },
      })
    }
    createdTeachersList.push(teacher)
    createdTeachersMap[tDef.empId] = teacher
  }
  console.log(`✅ ${createdTeachersList.length} Teachers seeded with 100% complete profile data.`)

  // Assign Class Teacher to ALL 20 Sections (10 classes x 2 sections)
  const allSectionKeys = Object.keys(createdSections)
  for (let i = 0; i < allSectionKeys.length; i++) {
    const secKey = allSectionKeys[i]
    const section = createdSections[secKey]
    const classObj = Object.values(createdClasses).find((c) => c.id === section.classId)
    if (!classObj) continue

    const teacher = createdTeachersList[i % createdTeachersList.length]
    const subCode = classObj.displayOrder <= 4 ? 'ENG-RHY' : 'MATH'
    const subject = createdSubjects[subCode]

    if (subject && teacher) {
      await prisma.teacherAssignment.upsert({
        where: {
          schoolId_teacherId_sessionId_classId_sectionId_subjectId: {
            schoolId,
            teacherId: teacher.id,
            sessionId: session.id,
            classId: classObj.id,
            sectionId: section.id,
            subjectId: subject.id,
          },
        },
        update: { isClassTeacher: true },
        create: {
          schoolId,
          teacherId: teacher.id,
          sessionId: session.id,
          classId: classObj.id,
          sectionId: section.id,
          subjectId: subject.id,
          isClassTeacher: true,
        },
      })
    }
  }

  // Also assign subject teachers for Classes 1 to 6
  const subjectListForUpper = ['MATH', 'SCI', 'ENG', 'SST', 'HIN', 'CS']
  for (const cDef of activeClassDefs.filter((c) => c.order >= 5)) {
    const cls = createdClasses[cDef.name]
    for (const secName of ['A', 'B']) {
      const sec = createdSections[`${cDef.name}-${secName}`]
      if (!cls || !sec) continue

      for (let sIdx = 0; sIdx < subjectListForUpper.length; sIdx++) {
        const subCode = subjectListForUpper[sIdx]
        const sub = createdSubjects[subCode]
        const teacher = createdTeachersList[(sIdx + cDef.order) % createdTeachersList.length]

        if (sub && teacher) {
          await prisma.teacherAssignment.upsert({
            where: {
              schoolId_teacherId_sessionId_classId_sectionId_subjectId: {
                schoolId,
                teacherId: teacher.id,
                sessionId: session.id,
                classId: cls.id,
                sectionId: sec.id,
                subjectId: sub.id,
              },
            },
            update: {},
            create: {
              schoolId,
              teacherId: teacher.id,
              sessionId: session.id,
              classId: cls.id,
              sectionId: sec.id,
              subjectId: sub.id,
              isClassTeacher: false,
            },
          })
        }
      }
    }
  }
  console.log(`✅ Class Teachers & Subject Teachers assigned to all 20 sections.`)

  // ─── 10. Fee Plans (Standard, Sibling Discount, Concession) ────
  const feePlans: Record<string, { standard: any; sibling: any; concession: any }> = {}

  for (const cDef of activeClassDefs) {
    const cls = createdClasses[cDef.name]
    if (!cls) continue

    const monthlyStandard = cDef.order <= 4 ? 200000 : 300000 // ₹2000 / ₹3000 pm
    const monthlySibling = Math.round(monthlyStandard * 0.8)   // 20% discount
    const monthlyConcession = Math.round(monthlyStandard * 0.5) // 50% discount

    const planStandard = await prisma.feePlan.upsert({
      where: {
        schoolId_name_sessionId_classId: {
          schoolId,
          name: `${cDef.name} Standard Plan`,
          sessionId: session.id,
          classId: cls.id,
        },
      },
      update: { monthlyAmount: monthlyStandard },
      create: {
        schoolId,
        name: `${cDef.name} Standard Plan`,
        sessionId: session.id,
        classId: cls.id,
        monthlyAmount: monthlyStandard,
        admissionFee: 500000,
        annualFee: 1500000,
        otherCharges: 200000,
        description: `Standard Monthly Fee Plan for ${cDef.name}`,
      },
    })

    const planSibling = await prisma.feePlan.upsert({
      where: {
        schoolId_name_sessionId_classId: {
          schoolId,
          name: `${cDef.name} Sibling Discount Plan`,
          sessionId: session.id,
          classId: cls.id,
        },
      },
      update: { monthlyAmount: monthlySibling },
      create: {
        schoolId,
        name: `${cDef.name} Sibling Discount Plan`,
        sessionId: session.id,
        classId: cls.id,
        monthlyAmount: monthlySibling,
        admissionFee: 250000,
        annualFee: 1200000,
        otherCharges: 100000,
        description: `Sibling Discount Plan (20% Off) for ${cDef.name}`,
      },
    })

    const planConcession = await prisma.feePlan.upsert({
      where: {
        schoolId_name_sessionId_classId: {
          schoolId,
          name: `${cDef.name} Concession Plan`,
          sessionId: session.id,
          classId: cls.id,
        },
      },
      update: { monthlyAmount: monthlyConcession },
      create: {
        schoolId,
        name: `${cDef.name} Concession Plan`,
        sessionId: session.id,
        classId: cls.id,
        monthlyAmount: monthlyConcession,
        admissionFee: 0,
        annualFee: 500000,
        otherCharges: 0,
        description: `Need-based Concession Plan (50% Off) for ${cDef.name}`,
      },
    })

    feePlans[cDef.name] = { standard: planStandard, sibling: planSibling, concession: planConcession }
  }
  console.log(`✅ Fee Plans (Standard, Sibling Discount, Concession) seeded.`)

  // ─── 11. Students & Class Enrolments (~120 Students, 6 per section) ─
  const firstNamesMale = ['Aarav', 'Vihaan', 'Vivaan', 'Kabir', 'Aditya', 'Reyansh', 'Ishaan', 'Shaurya', 'Atharv', 'Ojas', 'Rudra', 'Dhruv', 'Arjun', 'Sai', 'Karan']
  const firstNamesFemale = ['Ananya', 'Diya', 'Myra', 'Ira', 'Aadhya', 'Pari', 'Avani', 'Kiara', 'Riya', 'Saanvi', 'Kavya', 'Anushka', 'Tara', 'Meera', 'Navya']
  const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Iyer', 'Nair', 'Reddy', 'Joshi', 'Bhardwaj', 'Kulkarni', 'Saxena', 'Deshmukh', 'Chowdhury']

  const studentList: any[] = []
  let globalStudentIdx = 1

  for (const cDef of activeClassDefs) {
    const cls = createdClasses[cDef.name]
    for (const secName of ['A', 'B']) {
      const sec = createdSections[`${cDef.name}-${secName}`]
      if (!cls || !sec) continue

      for (let r = 1; r <= 6; r++) {
        const isMale = (globalStudentIdx + r) % 2 === 0
        const fName = isMale
          ? firstNamesMale[(globalStudentIdx + r) % firstNamesMale.length]
          : firstNamesFemale[(globalStudentIdx + r) % firstNamesFemale.length]
        const lName = lastNames[(globalStudentIdx + r * 3) % lastNames.length]

        const admNo = `ADM-2026-${String(globalStudentIdx).padStart(3, '0')}`
        const username = `student.${fName.toLowerCase()}.${lName.toLowerCase()}${globalStudentIdx}`
        const email = `${username}@student.school1.in`
        const phone = `+91987${String(globalStudentIdx).padStart(7, '0')}`

        // Calculate DOB
        let dobMonth = ((globalStudentIdx * 5) % 12) + 1
        let dobDay = ((globalStudentIdx * 7) % 28) + 1

        // Inject Today's & Upcoming Birthdays intentionally (Aug 12 = Today)
        if (globalStudentIdx === 1 || globalStudentIdx === 25 || globalStudentIdx === 49 || globalStudentIdx === 73) {
          dobMonth = 8; dobDay = 12 // Today (Aug 12)
        } else if (globalStudentIdx === 2 || globalStudentIdx === 26) {
          dobMonth = 8; dobDay = 13 // Tomorrow (Aug 13)
        } else if (globalStudentIdx === 3 || globalStudentIdx === 27) {
          dobMonth = 8; dobDay = 14 // Aug 14
        } else if (globalStudentIdx === 4 || globalStudentIdx === 28) {
          dobMonth = 8; dobDay = 15 // Aug 15
        }

        const dobStr = `${cDef.birthYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`
        const dob = new Date(dobStr)

        const bloodGroup = bloodGroupPool[globalStudentIdx % bloodGroupPool.length]

        // Assign fee category & plan
        let feeCat: FeeCategory = 'STANDARD'
        let selectedPlan = feePlans[cDef.name].standard
        if (globalStudentIdx % 5 === 0) {
          feeCat = 'SIBLING'
          selectedPlan = feePlans[cDef.name].sibling
        } else if (globalStudentIdx % 10 === 0) {
          feeCat = 'STANDARD'
          selectedPlan = feePlans[cDef.name].concession
        }

        const sUser = await prisma.user.upsert({
          where: { username },
          update: { schoolId, passwordHash: defaultUserPasswordHash, accountStatus: 'ACTIVE' },
          create: {
            schoolId,
            username,
            email,
            phone,
            passwordHash: defaultUserPasswordHash,
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
            mustChangePassword: false,
          },
        })

        const fatherName = `Ramesh ${lName}`
        const fatherPhone = `+91981${String(globalStudentIdx).padStart(7, '0')}`
        const motherName = `Sunita ${lName}`
        const motherPhone = `+91982${String(globalStudentIdx).padStart(7, '0')}`
        const address = `${globalStudentIdx * 12} Residency Road, Knowledge Park, Metropolis`

        const existingStudent = await prisma.student.findFirst({
          where: {
            OR: [
              { userId: sUser.id },
              { schoolId, admissionNumber: admNo },
            ],
          },
        })

        let student
        if (existingStudent) {
          student = await prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              schoolId,
              userId: sUser.id,
              admissionNumber: admNo,
              rollNumber: String(r),
              firstName: fName,
              lastName: lName,
              gender: isMale ? 'MALE' : 'FEMALE',
              dateOfBirth: dob,
              bloodGroup,
              email,
              phone,
              fatherName,
              fatherPhone,
              motherName,
              motherPhone,
              guardianName: fatherName,
              guardianPhone: fatherPhone,
              guardianRelation: 'Father',
              emergencyContact: fatherName,
              emergencyPhone: fatherPhone,
              address,
              sessionId: session.id,
              classId: cls.id,
              sectionId: sec.id,
              feeCategory: feeCat,
              feePlanId: selectedPlan.id,
              status: 'ACTIVE',
              isActive: true,
            },
          })
        } else {
          student = await prisma.student.create({
            data: {
              id: sUser.id,
              schoolId,
              userId: sUser.id,
              admissionNumber: admNo,
              rollNumber: String(r),
              firstName: fName,
              lastName: lName,
              gender: isMale ? 'MALE' : 'FEMALE',
              dateOfBirth: dob,
              bloodGroup,
              email,
              phone,
              fatherName,
              fatherPhone,
              motherName,
              motherPhone,
              guardianName: fatherName,
              guardianPhone: fatherPhone,
              guardianRelation: 'Father',
              emergencyContact: fatherName,
              emergencyPhone: fatherPhone,
              address,
              sessionId: session.id,
              classId: cls.id,
              sectionId: sec.id,
              feeCategory: feeCat,
              feePlanId: selectedPlan.id,
              admissionDate: new Date('2024-04-01'),
              status: 'ACTIVE',
              isActive: true,
            },
          })
        }
        studentList.push(student)
        globalStudentIdx++
      }
    }
  }
  console.log(`✅ ${studentList.length} Realistic Students seeded with 100% complete profile data (Blood Groups, Parents, Fee Plans).`)

  // ─── 12. Timetables (Mon-Fri 5-Period Schedule for ALL 20 Sections) ─
  await prisma.timetable.deleteMany({ where: { schoolId } })

  const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'> = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ]

  const usedTeacherSlots: Record<string, Set<string>> = {}
  let sectionSeqIdx = 0

  for (const cDef of activeClassDefs) {
    const cls = createdClasses[cDef.name]
    for (const secName of ['A', 'B']) {
      const sec = createdSections[`${cDef.name}-${secName}`]
      if (!cls || !sec) { sectionSeqIdx++; continue }

      const isEarly = cDef.order <= 4
      const subjectCodes = isEarly
        ? ['ENG-RHY', 'NUM-WORK', 'EVS', 'ART', 'ENG-RHY']
        : ['MATH', 'SCI', 'ENG', 'SST', 'HIN']

      for (const day of days) {
        for (let pNum = 1; pNum <= 5; pNum++) {
          const subCode = subjectCodes[(pNum - 1 + days.indexOf(day)) % subjectCodes.length]
          const sub = createdSubjects[subCode]

          const slotKey = `${day}-${pNum}`
          if (!usedTeacherSlots[slotKey]) usedTeacherSlots[slotKey] = new Set()

          let teacher: any = null
          for (let t = 0; t < createdTeachersList.length; t++) {
            const candidate = createdTeachersList[(sectionSeqIdx * 3 + pNum + t) % createdTeachersList.length]
            if (!usedTeacherSlots[slotKey].has(candidate.id)) {
              teacher = candidate
              usedTeacherSlots[slotKey].add(candidate.id)
              break
            }
          }

          if (sub && teacher) {
            await prisma.timetable.create({
              data: {
                schoolId,
                sessionId: session.id,
                classId: cls.id,
                sectionId: sec.id,
                subjectId: sub.id,
                teacherId: teacher.id,
                dayOfWeek: day,
                periodNumber: pNum,
                room: `Room ${cDef.order}0${secName === 'A' ? '1' : '2'}`,
              },
            })
          }
        }
      }
      sectionSeqIdx++
    }
  }
  console.log(`✅ Complete Mon-Fri 5-period Timetables seeded for all 20 sections without clashes.`)

  // ─── 13. Attendance Records ───────────────────────────────────
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  for (const secKey of Object.keys(createdSections)) {
    const sec = createdSections[secKey]
    const attendance = await prisma.attendance.upsert({
      where: {
        schoolId_sectionId_date: {
          schoolId,
          sectionId: sec.id,
          date: todayDate,
        },
      },
      update: {},
      create: {
        schoolId,
        sectionId: sec.id,
        date: todayDate,
        recordedById: adminUser.id,
      },
    })

    const secStudents = studentList.filter((s) => s.sectionId === sec.id)
    for (let sIdx = 0; sIdx < secStudents.length; sIdx++) {
      const student = secStudents[sIdx]
      const status = sIdx === 5 ? 'ABSENT' : sIdx === 4 ? 'LATE' : 'PRESENT'
      await prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId: attendance.id,
            studentId: student.id,
          },
        },
        update: { status },
        create: {
          schoolId,
          attendanceId: attendance.id,
          studentId: student.id,
          status,
        },
      })
    }
  }
  console.log(`✅ Today's Attendance Records seeded for all 20 sections.`)

  // ─── 14. Fee Records & Fee Payments ───────────────────────────
  let receiptCounter = 1001
  for (let sIdx = 0; sIdx < studentList.length; sIdx++) {
    const student = studentList[sIdx]
    const classObj = Object.values(createdClasses).find((c) => c.id === student.classId)
    if (!classObj) continue
    const fPlanGroup = feePlans[classObj.name]
    if (!fPlanGroup) continue

    const fPlan = student.feeCategory === 'SIBLING'
      ? fPlanGroup.sibling
      : (sIdx + 1) % 10 === 0
      ? fPlanGroup.concession
      : fPlanGroup.standard

    let maxPaidMonth = 8 // August
    if (sIdx % 10 === 1 || sIdx % 10 === 5) maxPaidMonth = 7 // July (Aug Overdue)
    else if (sIdx % 10 === 2 || sIdx % 10 === 6) maxPaidMonth = 5 // May (June, July, Aug Overdue)
    else if (sIdx % 10 === 3) maxPaidMonth = 12 // Prepaid full year

    for (let m = 4; m <= 8; m++) {
      const isPaid = m <= maxPaidMonth
      const status = isPaid ? 'PAID' : m === 8 ? 'PENDING' : 'OVERDUE'
      const paidAmt = isPaid ? fPlan.monthlyAmount : 0
      const balAmt = isPaid ? 0 : fPlan.monthlyAmount

      const feeRecord = await prisma.feeRecord.upsert({
        where: {
          schoolId_studentId_month_year_sessionId: {
            schoolId,
            studentId: student.id,
            month: m,
            year: 2026,
            sessionId: session.id,
          },
        },
        update: { status, paidAmount: paidAmt, balanceAmount: balAmt, feePlanId: fPlan.id },
        create: {
          schoolId,
          studentId: student.id,
          classId: classObj.id,
          feePlanId: fPlan.id,
          sessionId: session.id,
          month: m,
          year: 2026,
          dueDate: new Date(2026, m - 1, 15),
          monthlyAmount: fPlan.monthlyAmount,
          netAmount: fPlan.monthlyAmount,
          paidAmount: paidAmt,
          balanceAmount: balAmt,
          status,
        },
      })

      if (isPaid) {
        const receiptNo = `REC-2026${String(m).padStart(2, '0')}-${receiptCounter++}`
        const existingPayment = await prisma.feePayment.findFirst({
          where: { schoolId, feeRecordId: feeRecord.id },
        })
        if (!existingPayment) {
          await prisma.feePayment.create({
            data: {
              schoolId,
              feeRecordId: feeRecord.id,
              studentId: student.id,
              receiptNumber: receiptNo,
              amount: fPlan.monthlyAmount,
              paymentMode: sIdx % 2 === 0 ? 'ONLINE' : 'CASH',
              paymentDate: new Date(2026, m - 1, 10),
              transactionRef: sIdx % 2 === 0 ? `TXN_${receiptCounter}9988` : undefined,
              remarks: `Monthly fee paid for ${m}/2026`,
            },
          })
        }
      }
    }
  }
  console.log(`✅ Fee Records & Payments seeded with varied payment states across all students.`)

  // ─── 15. Mid-Term Examination, Schedules, Marks & Document Engine ─
  const midTermExams: Record<string, any> = {}

  // Ensure Document Templates exist for ADMIT_CARD and REPORT_CARD
  await DocumentEngineService.getLatestTemplate(prisma, 'ADMIT_CARD', schoolId)
  await DocumentEngineService.getLatestTemplate(prisma, 'REPORT_CARD', schoolId)

  for (const cDef of activeClassDefs.filter((c) => c.order >= 5)) { // Classes 1 to 6
    const cls = createdClasses[cDef.name]
    for (const secName of ['A', 'B']) {
      const sec = createdSections[`${cDef.name}-${secName}`]
      if (!cls || !sec) continue

      const exam = await prisma.exam.upsert({
        where: {
          schoolId_sessionId_classId_sectionId_name: {
            schoolId,
            sessionId: session.id,
            classId: cls.id,
            sectionId: sec.id,
            name: `Mid-Term Examination 2026`,
          },
        },
        update: { startDate: new Date('2026-08-25'), endDate: new Date('2026-08-31') },
        create: {
          schoolId,
          sessionId: session.id,
          classId: cls.id,
          sectionId: sec.id,
          name: `Mid-Term Examination 2026`,
          startDate: new Date('2026-08-25'),
          endDate: new Date('2026-08-31'),
          status: 'PUBLISHED',
        },
      })
      midTermExams[`${cDef.name}-${secName}`] = exam

      const upperSubs = ['MATH', 'SCI', 'ENG', 'SST', 'HIN']
      for (let eIdx = 0; eIdx < upperSubs.length; eIdx++) {
        const subCode = upperSubs[eIdx]
        const sub = createdSubjects[subCode]
        if (!sub) continue

        await prisma.examSchedule.upsert({
          where: {
            schoolId_examId_subjectId: {
              schoolId,
              examId: exam.id,
              subjectId: sub.id,
            },
          },
          update: { examDate: new Date(2026, 7, 25 + eIdx) },
          create: {
            schoolId,
            examId: exam.id,
            subjectId: sub.id,
            examDate: new Date(2026, 7, 25 + eIdx),
            startTime: '09:00',
            endTime: '12:00',
            room: `Hall ${cDef.order}0${secName === 'A' ? '1' : '2'}`,
          },
        })

        const secStudents = studentList.filter((s) => s.sectionId === sec.id)
        for (let sIdx = 0; sIdx < secStudents.length; sIdx++) {
          const student = secStudents[sIdx]
          // Varied scores: high (92, 88), average (76, 68), low (48, 42)
          const marksObtained = sIdx === 0 ? 94 : sIdx === 1 ? 88 : sIdx === 2 ? 76 : sIdx === 3 ? 68 : sIdx === 4 ? 54 : 42
          await prisma.examMark.upsert({
            where: {
              schoolId_examId_studentId_subjectId: {
                schoolId,
                examId: exam.id,
                studentId: student.id,
                subjectId: sub.id,
              },
            },
            update: { obtainedMarks: marksObtained },
            create: {
              schoolId,
              examId: exam.id,
              studentId: student.id,
              subjectId: sub.id,
              obtainedMarks: marksObtained,
              maxMarks: 100,
            },
          })
        }
      }

      // Generate Admit Cards & Report Cards for all students in exam section
      const secStudents = studentList.filter((s) => s.sectionId === sec.id)
      for (let sIdx = 0; sIdx < secStudents.length; sIdx++) {
        const student = secStudents[sIdx]

        // Release Admit Card
        await prisma.admitCard.upsert({
          where: {
            schoolId_sessionId_studentId_examId: {
              schoolId,
              sessionId: session.id,
              examId: exam.id,
              studentId: student.id,
            },
          },
          update: { isReleased: true },
          create: {
            schoolId,
            sessionId: session.id,
            examId: exam.id,
            studentId: student.id,
            isReleased: true,
          },
        })

        // Generate Report Card
        const totalMarks = 500
        const obtained = sIdx === 0 ? 470 : sIdx === 1 ? 440 : sIdx === 2 ? 380 : sIdx === 3 ? 340 : sIdx === 4 ? 270 : 210
        const percentage = Math.round((obtained / totalMarks) * 100)
        const grade = percentage >= 90 ? 'A+' : percentage >= 75 ? 'A' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D'

        await prisma.reportCard.upsert({
          where: {
            schoolId_examId_studentId: {
              schoolId,
              examId: exam.id,
              studentId: student.id,
            },
          },
          update: { totalMarks, obtainedMarks: obtained, percentage, grade, isReleased: true },
          create: {
            schoolId,
            examId: exam.id,
            studentId: student.id,
            totalMarks,
            obtainedMarks: obtained,
            percentage,
            grade,
            isReleased: true,
          },
        })

        // Trigger Document Engine record generation for official Admit Card and Report Card
        try {
          await DocumentEngineService.generateDocumentRecord(prisma, {
            documentType: 'ADMIT_CARD',
            studentId: student.id,
            examId: exam.id,
            generatedBy: 'System Auto-Engine',
          })
          await DocumentEngineService.generateDocumentRecord(prisma, {
            documentType: 'REPORT_CARD',
            studentId: student.id,
            examId: exam.id,
            generatedBy: 'System Auto-Engine',
          })
        } catch (docErr) {
          // Ignore if generated document record already exists for checksum
        }
      }
    }
  }
  console.log(`✅ Mid-Term Exams, Schedules, Marks, Admit Cards, Report Cards & Document Engine documents generated.`)

  // ─── 16. Homework Assignments & Submissions ───────────────────
  const cls1 = createdClasses['Class 1']
  const sec1A = createdSections['Class 1-A']
  const mathSub = createdSubjects['MATH']
  const teacherRajesh = createdTeachersMap['EMP-2026-001']

  if (cls1 && sec1A && mathSub && teacherRajesh) {
    const existingHW = await prisma.homework.findFirst({
      where: { schoolId, sectionId: sec1A.id, title: 'Addition & Subtraction Practice Sheet' },
    })
    let hw
    if (!existingHW) {
      hw = await prisma.homework.create({
        data: {
          schoolId,
          sessionId: session.id,
          classId: cls1.id,
          sectionId: sec1A.id,
          subjectId: mathSub.id,
          teacherId: teacherRajesh.id,
          title: 'Addition & Subtraction Practice Sheet',
          description: 'Solve problems 1 through 20 from Chapter 3 worksheet.',
          assignedDate: new Date(),
          dueDate: new Date(Date.now() + 3 * 86400000),
          status: 'PUBLISHED',
        },
      })
    } else {
      hw = existingHW
    }

    const sec1AStudents = studentList.filter((s) => s.sectionId === sec1A.id)
    if (sec1AStudents.length > 0 && hw) {
      const sampleStudent = sec1AStudents[0]
      const existingSub = await prisma.homeworkSubmission.findFirst({
        where: { homeworkId: hw.id, studentId: sampleStudent.id },
      })
      if (!existingSub) {
        await prisma.homeworkSubmission.create({
          data: {
            schoolId,
            homeworkId: hw.id,
            studentId: sampleStudent.id,
            status: 'SUBMITTED',
            submissionUrl: 'https://storage.cloudems.in/submissions/hw1_addition.pdf',
            submittedAt: new Date(),
          },
        })
      }
    }
  }
  console.log(`✅ Homework Assignments & Submissions seeded.`)

  // ─── 17. Notices & Announcements ──────────────────────────────
  const noticeList = [
    { title: 'Parent-Teacher Meeting (PTM)', content: 'The upcoming Parent-Teacher Meeting is scheduled for Saturday, August 22, 2026. Discussion on Term 1 academic progress and attendance.' },
    { title: 'Independence Day Celebration & Holiday Notice', content: 'Independence Day will be celebrated on Friday, August 15, 2026. Flag hoisting ceremony starts at 8:00 AM followed by cultural programs.' },
    { title: 'Mid-Term Examination Schedule Announcement', content: 'Mid-Term Examinations for Classes 1 to 6 will commence from August 25, 2026. Students can view their admit cards on the portal.' },
    { title: 'Second Quarter Fee Payment Reminder', content: 'Parents are requested to clear second-quarter fee dues by August 20, 2026 to avoid late fee charges.' },
    { title: 'Monsoon Revised School Timings Notice', content: 'School timings will be 8:30 AM to 2:00 PM starting Monday, August 17, 2026 for all classes.' },
    { title: 'Annual Sports Day 2026 Selection Trials', content: 'Preparations for Annual Sports Meet 2026 have begun. Selection trials for track and field events start next week.' },
  ]

  for (const n of noticeList) {
    const existingNotice = await prisma.notice.findFirst({
      where: { schoolId, title: n.title },
    })
    if (!existingNotice) {
      await prisma.notice.create({
        data: {
          schoolId,
          title: n.title,
          content: n.content,
          publishedAt: new Date(),
          authorId: adminUser.id,
        },
      })
    }
  }
  console.log(`✅ Professional School Notices seeded.`)

  // ─── 18. Sequence Counters & Orphan Cleanup ────────────────────
  await prisma.usernameSequence.upsert({
    where: { schoolId_prefix: { schoolId, prefix: 'STD' } },
    update: { lastSeq: 200 },
    create: { schoolId, prefix: 'STD', lastSeq: 200 },
  })

  await prisma.usernameSequence.upsert({
    where: { schoolId_prefix: { schoolId, prefix: 'TCH' } },
    update: { lastSeq: 50 },
    create: { schoolId, prefix: 'TCH', lastSeq: 50 },
  })

  await prisma.user.updateMany({
    where: { role: { not: 'SUPER_ADMIN' }, schoolId: null },
    data: { schoolId },
  })

  console.log('\n🎉 Master Idempotent Seed Completed Successfully!')
  console.log(`📍 Tenant: ${defaultSchool.name} (slug: ${defaultSchool.slug})`)
  console.log(`🔑 Admin: admin / Admin@123456`)
  console.log(`🔑 Teachers: teacher.rajesh, teacher.priya, etc. / Password@123456`)
  console.log(`🔑 Students: student.aarav.sharma1, student.ananya.gupta2, etc. / Password@123456`)
  console.log(`🔑 SuperAdmin: superadmin / SuperAdmin@123456`)
}

main()
  .catch((e) => {
    console.error('❌ Migration seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
