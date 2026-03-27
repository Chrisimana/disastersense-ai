import { create } from 'zustand';
import type { AppState, LocationData, WeatherData, RiskResult, AlertEntry } from '../types';
import { getCurrentLocation } from '../services/locationService';
import { fetchWeather } from '../services/weatherService';
import { calculate } from '../services/riskEngine';
import { checkAndAlert, sendBrowserNotification } from '../services/notificationService';

interface AppActions {
  setLocation: (location: LocationData) => Promise<void>;
  setWeather: (weather: WeatherData) => void;
  setRiskResult: (riskResult: RiskResult) => void;
  addAlert: (alert: AlertEntry) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  location: getCurrentLocation(),
  weather: null,
  riskResult: null,
  alerts: [],
  isLoadingWeather: false,
  weatherError: null,

  setLocation: async (location: LocationData) => {
    set({ location, isLoadingWeather: true, weatherError: null });

    try {
      // Location_Service → Weather_Service
      const weather = await fetchWeather(location);
      set({ weather, isLoadingWeather: false });

      // Weather_Service → Risk_Engine
      const previousRiskResult = get().riskResult;
      const riskResult = calculate(weather);
      set({ riskResult });

      // Risk_Engine → Notification_Service
      const alert = checkAndAlert(
        previousRiskResult,
        riskResult,
        location.cityName,
        weather
      );

      if (alert) {
        set((state) => ({ alerts: [...state.alerts, alert] }));
        sendBrowserNotification(alert);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengambil data cuaca.';
      set({ isLoadingWeather: false, weatherError: message });
    }
  },

  setWeather: (weather: WeatherData) => {
    set({ weather });
  },

  setRiskResult: (riskResult: RiskResult) => {
    set({ riskResult });
  },

  addAlert: (alert: AlertEntry) => {
    set((state) => ({ alerts: [...state.alerts, alert] }));
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoadingWeather: isLoading });
  },

  setError: (error: string | null) => {
    set({ weatherError: error });
  },
}));
