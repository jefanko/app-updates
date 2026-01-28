# Cara Build Aplikasi menjadi .EXE

Aplikasi sudah siap untuk di-build menjadi `.exe`.

## 🚀 Cara Paling Mudah (Recommended)

Saya sudah menyiapkan script khusus yang terbukti berhasil di komputer Anda:

```bash
npm run electron:package
```

Setelah proses selesai (sekitar 1-2 menit), file aplikasi akan muncul di:
📂 **`release/INA AI Chart-win32-x64/INA AI Chart.exe`**

Anda bisa langsung double-click file tersebut untuk menjalankan aplikasi.

---

## Alternatif Lain (Jika cara di atas gagal)

### Cara 1: Build dengan electron-builder (Installer)

```bash
# Build menjadi Windows executable (Installer)
npm run electron:build
```
*Note: Cara ini mungkin gagal jika ada masalah koneksi untuk download tools signing.*

### Cara 2: Manual (Tanpa Build Tool)

Jika cara di atas tidak bekerja, Anda bisa menjalankan aplikasi tanpa build:

```bash
# Jalankan Electron app
npm run electron:serve
```

Aplikasi akan terbuka sebagai aplikasi desktop. Cara ini tidak membuat file .exe, tapi aplikasi tetap berfungsi sebagai native app.

## Cara 4: Menggunakan electron-forge (Recommended Alternative)

```bash
# Install electron-forge
npm install --save-dev @electron-forge/cli
npx electron-forge import

# Build
npm run make
```

## Output yang Dihasilkan

Setelah berhasil build, Anda akan mendapatkan:

**Portable .exe:**
- File: `INA AI Chart.exe`
- Lokasi: `release/`
- Cara pakai: Double-click langsung jalan tanpa install

**NSIS Installer:**
- File: `INA AI Chart Setup 0.0.0.exe`
- Lokasi: `release/`
- Cara pakai: Double-click untuk install seperti software biasa

## Troubleshooting

### Error: "Cannot find module"
```bash
npm install
npm run build
```

### Error: "electron-builder failed"
Gunakan electron-packager (Cara 2) sebagai alternatif

### Error: "EPERM operation not permitted"
- Run command prompt as Administrator
- Atau disable antivirus sementara

### Aplikasi tidak mau jalan setelah di-build
- Pastikan `npm run build` sudah dijalankan
- Cek folder `dist/` ada isinya atau tidak

## Distribusi Aplikasi

Setelah berhasil build, Anda bisa:

1. **Copy folder unpacked** - Share seluruh folder hasil build
2. **Share .exe portable** - Share file .exe saja (lebih besar filenya ~150-200MB)
3. **Share installer** - Share file installer .exe (~100MB)

**Recommended:** Gunakan installer untuk distribusi ke user lain.

## Catatan Penting

- File .exe akan cukup besar (100-200 MB) karena include Chromium engine
- Ini normal untuk aplikasi Electron (seperti VS Code, Slack, dll)
- Antivirus mungkin flag file .exe karena belum ada signature - ini normal
- Untuk production, sebaiknya sign code dengan certificate

## Quick Commands

```bash
# Development mode (no build needed)
npm run electron:dev

# Build production
npm run build && npm run electron:build

# Just run (no exe, but works as desktop app)
npm run electron:serve
```

---

## Simplified Approach (Tanpa Build)

Jika Anda kesulitan dengan build process, cara paling mudah adalah:

1. pastikan dependencies terinstall (`npm install`)
2. Build web assets (`npm run build`)  
3. Jalankan dengan (`npm run electron:serve`)

Aplikasi akan terbuka sebagai desktop app meskipun tanpa file .exe!

Untuk share ke orang lain, share folder project nya, lalu suruh jalankan:
```bash
npm install
npm run build
npm run electron:serve
```
