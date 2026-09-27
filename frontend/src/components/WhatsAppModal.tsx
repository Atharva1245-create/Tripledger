import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Edit3, AlertTriangle, ExternalLink, CheckCircle2, PhoneCall } from 'lucide-react';
import { generateWhatsAppMessage, generateWhatsAppDeepLink, normalizeIndianPhoneNumber, WhatsAppTemplateType } from '../utils/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorPhone: string;
  tripName: string;
  userName: string;
  expenseTitle?: string;
  amount?: number;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  vendorName,
  vendorPhone,
  tripName,
  userName,
  expenseTitle,
  amount
}) => {
  const [phoneInput, setPhoneInput] = useState(vendorPhone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(!vendorPhone);
  const [template, setTemplate] = useState<WhatsAppTemplateType>('booking_confirmation');
  const [messageText, setMessageText] = useState(() =>
    generateWhatsAppMessage({ vendorName, vendorPhone: phoneInput, tripName, userName, expenseTitle, amount, templateType: 'booking_confirmation' })
  );
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  
  // Status feedback states
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [isSendingApi, setIsSendingApi] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);

  // Sync phoneInput when modal opens or vendorPhone prop changes
  useEffect(() => {
    setPhoneInput(vendorPhone || '');
    const valid = Boolean(normalizeIndianPhoneNumber(vendorPhone));
    setIsEditingPhone(!vendorPhone || !valid);
    setStatusNotice(null);
  }, [vendorPhone, isOpen]);

  // Check if WhatsApp Cloud API credentials exist on backend
  useEffect(() => {
    if (!isOpen) return;
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/whatsapp/config');
        const data = await res.json();
        setIsApiConfigured(Boolean(data.configured));
      } catch (e) {
        setIsApiConfigured(false);
      }
    };
    checkConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedPhone = normalizeIndianPhoneNumber(phoneInput);
  const isPhoneValid = Boolean(normalizedPhone);

  const handleTemplateChange = (newTemplate: WhatsAppTemplateType) => {
    setTemplate(newTemplate);
    const newMsg = generateWhatsAppMessage({
      vendorName,
      vendorPhone: phoneInput,
      tripName,
      userName,
      expenseTitle,
      amount,
      templateType: newTemplate
    });
    setMessageText(newMsg);
  };

  // LEVEL 1: Open WhatsApp via wa.me Deep Link
  const handleOpenWhatsAppDeepLink = () => {
    if (!normalizedPhone) {
      setStatusNotice({ type: 'error', text: 'Vendor WhatsApp number is unavailable.' });
      return;
    }
    const link = generateWhatsAppDeepLink(normalizedPhone, messageText);
    if (!link) {
      setStatusNotice({ type: 'error', text: 'Vendor WhatsApp number is unavailable.' });
      return;
    }

    window.open(link, '_blank');
    setStatusNotice({
      type: 'info',
      text: 'WhatsApp opened. Review and tap Send in your WhatsApp chat.'
    });
  };

  // LEVEL 2: Direct API Send via Meta WhatsApp Cloud API
  const handleSendWhatsAppApi = async () => {
    if (!normalizedPhone) {
      setStatusNotice({ type: 'error', text: 'Vendor WhatsApp number is unavailable.' });
      return;
    }

    if (!isApiConfigured) {
      // Fallback to wa.me deep link when API is not configured
      handleOpenWhatsAppDeepLink();
      return;
    }

    setIsSendingApi(true);
    setStatusNotice(null);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          vendorPhone: normalizedPhone,
          vendorName,
          message: messageText,
          templateType: template
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusNotice({
          type: 'success',
          text: 'Message sent successfully via WhatsApp Cloud API.'
        });
      } else {
        setStatusNotice({
          type: 'error',
          text: data.error || 'Message could not be sent.'
        });
      }
    } catch (err: any) {
      console.error('WhatsApp API send error:', err);
      setStatusNotice({
        type: 'error',
        text: 'Message could not be sent. Network error.'
      });
    } finally {
      setIsSendingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-purple-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2D1344]">Message Vendor</h3>
              <p className="text-xs text-slate-500 font-medium">
                {vendorName} {normalizedPhone ? `(+${normalizedPhone})` : '(No contact)'}
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

        {/* Vendor Phone Number Section & Inline Edit */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
              Vendor WhatsApp Number
            </label>
            <button
              type="button"
              onClick={() => setIsEditingPhone(!isEditingPhone)}
              className="text-xs text-[#8E58A6] font-bold flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingPhone ? 'Done' : 'Edit Contact'}
            </button>
          </div>

          {isEditingPhone ? (
            <div className="space-y-1">
              <input
                type="text"
                placeholder="e.g. +91 98765 43210 or 9876543210"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setStatusNotice(null);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-purple-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E58A6] bg-white"
              />
              {normalizedPhone && (
                <span className="text-[11px] text-emerald-600 font-bold block">
                  ✓ Normalized Format: +{normalizedPhone}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#2D1344]">
                {normalizedPhone ? `+${normalizedPhone}` : phoneInput || 'Not provided'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {isPhoneValid ? '✓ Ready for WhatsApp' : '⚠️ Phone number needed'}
              </span>
            </div>
          )}
        </div>

        {/* Warning Banner if number is invalid/missing */}
        {!isPhoneValid && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Vendor WhatsApp number is unavailable.</span>
            </div>
            {!isEditingPhone && (
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-[11px] font-extrabold hover:bg-amber-300 transition-all shrink-0"
              >
                Add Number
              </button>
            )}
          </div>
        )}

        {/* Status Notice Feedback Box */}
        {statusNotice && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
              statusNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusNotice.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusNotice.type === 'info' ? (
              <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Template Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Select Template
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'booking_confirmation', label: 'Booking Confirmation' },
              { id: 'payment_confirmation', label: 'Payment Proof' },
              { id: 'bill_clarification', label: 'Bill Details' },
              { id: 'general_inquiry', label: 'General Inquiry' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id as WhatsAppTemplateType)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  template === t.id
                    ? 'bg-[#3D1B5B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Content & Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Message Content
            </label>
            <button
              type="button"
              onClick={() => setIsEditingMessage(!isEditingMessage)}
              className="text-xs text-[#8E58A6] font-semibold flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingMessage ? 'Done Editing' : 'Edit Message'}
            </button>
          </div>

          <textarea
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!isEditingMessage}
            className={`w-full p-4 rounded-2xl text-sm font-sans transition-all ${
              isEditingMessage
                ? 'bg-white border-2 border-[#8E58A6] focus:outline-none shadow-sm'
                : 'bg-emerald-50/50 border border-emerald-200 text-slate-800'
            }`}
          />
        </div>

        {/* API Config Info Notice */}
        {!isApiConfigured && (
          <p className="text-[11px] text-slate-500 font-medium italic text-center">
            ℹ️ Direct API sending is not configured. WhatsApp will open with the message ready to send.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            Cancel
          </button>

          {/* Level 1: Open WhatsApp Deep Link */}
          <button
            type="button"
            onClick={handleOpenWhatsAppDeepLink}
            disabled={!isPhoneValid}
            className={`w-full sm:flex-1 py-3 px-4 rounded-2xl font-semibold transition-all shadow-md flex items-center justify-center gap-2 text-sm ${
              isPhoneValid
                ? 'bg-[#22C55E] hover:bg-[#16a34a] text-white shadow-green-500/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Open WhatsApp
          </button>

          {/* Level 2: Direct API Send (When Configured) */}
          {isApiConfigured && (
            <button
              type="button"
              onClick={handleSendWhatsAppApi}
              disabled={!isPhoneValid || isSendingApi}
              className={`w-full sm:flex-1 py-3 px-4 rounded-2xl font-semibold transition-all shadow-md flex items-center justify-center gap-2 text-sm ${
                isPhoneValid && !isSendingApi
                  ? 'bg-[#3D1B5B] hover:bg-[#2D1344] text-white shadow-purple-500/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Send className="w-4 h-4" />
              {isSendingApi ? 'Sending...' : 'Send via WhatsApp'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
