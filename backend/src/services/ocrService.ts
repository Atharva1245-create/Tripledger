import { GoogleGenerativeAI } from '@google/generative-ai';

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
  console.log(`==================================================`);

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Empty image file received. Please select a valid receipt image.");
  }

  const apiKey = process.env.AI_API_KEY || process.env.OCR_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    console.error(`[OCR SERVICE] ERROR: No AI/OCR API key configured in environment.`);
    throw new Error("Receipt AI is not configured yet. Please add a valid AI_API_KEY in your backend/.env file.");
  }

  console.log(`[OCR SERVICE] Sending image to Vision AI model...`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const base64Image = imageBuffer.toString("base64");

    const prompt = `
Extract the detailed receipt information from this uploaded receipt image.
Analyze the image content directly and return ONLY a valid JSON object matching this exact schema:
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
1. Extract the actual merchant name and line items visible in the image.
2. Ensure item amounts, tax, and discount sum up to the total bill.
3. Output strictly valid JSON without markdown codeblocks or extra text.
`;

    const response = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const responseText = response.response.text() || '';
    const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    console.log(`[OCR SERVICE] Raw AI JSON Response Received:`, cleanJsonStr.substring(0, 150) + "...");

    let parsed: StructuredReceipt;
    try {
      parsed = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.error(`[OCR SERVICE] ERROR: Failed to parse JSON from AI response:`, responseText);
      throw new Error("Unable to parse structured receipt data from the AI response. Please try again with a clearer image.");
    }

    // 8 & 9. Validate Extracted Receipt Data
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
    
    // Check total match
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
    console.error(`[OCR SERVICE] ❌ ERROR during receipt vision AI extraction:`, err?.message || err);
    
    // Explicitly rethrow clean user-facing error message (DO NOT return demo data for real uploads!)
    const errorMessage = err?.message?.includes("API key")
      ? "Receipt AI key is missing or invalid. Please configure a valid AI_API_KEY."
      : err?.message || "Unable to analyze this receipt image. Please try again with a clearer photo.";
      
    throw new Error(errorMessage);
  }
}

