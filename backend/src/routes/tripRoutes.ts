import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateMemberBalances, optimizeSettlements } from '../services/settlementOptimizer';

const router = Router();
const prisma = new PrismaClient();

// Get all trips for logged in user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    // Find trips where user is creator or member
    const memberships = await prisma.tripMember.findMany({
      where: { userId },
      include: {
        trip: {
          include: {
            members: true,
            expenses: {
              include: {
                participants: true
              }
            }
          }
        }
      }
    });

    const trips = memberships.map(m => {
      const t = m.trip;
      const totalSpent = t.expenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        currency: t.currency,
        budget: t.budget,
        startDate: t.startDate,
        endDate: t.endDate,
        totalSpent,
        memberCount: t.members.length,
        role: m.role,
        createdAt: t.createdAt
      };
    });

    return res.json({ trips });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get single trip details with balances and settlements
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { upiId: true }
            }
          }
        },
        expenses: {
          include: {
            paidByMember: true,
            items: true,
            participants: {
              include: {
                member: true
              }
            }
          },
          orderBy: { date: 'desc' }
        },
        settlements: {
          include: {
            payerMember: true,
            receiverMember: true
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Map members to include upiId directly
    const formattedMembers = trip.members.map(m => ({
      ...m,
      upiId: m.user?.upiId || null
    }));

    // Verify user is a member
    const currentMember = formattedMembers.find(m => m.userId === userId);
    if (!currentMember) {
      return res.status(403).json({ error: 'Not authorized for this trip' });
    }

    // Calculate balances (factoring in confirmed settlements)
    const balances = calculateMemberBalances(formattedMembers, trip.expenses, trip.settlements);

    // Calculate optimized settlements
    const optimizedSettlements = optimizeSettlements(balances);

    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentUserBalance = balances.find(b => b.memberId === currentMember.id);

    return res.json({
      trip: {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        currency: trip.currency,
        budget: trip.budget,
        startDate: trip.startDate,
        endDate: trip.endDate,
        createdById: trip.createdById,
        createdAt: trip.createdAt
      },
      currentMember,
      members: formattedMembers,
      expenses: trip.expenses,
      balances,
      currentUserBalance,
      optimizedSettlements,
      settlementsHistory: trip.settlements,
      totalSpent
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create Trip wizard
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.name;
    const { name, description, currency, budget, startDate, endDate, guestMembers } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Trip name is required' });
    }

    const creatorUser = await prisma.user.findUnique({ where: { id: userId } });

    const trip = await prisma.trip.create({
      data: {
        name,
        description,
        currency: currency || 'INR',
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: userId,
        members: {
          create: [
            {
              userId,
              name: userName,
              email: creatorUser?.email,
              avatarUrl: creatorUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
              role: 'ORGANIZER',
              isGuest: false
            },
            ...(guestMembers || []).map((gm: { name: string; email?: string }) => ({
              name: gm.name,
              email: gm.email || null,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(gm.name)}`,
              role: 'MEMBER',
              isGuest: true
            }))
          ]
        }
      },
      include: {
        members: true
      }
    });

    return res.json({ trip });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create trip: ' + err.message });
  }
});

// Add Guest Member to existing trip
router.post('/:id/members', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, isGuest = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Member name is required' });
    }

    const member = await prisma.tripMember.create({
      data: {
        tripId: id,
        name,
        email: email || null,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: 'MEMBER',
        isGuest
      }
    });

    return res.json({ member });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
