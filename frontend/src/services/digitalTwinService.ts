import { TripMember, Expense, MemberBalance, SettlementTransaction } from '../types';
import { calculateMemberBalances, optimizeSettlements } from '../../../backend/src/services/settlementOptimizer';

export interface SimulatedActivityImpact {
  id: string;
  title: string;
  category: string;
  originalCost: number;
  locationName: string;
  vendorName: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NORMAL' | 'DELAYED' | 'AT_RISK' | 'CANCELLED';
  statusReason: string;
  refundPercentage: number;
  refundAmount: number;
  simulatedCost: number;
  riskProbability: number; // 0-100%
}

export interface DigitalTwinScenario {
  rainfallMm: number;
  rainSeverityLabel: 'Normal / Clear' | 'Light Rain' | 'Moderate Rain' | 'Heavy Rain' | 'Extreme Downpour';
  cancellationRiskPercent: number;
  confidencePercent: number;
  activities: SimulatedActivityImpact[];
  totalOriginalCost: number;
  totalSimulatedCost: number;
  totalRefundAmount: number;
  simulatedBalances: MemberBalance[];
  simulatedSettlements: SettlementTransaction[];
  cascadingChain: {
    step: number;
    title: string;
    description: string;
    icon: string;
  }[];
}

/**
 * Determines activity sensitivity based on title or category
 */
function getActivitySensitivity(title: string, category: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const t = title.toLowerCase();
  const c = category.toLowerCase();

  if (t.includes('rafting') || t.includes('boating') || t.includes('river') || t.includes('water') || t.includes('surfing')) {
    return 'CRITICAL';
  }
  if (t.includes('trek') || t.includes('hike') || t.includes('camping') || t.includes('zipline') || t.includes('paragliding')) {
    return 'HIGH';
  }
  if (t.includes('sightseeing') || t.includes('tour') || t.includes('beach') || c.includes('activities')) {
    return 'MEDIUM';
  }
  return 'LOW'; // Hotels, indoor dining, shopping
}

/**
 * Runs the Digital Twin simulation in-memory for a given rainfall amount (0-50mm)
 */
export function simulateDigitalTwinScenario(
  expenses: Expense[],
  members: TripMember[],
  rainfallMm: number
): DigitalTwinScenario {
  // Determine rainfall severity label
  let rainSeverityLabel: DigitalTwinScenario['rainSeverityLabel'] = 'Normal / Clear';
  if (rainfallMm > 40) rainSeverityLabel = 'Extreme Downpour';
  else if (rainfallMm > 25) rainSeverityLabel = 'Heavy Rain';
  else if (rainfallMm > 10) rainSeverityLabel = 'Moderate Rain';
  else if (rainfallMm > 0) rainSeverityLabel = 'Light Rain';

  // Build target activity list from expenses (or create representative trip activities if expenses lack outdoor activities)
  let rawActivities: { id: string; title: string; category: string; amount: number; vendorName: string; locationName: string }[] = [];

  expenses.forEach((e) => {
    rawActivities.push({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      vendorName: e.vendorName || 'Local Activity Operator',
      locationName: e.category === 'Hotel' ? 'Hotel XYZ Resort' : `${e.title} Spot`
    });
  });

  // If trip expenses don't have dedicated activities, add demo activities linked to the trip destination
  if (rawActivities.length === 0 || !rawActivities.some(a => a.category === 'Activities')) {
    rawActivities.push(
      {
        id: 'act-demo-1',
        title: 'River Rafting Expedition',
        category: 'Activities',
        amount: 3000,
        vendorName: 'Kundalika Rafting Club',
        locationName: 'White Water River Point'
      },
      {
        id: 'act-demo-2',
        title: 'Mountain Peak Trekking',
        category: 'Activities',
        amount: 1800,
        vendorName: 'Adventure Trails',
        locationName: 'Tiger Point Cliff'
      },
      {
        id: 'act-demo-3',
        title: 'Hotel Paradise Stay',
        category: 'Hotel',
        amount: 8500,
        vendorName: 'Hotel Paradise',
        locationName: 'Lonavala Hill Resort'
      }
    );
  }

  let totalRefundAmount = 0;
  let totalRiskProbabilitySum = 0;

  const simulatedActivities: SimulatedActivityImpact[] = rawActivities.map((act) => {
    const sensitivity = getActivitySensitivity(act.title, act.category);
    let status: SimulatedActivityImpact['status'] = 'NORMAL';
    let statusReason = 'Weather conditions optimal for activity.';
    let refundPercentage = 0;
    let riskProbability = Math.min(95, Math.round((rainfallMm / 50) * 100));

    if (sensitivity === 'CRITICAL') {
      riskProbability = Math.min(99, Math.round((rainfallMm / 35) * 100));
      if (rainfallMm >= 32) {
        status = 'CANCELLED';
        statusReason = `Rainfall (${rainfallMm}mm) exceeds safety limit (32mm). High water velocity safety hazard.`;
        refundPercentage = 75; // 75% vendor refund
      } else if (rainfallMm >= 18) {
        status = 'AT_RISK';
        statusReason = `Moderate rain (${rainfallMm}mm). Operations strictly subject to river advisory.`;
        refundPercentage = 25;
      } else if (rainfallMm >= 8) {
        status = 'DELAYED';
        statusReason = `Light rain (${rainfallMm}mm). Start time delayed by 1-2 hours.`;
        refundPercentage = 0;
      }
    } else if (sensitivity === 'HIGH') {
      riskProbability = Math.min(95, Math.round((rainfallMm / 40) * 100));
      if (rainfallMm >= 38) {
        status = 'CANCELLED';
        statusReason = `Heavy downpour (${rainfallMm}mm) causing landslide & slippery trail alert.`;
        refundPercentage = 70;
      } else if (rainfallMm >= 22) {
        status = 'AT_RISK';
        statusReason = `Rainfall (${rainfallMm}mm). Trail slippery; guide advisory in effect.`;
        refundPercentage = 20;
      } else if (rainfallMm >= 12) {
        status = 'DELAYED';
        statusReason = `Low visibility. Trek departure rescheduled.`;
        refundPercentage = 0;
      }
    } else if (sensitivity === 'MEDIUM') {
      riskProbability = Math.min(80, Math.round((rainfallMm / 45) * 100));
      if (rainfallMm >= 42) {
        status = 'CANCELLED';
        statusReason = `Outdoor sightseeing cancelled due to flooding alert.`;
        refundPercentage = 50;
      } else if (rainfallMm >= 25) {
        status = 'AT_RISK';
        statusReason = `Heavy rain causing delays. Outdoor stops reduced.`;
        refundPercentage = 15;
      }
    } else {
      // LOW sensitivity (Hotel / Indoor Dining)
      riskProbability = Math.round((rainfallMm / 50) * 20);
      statusReason = 'Indoor facility unaffected by precipitation.';
      status = 'NORMAL';
      refundPercentage = 0;
    }

    const refundAmount = Math.round((act.amount * refundPercentage) / 100);
    const simulatedCost = act.amount - refundAmount;
    totalRefundAmount += refundAmount;
    totalRiskProbabilitySum += riskProbability;

    return {
      id: act.id,
      title: act.title,
      category: act.category,
      originalCost: act.amount,
      locationName: act.locationName,
      vendorName: act.vendorName,
      sensitivity,
      status,
      statusReason,
      refundPercentage,
      refundAmount,
      simulatedCost,
      riskProbability
    };
  });

  // Calculate overall cancellation risk & confidence
  const avgRisk = Math.round(totalRiskProbabilitySum / Math.max(1, simulatedActivities.length));
  const confidencePercent = Math.min(95, Math.max(78, 92 - Math.round(rainfallMm / 5)));

  // Total original cost & simulated cost
  const totalOriginalCost = expenses.reduce((sum, e) => sum + e.amount, 0) || rawActivities.reduce((sum, a) => sum + a.amount, 0);
  const totalSimulatedCost = Math.max(0, totalOriginalCost - totalRefundAmount);

  // Recalculate Expenses for Simulation
  // Adjust expense amounts based on simulated refunds
  const simulatedExpenses: Expense[] = (expenses.length > 0 ? expenses : [
    {
      id: 'demo-exp-1',
      tripId: members[0]?.tripId || 'trip-1',
      title: 'River Rafting Expedition',
      amount: 3000,
      category: 'Activities',
      paidByMemberId: members[0]?.id || 'm-1',
      paidByMember: members[0] || { id: 'm-1', tripId: 't1', name: 'Rahul', role: 'ORGANIZER', isGuest: false },
      splitType: 'EQUAL' as const,
      date: new Date().toISOString(),
      items: [],
      participants: members.map(m => ({ memberId: m.id, shareAmount: 3000 / members.length }))
    }
  ]).map((e) => {
    const actImpact = simulatedActivities.find(a => a.id === e.id || a.title === e.title);
    const refund = actImpact ? actImpact.refundAmount : 0;
    const newAmount = Math.max(0, e.amount - refund);

    // Recalculate participant shares proportionally
    const ratio = e.amount > 0 ? newAmount / e.amount : 1;
    const newParticipants = e.participants.map(p => ({
      ...p,
      shareAmount: Math.round(p.shareAmount * ratio * 100) / 100
    }));

    return {
      ...e,
      amount: newAmount,
      participants: newParticipants
    };
  });

  // Calculate Simulated Balances & Settlements in-memory using existing optimizer
  const formattedMembers = members.map(m => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl,
    upiId: (m as any).upiId || null
  }));

  const simulatedBalances = calculateMemberBalances(formattedMembers, simulatedExpenses);
  const simulatedSettlements = optimizeSettlements(simulatedBalances);

  // Build Cascading Effect Steps
  const cancelledAct = simulatedActivities.find(a => a.status === 'CANCELLED');
  const delayedAct = simulatedActivities.find(a => a.status === 'AT_RISK' || a.status === 'DELAYED');

  const cascadingChain = [
    {
      step: 1,
      title: `Simulated Rainfall (${rainfallMm} mm)`,
      description: `Weather parameters updated to ${rainSeverityLabel}.`,
      icon: '🌧️'
    },
    {
      step: 2,
      title: cancelledAct ? `${cancelledAct.title} CANCELLED` : delayedAct ? `${delayedAct.title} AT RISK` : 'All Activities Normal',
      description: cancelledAct ? cancelledAct.statusReason : 'Safety threshold met across all activity locations.',
      icon: cancelledAct ? '🚫' : delayedAct ? '⚠️' : '✅'
    },
    {
      step: 3,
      title: totalRefundAmount > 0 ? `₹${totalRefundAmount.toLocaleString()} Vendor Refund Triggered` : 'No Refund Required',
      description: totalRefundAmount > 0 ? `Automated cancellation policy applied (${simulatedActivities.filter(a => a.refundAmount > 0).length} activities affected).` : 'Standard activity pricing retained.',
      icon: '💰'
    },
    {
      step: 4,
      title: `Simulated Trip Budget Adjusted (₹${totalSimulatedCost.toLocaleString()})`,
      description: `Net trip expenses reduced from ₹${totalOriginalCost.toLocaleString()} to ₹${totalSimulatedCost.toLocaleString()}.`,
      icon: '🧮'
    },
    {
      step: 5,
      title: 'Individual Member Balances & Ledger Recalculated',
      description: `Group debts updated across ${simulatedBalances.length} members with ${simulatedSettlements.length} optimized payments.`,
      icon: '👥'
    }
  ];

  return {
    rainfallMm,
    rainSeverityLabel,
    cancellationRiskPercent: avgRisk,
    confidencePercent,
    activities: simulatedActivities,
    totalOriginalCost,
    totalSimulatedCost,
    totalRefundAmount,
    simulatedBalances,
    simulatedSettlements,
    cascadingChain
  };
}
