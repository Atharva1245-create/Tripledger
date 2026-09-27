import React from 'react';
import { AvatarGroup } from './AvatarGroup';
import { MemberBalance, TripMember } from '../types';
import { ChevronRight, Sparkles } from 'lucide-react';

interface Member3DCardProps {
  balance: MemberBalance;
  members: TripMember[];
  onClick: (member: MemberBalance) => void;
}

export const Member3DCard: React.FC<Member3DCardProps> = ({ balance, members, onClick }) => {
  const isPos = balance.netBalance > 0;
  const isNeg = balance.netBalance < 0;

  const cardVariantClass = isPos
    ? 'member-card-positive'
    : isNeg
    ? 'member-card-negative'
    : 'member-card-neutral';

  return (
    <div className="member-card-container select-none cursor-pointer group" onClick={() => onClick(balance)}>
      {/* 5x5 Touch/Mouse Grid Tracker for 3D Tilt */}
      <div className="member-card-canvas">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className={`tr-${i + 1} cursor-pointer`} />
        ))}
      </div>

      {/* Inner Card Content */}
      <div className={`member-card-inner ${cardVariantClass} p-5 shadow-md border border-amber-100/60 transition-all duration-300`}>
        <div className="flex items-center justify-between">
          {/* Avatar & Member Name */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative">
              <img
                src={balance.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(balance.name)}`}
                alt={balance.name}
                className="w-14 h-14 rounded-full object-cover ring-4 ring-[#FAF2EA] shadow-md"
              />
              <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-white ${isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
            </div>
            <div className="truncate">
              <h4 className="text-xl font-extrabold uppercase tracking-wide text-[#2D1344] group-hover:text-[#8E58A6] transition-colors truncate">
                {balance.name}
              </h4>
              <p className="text-xs text-slate-500 font-medium">balance</p>
            </div>
          </div>

          {/* Balance Display */}
          <div className="text-right shrink-0 flex items-center gap-2">
            <div>
              <span
                className={`text-2xl md:text-3xl font-black whitespace-nowrap tracking-tight ${
                  isPos
                    ? 'text-emerald-600'
                    : isNeg
                    ? 'text-slate-900'
                    : 'text-slate-600'
                }`}
              >
                {isPos
                  ? `+₹${balance.netBalance.toLocaleString()}`
                  : isNeg
                  ? `-₹${Math.abs(balance.netBalance).toLocaleString()}`
                  : `+₹0`}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#3D1B5B] group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Participants Sharing Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#8E58A6]" />
            Participants Sharing
          </span>
          <AvatarGroup members={members} maxDisplay={4} size="sm" />
        </div>
      </div>
    </div>
  );
};
