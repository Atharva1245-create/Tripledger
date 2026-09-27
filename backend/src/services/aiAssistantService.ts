import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '../config/aiConfig';

export interface AIResponse {
  answer: string;
  references: { title: string; amount: number; category?: string }[];
  spendingSummary?: { category: string; total: number }[];
}

export interface DigitalTwinContext {
  rainfallMm: number;
  rainSeverityLabel: string;
  cancellationRiskPercent: number;
  confidencePercent: number;
  totalOriginalCost: number;
  totalSimulatedCost: number;
  totalRefundAmount: number;
  activities: {
    title: string;
    category: string;
    status: string;
    statusReason: string;
    refundAmount: number;
    refundPercentage: number;
    simulatedCost: number;
  }[];
  simulatedBalances: { name: string; netBalance: number }[];
  simulatedSettlements: { payerName: string; receiverName: string; amount: number }[];
}

export interface NugenWeatherImpactResult {
  summary: string;
  weatherImpact: 'Low' | 'Moderate' | 'High' | 'Severe';
  activityStatus: string;
  refundPercentage: number;
  refundAmount: number;
  financialImpact: string;
  memberImpacts: { name: string; amount: number; direction: string }[];
  recommendedAction: string;
}

export interface ContextData {
  tripName: string;
  totalSpent: number;
  members: { id: string; name: string; balance: number; paid: number; owed: number }[];
  currentMember?: { id: string; name: string; balance: number; owed: number };
  expenses: {
    title: string;
    amount: number;
    category: string;
    paidByName: string;
    date: string;
    participants: { name: string; shareAmount: number }[];
  }[];
  settlements: { payerName: string; receiverName: string; amount: number }[];
  digitalTwinScenario?: DigitalTwinContext;
}

export async function askTripAssistant(
  question: string,
  context: ContextData
): Promise<AIResponse> {
  const apiKey = AI_CONFIG.apiKey;

  console.log(`[NUGEN_AI] Request started for trip "${context.tripName}"`);
  console.log(`[NUGEN_AI] Provider: GoogleGenerativeAI | Model: "${AI_CONFIG.chatModel}"`);

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({
        model: AI_CONFIG.chatModel,
        generationConfig: { responseMimeType: "application/json" }
      });

      let digitalTwinSection = '';
      if (context.digitalTwinScenario) {
        const dt = context.digitalTwinScenario;
        digitalTwinSection = `
Current Active Weather Digital Twin Simulation Context:
- Simulated Rainfall: ${dt.rainfallMm}mm (${dt.rainSeverityLabel})
- Cancellation Risk Probability: ${dt.cancellationRiskPercent}% (Confidence: ${dt.confidencePercent}%)
- Total Original Cost: ₹${dt.totalOriginalCost}, Total Refund: ₹${dt.totalRefundAmount}, Simulated Net Cost: ₹${dt.totalSimulatedCost}
- Activity Statuses:
${dt.activities.map(a => `  * ${a.title}: ${a.status} (Refund: ${a.refundPercentage}%, ₹${a.refundAmount}) - Reason: ${a.statusReason}`).join('\n')}
- Simulated Member Balances:
${dt.simulatedBalances.map(b => `  * ${b.name}: Net ${b.netBalance >= 0 ? '+' : ''}₹${b.netBalance}`).join('\n')}
- Simulated Optimized Settlements:
${dt.simulatedSettlements.map(s => `  * ${s.payerName} -> ${s.receiverName}: ₹${s.amount}`).join('\n')}
`;
      }

      const prompt = `
You are Nugen Intelligence / TripLedger AI, a financial and weather impact assistant for the trip "${context.tripName}".
Answer the user's question accurately using ONLY the authorized ledger and digital twin context provided below.
Do NOT invent financial values or claim actual database mutations occurred. Clearly state when answering based on a simulation vs real recorded data.

Authorized Trip Context:
- Trip Name: ${context.tripName}
- Total Trip Spending: ₹${context.totalSpent}
- Members & Balances:
${context.members.map(m => `  * ${m.name}: Paid ₹${m.paid}, Owes ₹${m.owed}, Net Balance ${m.balance >= 0 ? '+' : ''}₹${m.balance}`).join('\n')}
- Current User: ${context.currentMember ? `${context.currentMember.name} (Balance: ₹${context.currentMember.balance})` : 'Anonymous'}

Expenses List:
${context.expenses.map(e => `  * [${e.category}] ${e.title}: ₹${e.amount} (Paid by ${e.paidByName} on ${e.date.substring(0, 10)})`).join('\n')}

Optimized Settlements Needed:
${context.settlements.map(s => `  * ${s.payerName} -> ${s.receiverName}: ₹${s.amount}`).join('\n')}
${digitalTwinSection}

User Question: "${question}"

Provide a concise, helpful answer. Format references to relevant expenses or weather simulation impacts if any.
Return ONLY JSON matching:
{
  "answer": "Answer text here...",
  "references": [
    { "title": "Expense or Activity Title", "amount": 1000, "category": "Food/Weather" }
  ]
}
`;

      const response = await model.generateContent(prompt);
      const text = response.response.text() || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed: AIResponse = JSON.parse(cleanJson);
      console.log(`[NUGEN_AI] LLM Response successfully generated.`);
      return parsed;
    } catch (err: any) {
      console.warn(`[NUGEN_AI] LLM request failed (${err?.message || err}). Falling back to deterministic ledger engine.`);
    }
  }

  // Deterministic Ledger Intelligence Engine for exact accuracy
  const q = question.toLowerCase();
  let answer = "";
  const references: { title: string; amount: number; category?: string }[] = [];
  const dt = context.digitalTwinScenario;

  // Weather / Digital Twin Simulation Queries
  if (dt && (q.includes("rain") || q.includes("weather") || q.includes("cancel") || q.includes("refund") || q.includes("rafting") || q.includes("activity"))) {
    const cancelledAct = dt.activities.find((a: any) => a.status === 'CANCELLED');
    const atRiskAct = dt.activities.find((a: any) => a.status === 'AT_RISK' || a.status === 'DELAYED');

    if (q.includes("refund") || q.includes("amount")) {
      answer = dt.totalRefundAmount > 0
        ? `At ${dt.rainfallMm}mm (${dt.rainSeverityLabel}), a total vendor refund of ₹${dt.totalRefundAmount.toLocaleString()} is calculated, reducing net trip cost from ₹${dt.totalOriginalCost.toLocaleString()} to ₹${dt.totalSimulatedCost.toLocaleString()}.`
        : `At ${dt.rainfallMm}mm rainfall, no vendor refunds are required as all activities operate normally.`;
      if (dt.totalRefundAmount > 0 && cancelledAct) {
        references.push({ title: `${cancelledAct.title} Refund`, amount: cancelledAct.refundAmount, category: 'Weather Impact' });
      }
    } else if (q.includes("cancel") || q.includes("rafting")) {
      if (cancelledAct) {
        answer = `At ${dt.rainfallMm}mm heavy rain, ${cancelledAct.title} is CANCELLED due to safety limits (${dt.cancellationRiskPercent}% risk). A ${cancelledAct.refundPercentage}% vendor refund (₹${cancelledAct.refundAmount.toLocaleString()}) is calculated.`;
        references.push({ title: `${cancelledAct.title} Cancelled`, amount: cancelledAct.refundAmount, category: 'Weather Impact' });
      } else if (atRiskAct) {
        answer = `At ${dt.rainfallMm}mm rain, ${atRiskAct.title} is AT RISK (${dt.cancellationRiskPercent}% risk probability).`;
        references.push({ title: atRiskAct.title, amount: atRiskAct.refundAmount, category: 'Weather Risk' });
      } else {
        answer = `At ${dt.rainfallMm}mm rainfall, all planned trip activities remain NORMAL and active.`;
      }
    } else {
      answer = `Weather Simulation Context: ${dt.rainfallMm}mm (${dt.rainSeverityLabel}) with ${dt.cancellationRiskPercent}% cancellation risk. Total refund calculated: ₹${dt.totalRefundAmount.toLocaleString()}.`;
      if (cancelledAct) {
        references.push({ title: cancelledAct.title, amount: cancelledAct.refundAmount, category: 'Weather Impact' });
      }
    }
  } else if (q.includes("food") || q.includes("restaurant") || q.includes("eat")) {
    const foodExpenses = context.expenses.filter(
      (e) => e.category.toLowerCase() === "food" || e.title.toLowerCase().includes("restaurant") || e.title.toLowerCase().includes("cafe") || e.title.toLowerCase().includes("food")
    );
    const totalFood = foodExpenses.reduce((sum, e) => sum + e.amount, 0);
    answer = `You spent ₹${totalFood.toLocaleString()} on food across ${foodExpenses.length} expenses.`;
    foodExpenses.forEach((e) => references.push({ title: e.title, amount: e.amount, category: e.category }));
  } else if (q.includes("owe") || q.includes("my balance") || q.includes("how much do i owe")) {
    if (context.currentMember) {
      const bal = context.currentMember.balance;
      if (bal < 0) {
        answer = `You currently owe ₹${Math.abs(bal).toLocaleString()} in overall trip settlements.`;
      } else if (bal > 0) {
        answer = `You are owed ₹${bal.toLocaleString()} in total by other trip members!`;
      } else {
        answer = "Your trip balance is completely settled (₹0)!";
      }
    } else {
      answer = `Trip total spent is ₹${context.totalSpent.toLocaleString()}.`;
    }
  } else if (q.includes("paid the most") || q.includes("highest spender")) {
    const topSpender = [...context.members].sort((a, b) => b.paid - a.paid)[0];
    if (topSpender) {
      answer = `${topSpender.name} paid the most, spending a total of ₹${topSpender.paid.toLocaleString()} for the group.`;
    }
  } else if (q.includes("most expensive") || q.includes("biggest expense")) {
    const maxExp = [...context.expenses].sort((a, b) => b.amount - a.amount)[0];
    if (maxExp) {
      answer = `The most expensive item was "${maxExp.title}" costing ₹${maxExp.amount.toLocaleString()} (Paid by ${maxExp.paidByName}).`;
      references.push({ title: maxExp.title, amount: maxExp.amount, category: maxExp.category });
    }
  } else if (q.includes("hotel") || q.includes("stay") || q.includes("accommodation")) {
    const hotelExp = context.expenses.filter((e) => e.category.toLowerCase() === "hotel" || e.title.toLowerCase().includes("hotel"));
    const totalHotel = hotelExp.reduce((sum, e) => sum + e.amount, 0);
    answer = `Hotel and accommodation expenses total ₹${totalHotel.toLocaleString()} across ${hotelExp.length} transactions.`;
    hotelExp.forEach((e) => references.push({ title: e.title, amount: e.amount, category: e.category }));
  } else if (q.includes("who should i pay") || q.includes("settle")) {
    if (context.settlements.length > 0) {
      answer = `Optimized settlement plan: ${context.settlements.map((s) => `${s.payerName} pays ${s.receiverName} ₹${s.amount.toLocaleString()}`).join(", ")}.`;
    } else {
      answer = "No pending settlements required!";
    }
  } else if (q.includes("total") || q.includes("overall") || q.includes("budget")) {
    answer = `The overall spending for ${context.tripName} is ₹${context.totalSpent.toLocaleString()} across ${context.expenses.length} expenses.`;
  } else {
    answer = `For ${context.tripName}, total spending is ₹${context.totalSpent.toLocaleString()} with ${context.expenses.length} recorded expenses.`;
    context.expenses.slice(0, 3).forEach((e) => references.push({ title: e.title, amount: e.amount, category: e.category }));
  }

  return { answer, references };
}

/**
 * Nugen Intelligence Weather Impact Analysis Engine
 * Analyzes deterministic Digital Twin simulation results without inventing financial numbers
 */
export async function analyzeWeatherImpactWithNugen(
  tripName: string,
  simulationState: DigitalTwinContext
): Promise<NugenWeatherImpactResult> {
  const apiKey = AI_CONFIG.apiKey;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.weatherModel });
      const prompt = `
You are Nugen Intelligence, the automated financial and weather simulation analysis layer for GroupTrip Ledger.
Analyze the following DETERMINISTIC Digital Twin simulation state for trip "${tripName}":

Simulation Context:
- Simulated Rainfall: ${simulationState.rainfallMm}mm (${simulationState.rainSeverityLabel})
- Risk Probability: ${simulationState.cancellationRiskPercent}% (Confidence: ${simulationState.confidencePercent}%)
- Original Trip Cost: ₹${simulationState.totalOriginalCost}
- Total Vendor Refund: ₹${simulationState.totalRefundAmount}
- Simulated Net Cost: ₹${simulationState.totalSimulatedCost}
- Activities Status:
${simulationState.activities.map(a => `  * ${a.title}: ${a.status} (Refund: ${a.refundPercentage}%, ₹${a.refundAmount})`).join('\n')}
- Simulated Member Balances:
${simulationState.simulatedBalances.map(b => `  * ${b.name}: Net ${b.netBalance >= 0 ? '+' : ''}₹${b.netBalance}`).join('\n')}

System Directive:
Analyze the impact and return ONLY JSON matching this EXACT schema:
{
  "summary": "Brief summary of weather impact on trip",
  "weatherImpact": "Low|Moderate|High|Severe",
  "activityStatus": "CANCELLED|AT_RISK|DELAYED|NORMAL",
  "refundPercentage": 75,
  "refundAmount": 2250,
  "financialImpact": "Explanation of trip cost change",
  "memberImpacts": [
    { "name": "Rahul", "amount": 750, "direction": "REFUND" }
  ],
  "recommendedAction": "Recommended action for the trip group"
}
Do NOT invent financial numbers outside the provided simulation state.
`;

      const response = await model.generateContent(prompt);
      const text = response.response.text() || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed: NugenWeatherImpactResult = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.warn("Nugen Gemini API call failed, falling back to deterministic explanation builder:", err);
    }
  }

  // Deterministic Nugen Fallback Engine
  const cancelled = simulationState.activities.find(a => a.status === 'CANCELLED');
  const delayed = simulationState.activities.find(a => a.status === 'AT_RISK' || a.status === 'DELAYED');

  const mainAct = cancelled || delayed || simulationState.activities[0];
  const impactLabel = simulationState.rainfallMm >= 35 ? 'Severe' : simulationState.rainfallMm >= 20 ? 'High' : simulationState.rainfallMm >= 10 ? 'Moderate' : 'Low';

  const memberImpacts = simulationState.simulatedBalances.map(b => ({
    name: b.name,
    amount: Math.abs(b.netBalance),
    direction: b.netBalance >= 0 ? 'REFUND' : 'OWED'
  }));

  return {
    summary: cancelled
      ? `${simulationState.rainSeverityLabel} (${simulationState.rainfallMm}mm) caused ${cancelled.title} to be cancelled.`
      : delayed
      ? `${simulationState.rainSeverityLabel} (${simulationState.rainfallMm}mm) placed ${delayed.title} at risk.`
      : `Weather conditions (${simulationState.rainfallMm}mm) remain normal across all activities.`,
    weatherImpact: impactLabel,
    activityStatus: mainAct ? mainAct.status : 'NORMAL',
    refundPercentage: mainAct ? mainAct.refundPercentage : 0,
    refundAmount: simulationState.totalRefundAmount,
    financialImpact: simulationState.totalRefundAmount > 0
      ? `Trip cost reduced by ₹${simulationState.totalRefundAmount.toLocaleString()} (from ₹${simulationState.totalOriginalCost.toLocaleString()} to ₹${simulationState.totalSimulatedCost.toLocaleString()}).`
      : `Trip budget unchanged at ₹${simulationState.totalOriginalCost.toLocaleString()}.`,
    memberImpacts,
    recommendedAction: simulationState.totalRefundAmount > 0
      ? 'Apply vendor refund to recalculate member settlement shares in memory.'
      : 'Proceed with planned itinerary & monitor live weather updates.'
  };
}

