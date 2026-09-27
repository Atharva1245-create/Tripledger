import React from 'react';
import { AvatarGroup } from './AvatarGroup';
import { MemberBalance, TripMember } from '../types';

interface MemberCardProps {
  balance: MemberBalance;
  members: TripMember[];
}

export const MemberCard: React.FC<MemberCardProps> = ({ balance, members }) => {
  const isPos = balance.netBalance >= 0;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-100/50 flex flex-col space-y-3">
      {/* Top Row: Avatar, Name & Net Balance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={balance.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(balance.name)}`}
            alt={balance.name}
            className="w-14 h-14 rounded-full object-cover ring-4 ring-amber-50"
          />
          <div>
            <h4 className="text-xl font-extrabold uppercase tracking-wide text-[#2D1344]">{balance.name}</h4>
            <p className="text-xs text-slate-500 font-medium">balance</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-2xl font-black ${isPos ? 'text-emerald-600' : 'text-slate-800'}`}>
            {isPos ? `+₹${balance.netBalance.toLocaleString()}` : `-₹${Math.abs(balance.netBalance).toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Bottom Row: Participants Sharing Avatar Stack */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Participants Sharing</span>
        <AvatarGroup members={members} maxDisplay={4} size="sm" />
      </div>
    </div>
  );
};
