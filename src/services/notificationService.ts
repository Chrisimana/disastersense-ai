import type { RiskResult, RiskStatus, AlertEntry, WeatherData } from '../types';

const STORAGE_KEY = 'disastersense_alerts';

const STATUS_ORDER: Record<RiskStatus, number> = {
  Aman: 0,
  Waspada: 1,
  Bahaya: 2,
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadAlerts(): AlertEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AlertEntry[];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: AlertEntry[]): void {
  const json = JSON.stringify(alerts);
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    // FIFO: remove oldest entry and retry
    if (alerts.length > 0) {
      const sorted = [...alerts].sort((a, b) => a.timestamp - b.timestamp);
      sorted.shift(); // remove oldest
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      } catch {
        // If still failing, give up silently
      }
    }
  }
}

export function checkAndAlert(
  previous: RiskResult | null,
  current: RiskResult,
  location = 'Lokasi tidak diketahui',
  weather?: WeatherData
): AlertEntry | null {
  const prevOrder = previous ? STATUS_ORDER[previous.status] : STATUS_ORDER['Aman'];
  const currOrder = STATUS_ORDER[current.status];

  // Only alert if status escalates (increases)
  if (currOrder <= prevOrder) return null;

  const alert: AlertEntry = {
    id: generateId(),
    timestamp: Date.now(),
    location,
    previousStatus: previous ? previous.status : 'Aman',
    newStatus: current.status,
    weatherSnapshot: weather ?? ({} as WeatherData),
  };

  const existing = loadAlerts();
  existing.push(alert);
  saveAlerts(existing);

  return alert;
}

export async function requestBrowserPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

export function sendBrowserNotification(alert: AlertEntry): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = `⚠️ Peringatan Risiko: ${alert.newStatus}`;
  const body = `Lokasi: ${alert.location}\nStatus berubah dari ${alert.previousStatus} ke ${alert.newStatus}`;

  new Notification(title, { body });
}

export function getAlertHistory(): AlertEntry[] {
  const alerts = loadAlerts();
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
