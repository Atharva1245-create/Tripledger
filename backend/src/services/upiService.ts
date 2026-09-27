export const UPI_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export function isValidUPI(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  return UPI_REGEX.test(upiId.trim());
}

export interface UPILinkParams {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
}

export function generateUPIDeepLink(params: UPILinkParams): string {
  const { payeeVpa, payeeName, amount, transactionNote, transactionRef } = params;
  
  const query = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
  });

  if (transactionNote) query.append('tn', transactionNote);
  if (transactionRef) query.append('tr', transactionRef);

  return `upi://pay?${query.toString()}`;
}

export function generateQRCodeURL(upiLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
}
