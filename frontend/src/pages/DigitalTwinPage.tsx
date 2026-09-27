import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  Bot, 
  RefreshCw,
  TrendingDown,
  Info,
  Radio
} from 'lucide-react';
import { Trip, TripMember, Expense, MemberBalance } from '../types';
import { WeatherData, fetchLiveWeather } from '../services/weatherService';
import { simulateDigitalTwinScenario, DigitalTwinScenario } from '../services/digitalTwinService';
import { getDestinationSocialSignals, TravelSocialSignal } from '../services/socialSignalService';
import { GeospatialMap } from '../components/GeospatialMap';

interface DigitalTwinPageProps {
  tripData: {
    trip: Trip;
    members: TripMember[];
    expenses: Expense[];
    balances: MemberBalance[];
    totalSpent: number;
  } | null;
  onNavigate: (tab: string) => void;
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({ tripData, onNavigate }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [rainfallMm, setRainfallMm] = useState<number>(12); // Default 12mm baseline
  const [scenario, setScenario] = useState<DigitalTwinScenario | null>(null);
  const [socialSignals, setSocialSignals] = useState<TravelSocialSignal[]>([]);
  
  // Nugen Analysis state
  const [nugenAnalysis, setNugenAnalysis] = useState<{
    summary: string;
    weatherImpact: string;
    activityStatus: string;
    refundPercentage: number;
    refundAmount: number;
    financialImpact: string;
    memberImpacts: { name: string; amount: number; direction: string }[];
    recommendedAction: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const destinationName = tripData?.trip?.name ? tripData.trip.name.replace(/trip/gi, '').trim() : 'Lonavala';

  // Fetch Live Weather Baseline
  const loadWeather = async () => {
    setLoadingWeather(true);
    try {
      const data = await fetchLiveWeather(destinationName);
      setWeather(data);
      setRainfallMm(data.rainfall || 12);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [destinationName]);

  // Recalculate Scenario whenever rainfallMm or tripData changes
  useEffect(() => {
    if (!tripData) return;
    const result = simulateDigitalTwinScenario(tripData.expenses, tripData.members, rainfallMm);
    setScenario(result);
    setSocialSignals(getDestinationSocialSignals(destinationName, rainfallMm));
  }, [tripData, rainfallMm, destinationName]);

  // Fetch Nugen Intelligence Weather Impact Analysis
  const handleGenerateNugenReport = async () => {
    if (!scenario || !tripData) return;
    setLoadingAi(true);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/ai/weather-impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tripId: tripData.trip.id, simulationState: scenario })
      });

      const data = await res.json();
      if (res.ok && data.analysis) {
        setNugenAnalysis(data.analysis);
      } else {
        // Fallback Nugen Analysis
        setNugenAnalysis({
          summary: `${scenario.rainSeverityLabel} (${scenario.rainfallMm}mm) simulated over ${destinationName}.`,
          weatherImpact: scenario.rainfallMm >= 35 ? 'Severe' : scenario.rainfallMm >= 20 ? 'High' : 'Moderate',
          activityStatus: scenario.activities.find(a => a.status === 'CANCELLED')?.status || 'AT_RISK',
          refundPercentage: 75,
          refundAmount: scenario.totalRefundAmount,
          financialImpact: `Trip budget decreases by ₹${scenario.totalRefundAmount.toLocaleString()} due to vendor refunds.`,
          memberImpacts: scenario.simulatedBalances.map(b => ({
            name: b.name,
            amount: Math.abs(b.netBalance),
            direction: b.netBalance >= 0 ? 'REFUND' : 'OWED'
          })),
          recommendedAction: 'Apply vendor refund to recalculate member settlement shares in memory.'
        });
      }
    } catch (e) {
      console.error('Nugen Weather Impact request failed:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  // Debounced auto-analysis after slider stops changing (800ms)
  useEffect(() => {
    if (!scenario) return;
    const timer = setTimeout(() => {
      handleGenerateNugenReport();
    }, 800);
    return () => clearTimeout(timer);
  }, [rainfallMm]);


  if (!tripData) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading Weather Digital Twin Engine...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Simulation Banner Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-bold text-amber-900 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            🔮 <strong>SIMULATION MODE:</strong> Weather adjustments simulate future scenarios in-memory. Your actual trip database & ledger will <u>not</u> be modified.
          </span>
        </div>
        <span className="px-3 py-1 bg-amber-200/80 rounded-full text-[11px] font-extrabold uppercase shrink-0">
          Digital Twin Active
        </span>
      </div>

      {/* Main Header Card */}
      <div className="bg-[#3D1B5B] text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-purple-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-400/20">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Weather-Driven Digital Twin Layer
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {tripData.trip.name} — Weather Impact Simulator
            </h2>
            <p className="text-xs md:text-sm text-purple-200 font-medium max-w-xl">
              Simulate rainfall changes to preview activity cancellations, vendor refunds, and updated group member shares in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0">
            <div className="text-3xl">{weather?.conditionIcon || '🌧️'}</div>
            <div>
              <div className="text-xs text-purple-200 font-semibold uppercase">Live Baseline</div>
              <div className="text-xl font-black">{weather?.temp ?? 27}°C · {weather?.condition || 'Rainy'}</div>
              <div className="text-[11px] text-amber-200 font-medium">Precipitation: {weather?.rainfall ?? 12} mm</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Rainfall What-If Slider Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-lg font-black text-[#2D1344] flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-[#8E58A6]" />
              Rainfall What-If Interactive Slider
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Drag the slider to test different rainfall levels (0mm – 50mm)
            </p>
          </div>

          {/* Current Simulated Value Display */}
          <div className="bg-purple-50 px-5 py-2.5 rounded-2xl border border-purple-200 flex items-center gap-3 shrink-0">
            <span className="text-2xl">🌧️</span>
            <div>
              <span className="text-[10px] text-purple-600 font-bold uppercase block">Simulated Rainfall</span>
              <span className="text-xl font-black text-[#3D1B5B]">{rainfallMm} mm</span>
            </div>
          </div>
        </div>

        {/* The Slider Control */}
        <div className="space-y-4 pt-2">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3D1B5B] focus:outline-none"
            />
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-2">
              <span>0 mm (Clear)</span>
              <span>15 mm (Light)</span>
              <span>30 mm (Heavy)</span>
              <span>50 mm (Extreme)</span>
            </div>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-600 mr-2">Quick Scenarios:</span>

            <button
              onClick={() => setRainfallMm(5)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rainfallMm === 5 ? 'bg-[#3D1B5B] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ☀️ Normal (5mm)
            </button>

            <button
              onClick={() => setRainfallMm(18)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rainfallMm === 18 ? 'bg-[#3D1B5B] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🌦️ Moderate (18mm)
            </button>

            <button
              onClick={() => setRainfallMm(35)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rainfallMm === 35 ? 'bg-[#3D1B5B] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🌧️ Heavy Rain (35mm)
            </button>

            <button
              onClick={() => setRainfallMm(48)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rainfallMm === 48 ? 'bg-[#3D1B5B] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⛈️ Extreme (48mm)
            </button>
          </div>
        </div>
      </div>

      {/* Map & Real-World Social Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Geospatial Map */}
        <div className="lg:col-span-2">
          <GeospatialMap
            destinationName={destinationName}
            lat={weather?.lat || 18.7557}
            lon={weather?.lon || 73.4091}
            activities={scenario?.activities || []}
            rainfallMm={rainfallMm}
          />
        </div>

        {/* Right (1 col): Real-World Travel & Social Signals */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-amber-100/60 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-extrabold text-[#2D1344] flex items-center gap-2">
                📢 Real-World Social Signals
              </h4>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Public Feeds
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {socialSignals.map((sig) => (
                <div
                  key={sig.id}
                  className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                    sig.severity === 'HIGH'
                      ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                      : sig.severity === 'MEDIUM'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{sig.title}</span>
                    <span className="text-[10px] opacity-75">{sig.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{sig.description}</p>
                  <div className="text-[10px] opacity-75 font-mono pt-1">Source: {sig.source}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t text-[11px] text-slate-400 font-medium text-center">
            Aggregated travel advisory & community signals
          </div>
        </div>
      </div>

      {/* Simulated Activity Impact Grid */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-100/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#2D1344]">
              Simulated Activity & Risk Status
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Weather sensitivity rules & vendor refund thresholds at {rainfallMm}mm rain
            </p>
          </div>

          {/* Uncertainty / Risk Probability Badge */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shrink-0">
            <span className="text-xs font-bold text-slate-600">Cancellation Risk:</span>
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                (scenario?.cancellationRiskPercent || 0) > 60
                  ? 'bg-rose-100 text-rose-800'
                  : (scenario?.cancellationRiskPercent || 0) > 30
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {scenario?.cancellationRiskPercent}% Risk
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">(Confidence {scenario?.confidencePercent}%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {scenario?.activities.map((act) => {
            const isCancelled = act.status === 'CANCELLED';
            const isRisk = act.status === 'AT_RISK';
            const isDelayed = act.status === 'DELAYED';

            return (
              <div
                key={act.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                  isCancelled
                    ? 'bg-rose-50/60 border-rose-200'
                    : isRisk
                    ? 'bg-amber-50/60 border-amber-200'
                    : isDelayed
                    ? 'bg-blue-50/60 border-blue-200'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">{act.category}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isCancelled
                          ? 'bg-rose-200 text-rose-900'
                          : isRisk
                          ? 'bg-amber-200 text-amber-900'
                          : isDelayed
                          ? 'bg-blue-200 text-blue-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-[#2D1344]">{act.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{act.statusReason}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Original Cost:</span>
                    <span className="text-slate-800">₹{act.originalCost.toLocaleString()}</span>
                  </div>

                  {act.refundAmount > 0 ? (
                    <div className="flex justify-between font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl">
                      <span>Vendor Refund ({act.refundPercentage}%):</span>
                      <span>-₹{act.refundAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>Vendor Refund:</span>
                      <span>₹0 (Standard)</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-sm text-[#2D1344] pt-1">
                    <span>Simulated Net Cost:</span>
                    <span>₹{act.simulatedCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated Financial Ledger & Member Balances Comparison */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-100/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-lg font-black text-[#2D1344] uppercase tracking-wider">
              Simulated Financial Ledger Impact
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Comparing Original vs Simulated member balances after weather refunds
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
            <div className="bg-purple-100 text-[#3D1B5B] px-3.5 py-1.5 rounded-2xl">
              Original Cost: ₹{scenario?.totalOriginalCost.toLocaleString()}
            </div>
            <div className="bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-2xl">
              Simulated Cost: ₹{scenario?.totalSimulatedCost.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Member Balances Table Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simulated Balances */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              Simulated Member Balances
            </h4>
            <div className="space-y-2">
              {scenario?.simulatedBalances.map((b) => (
                <div
                  key={b.memberId}
                  className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={b.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.name)}`}
                      alt={b.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-200"
                    />
                    <span className="font-bold text-[#2D1344] text-sm">{b.name}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-xs px-2.5 py-1 rounded-xl ${
                        b.netBalance > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.netBalance < 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {b.netBalance > 0
                        ? `+₹${b.netBalance.toLocaleString()}`
                        : b.netBalance < 0
                        ? `-₹${Math.abs(b.netBalance).toLocaleString()}`
                        : `₹0`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulated Payment Plan */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              Simulated Optimized Settlements ({scenario?.simulatedSettlements.length} Payments)
            </h4>

            {scenario?.simulatedSettlements.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 font-bold text-xs">
                🎉 All member balances completely settled in this weather scenario!
              </div>
            ) : (
              <div className="space-y-2">
                {scenario?.simulatedSettlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-[#2D1344]">
                      <span>{s.payerName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8E58A6]" />
                      <span>{s.receiverName}</span>
                    </div>

                    <span className="font-black text-sm text-[#3D1B5B]">
                      ₹{s.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cascading Effects Visualization */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-100/60 space-y-6">
        <h3 className="text-lg font-black text-[#2D1344] uppercase tracking-wider">
          🔗 Digital Twin Cascading Effects Chain
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {scenario?.cascadingChain.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-100 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-[10px] font-extrabold bg-[#3D1B5B] text-white px-2 py-0.5 rounded-full">
                  Step {step.step}
                </span>
              </div>
              <h4 className="text-xs font-black text-[#2D1344] leading-snug">{step.title}</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nugen Intelligence Weather Impact Analysis & Advice */}
      <div className="bg-gradient-to-r from-[#3D1B5B] via-[#2D1344] to-[#1F0A30] text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-purple-500/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D5BD97] to-purple-400 flex items-center justify-center text-[#3D1B5B] shadow-lg font-black">
              🤖
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Nugen Intelligence</h3>
              <p className="text-xs text-purple-200">AI Financial & Weather Simulation Impact Analysis</p>
            </div>
          </div>

          <button
            onClick={handleGenerateNugenReport}
            disabled={loadingAi}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D5BD97] to-[#C8A873] hover:from-[#e2cb9f] hover:to-[#d4b47f] text-[#2D1344] font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
            {loadingAi ? 'Nugen is analyzing...' : '🤖 Analyze Weather Impact with Nugen'}
          </button>
        </div>

        {nugenAnalysis && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-purple-200 block">Weather Severity</span>
                <span className="text-sm font-black text-amber-300">🌧️ {nugenAnalysis.weatherImpact} Impact</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-purple-200 block">Activity Status</span>
                <span className="text-sm font-black text-rose-300">🚫 {nugenAnalysis.activityStatus}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-purple-200 block">Vendor Refund</span>
                <span className="text-sm font-black text-emerald-300">💰 {nugenAnalysis.refundPercentage}% (₹{nugenAnalysis.refundAmount.toLocaleString()})</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-purple-200 block">Net Budget Impact</span>
                <span className="text-sm font-black text-blue-300">📊 -₹{nugenAnalysis.refundAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
              <h4 className="font-extrabold text-amber-200 text-sm">💡 Nugen Impact Summary & Financial Explanation</h4>
              <p className="text-purple-100 font-medium leading-relaxed">{nugenAnalysis.summary}</p>
              <p className="text-emerald-300 font-bold">{nugenAnalysis.financialImpact}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
              <h4 className="font-extrabold text-amber-200 text-sm">👥 Individual Member Refund Allocations</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {nugenAnalysis.memberImpacts.map((m, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/15 rounded-xl font-bold text-emerald-200 border border-white/10">
                    {m.name}: +₹{m.amount.toLocaleString()} ({m.direction})
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-amber-200 text-xs font-semibold flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span>📌</span>
                <span><strong>Recommended Action:</strong> {nugenAnalysis.recommendedAction}</span>
              </span>
              <span className="text-[10px] opacity-75 font-mono shrink-0">Deterministic AI Analysis</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

