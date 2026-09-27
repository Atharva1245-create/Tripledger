import React from 'react';
import { CloudRain, Wind, Droplets, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { WeatherData } from '../services/weatherService';

interface WeatherImpactCardProps {
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenDigitalTwin: () => void;
}

export const WeatherImpactCard: React.FC<WeatherImpactCardProps> = ({
  weather,
  loading,
  onRefresh,
  onOpenDigitalTwin
}) => {
  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-amber-100/60 shadow-lg flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 text-[#8E58A6] animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Fetching live destination weather...</span>
      </div>
    );
  }

  const destination = weather?.destination || 'Lonavala';
  const temp = weather?.temp ?? 27;
  const condition = weather?.condition || 'Rainy';
  const icon = weather?.conditionIcon || '🌧️';
  const rainfall = weather?.rainfall ?? 12.0;
  const wind = weather?.windSpeed ?? 18;
  const humidity = weather?.humidity ?? 78;

  return (
    <div className="bg-gradient-to-br from-[#3D1B5B] via-[#2D1344] to-[#1F0A30] text-white rounded-3xl p-6 shadow-2xl shadow-[#3D1B5B]/20 border border-purple-500/20 relative overflow-hidden group">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Badges */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE DESTINATION WEATHER
          </div>
          <button
            onClick={onRefresh}
            title="Refresh Live Weather"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-purple-200 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Main Temperature & Location Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-purple-200 block">
              Trip Destination
            </span>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              📍 {destination}
            </h3>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <span className="text-4xl">{icon}</span>
            <div>
              <div className="text-3xl font-black tracking-tight text-white">{temp}°C</div>
              <div className="text-xs font-semibold text-amber-200">{condition}</div>
            </div>
          </div>
        </div>

        {/* Weather Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-purple-200 font-medium mb-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-300" />
              Precipitation
            </div>
            <div className="font-extrabold text-sm text-white">{rainfall} mm</div>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-purple-200 font-medium mb-1">
              <Wind className="w-3.5 h-3.5 text-teal-300" />
              Wind Speed
            </div>
            <div className="font-extrabold text-sm text-white">{wind} km/h</div>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-purple-200 font-medium mb-1">
              <Droplets className="w-3.5 h-3.5 text-purple-300" />
              Humidity
            </div>
            <div className="font-extrabold text-sm text-white">{humidity}%</div>
          </div>
        </div>

        {/* Call To Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
          <div className="text-[11px] text-purple-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Weather impacts trip itineraries, vendor refunds & member shares.</span>
          </div>

          <button
            onClick={onOpenDigitalTwin}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D5BD97] to-[#C8A873] hover:from-[#e2cb9f] hover:to-[#d4b47f] text-[#2D1344] font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            Open Digital Twin Simulator
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
