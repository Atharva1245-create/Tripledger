export interface User {
  id: string;
  name: string;
  email: string;
  upiId?: string;
  avatarUrl?: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: 'ORGANIZER' | 'MEMBER';
  isGuest: boolean;
}

export interface ExpenseItem {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface ExpenseParticipant {
  id?: string;
  memberId: string;
  shareAmount: number;
  percentage?: number;
  member?: TripMember;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  category: string;
  paidById?: string;
  paidByMemberId: string;
  paidByMember: TripMember;
  splitType: 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'ITEM_LEVEL' | 'CUSTOM';
  date: string;
  notes?: string;
  receiptImage?: string;
  vendorName?: string;
  vendorPhone?: string;
  vendorCategory?: string;
  items: ExpenseItem[];
  participants: ExpenseParticipant[];
}

export interface MemberBalance {
  memberId: string;
  name: string;
  avatarUrl?: string | null;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface SettlementTransaction {
  id?: string;
  payerId: string;
  payerName: string;
  payerAvatarUrl?: string | null;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string | null;
  receiverUpiId?: string | null;
  amount: number;
  status: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  currency: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  totalSpent: number;
  memberCount: number;
  role: string;
  createdAt: string;
}

export interface StructuredReceiptItem {
  name: string;
  amount: number;
  quantity?: number;
}

export interface StructuredReceipt {
  merchant: string;
  date?: string;
  items: StructuredReceiptItem[];
  subtotal?: number;
  tax: number;
  discount: number;
  serviceCharge?: number;
  total: number;
  currency?: string;
  isDemo?: boolean;
  needsVerification?: boolean;
  verificationMessage?: string;
}
