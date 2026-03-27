// Komponen badge status risiko
import type { RiskStatus } from '../types';

// status risiko dan ukuran badge
interface RiskBadgeProps {
  status: RiskStatus;
  size?: 'sm' | 'md' | 'lg';
}

// Konfigurasi warna dan label untuk setiap status risiko
const STATUS_CONFIG: Record<RiskStatus, { color: string; bg: string; label: string }> = {
  Aman:    { color: '#fff', bg: '#22c55e', label: '✓ Aman' },
  Waspada: { color: '#fff', bg: '#f59e0b', label: '⚠ Waspada' },
  Bahaya:  { color: '#fff', bg: '#ef4444', label: '✕ Bahaya' },
};

// Ukuran padding dan font untuk setiap varian ukuran badge
const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { fontSize: '0.75rem', padding: '2px 8px',  borderRadius: '4px' },
  md: { fontSize: '0.9rem',  padding: '4px 12px', borderRadius: '6px' },
  lg: { fontSize: '1.1rem',  padding: '6px 18px', borderRadius: '8px' },
};

export default function RiskBadge({ status, size = 'md' }: RiskBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 700,
        letterSpacing: '0.3px',
        transition: 'background-color 200ms',
        ...SIZE_STYLES[size],
      }}
      aria-label={`Status risiko: ${status}`}
    >
      {config.label}
    </span>
  );
}

/** Mengembalikan warna hex untuk status risiko tertentu */
export function getRiskColor(status: RiskStatus): string {
  return STATUS_CONFIG[status].bg;
}
