// Komponen navigasi utama 
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

// Daftar tautan navigasi beserta path dan labelnya
const NAV_LINKS = [
  { to: '/dashboard',     label: 'Dashboard' },
  { to: '/map',           label: 'Peta Risiko' },
  { to: '/notifications', label: 'Notifikasi' },
  { to: '/education',     label: 'Edukasi' },
  { to: '/about',         label: 'Tentang' },
];

export default function Navbar() {
  // State untuk mengontrol buka/tutup menu mobile
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup menu mobile saat tautan diklik
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand" onClick={closeMenu}>
        DisasterSense AI
      </NavLink>

      {/* Menu desktop */}
      <ul className="navbar__desktop-menu">
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Tombol hamburger */}
      <button
        className="navbar__hamburger"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
      >
        <span className="navbar__hamburger-line" />
        <span className="navbar__hamburger-line" />
        <span className="navbar__hamburger-line" />
      </button>

      {/* Menu mobile */}
      <ul
        id="mobile-nav"
        className={`navbar__mobile-menu${menuOpen ? ' navbar__mobile-menu--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `navbar__mobile-link${isActive ? ' navbar__link--active' : ''}`
              }
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
