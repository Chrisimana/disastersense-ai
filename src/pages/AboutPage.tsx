export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        color: '#1e293b',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 800,
          marginBottom: '0.5rem',
          color: '#1e3a5f',
        }}
      >
        Tentang DisasterSense AI
      </h1>

      <p
        style={{
          fontSize: '1rem',
          color: '#475569',
          marginBottom: '2rem',
          lineHeight: 1.7,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '1.5rem',
        }}
      >
        DisasterSense AI adalah aplikasi web kesiapsiagaan bencana yang
        membantu masyarakat Indonesia memantau risiko bencana alam secara
        real-time. Sistem menganalisis data cuaca terkini dan memberikan
        peringatan dini berbasis lokasi pengguna yang sepenuhnya berjalan di
        browser tanpa biaya layanan berbayar.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1e3a5f',
            marginBottom: '1rem',
          }}
        >
          Tujuan Proyek
        </h2>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {[
            'Memberikan informasi risiko bencana yang akurat dan tepat waktu kepada masyarakat.',
            'Meningkatkan kesiapsiagaan individu melalui peringatan dini otomatis berbasis lokasi.',
            'Menyediakan panduan edukasi bencana yang mudah dipahami dalam Bahasa Indonesia.',
            'Membangun solusi yang dapat diakses oleh semua kalangan tanpa biaya tambahan.',
          ].map((item) => (
            <li
              key={item}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.95rem',
                color: '#334155',
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  backgroundColor: '#1e3a5f',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginTop: '0.15rem',
                }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1e3a5f',
            marginBottom: '1rem',
          }}
        >
          Teknologi yang Digunakan
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {TECHNOLOGIES.map((tech) => (
            <div
              key={tech.name}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1rem 1.25rem',
              }}
            >
              <div
                style={{
                  fontSize: '1.5rem',
                  marginBottom: '0.4rem',
                }}
              >
                {tech.icon}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#1e3a5f',
                  marginBottom: '0.25rem',
                }}
              >
                {tech.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                {tech.description}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const TECHNOLOGIES = [
  {
    icon: '⚛️',
    name: 'React',
    description: 'Library UI untuk membangun antarmuka yang reaktif dan komponen yang dapat digunakan ulang.',
  },
  {
    icon: '🗺️',
    name: 'Leaflet.js',
    description: 'Library peta interaktif open-source yang ringan dan mudah dikustomisasi.',
  },
  {
    icon: '🌍',
    name: 'OpenStreetMap',
    description: 'Penyedia tile peta gratis berbasis kontribusi komunitas global.',
  },
  {
    icon: '🌤️',
    name: 'Open-Meteo API',
    description: 'API cuaca open-source yang menyediakan data prakiraan tanpa memerlukan API key.',
  },
  {
    icon: '📍',
    name: 'Geolocation API',
    description: 'API browser bawaan untuk mendeteksi koordinat lokasi pengguna secara akurat.',
  },
  {
    icon: '🔔',
    name: 'Browser Notifications API',
    description: 'API browser untuk mengirimkan notifikasi sistem meskipun tab tidak aktif.',
  },
];
