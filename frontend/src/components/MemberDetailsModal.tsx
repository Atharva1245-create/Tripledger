import React, { useState } from 'react';
import { X, Receipt, QrCode, MessageSquare, ArrowUpRight, ArrowDownLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { MemberBalance, Expense, SettlementTransaction, TripMember } from '../types';

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: MemberBalance | null;
  expenses: Expense[];
  settlements: SettlementTransaction[];
  onOpenPaymentModal: (payerName: string, receiverName: string, receiverUpiId: string, amount: number) => void;
  onOpenWhatsApp: (vendorName: string, vendorPhone: string, expenseTitle: string, amount: number) => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedMember,
  expenses,
  settlements,
  onOpenPaymentModal,
  onOpenWhatsApp
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'shares' | 'settlement'>('expenses');

  if (!isOpen || !selectedMember) return null;

  // Filter expenses paid by selected member
  const paidExpenses = expenses.filter(
    (e) => e.paidByMemberId === selectedMember.memberId || e.paidByMember?.name === selectedMember.name
  );

  // Filter expenses where member participated
  const participatedExpenses = expenses.filter((e) =>
    e.participants.some((p) => p.memberId === selectedMember.memberId || p.member?.name === selectedMember.name)
  );

  // Filter settlements involving this member
  const memberSettlements = settlements.filter(
    (s) => s.payerId === selectedMember.memberId || s.receiverId === selectedMember.memberId ||
           s.payerName === selectedMember.name || s.receiverName === selectedMember.name
  );

  const isPos = selectedMember.netBalance > 0;
  const isNeg = selectedMember.netBalance < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-purple-100 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header with Close Button */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <img
              src={selectedMember.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedMember.name)}`}
              alt={selectedMember.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-100 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-extrabold text-[#2D1344] uppercase tracking-wide">
                  {selectedMember.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#3D1B5B] text-[10px] font-bold">
                  Member Profile
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Trip Ledger Financial Statement & Settlements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Metrics Grid Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
            <span className="text-[11px] font-bold text-emerald-700 block uppercase">Total Paid</span>
            <span className="text-lg md:text-xl font-black text-emerald-900">
              ₹{selectedMember.totalPaid.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
            <span className="text-[11px] font-bold text-rose-700 block uppercase">Owed Share</span>
            <span className="text-lg md:text-xl font-black text-rose-900">
              ₹{selectedMember.totalOwed.toLocaleString()}
            </span>
          </div>

          <div className={`p-4 rounded-2xl text-center border ${isPos ? 'bg-emerald-100/60 border-emerald-200' : isNeg ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Net Balance</span>
            <span className={`text-lg md:text-xl font-black ${isPos ? 'text-emerald-700' : isNeg ? 'text-slate-900' : 'text-slate-700'}`}>
              {isPos ? `+₹${selectedMember.netBalance.toLocaleString()}` : isNeg ? `-₹${Math.abs(selectedMember.netBalance).toLocaleString()}` : `+₹0`}
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'expenses'
                ? 'bg-[#3D1B5B] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paid Expenses ({paidExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('shares')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'shares'
                ? 'bg-[#3D1B5B] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shared Expenses ({participatedExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'settlement'
                ? 'bg-[#3D1B5B] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settlement Plan ({memberSettlements.length})
          </button>
        </div>

        {/* Tab 1: Expenses Paid by Selected Member */}
        {activeTab === 'expenses' && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {paidExpenses.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6 font-medium">
                No expenses paid by {selectedMember.name} yet.
              </p>
            ) : (
              paidExpenses.map((e) => (
                <div key={e.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#3D1B5B] flex items-center justify-center text-lg font-bold">
                      {e.category === 'Hotel' ? '🏨' : e.category === 'Food' ? '🍕' : e.category === 'Transport' ? '🚕' : '🎟️'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2D1344]">{e.title}</h4>
                      <p className="text-xs text-slate-500 font-mono">{new Date(e.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-[#2D1344] text-base">₹{e.amount.toLocaleString()}</span>
                    {e.vendorPhone && (
                      <button
                        onClick={() => onOpenWhatsApp(e.vendorName || e.title, e.vendorPhone || '+919876543210', e.title, e.amount)}
                        className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all text-xs flex items-center gap-1"
                        title="Message Vendor on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Shared Expenses Participation */}
        {activeTab === 'shares' && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {participatedExpenses.map((e) => {
              const pShare = e.participants.find((p) => p.memberId === selectedMember.memberId || p.member?.name === selectedMember.name);
              const shareAmt = pShare?.shareAmount || Math.round(e.amount / e.participants.length);

              return (
                <div key={e.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF2EA] text-[#3D1B5B] flex items-center justify-center text-lg font-bold">
                      {e.category === 'Hotel' ? '🏨' : e.category === 'Food' ? '🍕' : '🚕'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2D1344]">{e.title}</h4>
                      <p className="text-xs text-slate-500">Total ₹{e.amount.toLocaleString()} (Paid by {e.paidByMember?.name || 'Rahul'})</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Member Share</span>
                    <span className="font-extrabold text-[#3D1B5B] text-sm">₹{shareAmt.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Settlement Actions / How to Settle */}
        {activeTab === 'settlement' && (
          <div className="space-y-3">
            {memberSettlements.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 font-bold text-xs">
                ✨ {selectedMember.name} has no pending settlements required!
              </div>
            ) : (
              memberSettlements.map((s, idx) => {
                const isPayer = s.payerName === selectedMember.name || s.payerId === selectedMember.memberId;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-600 font-medium">
                        {isPayer ? (
                          <><strong>{s.payerName}</strong> owes <strong>{s.receiverName}</strong></>
                        ) : (
                          <><strong>{s.payerName}</strong> must pay <strong>{s.receiverName}</strong></>
                        )}
                      </p>
                      <span className="text-lg font-black text-[#3D1B5B]">₹{s.amount.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => onOpenPaymentModal(s.payerName, s.receiverName, `${s.receiverName.toLowerCase().replace(/\s+/g, '')}@upi`, s.amount)}
                      className="px-4 py-2.5 rounded-xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
                    >
                      <QrCode className="w-4 h-4 text-[#D5BD97]" />
                      Pay via UPI
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
        >
          Close Member Statement
        </button>
      </div>
    </div>
  );
};
