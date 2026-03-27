# Rencana Implementasi: DisasterSense AI

## Ikhtisar

Implementasi aplikasi web kesiapsiagaan bencana berbasis React + TypeScript. Sistem dibangun sepenuhnya di sisi frontend tanpa backend, memanfaatkan Open-Meteo API, Leaflet.js, Geolocation API browser, dan Browser Notifications API. Logika AI menggunakan rule-based engine JavaScript murni.

## Tasks

- [x] 1. Setup proyek dan struktur dasar
  - Inisialisasi proyek Vite + React + TypeScript
  - Install dependensi: `leaflet`, `react-leaflet`, `zustand` (atau React Context), `fast-check`, `vitest`, `@testing-library/react`
  - Buat struktur direktori: `src/services/`, `src/components/`, `src/pages/`, `src/types/`, `src/data/`
  - Definisikan semua TypeScript interfaces dan types di `src/types/index.ts`: `LocationData`, `WeatherData`, `RiskResult`, `RiskStatus`, `AlertEntry`, `AppState`, `MapMarker`
  - Setup Vitest config (`vitest.config.ts`) dengan environment jsdom
  - _Kebutuhan: 1.1, 2.2, 3.1_

- [x] 2. Implementasi Location_Service
  - [x] 2.1 Implementasi `src/services/locationService.ts`
    - Implementasi `detectGPS()` menggunakan `navigator.geolocation.getCurrentPosition()`
    - Implementasi `parseManualInput()` untuk parsing nama kota (via Nominatim API) dan koordinat string
    - Implementasi `validateCoordinates(lat, lon)` — valid jika lat ∈ [-90, 90] dan lon ∈ [-180, 180]
    - Implementasi `getCurrentLocation()` dengan penyimpanan ke `localStorage` key `disastersense_last_location`
    - _Kebutuhan: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Tulis property test untuk Location_Service
    - **Properti 2: Validasi Rentang Koordinat** — `validateCoordinates` menerima iff lat ∈ [-90,90] dan lon ∈ [-180,180]
    - **Properti 3: Input Tidak Valid Menghasilkan Error** — koordinat di luar rentang atau string tidak dikenali mengembalikan error
    - **Properti 4: Round-Trip Penyimpanan Lokasi** — `getCurrentLocation()` setelah simpan mengembalikan lat, lon, cityName identik
    - **Memvalidasi: Kebutuhan 1.3, 1.4, 1.5**

  - [x] 2.3 Tulis property test presisi koordinat GPS
    - **Properti 1: Presisi Koordinat GPS** — nilai lat/lon dari GPS memiliki presisi minimal 4 digit desimal
    - **Memvalidasi: Kebutuhan 1.1**

  - [x] 2.4 Tulis unit test untuk Location_Service
    - Test GPS diizinkan → LocationData tersimpan
    - Test GPS ditolak → form manual ditampilkan
    - Test input koordinat valid dan tidak valid
    - Test Nominatim geocoding (mock fetch)
    - _Kebutuhan: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implementasi Weather_Service
  - [x] 3.1 Implementasi `src/services/weatherService.ts`
    - Implementasi `fetchWeather(location)` — GET `https://api.open-meteo.com/v1/forecast` dengan params `hourly=precipitation,windspeed_10m,relativehumidity_2m,temperature_2m,weathercode&forecast_days=1&timezone=Asia/Jakarta`
    - Ambil nilai jam terdekat dari array `hourly` berdasarkan waktu saat ini
    - Implementasi timeout 5 detik menggunakan `AbortController`
    - Set `isStale: true` jika data lebih dari 10 menit
    - Implementasi `startPolling(location, intervalMs)` dan `stopPolling()` menggunakan `setInterval`
    - Simpan data terakhir di state untuk fallback saat API error
    - _Kebutuhan: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Tulis property test untuk Weather_Service
    - **Properti 5: Kelengkapan Field Data Cuaca** — WeatherData hasil parse memiliki semua field: `rainfall`, `windSpeed`, `humidity`, `temperature`, `weatherCode`, `timestamp`
    - **Memvalidasi: Kebutuhan 2.2**

  - [x] 3.3 Tulis unit test untuk Weather_Service
    - Test fetch sukses → WeatherData lengkap
    - Test timeout → data terakhir dipertahankan, `isStale: true`
    - Test API error 4xx/5xx → fallback ke data terakhir
    - Test polling interval (mock timer)
    - _Kebutuhan: 2.1, 2.3, 2.4_

- [x] 4. Checkpoint — Pastikan semua test service lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 5. Implementasi Risk_Engine
  - [x] 5.1 Implementasi `src/services/riskEngine.ts`
    - Implementasi `calculate(weather)` dengan aturan:
      - `Aman`: rainfall < 10 DAN windSpeed < 40
      - `Waspada`: rainfall 10–50 ATAU windSpeed 40–70
      - `Bahaya`: rainfall > 50 ATAU windSpeed > 70
    - Prioritas: Bahaya > Waspada > Aman
    - Isi `triggeringFactors` dengan parameter yang memicu klasifikasi
    - Implementasi `getRecommendations(status)` menggunakan data statis `RECOMMENDATIONS`
    - Implementasi `getLastResult()` dengan penyimpanan di memori
    - Jika `weather` tidak lengkap/null → kembalikan last result dengan `isStale: true`
    - _Kebutuhan: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3_

  - [x] 5.2 Tulis property test untuk Risk_Engine — klasifikasi
    - **Properti 6: Klasifikasi Risiko Sesuai Aturan** — untuk semua WeatherData valid, status output sesuai rule table
    - **Memvalidasi: Kebutuhan 3.1, 3.2**

  - [x] 5.3 Tulis property test untuk Risk_Engine — faktor pemicu
    - **Properti 7: Faktor Pemicu Selalu Disertakan** — status Waspada/Bahaya selalu memiliki `triggeringFactors.length >= 1`
    - **Memvalidasi: Kebutuhan 3.3**

  - [x] 5.4 Tulis property test untuk Risk_Engine — data tidak lengkap
    - **Properti 8: Pertahanan Status Saat Data Tidak Lengkap** — input null/undefined mengembalikan last result dengan `isStale: true`
    - **Memvalidasi: Kebutuhan 3.5**

  - [x] 5.5 Tulis property test untuk Risk_Engine — rekomendasi
    - **Properti 14: Jumlah Minimum Rekomendasi Per Status** — Aman ≥ 1, Waspada ≥ 3, Bahaya ≥ 5 item
    - **Memvalidasi: Kebutuhan 7.1, 7.2, 7.3**

  - [x] 5.6 Tulis unit test untuk Risk_Engine
    - Test boundary conditions: tepat 10 mm/jam, tepat 50 mm/jam, tepat 40 km/jam, tepat 70 km/jam
    - Test kombinasi rainfall + windSpeed yang menghasilkan ketiga status
    - Test data tidak lengkap → isStale: true
    - _Kebutuhan: 3.1, 3.2, 3.5_

- [x] 6. Implementasi Notification_Service
  - [x] 6.1 Implementasi `src/services/notificationService.ts`
    - Implementasi `checkAndAlert(previous, current)` — buat AlertEntry hanya jika status meningkat (Aman < Waspada < Bahaya)
    - Implementasi `requestBrowserPermission()` menggunakan `Notification.requestPermission()`
    - Implementasi `sendBrowserNotification(alert)` — kirim jika `Notification.permission === 'granted'`
    - Implementasi `getAlertHistory()` — baca dari `localStorage` key `disastersense_alerts`, urutkan descending by timestamp
    - Implementasi `clearHistory()` — hapus dari localStorage
    - Strategi FIFO saat localStorage penuh: hapus entri terlama sebelum simpan baru
    - _Kebutuhan: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.2 Tulis property test untuk Notification_Service — entri peringatan
    - **Properti 11: Entri Peringatan Dibuat Saat Status Meningkat** — `checkAndAlert` mengembalikan AlertEntry iff status_baru > status_sebelumnya, null jika tidak
    - **Memvalidasi: Kebutuhan 5.1**

  - [x] 6.3 Tulis property test untuk Notification_Service — browser notification
    - **Properti 16: Browser Notification Dikirim Saat Izin Diberikan** — `sendBrowserNotification` dipanggil iff `Notification.permission === 'granted'`
    - **Memvalidasi: Kebutuhan 5.5**

  - [x] 6.4 Tulis property test untuk Notification_Service — riwayat
    - **Properti 12: Round-Trip Penyimpanan Riwayat Peringatan** — semua AlertEntry yang ditambahkan dapat diambil kembali via `getAlertHistory()`
    - **Properti 13: Urutan Riwayat Descending** — `alerts[i].timestamp >= alerts[i+1].timestamp` untuk semua i
    - **Memvalidasi: Kebutuhan 5.3, 5.4**

  - [x] 6.5 Tulis unit test untuk Notification_Service
    - Test transisi status: Aman→Waspada, Aman→Bahaya, Waspada→Bahaya (harus buat alert)
    - Test tidak ada alert: Bahaya→Waspada, Waspada→Aman, status sama
    - Test localStorage FIFO saat penuh
    - _Kebutuhan: 5.1, 5.3, 5.4_

- [x] 7. Checkpoint — Pastikan semua test service lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 8. Setup State Management dan App Context
  - Buat `src/store/appStore.ts` menggunakan Zustand (atau React Context)
  - Definisikan `AppState`: `location`, `weather`, `riskResult`, `alerts`, `isLoadingWeather`, `weatherError`
  - Implementasi actions: `setLocation`, `setWeather`, `setRiskResult`, `addAlert`, `setLoading`, `setError`
  - Wire Location_Service → Weather_Service → Risk_Engine → Notification_Service di dalam store actions
  - Muat lokasi terakhir dari `localStorage` saat inisialisasi
  - _Kebutuhan: 1.5, 2.5, 3.4_

- [x] 9. Implementasi komponen UI dasar dan layout
  - [x] 9.1 Buat `src/components/Navbar.tsx`
    - Navigasi ke: Dashboard, Peta Risiko, Notifikasi, Edukasi, Tentang
    - Responsif: menu horizontal di desktop (≥1024px), hamburger menu di mobile (<768px)
    - _Kebutuhan: 9.2, 9.4_

  - [x] 9.2 Buat `src/components/ErrorBoundary.tsx`
    - React Error Boundary untuk membungkus setiap halaman utama
    - Tampilkan fallback UI yang informatif saat error
    - _Kebutuhan: 4.4 (error handling)_

  - [x] 9.3 Buat `src/components/RiskBadge.tsx`
    - Komponen badge Status Risiko dengan warna: Aman → `#22c55e`, Waspada → `#f59e0b`, Bahaya → `#ef4444`
    - _Kebutuhan: 4.2, 6.2_

  - [x] 9.4 Tulis property test untuk konsistensi warna
    - **Properti 10: Konsistensi Pemetaan Warna Status Risiko** — setiap RiskStatus selalu dipetakan ke warna yang benar di RiskBadge dan marker peta
    - **Memvalidasi: Kebutuhan 4.2, 6.2**

- [x] 10. Implementasi Landing Page
  - Buat `src/pages/LandingPage.tsx`
  - Tampilkan judul aplikasi, deskripsi singkat, dan tombol "Cek Risiko Sekarang"
  - Tombol mengarahkan ke `/dashboard` dan memulai deteksi lokasi
  - _Kebutuhan: 9.1, 9.3_

- [x] 11. Implementasi Dashboard
  - [x] 11.1 Buat `src/pages/Dashboard.tsx`
    - Tampilkan nama lokasi aktif, data cuaca terkini (rainfall, windSpeed, humidity, temperature), Status Risiko, dan rekomendasi tindakan
    - Gunakan `RiskBadge` untuk Status Risiko dengan warna yang sesuai
    - Tampilkan loading indicator saat `isLoadingWeather: true`
    - Tampilkan banner error saat `weatherError` tidak null
    - Update otomatis saat AppState berubah (reaktif via store)
    - _Kebutuhan: 4.1, 4.2, 4.3, 4.4, 4.5, 7.4, 7.5_

  - [x] 11.2 Buat `src/components/LocationForm.tsx`
    - Form input manual lokasi (nama kota atau koordinat)
    - Tampilkan saat GPS ditolak atau pengguna ingin ganti lokasi
    - Tampilkan pesan error deskriptif saat input tidak valid
    - _Kebutuhan: 1.2, 1.3, 1.4_

  - [x] 11.3 Tulis property test untuk Dashboard
    - **Properti 9: Kelengkapan Tampilan Dashboard** — AppState valid selalu me-render nama lokasi, data cuaca, Status Risiko, dan ≥1 rekomendasi
    - **Memvalidasi: Kebutuhan 4.1, 7.4**

  - [x] 11.4 Tulis unit test untuk Dashboard
    - Test render saat loading
    - Test render saat error cuaca
    - Test render saat data lengkap (ketiga status)
    - Test update otomatis saat status berubah
    - _Kebutuhan: 4.1, 4.2, 4.3, 4.5_

- [x] 12. Implementasi Map_Component dan halaman Peta Risiko
  - [x] 12.1 Buat `src/components/MapComponent.tsx`
    - Inisialisasi Leaflet map dengan tile OpenStreetMap
    - Implementasi `centerOn(lat, lon, zoom)`, `addMarker(marker)`, `updateMarkerStatus()`
    - Marker berwarna sesuai RiskStatus menggunakan custom icon
    - Popup saat klik marker: nama lokasi, Status Risiko, ringkasan cuaca
    - Overlay zona risiko dengan legenda warna
    - Fallback UI saat tile gagal dimuat
    - _Kebutuhan: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 12.2 Buat `src/pages/MapPage.tsx`
    - Integrasikan MapComponent dengan AppState
    - Tampilkan marker lokasi pengguna dengan status risiko aktif
    - _Kebutuhan: 6.1, 6.2_

  - [x] 12.3 Tulis unit test untuk MapComponent
    - Test inisialisasi peta
    - Test marker ditambahkan dengan warna yang benar
    - Test popup konten
    - _Kebutuhan: 6.2, 6.4_

- [x] 13. Implementasi halaman Notifikasi
  - Buat `src/pages/NotificationsPage.tsx`
  - Tampilkan riwayat AlertEntry diurutkan descending by timestamp
  - Tampilkan tombol minta izin notifikasi browser jika belum diberikan
  - Tampilkan setiap alert: waktu, lokasi, previousStatus → newStatus
  - _Kebutuhan: 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 14. Implementasi data edukasi dan halaman Edukasi
  - [x] 14.1 Buat `src/data/educationData.ts`
    - Data statis untuk minimal 2 jenis bencana: banjir dan cuaca ekstrem
    - Setiap entri memiliki: `description`, `warningSigns`, `beforeSteps`, `duringSteps`, `afterSteps`, `checklist` (array ≥1 item)
    - Semua konten dalam Bahasa Indonesia
    - _Kebutuhan: 8.1, 8.2, 8.3, 8.4_

  - [x] 14.2 Tulis property test untuk data edukasi
    - **Properti 15: Kelengkapan Struktur Data Edukasi** — setiap entri memiliki semua field yang terdefinisi dan tidak kosong
    - **Memvalidasi: Kebutuhan 8.2, 8.3**

  - [x] 14.3 Buat `src/pages/EducationPage.tsx`
    - Tampilkan daftar panduan bencana dari `educationData`
    - Setiap panduan menampilkan: deskripsi, tanda peringatan, langkah sebelum/saat/setelah bencana, checklist
    - _Kebutuhan: 8.1, 8.2, 8.3, 8.4_

- [x] 15. Implementasi halaman Tentang dan routing
  - Buat `src/pages/AboutPage.tsx` — tujuan proyek dan daftar teknologi
  - Setup React Router di `src/App.tsx` dengan routes: `/`, `/dashboard`, `/map`, `/notifications`, `/education`, `/about`
  - Bungkus setiap halaman dengan `ErrorBoundary`
  - _Kebutuhan: 9.2, 9.5_

- [x] 16. Checkpoint — Pastikan semua test lulus dan integrasi berjalan
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 17. Styling responsif dan tema visual
  - Terapkan skema warna: biru (informasi), merah (`#ef4444`), oranye/kuning (`#f59e0b`), hijau (`#22c55e`)
  - Pastikan semua halaman responsif dari 320px hingga 1920px
  - Navbar hamburger menu berfungsi di mobile
  - Kontras warna teks ≥ 4.5:1 (WCAG AA)
  - Feedback visual pada elemen interaktif dalam 200ms (CSS transition/hover)
  - _Kebutuhan: 4.4, 9.4, 10.1, 10.2, 10.4, 10.5_

- [x] 18. Final checkpoint — Verifikasi keseluruhan
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

## Catatan

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan kebutuhan spesifik untuk keterlacakan
- Property test menggunakan fast-check dengan minimal 100 iterasi per properti
- Unit test menggunakan Vitest + React Testing Library
- Semua pemanggilan API eksternal (Open-Meteo, Nominatim) harus di-mock saat testing
- Tidak ada backend — semua logika berjalan di browser
