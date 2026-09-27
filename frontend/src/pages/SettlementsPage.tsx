import React from 'react';
import { QrCode, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { MemberBalance, SettlementTransaction } from '../types';

interface SettlementsPageProps {
  balances: MemberBalance[];
  optimizedSettlements: SettlementTransaction[];
  settlementsHistory?: any[];
  onOpenPaymentModal: (payerName: string, receiverName: string, receiverUpiId: string, amount: number, payerMemberId?: string, receiverMemberId?: string) => void;
}

export const SettlementsPage: React.FC<SettlementsPageProps> = ({
  balances,
  optimizedSettlements,
  settlementsHistory = [],
  onOpenPaymentModal
}) => {
  const confirmedSettlements = settlementsHistory.filter(
    s => s.status === 'USER_CONFIRMED' || s.status === 'PAID' || s.status === 'CONFIRMED'
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-amber-100/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#3D1B5B] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Smart Debt Optimizer Algorithm
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2D1344]">
            Trip Settlement Optimizer
          </h2>
          <p className="text-xs md:text-sm text-slate-600 font-medium">
            Trip can be settled with only <strong className="text-[#3D1B5B]">{optimizedSettlements.length} payments</strong> minimizing unnecessary back-and-forth transactions.
          </p>
        </div>

        <div className="bg-[#FAF2EA] p-4 rounded-2xl border border-amber-100 text-center shrink-0 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Optimized Count</span>
          <span className="text-3xl font-black text-[#3D1B5B]">{optimizedSettlements.length} Payments</span>
        </div>
      </div>

      {/* Member Net Balances Summary Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100/50 space-y-4">
        <h3 className="text-lg font-bold text-[#2D1344] uppercase tracking-wider">TRIP BALANCES</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {balances.map((b) => {
            const isPos = b.netBalance > 0;
            const isNeg = b.netBalance < 0;

            return (
              <div
                key={b.memberId}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-all"
              >
                {/* Left: Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={b.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.name)}`}
                    alt={b.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white shadow-xs"
                  />
                  <span className="font-bold text-slate-800 text-sm truncate" title={b.name}>
                    {b.name}
                  </span>
                </div>

                {/* Right: Balance Pill (guaranteed single line) */}
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-black whitespace-nowrap tracking-tight ${
                    isPos
                      ? 'bg-emerald-100 text-emerald-700'
                      : isNeg
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isPos
                    ? `+₹${b.netBalance.toLocaleString()}`
                    : isNeg
                    ? `-₹${Math.abs(b.netBalance).toLocaleString()}`
                    : `+₹0`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimized Settlement Plan Cards */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100/50 space-y-4">
        <h3 className="text-lg font-bold text-[#2D1344] uppercase tracking-wider">OPTIMIZED PAYMENT PLAN</h3>

        {optimizedSettlements.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-emerald-100 text-emerald-800 font-bold text-sm">
            🎉 All trip members are completely settled! No pending payments needed.
          </div>
        ) : (
          <div className="space-y-4">
            {optimizedSettlements.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition-all"
              >
                {/* Payer & Receiver Details */}
                <div className="flex items-center gap-3 md:gap-5 min-w-0 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={s.payerAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.payerName)}`}
                      alt={s.payerName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-amber-200"
                    />
                    <span className="font-bold text-[#2D1344] text-sm md:text-base truncate max-w-[100px] sm:max-w-none">{s.payerName}</span>
                  </div>

                  <div className="flex flex-col items-center px-2 shrink-0">
                    <ArrowRight className="w-5 h-5 text-[#8E58A6]" />
                    <span className="text-xs font-black text-[#8E58A6] whitespace-nowrap">₹{s.amount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={s.receiverAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.receiverName)}`}
                      alt={s.receiverName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-emerald-200"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[#2D1344] text-sm md:text-base truncate max-w-[100px] sm:max-w-none">{s.receiverName}</span>
                      <span className="text-[10px] font-mono font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60 truncate">
                        {s.receiverUpiId || `${s.receiverName.toLowerCase().replace(/\s+/g, '')}@upi`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pay via UPI CTA */}
                <button
                  onClick={() => {
                    const recipientUpi = s.receiverUpiId || `${s.receiverName.toLowerCase().replace(/\s+/g, '')}@upi`;
                    onOpenPaymentModal(s.payerName, s.receiverName, recipientUpi, s.amount, s.payerId, s.receiverId);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#D5BD97]" />
                  Pay via UPI
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Settlements History */}
      {confirmedSettlements.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              CONFIRMED PAYMENTS HISTORY
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">{confirmedSettlements.length} Settled</span>
          </div>

          <div className="space-y-3">
            {confirmedSettlements.map((cs) => (
              <div
                key={cs.id}
                className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-950 text-sm">{cs.payerMember?.name || 'Member'}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-950 text-sm">{cs.receiverMember?.name || 'Member'}</span>
                  <span className="font-black text-sm text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                    ₹{cs.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 bg-emerald-200 text-emerald-900 font-extrabold text-[10px] rounded-full uppercase">
                    Status: {cs.status}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    (User confirmed — bank-level verification not available)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
