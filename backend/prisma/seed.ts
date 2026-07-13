/**
 * Database Seed Script
 *
 * Creates the default superadmin account.
 * Run: npx prisma db seed
 * Default credentials: admin / Admin@123456
 *
 * IMPORTANT: Change the password immediately after first login.
 */

import prisma from '../src/database/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('Admin@123456', 12)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      accountStatus: 'ACTIVE',
    },
    create: {
      username: 'admin',
      email: 'admin@school.local',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      mustChangePassword: true,
    },
  })

  console.log(`✅ Admin user ready: ${admin.username} (${admin.email})`)
  console.log('   Default password: Admin@123456')
  console.log('   ⚠️  Change this password immediately after first login.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
