import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, onOpenMobileMenu }) => {
  return (
    <header className="flex items-center justify-between py-4 px-6 md:px-8 bg-transparent">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl bg-white shadow-sm text-slate-700 hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2D1344] tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-3 rounded-2xl bg-white text-slate-700 shadow-sm hover:shadow-md transition-all hover:bg-slate-50 border border-amber-100">
          <Bell className="w-5 h-5 text-[#3D1B5B]" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
};
