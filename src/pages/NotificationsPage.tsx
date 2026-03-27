import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getAlertHistory, requestBrowserPermission, clearHistory } from '../services/notificationService';
import type { AlertEntry, RiskStatus } from '../types';

const STATUS_COLOR: Record<RiskStatus, string> = {
  Aman: '#22c55e',
  Waspada: '#f59e0b',
  Bahaya: '#ef4444',
};

const STATUS_BG: Record<RiskStatus, string> = {
  Aman: '#f0fdf4',
  Waspada: '#fffbeb',
  Bahaya: '#fef2f2',
};

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusChip({ status }: { status: RiskStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: STATUS_COLOR[status],
        background: STATUS_BG[status],
        border: `1px solid ${STATUS_COLOR[status]}33`,
      }}
    >
      {status}
    </span>
  );
}

function AlertCard({ alert }: { alert: AlertEntry }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${STATUS_COLOR[alert.newStatus]}`,
        borderRadius: '0.5rem',
        padding: '1rem 1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            🕐 {formatTimestamp(alert.timestamp)}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#1e3a5f' }}>
            📍 {alert.location}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <StatusChip status={alert.previousStatus} />
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>→</span>
          <StatusChip status={alert.newStatus} />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const storeAlerts = useAppStore((s) => s.alerts);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [requesting, setRequesting] = useState(false);

  // Sync alerts from service (localStorage) + store on mount and when store changes
  useEffect(() => {
    setAlerts(getAlertHistory());
  }, [storeAlerts]);

  async function handleRequestPermission() {
    setRequesting(true);
    const result = await requestBrowserPermission();
    setPermission(result);
    setRequesting(false);
  }

  function handleClearHistory() {
    clearHistory();
    setAlerts([]);
  }

  return (
    <main style={{ padding: '1.5rem', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f', margin: 0 }}>
            Notifikasi
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#475569', fontSize: '0.9rem' }}>
            Riwayat peringatan risiko bencana
          </p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={handleClearHistory}
            style={{
              padding: '0.4rem 0.875rem',
              border: '1.5px solid #e2e8f0',
              borderRadius: '0.375rem',
              background: 'transparent',
              color: '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Hapus Riwayat
          </button>
        )}
      </div>

      {/* Browser notification permission banner */}
      {permission !== 'granted' && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.875rem 1rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#1d4ed8', fontSize: '0.9rem' }}>
              🔔 Aktifkan Notifikasi Browser
            </p>
            <p style={{ margin: '0.2rem 0 0', color: '#3b82f6', fontSize: '0.8rem' }}>
              {permission === 'denied'
                ? 'Izin notifikasi ditolak. Aktifkan melalui pengaturan browser Anda.'
                : 'Izinkan notifikasi untuk mendapatkan peringatan langsung di browser.'}
            </p>
          </div>
          {permission !== 'denied' && (
            <button
              onClick={handleRequestPermission}
              disabled={requesting}
              style={{
                padding: '0.5rem 1rem',
                background: '#1d4ed8',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                cursor: requesting ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                opacity: requesting ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {requesting ? 'Meminta...' : 'Izinkan Notifikasi'}
            </button>
          )}
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔕</div>
          <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Belum ada peringatan</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Peringatan akan muncul di sini saat status risiko meningkat.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </main>
  );
}
