import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateUPIDeepLink, generateQRCodeURL, isValidUPI } from '../services/upiService';

const router = Router();
const prisma = new PrismaClient();

// 1. POST /initiate (or /api/payments/initiate)
router.post(['/initiate', '/api/payments/initiate'], authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId, payerMemberId, receiverMemberId, amount } = req.body;
    const userId = req.user!.id;

    if (!tripId || !payerMemberId || !receiverMemberId || amount === undefined) {
      return res.status(400).json({ error: 'Missing required payment details (tripId, payerMemberId, receiverMemberId, amount)' });
    }

    // Step 3: Validate Payment Amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive valid number greater than 0' });
    }

    // Verify trip exists and user is a member
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: { include: { user: true } } }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const currentMember = trip.members.find(m => m.userId === userId);
    if (!currentMember) {
      return res.status(403).json({ error: 'Not authorized for this trip' });
    }

    const payerMember = trip.members.find(m => m.id === payerMemberId);
    const receiverMember = trip.members.find(m => m.id === receiverMemberId);

    if (!payerMember || !receiverMember) {
      return res.status(404).json({ error: 'Payer or Receiver trip member not found' });
    }

    // Step 2 & 17: Recipient UPI ID resolution & backend regex validation
    const recipientUpiId = receiverMember.user?.upiId || `${receiverMember.name.toLowerCase().replace(/\s+/g, '')}@upi`;

    if (!isValidUPI(recipientUpiId)) {
      return res.status(400).json({
        error: `No valid UPI ID available for recipient ${receiverMember.name} (${recipientUpiId}). Please ask recipient to provide a valid UPI ID.`
      });
    }

    // Step 4: Create UPI Intent URL safely encoded
    const upiIntentUrl = generateUPIDeepLink({
      payeeVpa: recipientUpiId,
      payeeName: receiverMember.name,
      amount: numericAmount,
      transactionNote: `TripLedger ${trip.name} Settlement`
    });

    const qrCodeUrl = generateQRCodeURL(upiIntentUrl);

    // Step 5: Create or update Settlement record with status = PAYMENT_INITIATED
    let settlement = await prisma.settlement.findFirst({
      where: {
        tripId,
        payerId: payerMemberId,
        receiverId: receiverMemberId,
        status: { in: ['PENDING', 'PAYMENT_INITIATED'] }
      }
    });

    if (settlement) {
      settlement = await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          amount: numericAmount,
          status: 'PAYMENT_INITIATED',
          upiId: recipientUpiId,
          upiIntentUrl,
          verificationMode: 'USER_CONFIRMED',
          updatedAt: new Date()
        }
      });
    } else {
      settlement = await prisma.settlement.create({
        data: {
          tripId,
          payerId: payerMemberId,
          receiverId: receiverMemberId,
          amount: numericAmount,
          currency: 'INR',
          status: 'PAYMENT_INITIATED',
          upiId: recipientUpiId,
          upiIntentUrl,
          verificationMode: 'USER_CONFIRMED',
          notes: `UPI payment initiated from ${payerMember.name} to ${receiverMember.name}`
        }
      });
    }

    console.log(`[PAYMENT] Initiated paymentId=${settlement.id}, Payer=${payerMember.name}, Recipient=${receiverMember.name}, Amount=₹${numericAmount}`);

    return res.json({
      paymentId: settlement.id,
      status: 'PAYMENT_INITIATED',
      amount: numericAmount,
      currency: 'INR',
      payerName: payerMember.name,
      recipientName: receiverMember.name,
      recipientUpiId,
      upiIntentUrl,
      qrCodeUrl,
      verificationMode: 'USER_CONFIRMED'
    });

  } catch (err: any) {
    console.error('Payment initiation error:', err);
    return res.status(500).json({ error: 'Failed to initiate UPI payment: ' + err.message });
  }
});

// 2. POST /:paymentId/confirm (or /api/payments/:paymentId/confirm)
router.post(['/:paymentId/confirm', '/api/payments/:paymentId/confirm'], authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user!.id;

    const settlement = await prisma.settlement.findUnique({
      where: { id: paymentId },
      include: {
        trip: { include: { members: true } },
        payerMember: true,
        receiverMember: true
      }
    });

    if (!settlement) {
      return res.status(404).json({ error: 'Payment transaction record not found' });
    }

    // Step 17: Verify user is a member of the trip
    const isMember = settlement.trip.members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to confirm this payment' });
    }

    // Update status to USER_CONFIRMED (explicitly NOT bank verified)
    const updatedSettlement = await prisma.settlement.update({
      where: { id: paymentId },
      data: {
        status: 'USER_CONFIRMED',
        verificationMode: 'USER_CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: userId,
        upiTxnRef: `UPI-CONFIRMED-${Date.now().toString().slice(-8)}`
      }
    });

    console.log(`[PAYMENT] Confirmed paymentId=${paymentId}, status=USER_CONFIRMED`);

    return res.json({
      paymentId: updatedSettlement.id,
      status: 'USER_CONFIRMED',
      amount: updatedSettlement.amount,
      currency: updatedSettlement.currency,
      confirmedAt: updatedSettlement.confirmedAt,
      verificationMode: 'USER_CONFIRMED',
      message: 'Payment marked as completed by user. Bank-level verification is not available.'
    });

  } catch (err: any) {
    console.error('Payment confirmation error:', err);
    return res.status(500).json({ error: 'Failed to confirm payment: ' + err.message });
  }
});

// 3. POST /:paymentId/cancel
router.post(['/:paymentId/cancel', '/api/payments/:paymentId/cancel'], authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;

    const settlement = await prisma.settlement.findUnique({ where: { id: paymentId } });
    if (!settlement) {
      return res.status(404).json({ error: 'Payment transaction record not found' });
    }

    const updated = await prisma.settlement.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED', updatedAt: new Date() }
    });

    return res.json({
      paymentId: updated.id,
      status: 'CANCELLED',
      message: 'Payment transaction cancelled by user.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to cancel payment: ' + err.message });
  }
});

// Legacy /upi-link route support
router.post('/upi-link', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { receiverMemberId, amount, note } = req.body;

    const receiver = await prisma.tripMember.findUnique({
      where: { id: receiverMemberId },
      include: { user: true }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver member not found' });
    }

    const upiId = receiver.user?.upiId || `${receiver.name.toLowerCase().replace(/\s+/g, '')}@upi`;
    const deepLink = generateUPIDeepLink({
      payeeVpa: upiId,
      payeeName: receiver.name,
      amount: parseFloat(amount),
      transactionNote: note || 'TripLedger Settlement'
    });

    const qrCodeUrl = generateQRCodeURL(deepLink);

    return res.json({
      upiId,
      payeeName: receiver.name,
      amount,
      deepLink,
      qrCodeUrl
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
