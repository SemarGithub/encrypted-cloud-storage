# README.md for Cloud Secure Document

# 🔐 Cloud Secure Document

[![License](https://img.shields.io/badge/license-Academic-blue)](LICENSE)
[![Supabase](https://img.shields.io/badge/Supabase-Free%20Tier-green)](https://supabase.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Netlify-blue)](https://www.netlify.com/)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)]()

---

## **Deskripsi Proyek**
Cloud Secure Document adalah aplikasi web untuk **penyimpanan file aman berbasis cloud**, menggunakan **enkripsi AES end-to-end** dan **autentikasi pengguna Supabase**.  
File yang diupload terenkripsi di browser, sehingga hanya pemilik kunci rahasia yang dapat mengunduh file dalam bentuk asli.  

**Tujuan Proyek:**
- Memahami arsitektur cloud dan implementasi layanan gratis (Supabase Free Tier).  
- Menerapkan keamanan cloud: enkripsi, autentikasi, kontrol akses.  
- Membuat sistem web sederhana yang bisa di-deploy gratis.  

---

## **Fitur Utama**
- 🔑 **Login & Register** dengan email/password (Supabase Auth).  
- 🔒 **Upload File Terenkripsi** AES di sisi klien.  
- 📄 **Daftar File Anda** otomatis muncul setelah upload.  
- ⬇️ **Download File Terdekripsi** dengan kunci rahasia.  
- 🌐 **Deployment Gratis** di Netlify atau Vercel dengan HTTPS/SSL otomatis.  
- 📊 **Logging Aktivitas** melalui Supabase Logs (login, upload, download).  

---

## **Demo / Screenshot**
| Login/Register | Upload File | Download File |
|----------------|------------|---------------|
| ![Login](./screenshots/login.png) | ![Upload](./screenshots/upload.png) | ![Download](./screenshots/download.png) |

> Pastikan menambahkan folder `screenshots/` dan simpan gambar sesuai nama di atas.

---

## **Struktur Project**
```
cloud-secure-document/
│
├─ index.html      # Halaman utama
├─ style.css       # Styling modern & responsive
├─ app.js          # Logika upload, enkripsi, dekripsi, autentikasi
├─ README.md       # Dokumentasi project
└─ screenshots/    # Folder screenshot demo
```

---

## **Instalasi & Setup (Local Development)**

1. Clone repository:
```bash
git clone https://github.com/username/cloud-secure-document.git
cd cloud-secure-document
```

2. Buka `index.html` di browser.  

3. Buat akun di **Supabase Free Tier**: [https://supabase.com](https://supabase.com)  

4. Buat **Storage bucket** bernama `secure-files`.  
   - Atur akses per user (folder unik per user).  

5. Ganti URL & anon key di `app.js`:
```javascript
const supabase = createClient(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
);
```

6. Jalankan project di browser, login, dan coba upload file.  

---

## **Deployment ke Cloud Gratis**

### Netlify
1. Buat akun Netlify gratis: [https://www.netlify.com](https://www.netlify.com)  
2. Drag & drop folder project atau hubungkan repository GitHub.  
3. Netlify otomatis memberi **HTTPS/SSL**.  

### Vercel
1. Buat akun Vercel gratis: [https://vercel.com](https://vercel.com)  
2. Import project dari GitHub.  
3. Tambahkan environment variable: `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.  

---

## **Cara Penggunaan**

1. **Register/Login**
   - Masukkan email & password
2. **Upload File**
   - Pilih file  
   - Masukkan **kunci enkripsi**  
   - Klik **Encrypt & Upload**  
3. **Daftar File**
   - Semua file user akan muncul otomatis  
4. **Download File**
   - Klik tombol **Download**  
   - Masukkan kunci untuk mendapatkan file asli  

---

## **Keamanan**
- 🔒 **AES Encryption** di sisi klien  
- 👤 **Autentikasi Supabase** → setiap user hanya bisa akses folder sendiri  
- 📁 **Folder unik per user** → implementasi IAM sederhana  
- 🔗 **Signed URL** opsional untuk private file  
- 🌐 **HTTPS / SSL** dari hosting platform gratis  
- 💾 **Backup & Logging**
  - Backup manual / mirror bucket  
  - Logging aktivitas login, upload, download  

---

## **Risiko & Mitigasi**
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Lupa kunci enkripsi | File tidak bisa diakses | Simpan catatan lokal atau backup kunci |
| Bucket terekspos | File tetap terenkripsi | Signed URL + AES end-to-end |
| Brute force login | Akun terancam | Rate limit / MFA opsional |
| File besar lambat upload/download | User experience buruk | Chunking / progress bar |

---

## **License**
Academic / Learning Purpose.  
Tidak diperuntukkan untuk penggunaan komersial.  

---

## **Kontak**
- **Pembuat:** Harun  
- **Email:** hrun26010662@gmail.com
- **GitHub:** [https://github.com/harun-san/encrypted-cloud-storage.git]
