# Dokumen Kebutuhan (Requirements Document)

## Pendahuluan

DisasterSense AI adalah aplikasi web berbasis kecerdasan buatan yang dirancang untuk membantu masyarakat Indonesia meningkatkan kesiapsiagaan terhadap bencana alam. Sistem menganalisis data cuaca real-time dari Open-Meteo API dan parameter lingkungan untuk memprediksi potensi risiko bencana seperti banjir dan cuaca ekstrem, serta memberikan notifikasi dini yang dipersonalisasi berdasarkan lokasi pengguna. Antarmuka dibangun dengan React, peta interaktif menggunakan Leaflet.js + OpenStreetMap, lokasi menggunakan Geolocation API browser, notifikasi menggunakan Browser Notifications API, dan logika AI menggunakan JavaScript murni — semua tanpa biaya API atau layanan berbayar.

---

## Glosarium

- **Sistem**: Aplikasi web DisasterSense AI secara keseluruhan
- **Pengguna**: Individu yang mengakses aplikasi melalui browser
- **Risk_Engine**: Komponen rule-based yang menghitung dan mengklasifikasikan tingkat risiko bencana
- **Location_Service**: Komponen yang mengelola deteksi dan penyimpanan lokasi pengguna
- **Weather_Service**: Komponen yang mengambil dan memproses data cuaca dari Open-Meteo API
- **Notification_Service**: Komponen yang mengelola pembuatan dan pengiriman peringatan dini
- **Map_Component**: Komponen peta interaktif berbasis Leaflet.js
- **Dashboard**: Halaman utama yang menampilkan ringkasan kondisi risiko pengguna
- **Status Risiko**: Klasifikasi tingkat bahaya dengan tiga level — Aman (hijau), Waspada (kuning), Bahaya (merah)
- **Zona Risiko**: Area geografis yang diklasifikasikan berdasarkan Status Risiko
- **Peringatan Dini**: Notifikasi otomatis yang dikirim saat Status Risiko meningkat
- **Hyperlocal**: Analisis risiko yang spesifik pada koordinat lokasi pengguna

---

## Kebutuhan

### Kebutuhan 1: Deteksi Lokasi Pengguna

**User Story:** Sebagai pengguna, saya ingin sistem mendeteksi lokasi saya secara otomatis atau memungkinkan saya memasukkan lokasi secara manual, agar analisis risiko yang diberikan relevan dengan kondisi di sekitar saya.

#### Kriteria Penerimaan

1. WHEN pengguna mengizinkan akses GPS, THE Location_Service SHALL mendeteksi koordinat lintang dan bujur pengguna dengan presisi minimal 4 desimal.
2. WHEN pengguna menolak akses GPS, THE Location_Service SHALL menampilkan formulir input lokasi manual berupa nama kota atau koordinat.
3. WHEN pengguna mengirimkan input lokasi manual, THE Location_Service SHALL memvalidasi bahwa input merupakan nama kota yang dikenali atau koordinat dalam rentang valid (-90 hingga 90 lintang, -180 hingga 180 bujur).
4. IF input lokasi manual tidak valid, THEN THE Location_Service SHALL menampilkan pesan kesalahan deskriptif dan meminta pengguna memasukkan ulang.
5. WHEN lokasi berhasil ditentukan, THE Location_Service SHALL menyimpan lokasi tersebut untuk digunakan oleh Weather_Service dan Risk_Engine.

### Kebutuhan 2: Integrasi Data Cuaca Real-Time

**User Story:** Sebagai pengguna, saya ingin melihat data cuaca terkini di lokasi saya, agar saya dapat memahami kondisi lingkungan saat ini.

#### Kriteria Penerimaan

1. WHEN lokasi pengguna tersedia, THE Weather_Service SHALL mengambil data cuaca dari Open-Meteo API (https://api.open-meteo.com/v1/forecast) dalam waktu maksimal 5 detik tanpa memerlukan API key.
2. THE Weather_Service SHALL mengambil parameter berikut dari Open-Meteo: curah hujan/precipitation (mm/jam), kecepatan angin/windspeed_10m (km/jam), kelembaban udara/relativehumidity_2m (%), suhu/temperature_2m (°C), dan kode cuaca/weathercode.
3. THE Weather_Service SHALL memperbarui data cuaca secara berkala setiap 10 menit selama pengguna aktif menggunakan aplikasi.
4. IF Open-Meteo API tidak merespons dalam 5 detik, THEN THE Weather_Service SHALL menampilkan pesan bahwa data cuaca sementara tidak tersedia dan menampilkan data terakhir yang berhasil diambil beserta waktu pengambilannya.
5. WHEN data cuaca berhasil diambil, THE Weather_Service SHALL meneruskan data tersebut ke Risk_Engine untuk kalkulasi risiko.

---

### Kebutuhan 3: Prediksi Risiko Bencana Berbasis AI (Rule-Based)

**User Story:** Sebagai pengguna, saya ingin mengetahui tingkat risiko bencana di lokasi saya berdasarkan data cuaca terkini, agar saya dapat mengambil tindakan pencegahan yang tepat.

#### Kriteria Penerimaan

1. WHEN data cuaca diterima dari Weather_Service, THE Risk_Engine SHALL menghitung Status Risiko berdasarkan aturan berikut:
   - Aman: curah hujan < 10 mm/jam DAN kecepatan angin < 40 km/jam
   - Waspada: curah hujan 10–50 mm/jam ATAU kecepatan angin 40–70 km/jam
   - Bahaya: curah hujan > 50 mm/jam ATAU kecepatan angin > 70 km/jam
2. THE Risk_Engine SHALL menghasilkan tepat satu Status Risiko (Aman, Waspada, atau Bahaya) untuk setiap kalkulasi.
3. WHEN Status Risiko dihitung, THE Risk_Engine SHALL menyertakan parameter cuaca yang menjadi dasar klasifikasi tersebut sebagai data pendukung.
4. THE Risk_Engine SHALL mengevaluasi ulang Status Risiko setiap kali Weather_Service menyediakan data cuaca baru.
5. IF data cuaca tidak lengkap atau tidak tersedia, THEN THE Risk_Engine SHALL mempertahankan Status Risiko terakhir yang valid dan menandai kalkulasi sebagai tidak diperbarui.

---

### Kebutuhan 4: Dashboard Utama

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan kondisi cuaca, lokasi, dan status risiko dalam satu halaman, agar saya dapat memantau situasi dengan cepat.

#### Kriteria Penerimaan

1. WHEN pengguna membuka Dashboard, THE Dashboard SHALL menampilkan nama lokasi aktif, data cuaca terkini, Status Risiko saat ini, dan rekomendasi tindakan yang sesuai.
2. THE Dashboard SHALL menampilkan Status Risiko dengan warna yang sesuai: hijau untuk Aman, kuning untuk Waspada, dan merah untuk Bahaya.
3. WHEN Status Risiko berubah, THE Dashboard SHALL memperbarui tampilan Status Risiko dan rekomendasi tindakan tanpa memerlukan reload halaman.
4. THE Dashboard SHALL dapat diakses dan ditampilkan dengan benar pada layar desktop (lebar ≥ 1024px) maupun perangkat mobile (lebar < 768px).
5. WHEN data cuaca sedang dimuat, THE Dashboard SHALL menampilkan indikator loading yang terlihat oleh pengguna.

---

### Kebutuhan 5: Sistem Notifikasi Peringatan Dini

**User Story:** Sebagai pengguna, saya ingin menerima peringatan otomatis ketika tingkat risiko meningkat, agar saya dapat segera mengambil tindakan tanpa harus terus memantau aplikasi.

#### Kriteria Penerimaan

1. WHEN Status Risiko meningkat dari level sebelumnya (Aman → Waspada, Aman → Bahaya, atau Waspada → Bahaya), THE Notification_Service SHALL membuat entri peringatan baru yang mencatat waktu, lokasi, level risiko sebelumnya, dan level risiko baru.
2. WHEN peringatan baru dibuat, THE Notification_Service SHALL menampilkan notifikasi in-app yang terlihat oleh pengguna.
3. THE Notification_Service SHALL menyimpan riwayat peringatan yang dapat diakses pengguna pada halaman Notifikasi.
4. THE Notification_Service SHALL menampilkan riwayat peringatan diurutkan dari yang terbaru ke yang terlama.
5. WHEN pengguna telah memberikan izin notifikasi browser, THE Notification_Service SHALL mengirimkan peringatan menggunakan Browser Notifications API (Web Notifications API) sehingga notifikasi muncul meskipun tab tidak aktif.
6. IF pengguna belum memberikan izin notifikasi browser, THEN THE Notification_Service SHALL meminta izin kepada pengguna dan menampilkan peringatan hanya sebagai notifikasi in-app jika izin ditolak.

---

### Kebutuhan 6: Peta Risiko Interaktif

**User Story:** Sebagai pengguna, saya ingin melihat visualisasi zona risiko pada peta interaktif, agar saya dapat memahami distribusi risiko secara geografis di sekitar lokasi saya.

#### Kriteria Penerimaan

1. WHEN pengguna membuka halaman Peta Risiko, THE Map_Component SHALL menampilkan peta interaktif yang berpusat pada lokasi pengguna saat ini.
2. THE Map_Component SHALL menampilkan marker lokasi pengguna dengan warna yang sesuai Status Risiko aktif (hijau/kuning/merah).
3. THE Map_Component SHALL menampilkan zona risiko sebagai overlay berwarna pada peta dengan legenda yang menjelaskan arti setiap warna.
4. WHEN pengguna mengklik marker atau zona pada peta, THE Map_Component SHALL menampilkan popup yang berisi nama lokasi, Status Risiko, dan ringkasan data cuaca.
5. THE Map_Component SHALL mendukung operasi zoom in, zoom out, dan pan pada peta.
6. WHERE koneksi internet tersedia, THE Map_Component SHALL memuat tile peta dari OpenStreetMap (gratis, tanpa API key).

---

### Kebutuhan 7: Rekomendasi Tindakan Otomatis

**User Story:** Sebagai pengguna, saya ingin mendapatkan saran tindakan yang spesifik berdasarkan kondisi risiko saat ini, agar saya tahu langkah konkret yang harus diambil.

#### Kriteria Penerimaan

1. WHEN Status Risiko adalah Aman, THE Risk_Engine SHALL menghasilkan rekomendasi yang berisi setidaknya satu tindakan pemantauan rutin.
2. WHEN Status Risiko adalah Waspada, THE Risk_Engine SHALL menghasilkan rekomendasi yang berisi setidaknya tiga tindakan kesiapsiagaan spesifik.
3. WHEN Status Risiko adalah Bahaya, THE Risk_Engine SHALL menghasilkan rekomendasi yang berisi setidaknya lima tindakan evakuasi dan keselamatan spesifik.
4. THE Dashboard SHALL menampilkan rekomendasi tindakan yang dihasilkan Risk_Engine secara bersamaan dengan Status Risiko.
5. WHEN Status Risiko berubah, THE Dashboard SHALL memperbarui rekomendasi tindakan yang ditampilkan sesuai Status Risiko yang baru.

---

### Kebutuhan 8: Halaman Edukasi Bencana

**User Story:** Sebagai pengguna, saya ingin mengakses panduan dan informasi edukatif tentang jenis-jenis bencana, agar saya dapat mempersiapkan diri dengan lebih baik sebelum bencana terjadi.

#### Kriteria Penerimaan

1. THE Sistem SHALL menyediakan halaman Edukasi yang berisi panduan untuk minimal dua jenis bencana: banjir dan cuaca ekstrem.
2. THE Sistem SHALL menampilkan setiap panduan bencana dalam format yang mencakup: deskripsi bencana, tanda-tanda peringatan, langkah-langkah sebelum bencana, langkah-langkah saat bencana, dan langkah-langkah setelah bencana.
3. THE Sistem SHALL menyediakan checklist kesiapsiagaan yang dapat ditampilkan pengguna untuk setiap jenis bencana.
4. THE Sistem SHALL menampilkan konten edukasi dalam Bahasa Indonesia.

---

### Kebutuhan 9: Landing Page dan Navigasi

**User Story:** Sebagai pengguna baru, saya ingin memahami tujuan aplikasi dan dapat berpindah antar halaman dengan mudah, agar pengalaman penggunaan terasa intuitif.

#### Kriteria Penerimaan

1. THE Sistem SHALL menampilkan Landing Page yang berisi judul aplikasi, deskripsi singkat tujuan sistem, dan tombol "Cek Risiko Sekarang" yang mengarahkan pengguna ke Dashboard.
2. THE Sistem SHALL menyediakan navigasi yang dapat diakses dari semua halaman untuk berpindah ke: Dashboard, Peta Risiko, Notifikasi, Edukasi, dan Tentang.
3. WHEN pengguna mengklik tombol "Cek Risiko Sekarang" pada Landing Page, THE Sistem SHALL mengarahkan pengguna ke Dashboard dan memulai proses deteksi lokasi.
4. THE Sistem SHALL menampilkan navigasi dalam format yang responsif: menu horizontal pada desktop dan menu hamburger pada mobile.
5. THE Sistem SHALL menampilkan halaman Tentang yang berisi tujuan proyek dan daftar teknologi yang digunakan (React, Leaflet.js, OpenStreetMap, Open-Meteo API, Geolocation API, Browser Notifications API).

---

### Kebutuhan 10: Antarmuka Responsif dan Tema Visual

**User Story:** Sebagai pengguna, saya ingin antarmuka yang menarik secara visual dan dapat digunakan dengan nyaman di berbagai perangkat, agar pengalaman penggunaan terasa profesional dan mudah dipahami.

#### Kriteria Penerimaan

1. THE Sistem SHALL menerapkan skema warna yang mencerminkan tema kesiapsiagaan bencana dengan palet utama: biru (informasi/cuaca), merah (bahaya), oranye (waspada), dan hijau (aman).
2. THE Sistem SHALL menampilkan semua halaman dengan benar pada resolusi layar minimal 320px (mobile) hingga 1920px (desktop).
3. THE Sistem SHALL memuat halaman Dashboard dalam waktu maksimal 3 detik pada koneksi internet standar (≥ 10 Mbps).
4. THE Sistem SHALL menggunakan tipografi yang terbaca dengan kontras warna teks terhadap latar belakang minimal 4.5:1 sesuai standar WCAG AA.
5. WHEN pengguna berinteraksi dengan elemen interaktif (tombol, link, marker peta), THE Sistem SHALL memberikan umpan balik visual yang terlihat dalam 200ms.
