# 🚀 BeritaKarya — Panduan Deployment VPS Production

Dokumen ini berisi panduan **lengkap dan berurutan** untuk men-deploy project BeritaKarya ke VPS Ubuntu dari nol hingga production-ready.

> **Prasyarat VPS:**
> - Ubuntu 22.04 LTS (minimal)
> - RAM: 2GB minimum (4GB direkomendasikan)
> - Storage: 20GB+ SSD
> - Domain: `beritakarya.co` & `api.beritakarya.co` sudah diarahkan ke IP VPS
> - Akses SSH dengan user sudoer

---

## 📋 Daftar Isi

1. [Persiapan Awal Server](#1-persiapan-awal-server)
2. [Install Docker & Docker Compose](#2-install-docker--docker-compose)
3. [Setup Firewall](#3-setup-firewall)
4. [Install & Konfigurasi Nginx](#4-install--konfigurasi-nginx)
5. [Setup SSL (HTTPS)](#5-setup-ssl-https)
6. [Clone & Konfigurasi Project](#6-clone--konfigurasi-project)
7. [Konfigurasi Environment Variables](#7-konfigurasi-environment-variables)
8. [Build & Jalankan Docker Containers](#8-build--jalankan-docker-containers)
9. [Verifikasi Deployment](#9-verifikasi-deployment)
10. [Setup Backup Otomatis](#10-setup-backup-otomatis)
11. [Update & Re-deploy](#11-update--re-deploy)
12. [Monitoring & Troubleshooting](#12-monitoring--troubleshooting)

---

## 1. Persiapan Awal Server

Login ke VPS Anda via SSH:

```bash
ssh root@IP_VPS_ANDA
# atau jika sudah ada user:
ssh username@IP_VPS_ANDA
```

### 1.1 Update Sistem

```bash
apt-get update -y && apt-get upgrade -y
```

### 1.2 Install Tools Dasar

```bash
apt-get install -y curl wget git ufw fail2ban
```

### 1.3 Buat User Non-Root (Rekomendasi Keamanan)

```bash
# Buat user baru
adduser deploy

# Tambahkan ke grup sudo
usermod -aG sudo deploy

# Login sebagai user baru untuk sisa langkah ini
su - deploy
```

### 1.4 Setup Swap (Untuk VPS dengan RAM ≤ 2GB)

```bash
# Cek apakah sudah ada swap
free -h

# Jika belum, buat swapfile 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Agar permanen setelah reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 2. Install Docker & Docker Compose

```bash
# Install Docker menggunakan script resmi
curl -fsSL https://get.docker.com | sudo sh

# Tambahkan user saat ini ke group docker (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# PENTING: Logout dan login kembali agar grup aktif
exit
# Login ulang ke server
ssh deploy@IP_VPS_ANDA

# Verifikasi Docker
docker --version
docker compose version
```

---

## 3. Setup Firewall

```bash
# Konfigurasi UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Izinkan SSH (WAJIB, jangan sampai lupa!)
sudo ufw allow ssh
# atau jika SSH port kustom:
# sudo ufw allow 22222/tcp

# Izinkan HTTP dan HTTPS untuk Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Aktifkan firewall
sudo ufw --force enable

# Verifikasi
sudo ufw status verbose
```

### 3.1 Aktifkan Fail2Ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
```

---

## 4. Install & Konfigurasi Nginx

Nginx dijalankan **langsung di host** (bukan dalam Docker) sebagai reverse proxy. Ini memungkinkan Nginx mengakses container Docker lewat `127.0.0.1:3001`.

```bash
# Install Nginx
sudo apt-get install -y nginx

# Aktifkan Nginx saat boot
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.1 Buat Direktori SSL

```bash
sudo mkdir -p /etc/ssl/beritakarya
```

### 4.2 Deploy Konfigurasi Nginx Production

```bash
# Salin konfigurasi production dari repo nanti
# (Dilakukan setelah clone repo di langkah 6)
```

> ⚠️ **PENTING:** Jangan aktifkan konfigurasi SSL dulu sebelum Certbot dijalankan. Gunakan konfigurasi HTTP sementara terlebih dahulu.

### 4.3 Konfigurasi HTTP Sementara (Untuk Certbot)

Buat file konfigurasi sementara:

```bash
sudo nano /etc/nginx/sites-available/beritakarya-temp
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name beritakarya.co www.beritakarya.co api.beritakarya.co;

    location / {
        return 200 'Server is up!';
        add_header Content-Type text/plain;
    }
}
```

```bash
# Aktifkan konfigurasi sementara
sudo ln -s /etc/nginx/sites-available/beritakarya-temp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Setup SSL (HTTPS)

### 5.1 Install Certbot

```bash
sudo apt-get install -y certbot
```

### 5.2 Request Wildcard SSL Certificate

Wildcard SSL diperlukan untuk `*.beritakarya.co` (semua subdomain).

```bash
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  --email admin@beritakarya.co \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  -d beritakarya.co -d "*.beritakarya.co"
```

> **Proses DNS Challenge:**
> Certbot akan meminta Anda membuat TXT record di DNS panel Anda:
> - Record name: `_acme-challenge.beritakarya.co`
> - Record value: _(akan diberikan oleh Certbot)_
>
> Setelah menambahkan record, tunggu 1-2 menit lalu tekan Enter.

### 5.3 Link SSL Certificates

```bash
sudo mkdir -p /etc/ssl/beritakarya
sudo ln -sf /etc/letsencrypt/live/beritakarya.co/fullchain.pem /etc/ssl/beritakarya/fullchain.pem
sudo ln -sf /etc/letsencrypt/live/beritakarya.co/privkey.pem /etc/ssl/beritakarya/privkey.pem
```

### 5.4 Deploy Konfigurasi Nginx Production

Setelah SSL siap, hapus konfigurasi sementara dan gunakan konfigurasi production:

```bash
# Hapus konfigurasi sementara
sudo rm /etc/nginx/sites-enabled/beritakarya-temp
sudo rm /etc/nginx/sites-available/beritakarya-temp

# Salin konfigurasi production (setelah repo di-clone)
sudo cp /opt/beritakarya/infra/nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Test dan reload
sudo nginx -t && sudo systemctl reload nginx
```

### 5.5 Setup Auto-Renewal SSL

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Tambahkan cron job untuk auto-renewal
sudo crontab -e
# Tambahkan baris berikut:
0 3 * * * certbot renew --quiet && nginx -s reload
```

---

## 6. Clone & Konfigurasi Project

### 6.1 Buat Direktori Aplikasi

```bash
sudo mkdir -p /opt/beritakarya
sudo chown -R $USER:$USER /opt/beritakarya
```

### 6.2 Clone Repository

```bash
cd /opt/beritakarya
git clone https://github.com/sabdakarya77-spec/beritakarya.git .
```

> Jika repository private, Anda perlu setup SSH key atau Personal Access Token:
> ```bash
> # Generate SSH key di VPS
> ssh-keygen -t ed25519 -C "deploy@beritakarya.co"
> cat ~/.ssh/id_ed25519.pub
> # Tambahkan public key ini ke GitHub → Settings → Deploy Keys
> ```

### 6.3 Buat Direktori Pendukung

```bash
# Direktori logs
sudo mkdir -p /var/log/beritakarya
sudo chown -R $USER:$USER /var/log/beritakarya

# Direktori backup
sudo mkdir -p /var/backups/beritakarya
sudo chown -R $USER:$USER /var/backups/beritakarya
```

---

## 7. Konfigurasi Environment Variables

### 7.1 Buat File `.env` untuk Docker

```bash
cd /opt/beritakarya/infra/docker

# Salin dari contoh
cp /opt/beritakarya/.env.production.example .env

# Edit file .env
nano .env
```

### 7.2 Isi Semua Variabel yang Diperlukan

Berikut panduan setiap variabel di file `infra/docker/.env`:

```env
NODE_ENV=production
PORT=3001
API_URL=https://api.beritakarya.co
FRONTEND_URL=https://beritakarya.co
NEXT_PUBLIC_API_URL=https://api.beritakarya.co

# --- DATABASE ---
# User: postgres (default superuser PostgreSQL)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=BUAT_PASSWORD_SANGAT_KUAT_MIN_32_CHAR
POSTGRES_DB=beritakarya_prod

# Gunakan 'postgres' sebagai hostname (nama service Docker)
DATABASE_URL=postgresql://postgres:BUAT_PASSWORD_SANGAT_KUAT_MIN_32_CHAR@postgres:5432/beritakarya_prod
DIRECT_URL=postgresql://postgres:BUAT_PASSWORD_SANGAT_KUAT_MIN_32_CHAR@postgres:5432/beritakarya_prod

# --- SECURITY ---
# Generate dengan: openssl rand -hex 32
JWT_SECRET=ISI_DENGAN_STRING_64_KARAKTER_ACAK
# Generate dengan: openssl rand -hex 32
RESET_SECRET=ISI_DENGAN_STRING_32_KARAKTER_ACAK
CORS_ORIGIN=https://beritakarya.co,https://www.beritakarya.co

# --- SERVICES ---
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXX
AI_MODEL=gpt-4o

REDIS_HOST=redis
REDIS_PORT=6379
MEILISEARCH_HOST=http://meilisearch:7700
# Generate dengan: openssl rand -hex 32
MEILISEARCH_KEY=ISI_DENGAN_KEY_ACAK

SENTRY_DSN=https://XXXXXXX@sentry.io/XXXXXXX

# --- EMAIL ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@beritakarya.co
SMTP_PASS=APP_PASSWORD_GMAIL

# --- CDN (Opsional) ---
CDN_URL=https://cdn.beritakarya.co
```

### 7.3 Generate Secret Keys

Gunakan perintah berikut untuk membuat key yang aman:

```bash
# Untuk JWT_SECRET (64 karakter)
openssl rand -hex 32

# Untuk RESET_SECRET (32 karakter)
openssl rand -hex 16

# Untuk MEILISEARCH_KEY
openssl rand -hex 24
```

---

## 8. Build & Jalankan Docker Containers

### 8.1 Build Docker Images

```bash
cd /opt/beritakarya/infra/docker

# Build image API
docker compose -f docker-compose.backend.yml build api

# Atau build semua sekaligus
docker compose -f docker-compose.backend.yml build
```

> ⏳ Proses build pertama kali bisa memakan waktu 10-20 menit tergantung kecepatan internet VPS.

### 8.2 Jalankan Database & Redis Terlebih Dahulu

```bash
# Jalankan database dan redis saja dulu
docker compose -f docker-compose.backend.yml up -d postgres redis meilisearch

# Tunggu semua healthy (cek statusnya)
docker compose -f docker-compose.backend.yml ps
```

Tunggu hingga status `postgres` dan `redis` menjadi `healthy`.

### 8.3 Jalankan Semua Containers

```bash
# Jalankan semua services
docker compose -f docker-compose.backend.yml up -d

# Cek status semua container
docker compose -f docker-compose.backend.yml ps
```

Semua container harus berstatus `Up` atau `Up (healthy)`.

### 8.4 Cek Logs API (Validasi Startup)

```bash
# Lihat log API secara real-time
docker compose -f docker-compose.backend.yml logs -f api
```

Anda harus melihat pesan seperti:
```
✅ Database migrasi selesai
✅ API berjalan di http://localhost:3001
```

---

## 9. Verifikasi Deployment

### 9.1 Test Health Check API

```bash
# Dari dalam VPS
curl http://127.0.0.1:3001/health

# Response yang diharapkan:
# {"status":"healthy","timestamp":"...","services":{"database":"healthy","meilisearch":{"status":"healthy"}}}
```

### 9.2 Test Akses via Domain (HTTPS)

```bash
# Test API via HTTPS
curl https://api.beritakarya.co/health

# Test redirect HTTP ke HTTPS
curl -I http://api.beritakarya.co
# Harus mengembalikan: HTTP/1.1 301 Moved Permanently
```

### 9.3 Verifikasi Semua Container Berjalan

```bash
docker ps
# Semua container (postgres, redis, meilisearch, api) harus Up
```

### 9.4 Test Endpoint API

```bash
# Test endpoint public
curl https://api.beritakarya.co/api/v1/sites

# Test Swagger docs
curl -I https://api.beritakarya.co/api-docs
```

---

## 10. Setup Backup Otomatis

### 10.1 Test Script Backup

```bash
chmod +x /opt/beritakarya/infra/scripts/backup-database.sh
bash /opt/beritakarya/infra/scripts/backup-database.sh
```

### 10.2 Setup Cron Job Backup Harian

```bash
crontab -e
# Tambahkan baris berikut (backup setiap hari jam 2 pagi):
0 2 * * * /opt/beritakarya/infra/scripts/backup-database.sh >> /var/log/beritakarya/backup.log 2>&1
```

### 10.3 Konfigurasi Log Rotation

```bash
sudo nano /etc/logrotate.d/beritakarya
```

Isi:

```
/var/log/beritakarya/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## 11. Update & Re-deploy

Setiap kali ada pembaruan kode:

```bash
cd /opt/beritakarya

# 1. Pull perubahan terbaru
git pull origin main

# 2. Re-build image
docker compose -f infra/docker/docker-compose.backend.yml build api

# 3. Restart container dengan image baru (zero-downtime)
docker compose -f infra/docker/docker-compose.backend.yml up -d --no-deps api

# 4. Cek logs untuk memastikan startup berhasil
docker compose -f infra/docker/docker-compose.backend.yml logs -f api
```

> **Catatan:** Migrasi database dijalankan **otomatis** saat container API start (via `CMD: pnpm run db:migrate:deploy`).

---

## 12. Monitoring & Troubleshooting

### 12.1 Perintah Monitoring Harian

```bash
# Status semua container
docker ps

# Resource usage (CPU, RAM)
docker stats

# Log API (50 baris terakhir)
docker logs beritakarya_api --tail=50

# Log database
docker logs beritakarya_db --tail=50

# Log Nginx
sudo tail -f /var/log/nginx/error.log
```

### 12.2 Masuk ke dalam Container

```bash
# Masuk ke shell container API
docker exec -it beritakarya_api sh

# Masuk ke psql (database)
docker exec -it beritakarya_db psql -U postgres -d beritakarya_prod
```

### 12.3 Restart Container Tertentu

```bash
# Restart API saja
docker compose -f /opt/beritakarya/infra/docker/docker-compose.backend.yml restart api

# Restart semua
docker compose -f /opt/beritakarya/infra/docker/docker-compose.backend.yml restart
```

### 12.4 Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| API tidak bisa connect ke DB | Cek `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` di `.env`. Pastikan host adalah `postgres` (nama service Docker), bukan `localhost`. |
| SSL Error di Nginx | Cek path `/etc/ssl/beritakarya/fullchain.pem` dan `privkey.pem` sudah ada. |
| Container API terus restart | Jalankan `docker logs beritakarya_api` untuk melihat error. Biasanya karena env variable yang salah. |
| Meilisearch tidak bisa diakses | Cek `MEILISEARCH_KEY` di `.env` sudah benar. |
| CORS Error di browser | Pastikan `CORS_ORIGIN` di `.env` sudah mencantumkan domain frontend. |
| Rate limit terlalu ketat | Periksa konfigurasi di `infra/nginx/nginx.prod.conf` atau di `src/lib/rateLimit.ts`. |

---

## 📁 Struktur File di VPS Setelah Setup

```
/opt/beritakarya/              ← Root project (di-clone dari GitHub)
├── apps/
├── infra/
│   ├── docker/
│   │   ├── .env               ← ⚠️  File ini dibuat manual, TIDAK ada di GitHub
│   │   └── docker-compose.backend.yml
│   ├── nginx/
│   │   └── nginx.prod.conf    ← Disalin ke /etc/nginx/nginx.conf
│   └── scripts/
│       ├── setup-server.sh
│       ├── setup-ssl.sh
│       └── backup-database.sh
└── ...

/etc/ssl/beritakarya/
├── fullchain.pem              ← Symlink ke Let's Encrypt cert
└── privkey.pem                ← Symlink ke Let's Encrypt key

/var/log/beritakarya/         ← Log files
/var/backups/beritakarya/     ← Database backup files
```

---

## ✅ Checklist Production

Sebelum go-live, pastikan semua item ini sudah selesai:

- [ ] VPS sudah diupdate dan secure
- [ ] Docker & Docker Compose terinstall
- [ ] UFW firewall aktif (hanya port 22, 80, 443)
- [ ] Fail2Ban aktif
- [x] DNS domain sudah diarahkan ke IP VPS
- [ ] Nginx terinstall dan berjalan
- [ ] SSL certificate sudah terpasang dan valid
- [ ] Auto-renewal SSL sudah dikonfigurasi
- [x] File `infra/docker/.env` sudah diisi dengan nilai production yang aman
- [ ] Semua Docker containers berstatus `Up (healthy)`
- [ ] Health check endpoint mengembalikan `{"status":"healthy"}`
- [ ] HTTPS berfungsi untuk `api.beritakarya.co`
- [ ] Backup database sudah dikonfigurasi
- [ ] Log rotation sudah dikonfigurasi
- [x] `JWT_SECRET` dan `RESET_SECRET` sudah menggunakan nilai acak yang kuat

---

*Dokumen ini dibuat berdasarkan arsitektur project BeritaKarya versi production-ready.*
