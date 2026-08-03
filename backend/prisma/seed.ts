/**
 * Database Seed Script — CloudEMS SaaS v2 Platform
 *
 * Seeds initial platform defaults:
 * 1. Basic Plan
 * 2. Demo School Tenant ("demo") with Settings and Features
 * 3. Super Admin account (superadmin / SuperAdmin@123456)
 * 4. School Admin account (admin / Admin@123456)
 *
 * Run: npx prisma db seed
 */

import prisma from '../src/database/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding CloudEMS SaaS v2 Platform database...')

  // 1. Create Default Plan
  const plan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Basic Enterprise',
      tier: 'BASIC',
      monthlyPrice: 499900, // Rs 4999
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
      features: [
        'attendanceModule',
        'feesModule',
        'examModule',
        'homeworkModule',
        'noticeModule',
      ],
      isActive: true,
    },
  })
  console.log(`✅ Default Plan ready: ${plan.name}`)

  // 2. Create Default School Tenant
  const school = await prisma.school.upsert({
    where: { slug: 'demo' },
    update: {
      name: 'Demo Academy',
      isActive: true,
    },
    create: {
      name: 'Demo Academy',
      slug: 'demo',
      isActive: true,
    },
  })
  console.log(`✅ Demo School ready: ${school.name} (slug: ${school.slug})`)

  // 3. Create Default School Settings & Features
  await prisma.schoolSettings.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      principalName: 'Dr. Arthur Pendelton',
      address: '123 Education Lane, Knowledge Park',
      city: 'Metropolis',
      state: 'State',
      pincode: '110001',
      phone: '+919876543210',
      email: 'contact@demo.cloudems.in',
    },
  })

  await prisma.schoolFeatures.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      attendanceModule: true,
      feesModule: true,
      examModule: true,
      homeworkModule: true,
      noticeModule: true,
    },
  })

  // 4. Create Active Subscription for Demo School
  const subscriptionEndDate = new Date()
  subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)

  await prisma.subscription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      schoolId: school.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: subscriptionEndDate,
      autoRenew: true,
    },
  })

  // 5. Create Credentials Hashes
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@123456', 12)
  const schoolAdminPasswordHash = await bcrypt.hash('Admin@123456', 12)

  // 6. Create Super Admin User (global, schoolId: null)
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      passwordHash: superAdminPasswordHash,
      accountStatus: 'ACTIVE',
    },
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
  console.log(`✅ Super Admin ready: ${superAdmin.username} (${superAdmin.email})`)

  // 7. Create School Admin User (scoped to Demo School)
  const schoolAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      schoolId: school.id,
      passwordHash: schoolAdminPasswordHash,
      accountStatus: 'ACTIVE',
    },
    create: {
      schoolId: school.id,
      username: 'admin',
      email: 'admin@demo.cloudems.in',
      phone: '+919876543210',
      passwordHash: schoolAdminPasswordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      mustChangePassword: true,
    },
  })
  console.log(`✅ School Admin ready: ${schoolAdmin.username} (${schoolAdmin.email}) [School: ${school.name}]`)

  console.log('\n🎉 Phase 1 Database Seeding Complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
