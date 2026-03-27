import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { detectGPS } from '../services/locationService';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const setLocation = useAppStore((state) => state.setLocation);
  const [visible, setVisible] = useState(false);

  // Trigger animasi fade-in saat komponen mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleCekRisiko = async () => {
    navigate('/dashboard');
    try {
      const location = await detectGPS();
      await setLocation(location);
    } catch {
      // GPS gagal — dashboard akan minta input manual
    }
  };

  return (
    <main className="landing">
      {/* Lingkaran dekoratif latar belakang */}
      <div className="landing__blob landing__blob--1" />
      <div className="landing__blob landing__blob--2" />
      <div className="landing__blob landing__blob--3" />

      <div className={`landing__content ${visible ? 'landing__content--visible' : ''}`}>
        {/* Badge atas */}
        <div className="landing__badge">
          <span className="landing__badge-dot" />
          Sistem Peringatan Dini Bencana
        </div>

        {/* Judul utama dengan gradient text */}
        <h1 className="landing__title">
          DisasterSense
          <span className="landing__title-accent"> AI</span>
        </h1>

        {/* Deskripsi */}
        <p className="landing__desc">
          Sistem kesiapsiagaan bencana berbasis kecerdasan buatan yang memantau
          kondisi cuaca secara real-time dan memberikan peringatan dini risiko
          bencana di lokasi Anda.
        </p>

        <p className="landing__subdesc">
          Deteksi otomatis lokasi · Analisis risiko banjir &amp; cuaca ekstrem ·
          Rekomendasi tindakan langsung di browser Anda.
        </p>

        {/* Tombol CTA */}
        <button className="landing__cta" onClick={handleCekRisiko}>
          Cek Risiko Sekarang
          <span className="landing__cta-arrow">→</span>
        </button>

        {/* Fitur singkat */}
        <div className="landing__features">
          <div className="landing__feature">
            <span className="landing__feature-icon">🌧️</span>
            <span>Cuaca Real-time</span>
          </div>
          <div className="landing__feature">
            <span className="landing__feature-icon">📍</span>
            <span>Deteksi Lokasi</span>
          </div>
          <div className="landing__feature">
            <span className="landing__feature-icon">🔔</span>
            <span>Peringatan Dini</span>
          </div>
          <div className="landing__feature">
            <span className="landing__feature-icon">📚</span>
            <span>Edukasi Bencana</span>
          </div>
        </div>
      </div>
    </main>
  );
}
