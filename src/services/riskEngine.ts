import type { WeatherData, RiskResult, RiskStatus } from '../types';

const RECOMMENDATIONS: Record<RiskStatus, string[]> = {
  Aman: [
    'Pantau prakiraan cuaca secara berkala',
  ],
  Waspada: [
    'Siapkan tas darurat berisi dokumen penting',
    'Periksa saluran air di sekitar rumah',
    'Pantau informasi dari BMKG dan pemerintah setempat',
  ],
  Bahaya: [
    'Segera evakuasi ke tempat yang lebih tinggi',
    'Hubungi nomor darurat: 119 (BNPB) atau 112',
    'Jauhi saluran air, sungai, dan daerah rawan longsor',
    'Matikan aliran listrik jika air mulai masuk rumah',
    'Ikuti instruksi petugas evakuasi setempat',
  ],
};

let lastResult: RiskResult | null = null;

export function calculate(weather: WeatherData | null | undefined): RiskResult {
  if (
    weather == null ||
    weather.rainfall == null ||
    weather.windSpeed == null
  ) {
    if (lastResult !== null) {
      return { ...lastResult, isStale: true };
    }
    const defaultResult: RiskResult = {
      status: 'Aman',
      triggeringFactors: [],
      recommendations: RECOMMENDATIONS['Aman'],
      calculatedAt: Date.now(),
      isStale: true,
    };
    return defaultResult;
  }

  const { rainfall, windSpeed } = weather;
  const triggeringFactors: string[] = [];
  let status: RiskStatus;

  const isBahayaRain = rainfall > 50;
  const isBahayaWind = windSpeed > 70;
  const isWaspadaRain = rainfall >= 10 && rainfall <= 50;
  const isWaspadaWind = windSpeed >= 40 && windSpeed <= 70;

  if (isBahayaRain || isBahayaWind) {
    status = 'Bahaya';
    if (isBahayaRain) {
      triggeringFactors.push(`Curah hujan: ${rainfall} mm/jam`);
    }
    if (isBahayaWind) {
      triggeringFactors.push(`Kecepatan angin: ${windSpeed} km/jam`);
    }
  } else if (isWaspadaRain || isWaspadaWind) {
    status = 'Waspada';
    if (isWaspadaRain) {
      triggeringFactors.push(`Curah hujan: ${rainfall} mm/jam`);
    }
    if (isWaspadaWind) {
      triggeringFactors.push(`Kecepatan angin: ${windSpeed} km/jam`);
    }
  } else {
    status = 'Aman';
  }

  const result: RiskResult = {
    status,
    triggeringFactors,
    recommendations: RECOMMENDATIONS[status],
    calculatedAt: Date.now(),
    isStale: false,
  };

  lastResult = result;
  return result;
}

export function getRecommendations(status: RiskStatus): string[] {
  return RECOMMENDATIONS[status];
}

export function getLastResult(): RiskResult | null {
  return lastResult;
}
