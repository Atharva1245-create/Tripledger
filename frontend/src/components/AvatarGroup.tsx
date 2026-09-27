import React from 'react';

interface MemberAvatar {
  id?: string;
  name: string;
  avatarUrl?: string | null;
}

interface AvatarGroupProps {
  members: MemberAvatar[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  members,
  maxDisplay = 4,
  size = 'md'
}) => {
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  return (
    <div className="flex items-center -space-x-2 overflow-hidden py-1">
      {displayMembers.map((m, idx) => (
        <img
          key={m.id || idx}
          src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
          alt={m.name}
          title={m.name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-sm inline-block`}
        />
      ))}
      {remainingCount > 0 && (
        <div className={`${sizeClasses[size]} rounded-full bg-[#3D1B5B] text-white flex items-center justify-center font-bold ring-2 ring-white shadow-sm inline-block`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
