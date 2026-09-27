import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  PlusCircle, 
  Bot, 
  Receipt, 
  User as UserIcon, 
  LogOut,
  Sparkles,
  ChevronRight,
  CloudSun,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; email: string; avatarUrl?: string } | null;
  onLogout: () => void;
  activeTripName?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  activeTripName = "Goa Trip",
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'digital-twin', label: 'Weather Digital Twin', icon: CloudSun, highlight: true },
    { id: 'trips', label: 'My Trips', subtext: activeTripName, icon: MapPin },
    { id: 'add-expense', label: 'Add Expense', icon: PlusCircle },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'settlements', label: 'Settlements', icon: Receipt },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];


  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-[#3D1B5B] text-white flex flex-col justify-between shrink-0 min-h-screen shadow-2xl z-50 transition-transform duration-300 transform ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo & Brand Header */}
        <div>
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D5BD97] to-[#F3EAF8] flex items-center justify-center text-[#3D1B5B] shadow-lg">
                <Sparkles className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                  TripLedger
                </h1>
                <p className="text-[10px] text-purple-200 tracking-wider font-medium uppercase">
                  One Smart Ledger
                </p>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium transition-all duration-200 group text-left ${
                    isActive
                      ? 'bg-[#8E58A6] text-white shadow-lg shadow-[#3D1B5B]/50 font-semibold'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm block">{item.label}</span>
                      {item.subtext && (
                        <span className="text-[11px] opacity-75 block font-normal text-purple-200">
                          {item.subtext}
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Pill at Bottom */}
        <div className="p-4 border-t border-white/10 bg-[#351547]">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"}
                alt={user?.name || "User"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D5BD97] shrink-0"
              />
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user?.name || "Rahul"}</p>
                <p className="text-[11px] text-purple-200 truncate">{user?.email || "rahul@tripledger.com"}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 text-purple-200 hover:text-red-300 hover:bg-white/10 rounded-xl transition-all shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
