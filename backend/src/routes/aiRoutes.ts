import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateMemberBalances, optimizeSettlements } from '../services/settlementOptimizer';
import { askTripAssistant, analyzeWeatherImpactWithNugen } from '../services/aiAssistantService';
import { AI_CONFIG } from '../config/aiConfig';

const router = Router();
const prisma = new PrismaClient();

// AI Health Check Endpoint (Safe for diagnostics without secret exposure)
router.get('/health', async (_req, res) => {
  const hasKey = Boolean(AI_CONFIG.apiKey && AI_CONFIG.apiKey.trim().length > 0);
  return res.json({
    success: true,
    provider: "google-generative-ai",
    model: AI_CONFIG.chatModel,
    receiptModel: AI_CONFIG.receiptModel,
    available: hasKey
  });
});

router.post('/query', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId, question, digitalTwinScenario } = req.body;
    const userId = req.user!.id;

    if (!tripId || !question) {
      return res.status(400).json({ error: 'tripId and question are required' });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
        expenses: {
          include: {
            paidByMember: true,
            participants: { include: { member: true } }
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Verify authorized user
    const currentMember = trip.members.find((m) => m.userId === userId);
    if (!currentMember) {
      return res.status(403).json({ error: 'Not authorized for this trip' });
    }

    const balances = calculateMemberBalances(trip.members, trip.expenses);
    const optimized = optimizeSettlements(balances);
    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

    const currentUserBalance = balances.find((b) => b.memberId === currentMember.id);

    const contextData = {
      tripName: trip.name,
      totalSpent,
      members: balances.map((b) => ({
        id: b.memberId,
        name: b.name,
        balance: b.netBalance,
        paid: b.totalPaid,
        owed: b.totalOwed
      })),
      currentMember: currentUserBalance
        ? {
            id: currentUserBalance.memberId,
            name: currentUserBalance.name,
            balance: currentUserBalance.netBalance,
            owed: currentUserBalance.totalOwed
          }
        : undefined,
      expenses: trip.expenses.map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        paidByName: e.paidByMember.name,
        date: e.date.toISOString(),
        participants: e.participants.map((p) => ({
          name: p.member.name,
          shareAmount: p.shareAmount
        }))
      })),
      settlements: optimized.map((s) => ({
        payerName: s.payerName,
        receiverName: s.receiverName,
        amount: s.amount
      })),
      digitalTwinScenario
    };

    const result = await askTripAssistant(question, contextData);

    // Record query log
    await prisma.aIQuery.create({
      data: {
        tripId,
        userId,
        question,
        answer: result.answer,
        contextUsed: JSON.stringify(result.references)
      }
    });

    return res.json({ response: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI Query failed: ' + err.message });
  }
});

// Dedicated Nugen Weather Impact Analysis API Endpoint
router.post('/weather-impact', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId, simulationState } = req.body;
    const userId = req.user!.id;

    if (!tripId || !simulationState) {
      return res.status(400).json({ error: 'tripId and simulationState are required' });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Verify user membership
    const currentMember = trip.members.find((m) => m.userId === userId);
    if (!currentMember) {
      return res.status(403).json({ error: 'Not authorized for this trip' });
    }

    const nugenAnalysis = await analyzeWeatherImpactWithNugen(trip.name, simulationState);

    return res.json({ analysis: nugenAnalysis });
  } catch (err: any) {
    return res.status(500).json({ error: 'Nugen Weather Impact analysis failed: ' + err.message });
  }
});

export default router;

