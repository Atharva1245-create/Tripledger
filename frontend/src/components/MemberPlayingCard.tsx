import React from 'react';
import { AvatarGroup } from './AvatarGroup';
import { MemberBalance, TripMember } from '../types';

interface MemberPlayingCardProps {
  balance: MemberBalance;
  members: TripMember[];
  index?: number;
}

export const MemberPlayingCard: React.FC<MemberPlayingCardProps> = ({ balance, members }) => {
  const isPos = balance.netBalance > 0;
  const isNeg = balance.netBalance < 0;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[28px] p-5 md:p-6 shadow-xl shadow-[#3D1B5B]/5 hover:shadow-2xl border border-white/90 ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:border-amber-300/80 flex flex-col justify-between aspect-[2/3] min-h-[320px] relative overflow-hidden group select-none">
      
      {/* Specular Gloss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />

      {/* Soft Background Accent Ambient Glow */}
      <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl opacity-30 pointer-events-none group-hover:scale-125 transition-transform duration-500 ${isPos ? 'bg-emerald-400' : isNeg ? 'bg-rose-400' : 'bg-purple-400'}`}></div>

      {/* Top Row: Trip Member Tag & Net Balance Pill */}
      <div className="flex items-center justify-between z-10 gap-2">
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
          Member
        </span>

        {/* Balance Status Badge (guaranteed single-line, non-wrapping) */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-black tracking-tight whitespace-nowrap shrink-0 shadow-xs ${
            isPos
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : isNeg
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {isPos
            ? `+₹${balance.netBalance.toLocaleString()}`
            : isNeg
            ? `-₹${Math.abs(balance.netBalance).toLocaleString()}`
            : `+₹0`}
        </span>
      </div>

      {/* Center Section: Portrait Avatar, Member Name & Large Amount */}
      <div className="flex flex-col items-center text-center space-y-3 my-auto z-10 w-full px-1">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#D5BD97] via-[#8E58A6] to-[#3D1B5B] shadow-md">
            <img
              src={balance.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(balance.name)}`}
              alt={balance.name}
              className="w-full h-full rounded-full object-cover bg-white"
            />
          </div>
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-white ${isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
        </div>

        <div className="w-full">
          <h4 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-[#2D1344] group-hover:text-[#8E58A6] transition-colors truncate w-full" title={balance.name}>
            {balance.name}
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
            Trip Ledger Balance
          </span>
        </div>

        {/* Large Highlight Balance */}
        <div className="pt-1">
          <span className={`text-2xl font-black whitespace-nowrap ${isPos ? 'text-emerald-600' : isNeg ? 'text-slate-900' : 'text-slate-600'}`}>
            {isPos ? `+₹${balance.netBalance.toLocaleString()}` : isNeg ? `-₹${Math.abs(balance.netBalance).toLocaleString()}` : `+₹0`}
          </span>
        </div>
      </div>

      {/* Bottom Section: Participants Sharing Stack */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between z-10 gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Participants</span>
        <AvatarGroup members={members} maxDisplay={3} size="sm" />
      </div>
    </div>
  );
};
