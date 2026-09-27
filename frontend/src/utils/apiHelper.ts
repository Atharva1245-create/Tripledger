// Safe API Helper to handle Netlify / static deployment fallbacks cleanly
export async function safeFetchJson(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: any; isHtmlResponse: boolean }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (e.g. Netlify fallback index.html for unhandled /api routes)
    if (contentType.includes('text/html')) {
      return { ok: false, status: res.status, data: null, isHtmlResponse: true };
    }

    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data, isHtmlResponse: false };
  } catch (err) {
    return { ok: false, status: 0, data: null, isHtmlResponse: false };
  }
}

// Pre-seeded Demo Trip Data for standalone client deployments
export const DEMO_TRIP_DATA = {
  trip: {
    id: 'goa-trip-demo-id',
    name: 'Goa Trip',
    description: 'Annual beach vacation with college friends',
    currency: 'INR',
    budget: 50000,
    startDate: '2026-09-26',
    endDate: '2026-09-30',
    totalSpent: 42500,
    memberCount: 5,
    role: 'ORGANIZER',
    createdAt: new Date().toISOString()
  },
  members: [
    {
      id: 'm1',
      tripId: 'goa-trip-demo-id',
      userId: 'u1',
      name: 'Rahul',
      email: 'rahul@tripledger.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      role: 'ORGANIZER',
      isGuest: false
    },
    {
      id: 'm2',
      tripId: 'goa-trip-demo-id',
      userId: 'u2',
      name: 'Amit',
      email: 'amit@tripledger.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      role: 'MEMBER',
      isGuest: false
    },
    {
      id: 'm3',
      tripId: 'goa-trip-demo-id',
      userId: 'u3',
      name: 'Neha',
      email: 'neha@tripledger.com',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      role: 'MEMBER',
      isGuest: false
    },
    {
      id: 'm4',
      tripId: 'goa-trip-demo-id',
      userId: 'u4',
      name: 'Sameer',
      email: 'sameer@tripledger.com',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      role: 'MEMBER',
      isGuest: false
    },
    {
      id: 'm5',
      tripId: 'goa-trip-demo-id',
      userId: null,
      name: 'Rohit (Guest)',
      email: null,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
      role: 'MEMBER',
      isGuest: true
    }
  ],
  expenses: [
    {
      id: 'exp1',
      tripId: 'goa-trip-demo-id',
      title: 'Hotel Paradise Stay',
      amount: 12000,
      category: 'Hotel',
      paidByMemberId: 'm1',
      paidByMember: { id: 'm1', name: 'Rahul', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
      splitType: 'EQUAL',
      date: new Date('2026-09-26T10:00:00Z').toISOString(),
      notes: '3 nights stay near Calangute beach',
      vendorName: 'Hotel Paradise',
      vendorPhone: '+919876543210',
      items: [],
      participants: []
    },
    {
      id: 'exp2',
      tripId: 'goa-trip-demo-id',
      title: 'Restaurant ABC Dinner',
      amount: 2400,
      category: 'Food',
      paidByMemberId: 'm2',
      paidByMember: { id: 'm2', name: 'Amit', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
      splitType: 'EQUAL',
      date: new Date('2026-09-26T20:30:00Z').toISOString(),
      notes: 'Seafood and drinks night',
      vendorName: 'Restaurant ABC',
      vendorPhone: '+919812345678',
      items: [],
      participants: []
    },
    {
      id: 'exp3',
      tripId: 'goa-trip-demo-id',
      title: 'Airport Transfer Cab',
      amount: 900,
      category: 'Transport',
      paidByMemberId: 'm3',
      paidByMember: { id: 'm3', name: 'Neha', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80' },
      splitType: 'EQUAL',
      date: new Date('2026-09-26T08:00:00Z').toISOString(),
      notes: 'Airport to hotel cab fare',
      vendorName: 'Goa Taxi Services',
      vendorPhone: '+919988776655',
      items: [],
      participants: []
    },
    {
      id: 'exp4',
      tripId: 'goa-trip-demo-id',
      title: 'Scuba Diving & Watersports',
      amount: 3500,
      category: 'Activities',
      paidByMemberId: 'm4',
      paidByMember: { id: 'm4', name: 'Sameer', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80' },
      splitType: 'EQUAL',
      date: new Date('2026-09-27T11:00:00Z').toISOString(),
      notes: 'Water sports at Baga Beach',
      vendorName: 'Goa Watersports Club',
      vendorPhone: '+919765432109',
      items: [],
      participants: []
    },
    {
      id: 'exp5',
      tripId: 'goa-trip-demo-id',
      title: 'Beach Cafe Lunch',
      amount: 1850,
      category: 'Food',
      paidByMemberId: 'm1',
      paidByMember: { id: 'm1', name: 'Rahul', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
      splitType: 'EQUAL',
      date: new Date('2026-09-27T14:00:00Z').toISOString(),
      notes: 'Shack lunch & fresh juices',
      vendorName: 'Beach Cafe',
      vendorPhone: '+919123456789',
      items: [],
      participants: []
    }
  ],
  balances: [
    { memberId: 'm1', name: 'Rahul', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', totalPaid: 13850, totalOwed: 4130, netBalance: 9720 },
    { memberId: 'm2', name: 'Amit', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', totalPaid: 2400, totalOwed: 4130, netBalance: -1730 },
    { memberId: 'm3', name: 'Neha', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', totalPaid: 900, totalOwed: 4130, netBalance: -3230 },
    { memberId: 'm4', name: 'Sameer', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', totalPaid: 3500, totalOwed: 4130, netBalance: -630 },
    { memberId: 'm5', name: 'Rohit (Guest)', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80', totalPaid: 0, totalOwed: 4130, netBalance: -4130 }
  ],
  totalSpent: 20650,
  currentUserBalance: { memberId: 'm1', name: 'Rahul', totalPaid: 13850, totalOwed: 4130, netBalance: 9720 },
  optimizedSettlements: [
    { payerId: 'm3', payerName: 'Neha', receiverId: 'm1', receiverName: 'Rahul', receiverUpiId: 'rahul@upi', amount: 3230, status: 'PENDING' },
    { payerId: 'm2', payerName: 'Amit', receiverId: 'm1', receiverName: 'Rahul', receiverUpiId: 'rahul@upi', amount: 1730, status: 'PENDING' },
    { payerId: 'm5', payerName: 'Rohit (Guest)', receiverId: 'm1', receiverName: 'Rahul', receiverUpiId: 'rahul@upi', amount: 4130, status: 'PENDING' },
    { payerId: 'm4', payerName: 'Sameer', receiverId: 'm1', receiverName: 'Rahul', receiverUpiId: 'rahul@upi', amount: 630, status: 'PENDING' }
  ],
  settlementsHistory: []
};
