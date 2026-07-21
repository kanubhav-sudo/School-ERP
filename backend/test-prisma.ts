import { config } from 'dotenv';
config({ path: '.env.development' }); // or whichever env file is used
import prisma from './src/database/prisma';

async function main() {
  console.log('--- DIRECT PRISMA COUNTS ---');
  console.log('Students (all):', await prisma.student.count());
  console.log('Students (active, not deleted):', await prisma.student.count({ where: { isActive: true, deletedAt: null } }));
  console.log('Teachers (all):', await prisma.teacher.count());
  console.log('Teachers (active, not deleted):', await prisma.teacher.count({ where: { isActive: true, deletedAt: null } }));
  console.log('Classes (all):', await prisma.class.count());
  console.log('Classes (active, not deleted):', await prisma.class.count({ where: { isActive: true, isDeleted: false } }));
  console.log('Sections (all):', await prisma.section.count());
  console.log('Sections (active, not deleted):', await prisma.section.count({ where: { isActive: true, isDeleted: false } }));
  
  const activeSession = await prisma.academicSession.findFirst({
    where: { isActive: true, isDeleted: false },
  });
  console.log('Active Session:', activeSession);
  
  if (activeSession) {
    const feeStats = await prisma.feeRecord.aggregate({
      where: { sessionId: activeSession.id },
      _sum: {
        balanceAmount: true,
        paidAmount: true,
      }
    });
    console.log('Fee Stats:', feeStats);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
