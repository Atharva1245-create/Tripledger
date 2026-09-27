import React, { useState, useEffect } from 'react';
import { MemberPlayingCard } from '../components/MemberPlayingCard';
import { WeatherImpactCard } from '../components/WeatherImpactCard';
import { fetchLiveWeather, WeatherData } from '../services/weatherService';
import { Sparkles, PlusCircle, ArrowUpRight, Bot, Receipt, MessageSquare, CloudSun } from 'lucide-react';
import { Trip, MemberBalance, TripMember, Expense } from '../types';

interface DashboardPageProps {
  tripData: {
    trip: Trip;
    members: TripMember[];
    balances: MemberBalance[];
    totalSpent: number;
    currentUserBalance?: MemberBalance;
    expenses: Expense[];
  } | null;
  user?: { name: string; email: string } | null;
  onNavigate: (tab: string) => void;
  onOpenWhatsApp: (vendorName: string, vendorPhone: string, expenseTitle: string, amount: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  tripData,
  user,
  onNavigate,
  onOpenWhatsApp
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const destinationName = tripData?.trip?.name ? tripData.trip.name.replace(/trip/gi, '').trim() : 'Lonavala';

  const loadWeather = async () => {
    setLoadingWeather(true);
    try {
      const data = await fetchLiveWeather(destinationName);
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (tripData) {
      loadWeather();
    }
  }, [tripData?.trip?.id, destinationName]);

  if (!tripData) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading trip dashboard...
      </div>
    );
  }

  const { trip, members, balances, totalSpent, currentUserBalance, expenses } = tripData;
  const userBalanceVal = currentUserBalance?.netBalance || 0;

  const displayName = currentUserBalance?.name || user?.name || members[0]?.name || 'Member';

  return (
    <div className="space-y-8 pb-12 animate-fade-in relative">
      {/* Background Ambient Mesh for Glassmorphism Reflections */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-amber-300/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Welcome Card with Glassmorphism */}
      <div className="bg-white/65 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-[#3D1B5B]/10 border border-white/90 ring-1 ring-black/5 relative overflow-hidden group hover:border-amber-300/70 transition-all duration-500">
        {/* Gloss Specular Light Highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Glass Glow Orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-[#3D1B5B]/20 via-[#D5BD97]/30 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-amber-300/30 via-purple-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2D1344] tracking-tight">
              Welcome, {displayName} 👋
            </h2>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-1">
              Here’s your trip at a glance.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center gap-6 border-t border-slate-900/10">
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                {trip.name} Overall Spent
              </span>
              <span className="text-3xl font-black text-[#2D1344]">
                ₹{totalSpent.toLocaleString()}
              </span>
            </div>

            <div className="sm:border-l sm:pl-6 border-slate-900/10">
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                Your Trip Balance
              </span>
              <span className={`text-3xl font-black ${userBalanceVal >= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {userBalanceVal < 0 ? `You owe ₹${Math.abs(userBalanceVal).toLocaleString()}` : `You are owed ₹${userBalanceVal.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Destination Weather Impact Card */}
      <WeatherImpactCard
        weather={weather}
        loading={loadingWeather}
        onRefresh={loadWeather}
        onOpenDigitalTwin={() => onNavigate('digital-twin')}
      />

      {/* Primary Action Buttons (Glassmorphic Pills) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('add-expense')}
          className="p-4 rounded-2xl bg-gradient-to-r from-[#D5BD97] to-[#C8A873] text-[#2D1344] font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          Scan Receipt (AI)
        </button>

        <button
          onClick={() => onNavigate('add-expense')}
          className="p-4 rounded-2xl bg-white/70 backdrop-blur-md text-[#2D1344] font-bold border border-white/90 shadow-md hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          Add Expense
        </button>

        <button
          onClick={() => onNavigate('ai-assistant')}
          className="p-4 rounded-2xl bg-[#3D1B5B]/90 backdrop-blur-md text-white font-bold shadow-lg hover:bg-[#3D1B5B] transition-all flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Bot className="w-4 h-4" />
          Ask AI Assistant
        </button>

        <button
          onClick={() => onNavigate('settlements')}
          className="p-4 rounded-2xl bg-white/70 backdrop-blur-md text-[#3D1B5B] font-bold border border-white/90 shadow-md hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Receipt className="w-4 h-4" />
          Settlements
        </button>
      </div>

      {/* Vertical Member Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2D1344] uppercase tracking-wider">
            Trip Member Balances
          </h3>
          <span className="text-xs text-[#8E58A6] font-semibold">Member Ledger Overview</span>
        </div>

        {/* Vertical Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {balances.map((b, idx) => (
            <MemberPlayingCard
              key={b.memberId}
              balance={b}
              members={members}
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* Recent Expenses Preview with Glassmorphism */}
      <div className="bg-white/65 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-purple-900/5 border border-white/90 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2D1344]">Recent Trip Expenses</h3>
          <button
            onClick={() => onNavigate('trips')}
            className="text-xs font-bold text-[#8E58A6] hover:underline flex items-center gap-1"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {expenses.slice(0, 4).map((e) => (
            <div
              key={e.id}
              className="p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/70 flex items-center justify-between hover:bg-white/80 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-[#3D1B5B] flex items-center justify-center font-bold text-lg shadow-inner">
                  {e.category === 'Hotel' ? '🏨' : e.category === 'Food' ? '🍕' : e.category === 'Transport' ? '🚕' : '🎟️'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2D1344]">{e.title}</h4>
                  <p className="text-xs text-slate-500">Paid by {e.paidByMember?.name || 'Rahul'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-base font-extrabold text-[#2D1344]">
                  ₹{e.amount.toLocaleString()}
                </span>
                {e.vendorPhone && (
                  <button
                    onClick={() => onOpenWhatsApp(e.vendorName || e.title, e.vendorPhone || '', e.title, e.amount)}
                    className="px-3 py-1.5 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Vendor
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
