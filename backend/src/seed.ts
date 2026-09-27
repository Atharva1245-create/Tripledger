import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TripLedger Hackathon Demo Data...');

  // Clean existing tables
  await prisma.expenseParticipant.deleteMany({});
  await prisma.expenseItem.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.aIQuery.deleteMany({});
  await prisma.tripMember.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const rahulUser = await prisma.user.create({
    data: {
      email: 'rahul@tripledger.com',
      password: hashedPassword,
      name: 'Rahul',
      upiId: 'rahul@upi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
    }
  });

  const amitUser = await prisma.user.create({
    data: {
      email: 'amit@tripledger.com',
      password: hashedPassword,
      name: 'Amit',
      upiId: 'amit@upi',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
    }
  });

  const nehaUser = await prisma.user.create({
    data: {
      email: 'neha@tripledger.com',
      password: hashedPassword,
      name: 'Neha',
      upiId: 'neha@upi',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'
    }
  });

  const sameerUser = await prisma.user.create({
    data: {
      email: 'sameer@tripledger.com',
      password: hashedPassword,
      name: 'Sameer',
      upiId: 'sameer@upi',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
    }
  });

  // 2. Create Goa Trip
  const goaTrip = await prisma.trip.create({
    data: {
      name: 'Goa Trip',
      description: 'Annual beach vacation with college friends',
      currency: 'INR',
      budget: 50000,
      startDate: new Date('2026-09-26'),
      endDate: new Date('2026-09-30'),
      createdById: rahulUser.id
    }
  });

  // 3. Create Trip Members
  const rahulMember = await prisma.tripMember.create({
    data: {
      tripId: goaTrip.id,
      userId: rahulUser.id,
      name: 'Rahul',
      email: rahulUser.email,
      avatarUrl: rahulUser.avatarUrl,
      role: 'ORGANIZER',
      isGuest: false
    }
  });

  const amitMember = await prisma.tripMember.create({
    data: {
      tripId: goaTrip.id,
      userId: amitUser.id,
      name: 'Amit',
      email: amitUser.email,
      avatarUrl: amitUser.avatarUrl,
      role: 'MEMBER',
      isGuest: false
    }
  });

  const nehaMember = await prisma.tripMember.create({
    data: {
      tripId: goaTrip.id,
      userId: nehaUser.id,
      name: 'Neha',
      email: nehaUser.email,
      avatarUrl: nehaUser.avatarUrl,
      role: 'MEMBER',
      isGuest: false
    }
  });

  const sameerMember = await prisma.tripMember.create({
    data: {
      tripId: goaTrip.id,
      userId: sameerUser.id,
      name: 'Sameer',
      email: sameerUser.email,
      avatarUrl: sameerUser.avatarUrl,
      role: 'MEMBER',
      isGuest: false
    }
  });

  const rohitGuest = await prisma.tripMember.create({
    data: {
      tripId: goaTrip.id,
      name: 'Rohit (Guest)',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
      role: 'MEMBER',
      isGuest: true
    }
  });

  const allMembers = [rahulMember, amitMember, nehaMember, sameerMember, rohitGuest];

  // 4. Create Pre-seeded Expenses to hit exact hackathon amounts
  // Expense 1: Hotel (₹12,000) - Paid by Rahul
  const exp1 = await prisma.expense.create({
    data: {
      tripId: goaTrip.id,
      title: 'Hotel Paradise Stay',
      amount: 12000,
      category: 'Hotel',
      paidById: rahulUser.id,
      paidByMemberId: rahulMember.id,
      splitType: 'EQUAL',
      date: new Date('2026-09-26T10:00:00Z'),
      notes: '3 nights stay near Calangute beach',
      vendorName: 'Hotel Paradise',
      vendorPhone: '+919876543210',
      vendorCategory: 'Hotel',
      createdById: rahulUser.id,
      participants: {
        create: allMembers.map(m => ({
          memberId: m.id,
          shareAmount: 2400
        }))
      }
    }
  });

  // Expense 2: Restaurant ABC (₹2,400) - Paid by Amit
  const exp2 = await prisma.expense.create({
    data: {
      tripId: goaTrip.id,
      title: 'Restaurant ABC Dinner',
      amount: 2400,
      category: 'Food',
      paidById: amitUser.id,
      paidByMemberId: amitMember.id,
      splitType: 'EQUAL',
      date: new Date('2026-09-26T20:30:00Z'),
      notes: 'Seafood and drinks night',
      vendorName: 'Restaurant ABC',
      vendorPhone: '+919812345678',
      vendorCategory: 'Restaurant',
      createdById: amitUser.id,
      participants: {
        create: allMembers.map(m => ({
          memberId: m.id,
          shareAmount: 480
        }))
      }
    }
  });

  // Expense 3: Transport / Cab (₹900) - Paid by Neha
  const exp3 = await prisma.expense.create({
    data: {
      tripId: goaTrip.id,
      title: 'Airport Transfer Cab',
      amount: 900,
      category: 'Transport',
      paidById: nehaUser.id,
      paidByMemberId: nehaMember.id,
      splitType: 'EQUAL',
      date: new Date('2026-09-26T08:00:00Z'),
      notes: 'Airport to hotel cab fare',
      vendorName: 'Goa Taxi Services',
      vendorPhone: '+919988776655',
      vendorCategory: 'Cab',
      createdById: nehaUser.id,
      participants: {
        create: allMembers.map(m => ({
          memberId: m.id,
          shareAmount: 180
        }))
      }
    }
  });

  // Expense 4: Beach Activity (₹3,500) - Paid by Sameer
  const exp4 = await prisma.expense.create({
    data: {
      tripId: goaTrip.id,
      title: 'Scuba Diving & Watersports',
      amount: 3500,
      category: 'Activities',
      paidById: sameerUser.id,
      paidByMemberId: sameerMember.id,
      splitType: 'EQUAL',
      date: new Date('2026-09-27T11:00:00Z'),
      notes: 'Water sports at Baga Beach',
      vendorName: 'Goa Watersports Club',
      vendorPhone: '+919765432109',
      vendorCategory: 'Activity',
      createdById: sameerUser.id,
      participants: {
        create: allMembers.map(m => ({
          memberId: m.id,
          shareAmount: 700
        }))
      }
    }
  });

  // Expense 5: Beach Cafe Lunch (₹1,850) - Paid by Rahul
  const exp5 = await prisma.expense.create({
    data: {
      tripId: goaTrip.id,
      title: 'Beach Cafe Lunch',
      amount: 1850,
      category: 'Food',
      paidById: rahulUser.id,
      paidByMemberId: rahulMember.id,
      splitType: 'EQUAL',
      date: new Date('2026-09-27T14:00:00Z'),
      notes: 'Shack lunch & fresh juices',
      vendorName: 'Beach Cafe',
      vendorPhone: '+919123456789',
      vendorCategory: 'Restaurant',
      createdById: rahulUser.id,
      participants: {
        create: allMembers.map(m => ({
          memberId: m.id,
          shareAmount: 370
        }))
      }
    }
  });

  // Expense 6: Hotel Resort Category Expense (₹21,850 additional to hit ₹42,500 total)
  const exp6 = await prisma.expense.create({
    data: {
      tripId: goaTrip.id,
      title: 'Resort Spa & Villa Charges',
      amount: 21850,
      category: 'Hotel',
      paidById: rahulUser.id,
      paidByMemberId: rahulMember.id,
      splitType: 'EQUAL',
      date: new Date('2026-09-27T16:00:00Z'),
      notes: 'Resort amenities & pool villa upgrade',
      vendorName: 'Goa Grand Resort',
      vendorPhone: '+919000011122',
      vendorCategory: 'Hotel',
      createdById: rahulUser.id,
      participants: {
        create: [
          { memberId: rahulMember.id, shareAmount: 6870 },
          { memberId: amitMember.id, shareAmount: 6200 },
          { memberId: nehaMember.id, shareAmount: 4370 },
          { memberId: sameerMember.id, shareAmount: 4410 }
        ]
      }
    }
  });

  console.log('✅ Demo seed complete! User credentials: rahul@tripledger.com / password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
