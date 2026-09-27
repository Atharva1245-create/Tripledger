import React from 'react';
import { Eye, EyeOff, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';
import { MemberBalance } from '../types';

interface MemberWalletStackProps {
  balances: MemberBalance[];
  totalSpent: number;
  onSelectMember: (member: MemberBalance) => void;
}

export const MemberWalletStack: React.FC<MemberWalletStackProps> = ({
  balances,
  totalSpent,
  onSelectMember
}) => {
  const cardThemes = ['card-theme-purple', 'card-theme-emerald', 'card-theme-rose', 'card-theme-gold'];

  return (
    <div className="py-6 flex flex-col items-center justify-center">
      <div className="wallet-container">
        {/* Wallet Back Panel */}
        <div className="wallet-back"></div>

        {/* Stacked Member Credit Cards */}
        {balances.map((b, idx) => {
          const themeClass = cardThemes[idx % cardThemes.length];
          const isPos = b.netBalance > 0;
          const isNeg = b.netBalance < 0;
          const cardNumLast4 = (1000 + (idx + 1) * 2345).toString().slice(-4);

          return (
            <div
              key={b.memberId}
              onClick={(e) => {
                e.stopPropagation();
                onSelectMember(b);
              }}
              className={`stacked-card ${themeClass} cursor-pointer group hover:shadow-2xl`}
              title={`Click to view ${b.name}'s detailed statement`}
            >
              <div className="stacked-card-inner">
                {/* Top Row: Brand & EMV Chip */}
                <div className="card-top">
                  <div className="flex items-center gap-2">
                    <img
                      src={b.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.name)}`}
                      alt={b.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white/60"
                    />
                    <span className="font-extrabold tracking-wider truncate max-w-[140px]">{b.name}</span>
                  </div>
                  <div className="emv-chip"></div>
                </div>

                {/* Bottom Row: Balance & Masked Card Number */}
                <div className="card-bottom">
                  <div>
                    <span className="card-label">Trip Balance</span>
                    <span className="card-val">
                      {isPos
                        ? `+₹${b.netBalance.toLocaleString()}`
                        : isNeg
                        ? `-₹${Math.abs(b.netBalance).toLocaleString()}`
                        : `+₹0`}
                    </span>
                  </div>

                  <div className="card-number-wrapper">
                    <span className="hidden-stars">•••• {cardNumLast4}</span>
                    <span className="card-number">4820 •••• {cardNumLast4}</span>
                    <span className="card-label mt-1 text-right block">TRIP CARD</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Pocket Front Layer */}
        <div className="wallet-pocket">
          <div className="pocket-content">
            <span className="text-[10px] font-extrabold text-[#D5BD97] uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              TripLedger Vault
            </span>

            {/* Hidden vs Real Total Balance */}
            <div className="relative h-8 flex items-center justify-center">
              <span className="balance-stars">••••••••</span>
              <span className="balance-real">₹{totalSpent.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold opacity-90 mt-1">
              <Eye className="w-3.5 h-3.5 text-[#D5BD97]" />
              <span>Hover wallet to slide out cards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
