import { LocationData } from '../types';

const STORAGE_KEY = 'disastersense_last_location';
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function getCurrentLocation(): LocationData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocationData;
  } catch {
    return null;
  }
}

function saveLocation(location: LocationData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export async function detectGPS(): Promise<LocationData> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation tidak didukung oleh browser ini.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

  const lat = parseFloat(position.coords.latitude.toFixed(6));
  const lon = parseFloat(position.coords.longitude.toFixed(6));

  let cityName = `${lat}, ${lon}`;
  try {
    const res = await fetch(
      `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'id,en' } }
    );
    if (res.ok) {
      const data = await res.json();
      cityName =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.display_name ||
        cityName;
    }
  } catch {
    // Reverse geocoding failed — fall back to coordinate string
  }

  const location: LocationData = { lat, lon, cityName, source: 'gps' };
  saveLocation(location);
  return location;
}

export async function parseManualInput(input: string): Promise<LocationData | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse as "lat,lon"
  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);

    if (!validateCoordinates(lat, lon)) {
      throw new Error(
        `Koordinat tidak valid: lintang harus antara -90 dan 90, bujur antara -180 dan 180.`
      );
    }

    // Reverse geocode to get city name
    let cityName = `${lat}, ${lon}`;
    try {
      const res = await fetch(
        `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'id,en' } }
      );
      if (res.ok) {
        const data = await res.json();
        cityName =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          data.display_name ||
          cityName;
      }
    } catch {
      // Fall back to coordinate string
    }

    const location: LocationData = { lat, lon, cityName, source: 'manual' };
    saveLocation(location);
    return location;
  }

  // Treat as city name
  try {
    const url = `${NOMINATIM_SEARCH}?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'id,en' } });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(
        `Nama kota "${trimmed}" tidak ditemukan. Periksa ejaan atau coba masukkan koordinat.`
      );
    }

    const { lat: latStr, lon: lonStr, display_name } = results[0];
    const lat = parseFloat(parseFloat(latStr).toFixed(6));
    const lon = parseFloat(parseFloat(lonStr).toFixed(6));

    const location: LocationData = {
      lat,
      lon,
      cityName: display_name || trimmed,
      source: 'manual',
    };
    saveLocation(location);
    return location;
  } catch (err) {
    if (err instanceof Error && err.message.includes('tidak ditemukan')) {
      throw err;
    }
    throw new Error(
      `Gagal mencari lokasi "${trimmed}". Periksa koneksi internet Anda.`
    );
  }
}
