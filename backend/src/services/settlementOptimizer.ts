export interface MemberBalance {
  memberId: string;
  name: string;
  avatarUrl?: string | null;
  upiId?: string | null;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // totalPaid - totalOwed
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

/**
 * Calculates net balances for all members in a trip based on expenses.
 */
export function calculateMemberBalances(
  members: { id: string; name: string; avatarUrl?: string | null; upiId?: string | null }[],
  expenses: {
    paidByMemberId: string;
    amount: number;
    participants: { memberId: string; shareAmount: number }[];
  }[],
  settlements?: { payerId: string; receiverId: string; amount: number; status: string }[]
): MemberBalance[] {
  const balanceMap = new Map<string, { totalPaid: number; totalOwed: number }>();

  // Initialize for all members
  members.forEach((m) => {
    balanceMap.set(m.id, { totalPaid: 0, totalOwed: 0 });
  });

  // Aggregate expenses
  expenses.forEach((expense) => {
    const payer = balanceMap.get(expense.paidByMemberId);
    if (payer) {
      payer.totalPaid += expense.amount;
    }

    expense.participants.forEach((p) => {
      const participant = balanceMap.get(p.memberId);
      if (participant) {
        participant.totalOwed += p.shareAmount;
      }
    });
  });

  // Aggregate confirmed settlement payments
  if (settlements && settlements.length > 0) {
    settlements.forEach((s) => {
      if (s.status === 'USER_CONFIRMED' || s.status === 'PAID' || s.status === 'CONFIRMED') {
        const payer = balanceMap.get(s.payerId);
        if (payer) {
          payer.totalPaid += s.amount;
        }

        const receiver = balanceMap.get(s.receiverId);
        if (receiver) {
          receiver.totalOwed += s.amount;
        }
      }
    });
  }

  return members.map((m) => {
    const data = balanceMap.get(m.id) || { totalPaid: 0, totalOwed: 0 };
    const netBalance = Math.round((data.totalPaid - data.totalOwed) * 100) / 100;
    return {
      memberId: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      upiId: m.upiId,
      totalPaid: Math.round(data.totalPaid * 100) / 100,
      totalOwed: Math.round(data.totalOwed * 100) / 100,
      netBalance,
    };
  });
}

/**
 * Greedily minimizes settlement transactions between debtors and creditors.
 */
export function optimizeSettlements(
  balances: MemberBalance[]
): SettlementTransaction[] {
  const debtors: { memberId: string; name: string; avatarUrl?: string | null; amount: number }[] = [];
  const creditors: { memberId: string; name: string; avatarUrl?: string | null; upiId?: string | null; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({ memberId: b.memberId, name: b.name, avatarUrl: b.avatarUrl, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ memberId: b.memberId, name: b.name, avatarUrl: b.avatarUrl, upiId: b.upiId, amount: b.netBalance });
    }
  });

  // Sort descending by amount to optimize top debts first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        payerId: debtor.memberId,
        payerName: debtor.name,
        payerAvatarUrl: debtor.avatarUrl,
        receiverId: creditor.memberId,
        receiverName: creditor.name,
        receiverAvatarUrl: creditor.avatarUrl,
        receiverUpiId: creditor.upiId || `${creditor.name.toLowerCase().replace(/\s+/g, '')}@upi`,
        amount: roundedAmount,
        status: "Pending",
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  return transactions;
}

