# 🔒 Panduan Migrasi SSL: Certbot ke acme.sh (Vercel DNS)

Dokumen ini berisi rencana dan langkah-langkah untuk melakukan migrasi sistem SSL dari `certbot` (manual) ke `acme.sh` menggunakan Vercel API Token. 
Tujuannya adalah agar perpanjangan sertifikat Wildcard `*.beritakarya.co` bisa berjalan secara **100% otomatis** tanpa perlu verifikasi DNS manual lagi.

---

## Persiapan
- **Vercel API Token**: Sudah dibuat di dashboard Vercel (Scope: `sabdakarya77-6919's projects`, Expiration: `1 Year`). 
- Pastikan token tersebut sudah disalin dan siap ditempel.

## Langkah 1: Install acme.sh
Jalankan perintah ini di VPS Anda untuk mengunduh dan memasang `acme.sh`:
```bash
curl https://get.acme.sh | sh -s email=admin@beritakarya.co
source ~/.bashrc
```

## Langkah 2: Set Vercel API Token
Daftarkan token Vercel Anda ke dalam *environment variable* sistem agar bisa dibaca oleh `acme.sh`:
```bash
export VERCEL_TOKEN="ISI_DENGAN_TOKEN_YANG_ANDA_COPY_TADI"
```

## Langkah 3: Terbitkan Sertifikat Wildcard (Otomatis)
Jalankan perintah ini. `acme.sh` akan secara ajaib menambahkan dan menghapus TXT record di Vercel tanpa perlu campur tangan manusia:
```bash
~/.acme.sh/acme.sh --issue \
  --dns dns_vercel \
  -d beritakarya.co \
  -d "*.beritakarya.co" \
  --server letsencrypt
```
*(Tunggu proses ini sampai memunculkan pesan sukses)*

## Langkah 4: Install Sertifikat ke Folder Nginx
Perintah ini akan menyalin sertifikat yang baru dibuat ke folder SSL Nginx yang sudah kita konfigurasi sebelumnya, sekaligus mengatur instruksi restart otomatis untuk Nginx:
```bash
~/.acme.sh/acme.sh --install-cert \
  -d beritakarya.co \
  --cert-file /etc/ssl/beritakarya/cert.pem \
  --key-file /etc/ssl/beritakarya/privkey.pem \
  --fullchain-file /etc/ssl/beritakarya/fullchain.pem \
  --reloadcmd "systemctl reload nginx"
```

## Langkah 5: Bersihkan Konfigurasi Lama (Opsional)
Karena `acme.sh` sudah membuat jadwal *cronjob* otomatisnya sendiri, pastikan jadwal cronjob milik `certbot` manual yang lama sudah dibersihkan (jika ada):
```bash
sudo crontab -e
# Hapus atau beri tanda pagar (#) pada baris yang mengandung 'certbot renew'
```

---
> **💡 Catatan Penting:** 
> `acme.sh` akan melakukan perpanjangan otomatis setiap 60 hari sekali. Anda tidak perlu melakukan apa-apa lagi (kecuali saat bulan Mei 2027 tahun depan, ketika Vercel Token Anda *expired*, maka Anda harus membuat token baru dan mengulang Langkah 2).
