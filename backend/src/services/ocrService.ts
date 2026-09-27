import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '../config/aiConfig';

export interface StructuredReceiptItem {
  name: string;
  amount: number;
  quantity?: number;
}

export interface StructuredReceipt {
  merchant: string;
  date?: string;
  items: StructuredReceiptItem[];
  subtotal?: number;
  tax: number;
  discount: number;
  serviceCharge?: number;
  total: number;
  currency?: string;
  isDemo?: boolean;
  needsVerification?: boolean;
  verificationMessage?: string;
  rawText?: string;
}

export class ReceiptAIQuotaError extends Error {
  isQuotaError: boolean;
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptAIQuotaError';
    this.isQuotaError = true;
  }
}

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const str = String(err?.message || err?.stack || err?.statusText || err).toLowerCase();
  return (
    err?.status === 429 ||
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('freetier') ||
    str.includes('limit') ||
    str.includes('rate limit')
  );
}

async function executeGeminiReceiptModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> {
  console.log(`[OCR SERVICE] Calling Gemini Receipt Model: "${modelName}"...`);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" }
  });

  const response = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } }
  ]);

  return response.response.text() || '';
}

export async function processReceiptImage(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg",
  filename: string = "uploaded_receipt.jpg",
  isDemo: boolean = false
): Promise<StructuredReceipt> {
  // If explicitly requested via "Try Demo Receipt" button:
  if (isDemo) {
    console.log(`[OCR SERVICE] Processing DEMO receipt mode requested.`);
    return {
      merchant: "Goa Beach Restaurant & Bar",
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: "Woodfired Pizza", amount: 650, quantity: 1 },
        { name: "Crispy Calamari", amount: 480, quantity: 1 },
        { name: "Cocktails & Drinks", amount: 920, quantity: 2 },
        { name: "Garlic Bread", amount: 220, quantity: 1 }
      ],
      subtotal: 2270,
      tax: 180,
      discount: 0,
      serviceCharge: 0,
      total: 2450,
      currency: "INR",
      isDemo: true,
      needsVerification: false
    };
  }

  // Real Image OCR Processing Flow
  console.log(`==================================================`);
  console.log(`[OCR SERVICE] Real Receipt Upload Received`);
  console.log(`[OCR SERVICE] File Name : ${filename}`);
  console.log(`[OCR SERVICE] File Type : ${mimeType}`);
  console.log(`[OCR SERVICE] File Size : ${(imageBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`[OCR SERVICE] Primary Model  : ${AI_CONFIG.receiptModel}`);
  console.log(`[OCR SERVICE] Fallback Model : ${AI_CONFIG.receiptFallbackModel}`);
  console.log(`==================================================`);

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Empty image file received. Please select a valid receipt image.");
  }

  const apiKey = AI_CONFIG.apiKey;
  if (!apiKey || apiKey.trim().length === 0) {
    console.error(`[OCR SERVICE] ERROR: No AI/OCR API key configured in environment.`);
    throw new Error("Receipt AI is not configured yet. Please set AI_API_KEY in your backend/.env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const base64Image = imageBuffer.toString("base64");

  const prompt = `
Extract detailed receipt information from this uploaded receipt image.
Return strictly valid JSON matching this exact schema:
{
  "merchant": "Exact Store/Restaurant Name from Receipt",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "Exact Line Item Name", "amount": 650, "quantity": 1 }
  ],
  "subtotal": 2270,
  "tax": 180,
  "discount": 0,
  "serviceCharge": 0,
  "total": 2450,
  "currency": "INR"
}
Strict Rules:
1. Extract actual merchant name and line items visible in the image.
2. Ensure item amounts, tax, and discount sum up logically to total bill.
3. Output strictly valid JSON without markdown formatting.
`;

  let responseText = '';
  let primaryErr: any = null;

  // 1. Attempt Primary Model
  try {
    responseText = await executeGeminiReceiptModel(
      genAI,
      AI_CONFIG.receiptModel,
      prompt,
      base64Image,
      mimeType
    );
  } catch (err: any) {
    primaryErr = err;
    console.warn(`[OCR SERVICE] Primary model "${AI_CONFIG.receiptModel}" failed:`, err?.message || err);

    const isQuota = isQuotaOrRateLimitError(err);
    const hasFallback = AI_CONFIG.receiptFallbackModel && AI_CONFIG.receiptFallbackModel !== AI_CONFIG.receiptModel;

    // 2. Attempt Fallback Model ONLY if configured & primary suffered quota/rate limit error
    if (isQuota && hasFallback) {
      console.log(`[OCR SERVICE] Quota limit detected. Attempting fallback model "${AI_CONFIG.receiptFallbackModel}"...`);
      try {
        responseText = await executeGeminiReceiptModel(
          genAI,
          AI_CONFIG.receiptFallbackModel,
          prompt,
          base64Image,
          mimeType
        );
      } catch (fallbackErr: any) {
        console.error(`[OCR SERVICE] Fallback model "${AI_CONFIG.receiptFallbackModel}" also failed:`, fallbackErr?.message || fallbackErr);
        if (isQuotaOrRateLimitError(fallbackErr)) {
          throw new ReceiptAIQuotaError(
            "Receipt AI is temporarily unavailable because the AI usage limit has been reached. Please try again later or configure a paid/alternate AI model."
          );
        }
        throw new Error(`Receipt AI processing failed: ${fallbackErr?.message || 'Fallback model failed'}`);
      }
    } else if (isQuota) {
      throw new ReceiptAIQuotaError(
        "Receipt AI is temporarily unavailable because the AI usage limit has been reached. Please try again later or configure a paid/alternate AI model."
      );
    } else {
      throw err;
    }
  }

  // Parse and Validate JSON
  try {
    const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    console.log(`[OCR SERVICE] Raw AI JSON Response Received:`, cleanJsonStr.substring(0, 150) + "...");

    let parsed: StructuredReceipt;
    try {
      parsed = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.error(`[OCR SERVICE] ERROR: Failed to parse JSON from AI response:`, responseText);
      throw new Error("Unable to parse structured receipt data from the AI response. Please try again with a clearer photo.");
    }

    // Validate Extracted Receipt Data
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      throw new Error("No itemized details could be detected in this receipt image. Please try uploading a clearer image.");
    }

    // Normalize merchant name
    if (!parsed.merchant || typeof parsed.merchant !== 'string' || parsed.merchant.trim().length === 0) {
      parsed.merchant = "Scanned Merchant";
    }

    // Sanitize item list
    parsed.items = parsed.items.map((item, idx) => ({
      name: item.name && typeof item.name === 'string' ? item.name.trim() : `Item ${idx + 1}`,
      amount: typeof item.amount === 'number' && !isNaN(item.amount) ? Math.abs(item.amount) : 0,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
    }));

    const calculatedSubtotal = parsed.items.reduce((sum, item) => sum + item.amount, 0);
    parsed.subtotal = typeof parsed.subtotal === 'number' ? parsed.subtotal : calculatedSubtotal;
    parsed.tax = typeof parsed.tax === 'number' ? parsed.tax : 0;
    parsed.discount = typeof parsed.discount === 'number' ? parsed.discount : 0;
    parsed.serviceCharge = typeof parsed.serviceCharge === 'number' ? parsed.serviceCharge : 0;

    const computedTotal = parsed.subtotal + parsed.tax + parsed.serviceCharge - parsed.discount;
    
    if (typeof parsed.total !== 'number' || isNaN(parsed.total) || parsed.total <= 0) {
      parsed.total = computedTotal;
    } else if (Math.abs(parsed.total - computedTotal) > 5) {
      parsed.needsVerification = true;
      parsed.verificationMessage = "Receipt total needs verification. Computed item sum differs from detected total.";
    }

    parsed.currency = parsed.currency || "INR";
    parsed.isDemo = false;

    console.log(`==================================================`);
    console.log(`[OCR SERVICE] ✅ OCR Processing Completed Successfully`);
    console.log(`[OCR SERVICE] Extracted Merchant : ${parsed.merchant}`);
    console.log(`[OCR SERVICE] Extracted Items    : ${parsed.items.length} items`);
    console.log(`[OCR SERVICE] Extracted Total    : ₹${parsed.total}`);
    console.log(`==================================================`);

    return parsed;

  } catch (err: any) {
    if (err instanceof ReceiptAIQuotaError) {
      throw err;
    }
    console.error(`[OCR SERVICE] ❌ ERROR during receipt vision AI extraction:`, err?.message || err);
    throw new Error(err?.message || "Unable to analyze this receipt image. Please try again with a clearer photo.");
  }
}
