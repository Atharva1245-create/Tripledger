import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🧹 Resetting database: Deleting all expenses, settlements, trips, and users...');
  
  await prisma.expenseParticipant.deleteMany({});
  await prisma.expenseItem.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.aIQuery.deleteMany({});
  await prisma.tripMember.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('✨ Database reset complete! All data removed.');
}

resetDatabase()
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
