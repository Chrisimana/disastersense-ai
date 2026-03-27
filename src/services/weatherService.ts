import { LocationData, WeatherData } from '../types';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const FETCH_TIMEOUT_MS = 5000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

let lastWeatherData: WeatherData | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

function findClosestHourIndex(times: string[]): number {
  const now = Date.now();
  let closestIdx = 0;
  let minDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }

  return closestIdx;
}

export async function fetchWeather(location: LocationData): Promise<WeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    hourly: 'precipitation,windspeed_10m,relativehumidity_2m,temperature_2m,weathercode',
    forecast_days: '1',
    timezone: 'Asia/Jakarta',
  });

  try {
    const res = await fetch(`${OPEN_METEO_URL}?${params}`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo API error: ${res.status}`);
    }

    const json = await res.json();
    const hourly = json.hourly;
    const idx = findClosestHourIndex(hourly.time as string[]);

    const weather: WeatherData = {
      rainfall: hourly.precipitation[idx] as number,
      windSpeed: hourly.windspeed_10m[idx] as number,
      humidity: hourly.relativehumidity_2m[idx] as number,
      temperature: hourly.temperature_2m[idx] as number,
      weatherCode: hourly.weathercode[idx] as number,
      timestamp: Date.now(),
      isStale: false,
    };

    lastWeatherData = weather;
    return weather;
  } catch (err) {
    // Return last known data as stale fallback
    if (lastWeatherData) {
      return { ...lastWeatherData, isStale: true };
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getLastWeatherData(): WeatherData | null {
  if (!lastWeatherData) return null;
  const age = Date.now() - lastWeatherData.timestamp;
  return age > STALE_THRESHOLD_MS
    ? { ...lastWeatherData, isStale: true }
    : lastWeatherData;
}

export function startPolling(location: LocationData, intervalMs: number): void {
  stopPolling();
  pollingTimer = setInterval(() => {
    fetchWeather(location).catch(() => {
      // Errors are handled inside fetchWeather (stale fallback)
    });
  }, intervalMs);
}

export function stopPolling(): void {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}
