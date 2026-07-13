import { prisma } from './src/database/prisma'

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) return
  console.log('HASH:', admin.passwordHash)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
