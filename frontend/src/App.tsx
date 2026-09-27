import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddExpensePage } from './pages/AddExpensePage';
import { ExpenseListPage } from './pages/ExpenseListPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { ProfilePage } from './pages/ProfilePage';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PaymentModal } from './components/PaymentModal';
import { CreateTripModal } from './components/CreateTripModal';
import { SplashLoader } from './components/SplashLoader';
import { PlusCircle, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('tripledger_token'));
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tripData, setTripData] = useState<any>(null);
  const [loadingTrip, setLoadingTrip] = useState<boolean>(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // WhatsApp Modal State
  const [whatsAppModalState, setWhatsAppModalState] = useState<{
    isOpen: boolean;
    vendorName: string;
    vendorPhone: string;
    expenseTitle: string;
    amount: number;
  }>({
    isOpen: false,
    vendorName: '',
    vendorPhone: '',
    expenseTitle: '',
    amount: 0
  });

  // Payment Modal State
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    tripId?: string;
    payerMemberId?: string;
    receiverMemberId?: string;
    payerName: string;
    receiverName: string;
    receiverUpiId: string;
    amount: number;
  }>({
    isOpen: false,
    tripId: '',
    payerMemberId: '',
    receiverMemberId: '',
    payerName: '',
    receiverName: '',
    receiverUpiId: '',
    amount: 0
  });

  // Verify auth session
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('tripledger_token');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkAuth();
  }, [token]);

  // Fetch Trip Details
  const fetchTripDetails = async () => {
    if (!token) return;
    setLoadingTrip(true);
    try {
      const tripsRes = await fetch('/api/trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tripsData = await tripsRes.json();
      if (tripsData.trips && tripsData.trips.length > 0) {
        const firstTripId = tripsData.trips[0].id;
        const detailRes = await fetch(`/api/trips/${firstTripId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const detailData = await detailRes.json();
        if (detailRes.ok) {
          setTripData(detailData);
        }
      } else {
        setTripData(null);
      }
    } catch (e) {
      console.error('Failed to fetch trip details:', e);
      setTripData(null);
    } finally {
      setLoadingTrip(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTripDetails();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('tripledger_token');
    setToken(null);
    setUser(null);
    setTripData(null);
  };

  const handleOpenWhatsApp = (vendorName: string, vendorPhone: string, expenseTitle: string, amount: number) => {
    setWhatsAppModalState({
      isOpen: true,
      vendorName: vendorName || 'Vendor',
      vendorPhone: vendorPhone || '',
      expenseTitle: expenseTitle || 'Trip Expense',
      amount: amount || 0
    });
  };

  const handleOpenPaymentModal = (
    payerName: string,
    receiverName: string,
    receiverUpiId: string,
    amount: number,
    payerMemberId?: string,
    receiverMemberId?: string
  ) => {
    setPaymentModalState({
      isOpen: true,
      tripId: tripData?.trip?.id,
      payerMemberId,
      receiverMemberId,
      payerName: payerName || 'Amit',
      receiverName: receiverName || 'Rahul',
      receiverUpiId: receiverUpiId || 'rahul@upi',
      amount: amount || 1200
    });
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTripDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* App Splash Flight Animation Screen */}
      {showSplash && <SplashLoader onComplete={() => setShowSplash(false)} />}

      {!token ? (
        <LoginPage
          onLoginSuccess={(u, t) => {
            setUser(u);
            setToken(t);
          }}
        />
      ) : (
        <div className="flex min-h-screen bg-[#FAF2EA] text-slate-800 font-sans">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            onLogout={handleLogout}
            activeTripName={tripData?.trip?.name || 'No Active Trip'}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar
              title={
                activeTab === 'dashboard'
                  ? tripData
                    ? `My Trip Dashboard (${tripData.trip.name})`
                    : 'My Trip Dashboard'
                  : activeTab === 'digital-twin'
                  ? 'Weather Digital Twin Simulator'
                  : activeTab === 'trips'
                  ? tripData
                    ? `${tripData.trip.name} Expense List`
                    : 'Trip Expense List'
                  : activeTab === 'add-expense'
                  ? 'Add New Expense'
                  : activeTab === 'ai-assistant'
                  ? 'AI Chat Assistant'
                  : activeTab === 'settlements'
                  ? 'Settlement Optimizer'
                  : 'Profile & Payment Settings'
              }
              subtitle={
                activeTab === 'dashboard'
                  ? 'Real-time financial overview & balances'
                  : activeTab === 'digital-twin'
                  ? 'Simulate rainfall impacts, refunds & member ledger recalculations'
                  : activeTab === 'add-expense'
                  ? 'AI Receipt Scanner & Smart Item Split'
                  : activeTab === 'ai-assistant'
                  ? 'Context-aware financial Q&A'
                  : activeTab === 'settlements'
                  ? 'Minimizing transactions with UPI integration'
                  : 'Manage your profile and settings'
              }
            />

            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
              {/* Empty State when User has 0 Trips */}
              {!tripData && activeTab !== 'profile' ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-card border border-amber-100 max-w-lg mx-auto my-12 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#3D1B5B] text-[#D5BD97] flex items-center justify-center mx-auto shadow-xl">
                    <Sparkles className="w-8 h-8 fill-current" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D1344]">No Trips Found</h2>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    Create a fresh new trip to get started with TripLedger!
                  </p>
                  <button
                    onClick={() => setIsCreateTripOpen(true)}
                    className="px-6 py-3.5 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-sm transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    + Create New Trip
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardPage
                      tripData={tripData}
                      onNavigate={setActiveTab}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  )}

                  {activeTab === 'digital-twin' && (
                    <DigitalTwinPage
                      tripData={tripData}
                      onNavigate={setActiveTab}
                    />
                  )}

                  {activeTab === 'trips' && (
                    <ExpenseListPage
                      expenses={tripData?.expenses || []}
                      members={tripData?.members || []}
                      onNavigate={setActiveTab}
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  )}

                  {activeTab === 'add-expense' && (
                    <AddExpensePage
                      members={tripData?.members || []}
                      tripId={tripData?.trip?.id || ''}
                      onExpenseAdded={fetchTripDetails}
                      recentExpenses={tripData?.expenses || []}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  )}

                  {activeTab === 'ai-assistant' && (
                    <AIAssistantPage tripId={tripData?.trip?.id || ''} />
                  )}

                  {activeTab === 'settlements' && (
                    <SettlementsPage
                      balances={tripData?.balances || []}
                      optimizedSettlements={tripData?.optimizedSettlements || []}
                      settlementsHistory={tripData?.settlementsHistory || []}
                      onOpenPaymentModal={handleOpenPaymentModal}
                    />
                  )}
                </>
              )}

              {activeTab === 'profile' && (
                <ProfilePage
                  user={user}
                  onUserUpdated={(updatedUser) => {
                    setUser(updatedUser);
                    fetchTripDetails();
                  }}
                />
              )}
            </main>
          </div>

          {/* Modals */}
          <WhatsAppModal
            isOpen={whatsAppModalState.isOpen}
            onClose={() => setWhatsAppModalState(prev => ({ ...prev, isOpen: false }))}
            vendorName={whatsAppModalState.vendorName}
            vendorPhone={whatsAppModalState.vendorPhone}
            tripName={tripData?.trip?.name || 'Fresh Trip'}
            userName={user?.name || 'User'}
            expenseTitle={whatsAppModalState.expenseTitle}
            amount={whatsAppModalState.amount}
          />

          <PaymentModal
            isOpen={paymentModalState.isOpen}
            onClose={() => setPaymentModalState(prev => ({ ...prev, isOpen: false }))}
            tripId={paymentModalState.tripId || tripData?.trip?.id}
            payerMemberId={paymentModalState.payerMemberId}
            receiverMemberId={paymentModalState.receiverMemberId}
            payerName={paymentModalState.payerName}
            receiverName={paymentModalState.receiverName}
            receiverUpiId={paymentModalState.receiverUpiId}
            amount={paymentModalState.amount}
            onPaymentComplete={(txnRef) => {
              setPaymentModalState(prev => ({ ...prev, isOpen: false }));
              fetchTripDetails();
            }}
          />

          <CreateTripModal
            isOpen={isCreateTripOpen}
            onClose={() => setIsCreateTripOpen(false)}
            onTripCreated={() => {
              fetchTripDetails();
              setActiveTab('dashboard');
            }}
          />
        </div>
      )}
    </>
  );
};
