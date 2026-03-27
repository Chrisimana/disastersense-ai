// Komponen form untuk input lokasi manual oleh pengguna
// Mendukung input nama kota (misal: "Jakarta") atau koordinat (misal: "-6.2, 106.8")
import { useState } from 'react';
import { parseManualInput } from '../services/locationService';
import { useAppStore } from '../store/appStore';

// Callback yang dipanggil setelah lokasi berhasil disimpan
interface LocationFormProps {
  onSuccess?: () => void;
}

export default function LocationForm({ onSuccess }: LocationFormProps) {
  const setLocation = useAppStore((state) => state.setLocation);

  // nilai input pengguna
  const [input, setInput] = useState('');

  // pesan error validasi
  const [error, setError] = useState<string | null>(null);

  // status loading saat submit
  const [isSubmitting, setIsSubmitting] = useState(false);   

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // reset error sebelum proses baru
    setError(null);

    const trimmed = input.trim();
    if (!trimmed) {
      setError('Masukkan nama kota atau koordinat (contoh: -6.2, 106.8).');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse input
      const location = await parseManualInput(trimmed);
      if (!location) {
        setError('Lokasi tidak ditemukan. Periksa ejaan atau coba koordinat.');
        return;
      }
      // Simpan lokasi ke store dan trigger fetch cuaca
      await setLocation(location);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses lokasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '480px' }}>
      <label
        htmlFor="location-input"
        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e3a5f' }}
      >
        Masukkan Lokasi
      </label>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          id="location-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nama kota atau koordinat (lat, lon)"
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            border: `1.5px solid ${error ? '#ef4444' : '#cbd5e1'}`, // merah jika error, abu jika normal
            borderRadius: '0.375rem',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 200ms',
          }}
          onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = '#3b82f6'; }} // biru saat fokus
          onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = '#cbd5e1'; }}  // kembali abu saat blur
          aria-describedby={error ? 'location-error' : undefined}
          aria-invalid={!!error}
        />
        {/* Tombol submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: isSubmitting ? '#94a3b8' : '#1e3a5f',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 200ms',
            whiteSpace: 'nowrap',
          }}
        >
          {isSubmitting ? 'Mencari...' : 'Cari'}
        </button>
      </div>

      {/* Pesan error validasi */}
      {error && (
        <p
          id="location-error"
          role="alert"
          style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}
        >
          {error}
        </p>
      )}

      {/* Teks bantuan format input */}
      <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
        Contoh: "Jakarta", "Bandung", atau "-6.2, 106.8"
      </p>
    </form>
  );
}
