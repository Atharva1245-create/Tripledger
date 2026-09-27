import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { processReceiptImage } from '../services/ocrService';

const router = Router();
const prisma = new PrismaClient();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Real AI Receipt Scan Endpoint
router.post('/scan-receipt', authenticateToken, upload.single('receipt'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt image file uploaded. Please select a valid receipt photo.' });
    }

    const receiptData = await processReceiptImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      false
    );
    return res.json({ receipt: receiptData, isDemo: false });
  } catch (err: any) {
    const isQuota = err.isQuotaError || (err.message && (
      err.message.includes('usage limit') ||
      err.message.includes('429') ||
      err.message.includes('quota') ||
      err.message.includes('temporarily unavailable')
    ));

    const status = isQuota ? 429 : 422;
    return res.status(status).json({
      error: err.message || 'Receipt analysis failed.',
      isQuotaError: isQuota
    });
  }
});

// Explicit Demo Receipt Endpoint (for "Try Demo Receipt" button)
router.post('/demo-receipt', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const demoResult = await processReceiptImage(Buffer.from(''), 'image/jpeg', 'demo.jpg', true);
    return res.json({ receipt: demoResult, isDemo: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Demo receipt failed: ' + err.message });
  }
});

// Add New Expense
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      tripId,
      title,
      amount,
      category = 'Other',
      paidByMemberId,
      splitType = 'EQUAL',
      date,
      notes,
      receiptImage,
      vendorName,
      vendorPhone,
      vendorCategory,
      items = [],
      participants = []
    } = req.body;

    if (!tripId || !title || amount === undefined || !paidByMemberId) {
      return res.status(400).json({ error: 'Missing required expense fields (tripId, title, amount, paidByMemberId)' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Verify trip membership
    const tripMember = await prisma.tripMember.findUnique({
      where: { id: paidByMemberId }
    });
    if (!tripMember) {
      return res.status(404).json({ error: 'Payer member not found' });
    }

    const expense = await prisma.expense.create({
      data: {
        tripId,
        title,
        amount: numericAmount,
        category,
        paidById: tripMember.userId || null,
        paidByMemberId,
        splitType,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
        receiptImage: receiptImage || null,
        vendorName: vendorName || null,
        vendorPhone: vendorPhone || null,
        vendorCategory: vendorCategory || null,
        createdById: req.user!.id,
        items: {
          create: items.map((item: { name: string; price: number; quantity?: number }) => ({
            name: item.name,
            price: parseFloat(item.price as any),
            quantity: item.quantity ? parseInt(item.quantity as any) : 1
          }))
        },
        participants: {
          create: participants.map((p: { memberId: string; shareAmount: number; percentage?: number }) => ({
            memberId: p.memberId,
            shareAmount: Math.round(parseFloat(p.shareAmount as any) * 100) / 100,
            percentage: p.percentage ? parseFloat(p.percentage as any) : null
          }))
        }
      },
      include: {
        items: true,
        participants: {
          include: { member: true }
        },
        paidByMember: true
      }
    });

    return res.json({ expense });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create expense: ' + err.message });
  }
});

// Delete Expense
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
