import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import NotificationsPage from './pages/NotificationsPage';
import EducationPage from './pages/EducationPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <LandingPage />
            </ErrorBoundary>
          }
        />

        {/* App pages */}
        <Route
          path="/*"
          element={
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
              <Routes>
                <Route
                  path="dashboard"
                  element={
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="map"
                  element={
                    <ErrorBoundary>
                      <MapPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <ErrorBoundary>
                      <NotificationsPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="education"
                  element={
                    <ErrorBoundary>
                      <EducationPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="about"
                  element={
                    <ErrorBoundary>
                      <AboutPage />
                    </ErrorBoundary>
                  }
                />
              </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
