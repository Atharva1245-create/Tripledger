import React, { useState, useRef } from 'react';
import { Sparkles, Plus, Upload, Check, Calendar, Coffee, Utensils, Car, Cake, Receipt as ReceiptIcon, MoreVertical, ChevronDown, AlertCircle } from 'lucide-react';
import { TripMember, Expense, StructuredReceipt } from '../types';

interface AddExpensePageProps {
  members: TripMember[];
  tripId: string;
  onExpenseAdded: () => void;
  recentExpenses: Expense[];
  onOpenWhatsApp: (vendorName: string, vendorPhone: string, expenseTitle: string, amount: number) => void;
}

export const AddExpensePage: React.FC<AddExpensePageProps> = ({
  members,
  tripId,
  onExpenseAdded,
  recentExpenses,
  onOpenWhatsApp
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // OCR Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<StructuredReceipt | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Open popover index for item participant selection
  const [openItemPopover, setOpenItemPopover] = useState<number | null>(null);

  // Item assignment state (item index -> array of assigned member IDs)
  const [itemAssignments, setItemAssignments] = useState<Record<number, string[]>>({});

  // Manual Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidByMemberId, setPaidByMemberId] = useState(members[0]?.id || '');
  const [splitWithMemberIds, setSplitWithMemberIds] = useState<string[]>(members.map(m => m.id));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File Upload handler for REAL AI OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadRealReceiptImage(file);
  };

  const uploadRealReceiptImage = async (file: File) => {
    setIsScanning(true);
    setScanProgress(25);
    setScanError(null);
    setExtractedData(null);

    // Generate real image preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    const formData = new FormData();
    formData.append('receipt', file);

    const interval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 250);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/expenses/scan-receipt', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      clearInterval(interval);
      setScanProgress(100);

      const data = await res.json();

      if (!res.ok || !data.receipt) {
        if (res.status === 429 || data.isQuotaError || (data.error && (data.error.includes('limit') || data.error.includes('quota') || data.error.includes('429')))) {
          throw new Error('AI usage limit reached.');
        }
        throw new Error(data.error || 'Receipt analysis failed. Please check your AI API key or try again.');
      }

      const receipt: StructuredReceipt = { ...data.receipt, isDemo: false };
      setExtractedData(receipt);
      setTitle(receipt.merchant || 'Restaurant Expense');
      setAmount(receipt.total.toString());
      setVendorName(receipt.merchant || 'Restaurant');

      const initAssignments: Record<number, string[]> = {};
      receipt.items.forEach((_: any, idx: number) => {
        initAssignments[idx] = members.map((m) => m.id);
      });
      setItemAssignments(initAssignments);
    } catch (err: any) {
      console.error('Real receipt upload failed:', err);
      setScanError(err.message || 'Receipt AI is unavailable. Please check your AI_API_KEY configuration or enter details manually.');
      setExtractedData(null);
    } finally {
      setTimeout(() => setIsScanning(false), 300);
    }
  };

  // Demo mode handler (Explicit DEMO mode only)
  const handleSampleReceipt = async () => {
    setIsScanning(true);
    setScanProgress(25);
    setScanError(null);
    setExtractedData(null);
    setImagePreviewUrl(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/expenses/demo-receipt', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      clearInterval(interval);
      setScanProgress(100);

      const data = await res.json();
      const receipt: StructuredReceipt = { ...(data.receipt || {}), isDemo: true };

      setExtractedData(receipt);
      setTitle(receipt.merchant || 'Goa Beach Restaurant & Bar');
      setAmount(receipt.total.toString());
      setVendorName(receipt.merchant);

      const initAssignments: Record<number, string[]> = {};
      receipt.items.forEach((_: any, idx: number) => {
        initAssignments[idx] = members.map((m) => m.id);
      });
      setItemAssignments(initAssignments);
    } catch (err: any) {
      console.error('Demo receipt error:', err);
      setScanError('Unable to load demo receipt.');
    } finally {
      setTimeout(() => setIsScanning(false), 300);
    }
  };

  const toggleItemParticipant = (itemIndex: number, memberId: string) => {
    setItemAssignments(prev => {
      const current = prev[itemIndex] || [];
      const updated = current.includes(memberId)
        ? current.filter(id => id !== memberId)
        : [...current, memberId];
      return { ...prev, [itemIndex]: updated };
    });
  };

  const toggleAllItemParticipants = (itemIndex: number) => {
    setItemAssignments(prev => {
      const current = prev[itemIndex] || [];
      const allIds = members.map(m => m.id);
      const isAllSelected = current.length === allIds.length;
      return { ...prev, [itemIndex]: isAllSelected ? [members[0]?.id || ''] : allIds };
    });
  };

  const handleSaveScannedExpense = async () => {
    if (!extractedData) return;
    setSubmitting(true);

    try {
      const participantsMap = new Map<string, number>();
      members.forEach(m => participantsMap.set(m.id, 0));

      extractedData.items.forEach((item, idx) => {
        const assignedMembers = itemAssignments[idx] || members.map(m => m.id);
        const perPerson = item.amount / (assignedMembers.length || 1);
        assignedMembers.forEach(mId => {
          participantsMap.set(mId, (participantsMap.get(mId) || 0) + perPerson);
        });
      });

      const taxPerPerson = (extractedData.tax || 0) / members.length;
      members.forEach(m => {
        participantsMap.set(m.id, (participantsMap.get(m.id) || 0) + taxPerPerson);
      });

      const participants = Array.from(participantsMap.entries()).map(([memberId, shareAmount]) => ({
        memberId,
        shareAmount: Math.round(shareAmount * 100) / 100
      }));

      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId,
          title: extractedData.merchant || 'Scanned Restaurant Expense',
          amount: extractedData.total || 8420,
          category: 'Food',
          paidByMemberId: paidByMemberId || members[0]?.id,
          splitType: 'ITEM_LEVEL',
          date: new Date().toISOString(),
          vendorName: extractedData.merchant || vendorName || 'Restaurant',
          vendorPhone: vendorPhone || '',
          items: extractedData.items,
          participants
        })
      });

      if (res.ok) {
        setExtractedData(null);
        onExpenseAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveManualExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !paidByMemberId) return;

    setSubmitting(true);
    const numericAmount = parseFloat(amount);
    const perPerson = numericAmount / (splitWithMemberIds.length || 1);

    const participants = splitWithMemberIds.map(memberId => ({
      memberId,
      shareAmount: Math.round(perPerson * 100) / 100
    }));

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId,
          title,
          amount: numericAmount,
          category,
          paidByMemberId,
          splitType: 'EQUAL',
          date: new Date(date).toISOString(),
          notes: note,
          vendorName,
          vendorPhone,
          participants
        })
      });

      if (res.ok) {
        setTitle('');
        setAmount('');
        setNote('');
        onExpenseAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Top Tab Switcher matching Image 1 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab('scan')}
          className={`px-6 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center gap-2 text-sm shadow-md ${
            activeTab === 'scan'
              ? 'bg-gradient-to-r from-[#D5BD97] to-[#C8A873] text-[#2D1344] ring-2 ring-[#D5BD97]'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 fill-current text-[#2D1344]" />
          Scan Receipt (AI)
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center gap-2 text-sm ${
            activeTab === 'manual'
              ? 'bg-[#3D1B5B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add Manually
        </button>
      </div>

      {/* Tab 1: Scan Receipt (AI) View */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          {/* Upload Image Box */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-amber-100/50 flex flex-col justify-between space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) await uploadRealReceiptImage(file);
              }}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#3D1B5B] bg-purple-100/60 scale-[1.01]'
                  : 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/60'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#3D1B5B] text-white flex items-center justify-center shadow-lg shadow-[#3D1B5B]/20 mb-3">
                <Upload className="w-7 h-7" />
              </div>

              <p className="text-sm font-bold text-[#2D1344] mb-1">
                Drag & Drop receipt image here, or choose an option:
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Supports JPG, PNG, WEBP receipt photos
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload Receipt Image
                </button>

                <button
                  type="button"
                  onClick={handleSampleReceipt}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D5BD97] to-[#C8A873] text-[#2D1344] font-bold text-sm hover:shadow-md transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-current text-[#2D1344]" />
                  Try Demo Receipt
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#3D1B5B] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${isScanning ? scanProgress : extractedData ? 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {isScanning ? 'Scanning receipt with Vision AI...' : extractedData ? 'Receipt scanned & verified!' : 'Upload a receipt to scan with AI'}
              </span>
            </div>
          </div>

          {/* AI Scan Error Banner */}
          {scanError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-3xl p-5 shadow-sm space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>AI Receipt Processing Temporarily Unavailable</span>
              </div>
              <div className="pl-7 space-y-1">
                <p className="text-xs font-semibold text-amber-900">
                  Reason: <span className="font-medium text-amber-800">{scanError}</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Your uploaded receipt image is saved below. You can enter details manually or retry later.
                </p>
              </div>
            </div>
          )}

          {/* Image Preview Card */}
          {imagePreviewUrl && (
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-amber-100/50 flex items-center gap-4 animate-fade-in">
              <img
                src={imagePreviewUrl}
                alt="Uploaded Receipt Preview"
                className="w-24 h-24 object-cover rounded-2xl border border-slate-200 shadow-sm"
              />
              <div>
                <span className="text-[10px] font-extrabold text-[#8E58A6] uppercase tracking-wider block">Uploaded Image Preview</span>
                <p className="text-sm font-bold text-[#2D1344] mt-0.5">Receipt Photo Loaded</p>
                <p className="text-xs text-slate-500 mt-1">Ready for verification & itemized splitting below.</p>
              </div>
            </div>
          )}

          {/* Verify Extracted Items Card (Shown when receipt is scanned) */}
          {extractedData && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100/50 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#2D1344]">Verify Extracted Items</h3>
                    <p className="text-xs text-slate-500 font-medium">{extractedData.merchant}</p>
                  </div>

                  {extractedData.isDemo ? (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 shadow-xs">
                      DEMO RECEIPT
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300 shadow-xs">
                      REAL AI EXTRACTED
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setExtractedData(null);
                    setImagePreviewUrl(null);
                    setScanError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              </div>

              {/* Total Verification Alert Warning */}
              {extractedData.needsVerification && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{extractedData.verificationMessage || 'Receipt total needs verification. Computed item sum differs from detected total.'}</span>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                STRUCTURED BILL SPLIT
              </p>

              <div className="space-y-3 text-sm">
                {extractedData.items.map((item, idx) => {
                  const assignedIds = itemAssignments[idx] || [];
                  const isAllSelected = assignedIds.length === members.length;
                  const assignedNames = members
                    .filter(m => assignedIds.includes(m.id))
                    .map(m => m.name);

                  return (
                    <div key={idx} className="relative flex items-center justify-between py-2 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                            x{item.quantity}
                          </span>
                        )}
                        <span className="text-slate-600 font-black text-xs bg-slate-100 px-2 py-0.5 rounded-lg">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Participant Selection Pill */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenItemPopover(openItemPopover === idx ? null : idx)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#3D1B5B] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:bg-[#2D1344]"
                        >
                          <Check className="w-3.5 h-3.5 text-[#D5BD97]" />
                          <span className="max-w-[140px] truncate">
                            {isAllSelected
                              ? 'All'
                              : assignedNames.length > 0
                              ? assignedNames.join(', ')
                              : 'Select'}
                          </span>
                          <ChevronDown className="w-3 h-3 text-purple-200 ml-0.5" />
                        </button>

                        {/* Participant Dropdown Popover */}
                        {openItemPopover === idx && (
                          <div className="absolute right-0 top-9 z-30 bg-white rounded-2xl shadow-xl border border-purple-100 p-3 w-52 space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between border-b pb-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">Select People</span>
                              <button
                                type="button"
                                onClick={() => toggleAllItemParticipants(idx)}
                                className="text-[10px] font-bold text-[#8E58A6] hover:underline"
                              >
                                {isAllSelected ? 'Clear' : 'Select All'}
                              </button>
                            </div>

                            <div className="space-y-1 max-h-36 overflow-y-auto">
                              {members.map(m => {
                                const isChecked = assignedIds.includes(m.id);
                                return (
                                  <label
                                    key={m.id}
                                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleItemParticipant(idx, m.id)}
                                      className="rounded text-[#3D1B5B] focus:ring-[#8E58A6]"
                                    />
                                    <span className="truncate">{m.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {extractedData.tax ? (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>GST / Taxes & Fees</span>
                    <span className="font-bold text-slate-700">₹{extractedData.tax.toLocaleString()}</span>
                  </div>
                ) : null}

                <div className="pt-2 flex items-center justify-between font-bold text-[#2D1344] border-t border-slate-200">
                  <span className="text-sm font-extrabold">Total Bill</span>
                  <span className="text-xl font-black">₹{extractedData.total.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleSaveScannedExpense}
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-[#3D1B5B] text-white font-bold text-xs hover:bg-[#2D1344] transition-all shadow-md"
                >
                  {submitting ? 'Saving Expense...' : 'Confirm & Save Bill Split'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Add Manually Form */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-amber-100/50 space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-lg font-bold text-[#2D1344]">Add Expense Manually</h3>
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </div>

          <form onSubmit={handleSaveManualExpense} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Expense Title</label>
              <input
                type="text"
                required
                placeholder="Beach Cafe Lunch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                />
                <Calendar className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Category Icon Pills */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
              <div className="flex gap-2">
                {[
                  { id: 'Food', icon: Utensils },
                  { id: 'Coffee', icon: Coffee },
                  { id: 'Hotel', icon: ReceiptIcon },
                  { id: 'Transport', icon: Car },
                  { id: 'Activities', icon: Cake }
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        category === c.id
                          ? 'bg-[#3D1B5B] text-[#D5BD97] border-[#3D1B5B]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="2400"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Paid By</label>
                <select
                  value={paidByMemberId}
                  onChange={(e) => setPaidByMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Split With</label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = splitWithMemberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSplitWithMemberIds(prev =>
                          selected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                        selected
                          ? 'bg-[#3D1B5B] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Paradise"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Vendor WhatsApp Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Note</label>
              <input
                type="text"
                placeholder="Dinner expense details"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold transition-all shadow-lg shadow-[#3D1B5B]/30 text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current text-[#D5BD97]" />
              {submitting ? 'Saving Expense...' : 'Save Expense'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
