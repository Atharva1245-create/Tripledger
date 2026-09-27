import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SimulatedActivityImpact } from '../services/digitalTwinService';

interface GeospatialMapProps {
  destinationName: string;
  lat: number;
  lon: number;
  activities: SimulatedActivityImpact[];
  rainfallMm: number;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({
  destinationName,
  lat,
  lon,
  activities,
  rainfallMm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | TripLedger Weather Twin'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    } else {
      mapInstanceRef.current.setView([lat, lon], 12);
    }

    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;

    if (layerGroup) {
      layerGroup.clearLayers();

      // Helper to create custom HTML pin icon
      const createCustomIcon = (emoji: string, colorClass: string, label: string) => {
        return L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <div style="background:${colorClass}; color:white; padding:6px 10px; border-radius:14px; font-weight:800; font-size:11px; box-shadow:0 6px 16px rgba(0,0,0,0.3); border:2px solid white; display:flex; align-items:center; gap:4px; whitespace-nowrap;">
                <span>${emoji}</span>
                <span>${label}</span>
              </div>
              <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid ${colorClass}; margin-top:-1px;"></div>
            </div>
          `,
          iconSize: [120, 42],
          iconAnchor: [60, 42],
          popupAnchor: [0, -42]
        });
      };

      // 1. Add Hotel / Base Camp Pin
      const hotelIcon = createCustomIcon('🏨', '#3D1B5B', 'Hotel Base Camp');
      const hotelMarker = L.marker([lat + 0.008, lon - 0.012], { icon: hotelIcon });
      hotelMarker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <h4 style="margin:0 0 4px 0; font-weight:800; color:#3D1B5B;">🏨 Hotel XYZ Resort</h4>
          <p style="margin:0; font-size:12px; color:#64748b;">Primary Accommodation & Basecamp</p>
          <span style="display:inline-block; margin-top:6px; background:#ecfdf5; color:#047857; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;">
            ✓ Operational (Indoor Facility)
          </span>
        </div>
      `);
      layerGroup.addLayer(hotelMarker);

      // 2. Add Activity Pins with Simulated Weather Status Colors
      const offsets = [
        { latOff: 0.022, lonOff: 0.031 },
        { latOff: -0.018, lonOff: -0.025 },
        { latOff: 0.035, lonOff: -0.015 },
        { latOff: -0.025, lonOff: 0.028 }
      ];

      activities.forEach((act, idx) => {
        const offset = offsets[idx % offsets.length];
        const actLat = lat + offset.latOff;
        const actLon = lon + offset.lonOff;

        let badgeBg = '#059669'; // Green (NORMAL)
        let badgeEmoji = '🟢';
        let statusText = 'NORMAL';

        if (act.status === 'CANCELLED') {
          badgeBg = '#dc2626'; // Red
          badgeEmoji = '🔴';
          statusText = 'CANCELLED';
        } else if (act.status === 'AT_RISK') {
          badgeBg = '#d97706'; // Amber
          badgeEmoji = '🟡';
          statusText = 'AT RISK';
        } else if (act.status === 'DELAYED') {
          badgeBg = '#2563eb'; // Blue
          badgeEmoji = '🔵';
          statusText = 'DELAYED';
        }

        const actIcon = createCustomIcon(badgeEmoji, badgeBg, act.title.split(' ')[0]);
        const actMarker = L.marker([actLat, actLon], { icon: actIcon });

        actMarker.bindPopup(`
          <div style="font-family:sans-serif; min-width:180px; padding:2px;">
            <div style="font-size:10px; font-weight:700; color:${badgeBg}; text-transform:uppercase;">
              ${statusText} (Rainfall: ${rainfallMm}mm)
            </div>
            <h4 style="margin:2px 0; font-weight:800; color:#1e293b; font-size:13px;">${act.title}</h4>
            <p style="margin:0 0 6px 0; font-size:11px; color:#64748b;">Operator: ${act.vendorName}</p>
            <div style="font-size:11px; font-weight:700; color:#334155; background:#f8fafc; padding:4px 8px; border-radius:6px;">
              Original Cost: ₹${act.originalCost.toLocaleString()} <br/>
              ${act.refundAmount > 0 ? `<span style="color:#059669;">Refund: ₹${act.refundAmount.toLocaleString()} (${act.refundPercentage}%)</span>` : 'No refund required'}
            </div>
          </div>
        `);

        layerGroup.addLayer(actMarker);
      });
    }

    return () => {
      // Keep map instance alive for fast slider rerenders
    };
  }, [destinationName, lat, lon, activities, rainfallMm]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/90 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <div>
            <h4 className="text-sm font-extrabold text-[#2D1344]">Geospatial Trip Location Map</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time activity pins & weather risk visualization ({destinationName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">🟢 Normal</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">🟡 Risk</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">🔴 Cancelled</span>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-64 md:h-72 rounded-2xl shadow-inner border border-slate-200 z-10"
      />
    </div>
  );
};
