// menangkap error yang terjadi di dalam komponen anak dan menampilkan UI fallback agar aplikasi tidak crash
import { Component, type ReactNode, type ErrorInfo } from 'react';

// Menerima komponen anak dan opsional UI fallback kustom
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

// State internal untuk menyimpan status error dan objek error-nya
interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Inisialisasi state awal
    this.state = { hasError: false, error: null };
  }

  // Dipanggil React saat ada error di komponen anak
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Dipanggil setelah error tertangkap
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  // Reset state error agar komponen anak bisa dicoba render ulang
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      // Tampilkan UI error default dengan tombol "Coba Lagi"
      return (
        <div style={styles.container} role="alert">
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>Terjadi Kesalahan</h2>
          <p style={styles.message}>
            Halaman ini mengalami masalah dan tidak dapat ditampilkan.
          </p>
          {/* Tampilkan pesan error teknis jika tersedia */}
          {this.state.error && (
            <pre style={styles.detail}>{this.state.error.message}</pre>
          )}
          <button style={styles.button} onClick={this.handleReset}>
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: '2rem',
    textAlign: 'center',
    color: '#1e293b',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
    color: '#ef4444',
  },
  message: {
    fontSize: '1rem',
    color: '#475569',
    margin: '0 0 1rem',
    maxWidth: '400px',
  },
  detail: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    background: '#f1f5f9',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    maxWidth: '500px',
    overflowX: 'auto',
    marginBottom: '1.5rem',
    textAlign: 'left',
  },
  button: {
    padding: '0.6rem 1.5rem',
    backgroundColor: '#1e3a5f',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background-color 150ms',
  },
};
