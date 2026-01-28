# Panduan Migrasi Data dari Firebase

Karena aplikasi ini sekarang berjalan secara lokal (offline), data dari Firebase tidak otomatis muncul. Anda perlu memindahkannya secara manual.

## Langkah 1: Download Data dari Firebase

Saya telah menyiapkan script khusus untuk mengambil data Anda dari Firebase.

1. Buka terminal di folder project
2. Jalankan perintah berikut:

```bash
cd migration
npm install
npm start
```

Jika berhasil, akan muncul file baru bernama **`firebase-export.json`** di folder `migration/`.

> **Note:** Script ini menggunakan konfigurasi Firebase yang lama. Jika Anda sudah mengubah security rules di Firebase console untuk memblokir akses publik, script ini mungkin gagal. Pastikan rules Firestore mengizinkan read.

## Langkah 2: Import ke Aplikasi Electron

1. Jalankan aplikasi Electron:
   ```bash
   npm run electron:dev
   # Atau buka file .exe yang sudah di-build
   ```

2. Login ke aplikasi (gunakan default: `admin@local.app` / `admin123`)

3. Di pojok kanan atas, klik tombol **Menu** -> **Backup & Restore**

4. Klik tombol **"Import Data / Restore"**

5. Pilih file `firebase-export.json` yang tadi dibuat di langkah 1.

6. Aplikasi akan reload, dan data Clients & Projects Anda dari Firebase akan muncul!

## Langkah 3: Backup Berkala

Karena data sekarang tersimpan di komputer lokal (localStorage), **sangat disarankan** untuk melakukan backup berkala.

- Gunakan menu **Backup & Restore** -> **Export Data**
- Simpan file JSON hasil export di tempat aman (Google Drive, dll)

---

## Troubleshooting

**Script gagal mengambil data?**
- Pastikan koneksi internet lancar
- Cek apakah Firebase project masih aktif

**Import gagal?**
- Pastikan format file JSON valid
- Cek console (Ctrl+Shift+I) untuk melihat pesan error detail
