import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  isWhatsAppCloudApiConfigured,
  sendWhatsAppCloudApiMessage,
  normalizeIndianPhoneNumber
} from '../services/whatsappService';

const router = Router();

// GET /api/whatsapp/config - Check if server has Meta WhatsApp Cloud API credentials configured
router.get('/config', (req, res) => {
  const configured = isWhatsAppCloudApiConfigured();
  res.json({ configured });
});

// POST /api/whatsapp/send - Real send via Meta WhatsApp Cloud API (if configured)
router.post('/send', authenticateToken, async (req, res) => {
  const { vendorPhone, message } = req.body;

  if (!vendorPhone || !message) {
    return res.status(400).json({
      success: false,
      status: 'FAILED',
      error: 'Vendor phone number and message content are required.'
    });
  }

  const normalizedPhone = normalizeIndianPhoneNumber(vendorPhone);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      status: 'FAILED',
      error: 'Vendor WhatsApp number is invalid or unavailable.'
    });
  }

  if (!isWhatsAppCloudApiConfigured()) {
    return res.status(400).json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'Direct API sending is not configured. WhatsApp will open with the message ready to send.'
    });
  }

  try {
    const result = await sendWhatsAppCloudApiMessage(vendorPhone, message);
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('WhatsApp API send error:', error);
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      error: error?.message || 'Server error attempting to send WhatsApp message.'
    });
  }
});

export default router;
