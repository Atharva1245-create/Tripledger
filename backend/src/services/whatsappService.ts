export type WhatsAppTemplateType =
  | 'booking_confirmation'
  | 'payment_confirmation'
  | 'bill_clarification'
  | 'refund_request'
  | 'general_inquiry';

export interface WhatsAppMessageParams {
  vendorName: string;
  vendorPhone: string;
  tripName: string;
  userName: string;
  expenseTitle?: string;
  amount?: number;
  templateType?: WhatsAppTemplateType;
  customText?: string;
}

export function generateWhatsAppMessage(params: WhatsAppMessageParams): string {
  if (params.customText && params.customText.trim()) {
    return params.customText.trim();
  }

  const { vendorName, tripName, userName, expenseTitle, amount, templateType = 'booking_confirmation' } = params;
  const itemDesc = expenseTitle ? `for ${expenseTitle}` : '';
  const amountDesc = amount ? `amounting to ₹${amount.toLocaleString()}` : '';

  switch (templateType) {
    case 'booking_confirmation':
      return `Hi ${vendorName}, this is ${userName} regarding our ${tripName} booking. We have a payment/expense ${amountDesc} ${itemDesc}. Could you please confirm the booking/reservation details? Thank you!`;
    case 'payment_confirmation':
      return `Hello ${vendorName}, ${userName} here from ${tripName}. We've processed the payment of ₹${amount ? amount.toLocaleString() : ''} ${itemDesc}. Kindly check and confirm receipt.`;
    case 'bill_clarification':
      return `Hi ${vendorName}, I'm reaching out from ${tripName} regarding bill item details ${itemDesc} (${amountDesc}). Could you share a quick breakdown/GST invoice? Thanks!`;
    case 'refund_request':
      return `Hi ${vendorName}, regarding our ${tripName} booking ${itemDesc}, we would like to inquire about the refund process for ₹${amount ? amount.toLocaleString() : ''}. Please guide us.`;
    case 'general_inquiry':
    default:
      return `Hi ${vendorName}, this is ${userName} regarding our ${tripName} trip. Could you please provide updates on our booking details? Thank you.`;
  }
}

export function normalizeIndianPhoneNumber(phone?: string | null): string | null {
  if (!phone || !phone.trim()) return null;

  // Remove spaces, +, -, brackets and all non-digit characters
  const cleanDigits = phone.replace(/[^0-9]/g, '');

  if (!cleanDigits) return null;

  // Case 1: Standard 12-digit number starting with 91 (e.g., 919876543210)
  if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
    return cleanDigits;
  }

  // Case 2: 11-digit number starting with 0 (e.g., 09876543210) -> strip leading 0 & add 91
  if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
    return `91${cleanDigits.slice(1)}`;
  }

  // Case 3: 10-digit number (e.g., 9876543210) -> prepend 91
  if (cleanDigits.length === 10) {
    return `91${cleanDigits}`;
  }

  // Case 4: Any other valid length international number (11 to 15 digits)
  if (cleanDigits.length >= 10 && cleanDigits.length <= 15) {
    return cleanDigits;
  }

  return null;
}

export function generateWhatsAppDeepLink(phone: string, text: string): string | null {
  const normalizedPhone = normalizeIndianPhoneNumber(phone);
  if (!normalizedPhone) return null;
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
}

export interface SendWhatsAppResult {
  success: boolean;
  status: 'READY' | 'SENDING' | 'SENT' | 'FAILED' | 'NOT_CONFIGURED';
  messageId?: string;
  error?: string;
}

export function isWhatsAppCloudApiConfigured(): boolean {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(token && token.trim() && phoneId && phoneId.trim());
}

export async function sendWhatsAppCloudApiMessage(
  phone: string,
  message: string
): Promise<SendWhatsAppResult> {
  const normalizedPhone = normalizeIndianPhoneNumber(phone);
  if (!normalizedPhone) {
    return {
      success: false,
      status: 'FAILED',
      error: 'Vendor WhatsApp number is invalid or unavailable.'
    };
  }

  if (!isWhatsAppCloudApiConfigured()) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'Direct API sending is not configured. WhatsApp will open with the message ready to send.'
    };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages.length > 0) {
      return {
        success: true,
        status: 'SENT',
        messageId: data.messages[0].id
      };
    } else {
      const errMsg = data?.error?.message || 'Failed to send WhatsApp message via Meta Cloud API';
      return {
        success: false,
        status: 'FAILED',
        error: errMsg
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 'FAILED',
      error: err?.message || 'Network error while reaching Meta WhatsApp Cloud API.'
    };
  }
}


