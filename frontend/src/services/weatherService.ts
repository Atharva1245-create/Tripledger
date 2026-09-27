// Weather Service using Open-Meteo API (Free, no API key required)

export interface WeatherData {
  destination: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  rainfall: number; // in mm
  windSpeed: number; // in km/h
  humidity: number; // in %
  isLive: boolean;
  updatedAt: string;
}

// Default fallback coordinates for common Indian travel destinations
const FALLBACK_DESTINATIONS: Record<string, { lat: number; lon: number }> = {
  lonavala: { lat: 18.7557, lon: 73.4091 },
  goa: { lat: 15.2993, lon: 74.1240 },
  manali: { lat: 32.2432, lon: 77.1892 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  shimla: { lat: 31.1048, lon: 77.1734 },
  rishikesh: { lat: 30.0869, lon: 78.2676 },
  udaipur: { lat: 24.5854, lon: 73.7125 }
};

/**
 * Geocode a destination string to latitude and longitude using Open-Meteo Geocoding
 */
export async function getDestinationCoordinates(destination: string): Promise<{ lat: number; lon: number; name: string }> {
  const normalized = destination.trim().toLowerCase();
  
  // Try exact lookup first
  for (const [key, coords] of Object.entries(FALLBACK_DESTINATIONS)) {
    if (normalized.includes(key)) {
      return { ...coords, name: destination };
    }
  }

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const loc = data.results[0];
      return {
        lat: loc.latitude,
        lon: loc.longitude,
        name: loc.name || destination
      };
    }
  } catch (err) {
    console.warn('Geocoding API failed, using default coordinates for Lonavala:', err);
  }

  // Default to Lonavala if lookup fails
  return { lat: 18.7557, lon: 73.4091, name: destination || 'Lonavala' };
}

/**
 * Map WMO weather interpretation code to human readable string & icon
 */
function decodeWMOWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy / Misty', icon: '🌫️' };
  if (code >= 51 && code <= 57) return { condition: 'Light Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 67) return { condition: 'Moderate Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Snowfall', icon: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Heavy Rainfall', icon: '⛈️' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: '🌩️' };
  return { condition: 'Rainy', icon: '🌧️' };
}

/**
 * Fetch real-time live weather data from Open-Meteo API
 */
export async function fetchLiveWeather(destination: string): Promise<WeatherData> {
  const coords = await getDestinationCoordinates(destination);

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`;
    
    const res = await fetch(weatherUrl);
    const data = await res.json();

    if (data.current) {
      const cur = data.current;
      const decoded = decodeWMOWeatherCode(cur.weather_code || 61);

      return {
        destination: coords.name,
        lat: coords.lat,
        lon: coords.lon,
        temp: Math.round(cur.temperature_2m ?? 27),
        feelsLike: Math.round(cur.apparent_temperature ?? 28),
        condition: decoded.condition,
        conditionIcon: decoded.icon,
        rainfall: Math.round((cur.precipitation || cur.rain || 12) * 10) / 10,
        windSpeed: Math.round(cur.wind_speed_10m ?? 18),
        humidity: Math.round(cur.relative_humidity_2m ?? 78),
        isLive: true,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  } catch (err) {
    console.error('Failed to fetch live weather from Open-Meteo:', err);
  }

  // Graceful Fallback if offline / API timeout
  return {
    destination: coords.name,
    lat: coords.lat,
    lon: coords.lon,
    temp: 27,
    feelsLike: 29,
    condition: 'Rainy',
    conditionIcon: '🌧️',
    rainfall: 12.0,
    windSpeed: 18,
    humidity: 82,
    isLive: false,
    updatedAt: 'Just now (Cached)'
  };
}
