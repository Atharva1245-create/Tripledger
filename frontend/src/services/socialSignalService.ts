export interface TravelSocialSignal {
  id: string;
  type: 'TRAFFIC_DELAY' | 'ACTIVITY_ADVISORY' | 'WEATHER_ALERT' | 'COMMUNITY_REPORT';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  source: string;
  timestamp: string;
  location: string;
  isSimulatedDemo: boolean;
}

/**
 * Fetch travel and social signals relevant to the trip destination and weather
 */
export function getDestinationSocialSignals(destinationName: string, rainfallMm: number): TravelSocialSignal[] {
  const dest = destinationName || 'Lonavala';
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (rainfallMm >= 35) {
    return [
      {
        id: 'sig-1',
        type: 'TRAFFIC_DELAY',
        title: `Expressway Slowdown near ${dest}`,
        description: `Heavy downpour (${rainfallMm}mm) causing waterlogging & 45-min traffic delays near main exit toll plaza.`,
        severity: 'HIGH',
        source: 'Public Highway Travel Portal (Real-Time)',
        timestamp: nowStr,
        location: dest,
        isSimulatedDemo: true
      },
      {
        id: 'sig-2',
        type: 'ACTIVITY_ADVISORY',
        title: 'High Water Velocity Safety Alert',
        description: 'Local adventure safety board issued temporary suspension for white-water river rafting and cliff diving.',
        severity: 'HIGH',
        source: 'Regional Disaster & Safety Signals',
        timestamp: '15 mins ago',
        location: `${dest} River Basin`,
        isSimulatedDemo: true
      },
      {
        id: 'sig-3',
        type: 'COMMUNITY_REPORT',
        title: 'Travelers Reporting Low Mountain Visibility',
        description: 'Multiple traveler posts mention fog & heavy rain reducing trail visibility under 50 meters near Tiger Point.',
        severity: 'MEDIUM',
        source: 'Public Social Travel Feeds (Aggregated)',
        timestamp: '32 mins ago',
        location: dest,
        isSimulatedDemo: true
      }
    ];
  } else if (rainfallMm >= 15) {
    return [
      {
        id: 'sig-1',
        type: 'WEATHER_ALERT',
        title: `Passing Rain Showers in ${dest}`,
        description: 'Light to moderate rain recorded across hill slopes. Roads damp; drive with fog lamps on.',
        severity: 'MEDIUM',
        source: 'Regional Weather Advisory',
        timestamp: nowStr,
        location: dest,
        isSimulatedDemo: true
      },
      {
        id: 'sig-2',
        type: 'TRAFFIC_DELAY',
        title: 'Minor Traffic Congestion at Ghat Section',
        description: 'Slower vehicle movement observed around tourist viewpoints due to rain stops.',
        severity: 'LOW',
        source: 'Public Travel Signal',
        timestamp: '20 mins ago',
        location: dest,
        isSimulatedDemo: true
      }
    ];
  }

  return [
    {
      id: 'sig-1',
      type: 'WEATHER_ALERT',
      title: `Optimal Weather Signals in ${dest}`,
      description: 'Clear skies and favorable temperatures reported across all key trip locations & highways.',
      severity: 'LOW',
      source: 'Live Destination Feed',
      timestamp: nowStr,
      location: dest,
      isSimulatedDemo: true
    },
    {
      id: 'sig-2',
      type: 'COMMUNITY_REPORT',
      title: 'Normal Traffic Movement',
      description: 'Smooth travel conditions reported by incoming weekend travelers.',
      severity: 'LOW',
      source: 'Public Travel Signal',
      timestamp: '1 hour ago',
      location: dest,
      isSimulatedDemo: true
    }
  ];
}
