// Mobile-Ready UPI Payment Service Abstraction for TripLedger Web & Android Native Conversion

export const UPI_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export interface UPIPaymentRequestParams {
  recipientUpiId: string;
  recipientName: string;
  amount: number;
  currency?: string;
  transactionRef?: string;
  transactionNote?: string;
}

export interface UPIPaymentResult {
  isValid: boolean;
  errorMessage?: string;
  upiUri?: string;
  qrCodeUrl?: string;
}

/**
 * Validates UPI ID format (e.g., username@upi, rahul@okicici)
 */
export function isValidUPI(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  return UPI_REGEX.test(upiId.trim());
}

/**
 * Creates a standard dynamic UPI Payment URI and QR Code URL
 */
export function createUPIPaymentRequest(params: UPIPaymentRequestParams): UPIPaymentResult {
  const { recipientUpiId, recipientName, amount, currency = 'INR', transactionRef, transactionNote } = params;

  if (!isValidUPI(recipientUpiId)) {
    return {
      isValid: false,
      errorMessage: `Invalid UPI ID format (${recipientUpiId}). Must match standard format e.g. name@upi`
    };
  }

  if (isNaN(amount) || amount <= 0) {
    return {
      isValid: false,
      errorMessage: 'Invalid amount. Payment amount must be greater than 0.'
    };
  }

  const queryParams = new URLSearchParams({
    pa: recipientUpiId.trim(),
    pn: recipientName.trim(),
    am: amount.toFixed(2),
    cu: currency
  });

  if (transactionRef) queryParams.append('tr', transactionRef);
  if (transactionNote) queryParams.append('tn', transactionNote);

  const upiUri = `upi://pay?${queryParams.toString()}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  return {
    isValid: true,
    upiUri,
    qrCodeUrl
  };
}

/**
 * Detects if current environment is a mobile browser or native Android app wrapper
 */
export function isMobileOrAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for native mobile bridge hooks (Android WebView, Capacitor, Cordova)
  const win = window as any;
  if (win.AndroidUPIBridge || win.Capacitor || win.cordova || win.isNativeAndroidApp) {
    return true;
  }

  // Check mobile userAgent
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Launches UPI app intent across Web, Mobile Browser, and future Android Native Bridge
 */
export function launchUPIPaymentApp(upiUri: string): { launched: boolean; message: string } {
  if (!upiUri) {
    return { launched: false, message: 'Invalid UPI Payment URI.' };
  }

  const win = window as any;

  // 1. Hook for future Android Native App Conversion (Capacitor / Custom Bridge)
  if (win.AndroidUPIBridge && typeof win.AndroidUPIBridge.launchUPI === 'function') {
    try {
      win.AndroidUPIBridge.launchUPI(upiUri);
      return { launched: true, message: 'UPI payment launched via Android Native Bridge.' };
    } catch (e) {
      console.warn('Native Android bridge launch failed, falling back to deep link:', e);
    }
  }

  // 2. Mobile Browser / Mobile Device Intent
  if (isMobileOrAndroidApp()) {
    try {
      window.location.href = upiUri;
      return { launched: true, message: 'Launching installed UPI app (Google Pay, PhonePe, Paytm, BHIM)...' };
    } catch (e) {
      console.error('Failed to launch mobile deep link:', e);
    }
  }

  // 3. Desktop / Web Browser Fallback
  return {
    launched: false,
    message: 'UPI app direct launch is supported on mobile devices and Android apps. On desktop, please scan the QR code using Google Pay, PhonePe, Paytm or BHIM.'
  };
}

/**
 * Copy UPI ID to clipboard
 */
export async function copyUPIIdToClipboard(upiId: string): Promise<boolean> {
  if (!upiId) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(upiId);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API write failed:', err);
  }
  return false;
}
