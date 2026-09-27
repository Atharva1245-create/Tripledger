import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, ArrowRight, ShieldCheck, Copy, ExternalLink, Sparkles, AlertCircle, RefreshCw, Smartphone, Laptop } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createUPIPaymentRequest, launchUPIPaymentApp, isMobileOrAndroidApp, copyUPIIdToClipboard, isValidUPI } from '../services/upiPaymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
  payerMemberId?: string;
  receiverMemberId?: string;
  payerName: string;
  receiverName: string;
  receiverUpiId: string;
  amount: number;
  onPaymentComplete: (txnRef: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  tripId,
  payerMemberId,
  receiverMemberId,
  payerName,
  receiverName,
  receiverUpiId,
  amount,
  onPaymentComplete
}) => {
  // Step State: 'CONFIRM_INITIATION' | 'UPI_INTENT_LAUNCH' | 'VERIFY_USER_CONFIRMED' | 'SUCCESS' | 'ERROR'
  const [step, setStep] = useState<'CONFIRM_INITIATION' | 'UPI_INTENT_LAUNCH' | 'VERIFY_USER_CONFIRMED' | 'SUCCESS' | 'ERROR'>('CONFIRM_INITIATION');
  const [status, setStatus] = useState<'PENDING' | 'PAYMENT_INITIATED' | 'USER_CONFIRMED' | 'CANCELLED' | 'FAILED'>('PENDING');

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [upiIntentUrl, setUpiIntentUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeUpiId, setActiveUpiId] = useState<string>(receiverUpiId);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [launchNotice, setLaunchNotice] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('CONFIRM_INITIATION');
      setStatus('PENDING');
      setPaymentId(null);
      setErrorMessage(null);
      setLaunchNotice(null);
      setActiveUpiId(receiverUpiId || `${receiverName.toLowerCase().replace(/\s+/g, '')}@upi`);
      setIsMobileDevice(isMobileOrAndroidApp());
    }
  }, [isOpen, receiverUpiId, receiverName]);

  if (!isOpen) return null;

  const isUpiValid = isValidUPI(activeUpiId);

  // Copy UPI ID to Clipboard
  const handleCopyUPI = async () => {
    if (activeUpiId) {
      const success = await copyUPIIdToClipboard(activeUpiId);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Initiate Payment via Backend & create UPI Payment Request
  const handleInitiatePayment = async () => {
    if (!isUpiValid) {
      setErrorMessage(`Invalid UPI ID format (${activeUpiId}). Please use standard format e.g. name@upi`);
      setStep('ERROR');
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setErrorMessage('Invalid payment amount. Amount must be greater than 0.');
      setStep('ERROR');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: tripId || 'demo-trip-id',
          payerMemberId: payerMemberId || 'demo-payer-id',
          receiverMemberId: receiverMemberId || 'demo-receiver-id',
          amount
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment.');
      }

      setPaymentId(data.paymentId);
      setUpiIntentUrl(data.upiIntentUrl);
      setQrCodeUrl(data.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.upiIntentUrl)}`);
      setActiveUpiId(data.recipientUpiId || activeUpiId);
      setStatus('PAYMENT_INITIATED');
      setStep('UPI_INTENT_LAUNCH');

      // Attempt launching UPI app on mobile / native Android bridge
      const result = launchUPIPaymentApp(data.upiIntentUrl);
      setLaunchNotice(result.message);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Payment initiation failed.');
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  };

  // Launch UPI App Button Handler
  const handleLaunchUpiAppClick = () => {
    if (!upiIntentUrl) return;
    const result = launchUPIPaymentApp(upiIntentUrl);
    setLaunchNotice(result.message);
  };

  // Confirm Payment (USER_CONFIRMED)
  const handleConfirmUserPaid = async () => {
    if (!paymentId) {
      setStep('SUCCESS');
      onPaymentComplete(`UPI-CONFIRMED-${Date.now().toString().slice(-8)}`);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch(`/api/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm payment.');
      }

      setStatus('USER_CONFIRMED');
      setStep('SUCCESS');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      onPaymentComplete(data.paymentId || `UPI-${Date.now().toString().slice(-8)}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Payment confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Payment Handler
  const handleCancelPayment = async () => {
    if (paymentId) {
      try {
        const token = localStorage.getItem('tripledger_token');
        await fetch(`/api/payments/${paymentId}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error(e);
      }
    }
    setStatus('CANCELLED');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-purple-100 space-y-5 relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#3D1B5B] flex items-center justify-center font-bold shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2D1344]">Pay {receiverName}</h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                {isMobileDevice ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> : <Laptop className="w-3.5 h-3.5 text-purple-600" />}
                {isMobileDevice ? 'Mobile / Android UPI Intent Ready' : 'Web Browser View'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Confirmed Mode Disclaimer */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Mobile-App Ready UPI Flow</p>
            <p className="text-[11px] text-amber-800 font-medium">
              User confirmed settlement mode. Direct bank verification is not connected.
            </p>
          </div>
        </div>

        {/* Payment Amount & Recipient Summary */}
        <div className="bg-[#FAF2EA] p-4 rounded-2xl border border-amber-100/80 flex items-center justify-between text-center shadow-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Payer</p>
            <p className="text-sm font-bold text-[#2D1344]">{payerName}</p>
          </div>

          <div className="flex flex-col items-center px-2">
            <ArrowRight className="w-5 h-5 text-[#8E58A6]" />
            <span className="text-sm font-black text-[#8E58A6] mt-0.5">₹{amount.toFixed(2)} INR</span>
          </div>

          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Recipient</p>
            <p className="text-sm font-bold text-[#2D1344]">{receiverName}</p>
          </div>
        </div>

        {/* STEP 1: Confirmation Modal Before Launching UPI */}
        {step === 'CONFIRM_INITIATION' && (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Target UPI Address</span>
              <span className="text-base font-mono font-bold text-[#2D1344] block bg-white py-1.5 px-3 rounded-xl border border-slate-200 inline-block shadow-xs">
                {activeUpiId}
              </span>
              <p className="text-xs text-slate-500 font-medium pt-1">
                You will be redirected to your UPI app (Google Pay, PhonePe, Paytm, BHIM) to complete the payment of <strong className="text-slate-800">₹{amount.toFixed(2)}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={loading}
                className="py-3.5 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-amber-300" />
                )}
                Continue to UPI
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Initiated & UPI Launch / Desktop Fallback */}
        {step === 'UPI_INTENT_LAUNCH' && (
          <div className="space-y-4 animate-fade-in">
            {/* Launch Notice Banner */}
            {launchNotice && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-[11px] font-medium text-purple-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#8E58A6] shrink-0 mt-0.5" />
                <span>{launchNotice}</span>
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-3">
              {/* Dynamic QR Code */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md relative group">
                <img
                  src={qrCodeUrl}
                  alt="Dynamic UPI QR Code"
                  className="w-44 h-44 rounded-xl object-contain"
                />
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  Scan using Google Pay, PhonePe, Paytm or BHIM
                </span>
              </div>

              {/* Copy UPI ID Pill */}
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-xs font-mono text-slate-800 border border-slate-200">
                <span>{activeUpiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="text-[#8E58A6] hover:text-[#3D1B5B] transition-colors p-1 flex items-center gap-1 cursor-pointer font-sans text-[11px] font-bold"
                  title="Copy UPI ID"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy UPI ID'}
                </button>
              </div>

              {/* Launch UPI App Button */}
              <button
                type="button"
                onClick={handleLaunchUpiAppClick}
                className="w-full py-3 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                Launch UPI App
              </button>
            </div>

            {/* Confirmation Prompt: "Did you complete the payment?" */}
            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 text-center space-y-3">
              <p className="text-xs font-bold text-[#2D1344]">
                Did you complete the payment of ₹{amount.toFixed(2)} in your UPI app?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  className="py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  No, payment not completed
                </button>

                <button
                  type="button"
                  onClick={() => setStep('VERIFY_USER_CONFIRMED')}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  Yes, I have paid
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Explicit Double-Check User Confirmation */}
        {step === 'VERIFY_USER_CONFIRMED' && (
          <div className="space-y-4 animate-fade-in text-center py-2">
            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-base font-extrabold text-emerald-950">Confirm Payment Completion</h4>
              <p className="text-xs text-emerald-800 font-medium">
                Are you sure you completed the payment of <strong className="text-emerald-950">₹{amount.toFixed(2)}</strong> to <strong className="text-emerald-950">{receiverName}</strong>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('UPI_INTENT_LAUNCH')}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={handleConfirmUserPaid}
                disabled={loading}
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <CheckCircle className="w-4 h-4 text-white" />}
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success Display (USER_CONFIRMED) */}
        {step === 'SUCCESS' && (
          <div className="py-6 flex flex-col items-center text-center space-y-4 bg-emerald-50/90 rounded-3xl border border-emerald-200 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-emerald-950">Payment Marked as Completed</h4>
              <p className="text-xs font-semibold text-emerald-700">₹{amount.toFixed(2)} settled with {receiverName}</p>
              <div className="mt-2 pt-2 border-t border-emerald-200/60">
                <span className="px-3 py-1 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider">
                  Status: USER_CONFIRMED
                </span>
                <p className="text-[11px] text-emerald-800 font-medium mt-1.5">
                  User confirmed — bank-level verification not available.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md mt-2 cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {step === 'ERROR' && (
          <div className="py-4 space-y-4 text-center animate-fade-in">
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-900 space-y-1">
              <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-rose-950">Payment Could Not Be Initiated</p>
              <p className="text-xs text-rose-700">{errorMessage}</p>
            </div>

            <button
              type="button"
              onClick={() => setStep('CONFIRM_INITIATION')}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
