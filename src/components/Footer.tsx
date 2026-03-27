import { NavLink } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  // Ambil tahun saat ini untuk copyright dinamis
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__brand-name">DisasterSense AI</span>
          <p className="footer__tagline">
            Sistem peringatan dini bencana alam berbasis Artificial Intelligence (AI) untuk Indonesia.
          </p>
        </div>

        {/* Kolom navigasi */}
        <nav className="footer__nav" aria-label="Footer navigation">
          <h3 className="footer__nav-title">Navigasi</h3>
          <ul className="footer__nav-list">
            <li><NavLink to="/dashboard" className="footer__link">Dashboard</NavLink></li>
            <li><NavLink to="/map" className="footer__link">Peta Risiko</NavLink></li>
            <li><NavLink to="/notifications" className="footer__link">Notifikasi</NavLink></li>
            <li><NavLink to="/education" className="footer__link">Edukasi</NavLink></li>
            <li><NavLink to="/about" className="footer__link">Tentang</NavLink></li>
          </ul>
        </nav>

        {/* Kolom nomor darurat */}
        <div className="footer__emergency">
          <h3 className="footer__nav-title">Nomor Darurat</h3>
          <ul className="footer__emergency-list">
            <li><span className="footer__emergency-label">BNPB</span><span>117</span></li>
            <li><span className="footer__emergency-label">Basarnas</span><span>115</span></li>
            <li><span className="footer__emergency-label">PMI</span><span>021-7992325</span></li>
            <li><span className="footer__emergency-label">PLN</span><span>123</span></li>
          </ul>
        </div>
      </div>

      {/* copyright */}
      <div className="footer__bottom">
        <p>© {year} DisasterSense AI. Dibuat untuk keselamatan masyarakat Indonesia.</p>
      </div>
    </footer>
  );
}
