# INA AI Chart - Native Desktop Application

Aplikasi desktop native berbasis Electron untuk manajemen proyek AI dan INA. Aplikasi ini menggunakan database lokal (localStorage) untuk penyimpanan data, sehingga tidak memerlukan koneksi internet.

## 🎯 Fitur

- ✅ **Aplikasi Native Desktop** - Berjalan sebagai aplikasi Windows standalone
- ✅ **Database Lokal** - Semua data tersimpan di komputer lokal menggunakan localStorage
- ✅ **Offline-First** - Tidak memerlukan koneksi internet
- ✅ **Authentication Lokal** - Sistem login dengan kredensial tersimpan lokal
- ✅ **Multi-Organization** - Mendukung AI dan INA organization
- ✅ **Project Management** - Kelola clients, projects, milestones, dan sub-milestones

## 📋 Prerequisites

- Node.js (versi 18 atau lebih baru)
- npm (biasanya sudah terinstall dengan Node.js)

## 🚀 Cara Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Menjalankan dalam Development Mode

**Pilihan A: Web Browser (Dev Server saja)**
```bash
npm run dev
```
Buka browser dan akses: `http://localhost:5173`

**Pilihan B: Electron App (Recommended untuk testing native)**
```bash
npm run electron:dev
```
Ini akan membuka aplikasi Electron dengan DevTools aktif.

### 3. Build Production

**Build Web Assets**
```bash
npm run build
```

**Build Aplikasi Native Windows (.exe)**
```bash
npm run electron:build
```

Hasil build akan berada di folder `release/`. Anda akan menemukan installer Windows (.exe) yang dapat didistribusikan.

## 🔐 Login Credentials

Default user untuk login:
- **Email**: `admin@local.app`
- **Password**: `admin123`

> ⚠️ **Note**: Password disimpan dalam plaintext di localStorage. Ini cocok untuk aplikasi lokal, tapi TIDAK aman untuk production app yang terkoneksi ke internet.

## 💾 Data Persistence

### Lokasi Database

Data aplikasi tersimpan di **localStorage browser** dengan key: `ina-ai-chart-db`

### Struktur Data

```json
{
  "users": [...],
  "clients": [...],
  "projects": [...],
  "currentUser": {...}
}
```

### Cara Melihat Data

**Di Browser:**
1. Buka DevTools (F12)
2. Tab "Application" > "Local Storage"
3. Cari key `ina-ai-chart-db`

**Di Electron:**
Data tersimpan di localStorage yang sama dengan browser, tetapi terisolasi per aplikasi.

### Reset Database

Untuk mereset database ke kondisi awal:
1. Buka DevTools
2. Hapus key `ina-ai-chart-db` dari localStorage
3. Refresh halaman

## 📁 Project Structure

```
├── electron.cjs              # Electron main process
├── preload.cjs               # Electron preload script
├── electron-builder.json     # Electron builder configuration
├── src/
│   ├── database/
│   │   └── db.js            # Local database implementation
│   ├── components/          # React components
│   ├── App.jsx              # Main application
│   └── main.jsx             # React entry point
├── dist/                    # Built web assets (generated)
└── release/                 # Built Electron apps (generated)
```

## 🔧 Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan Vite dev server (browser) |
| `npm run build` | Build production web assets |
| `npm run electron:dev` | Jalankan app Electron dengan hot reload |
| `npm run electron:build` | Build aplikasi native (.exe) |
| `npm run electron:serve` | Jalankan Electron dengan built files |

## 🎨 Tech Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **localStorage** - Local database
- **electron-builder** - Package and distribute

## 📝 Development Notes

### Database Implementation

Aplikasi ini menggunakan **localStorage** sebagai database lokal. File `src/database/db.js` menyediakan API yang kompatibel dengan Firebase Firestore, sehingga migrasi dari Firebase sangat minimal.

**Key Features:**
- CRUD operations (Create, Read, Update, Delete)
- Collection-based structure
- Auto-generated IDs using UUID
- Polling-based "real-time" updates (500ms interval)

### Authentication

Authentication menggunakan sistem sederhana:
- Credentials disimpan di localStorage
- Session persisten sampai user logout
- Support untuk auth state listeners (mirip Firebase Auth)

### Limitations

1. **No Real-time Sync** - Polling every 500ms untuk refresh data
2. **Single User** - Tidak ada multi-user support
3. **No Cloud Backup** - Data hanya tersimpan lokal
4. **No Encryption** - Data tersimpan dalam plaintext

## 🐛 Troubleshooting

### Dev Server tidak jalan

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Electron tidak membuka

```bash
# Pastikan build sudah dilakukan
npm run build

# Kemudian jalankan ulang
npm run electron:serve
```

### Data hilang

- Data tersimpan di localStorage browser/Electron
- Setiap environment (browser vs Electron) memiliki localStorage terpisah
- Clear browser cache akan menghapus data

### Build error

```bash
# Pastikan dependencies terinstall
npm install

# Build ulang
npm run build
npm run electron:build
```

## 📜 License

Private project untuk internal use.

## 👤 Credits

Made with ❤️ by [慎吾](https://github.com/jefanko)
