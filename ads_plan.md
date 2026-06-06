# Ads System — Analysis & Fix Plan

> Dokumentasi lengkap sistem iklan BeritaKarya: arsitektur, temuan issue, dan rencana perbaikan.
> Dibuat: 2026-06-06

---

## 1. Arsitektur Sistem

### 1.1 Database (Prisma Schema)

| Model | Fungsi | Lokasi |
|-------|--------|--------|
| `Advertisement` | Slot iklan aktif per site (1 record per slot per site) | `apps/api/prisma/schema.prisma:185-200` |
| `AdPackage` | Katalog paket iklan (nama, slot, durasi, harga, format) | `apps/api/prisma/schema.prisma:491-503` |
| `AdBooking` | Transaksi pemesanan iklan oleh advertiser | `apps/api/prisma/schema.prisma:506-532` |

**Enums:**
- `PaymentStatus`: `PENDING` → `VERIFYING` → `PAID` / `REJECTED`
- `AdStatus`: `PENDING_REVIEW` → `ACTIVE` → `COMPLETED` / `REJECTED`

**Role:** `advertiser` (added via migration `20260519000000`)

### 1.2 Ad Slots (4 Slot)

| Slot ID | Nama | Ukuran | Penempatan |
|---------|------|--------|------------|
| `leaderboard` | Leaderboard Atas | 970×90px (mobile: 320×50) | Top homepage |
| `rectangle` | Sidebar Rectangle Utama | 300×250px | Sidebar homepage + artikel |
| `rectangle_secondary` | Sidebar Rectangle Sekunder | 300×250px | Sidebar artikel (posisi ke-2) |
| `in_feed` | In-Feed Homepage | 300×250px | Antara artikel di homepage |

**Definisi:** `apps/web/lib/constants.ts:89-169` (`AD_SLOT_DEFINITIONS`)

### 1.3 Slot Coverage per Halaman

| Slot | Homepage | Artikel | Dashboard |
|------|----------|---------|-----------|
| `leaderboard` | ✅ | ❌ | ✅ |
| `rectangle` | ✅ (conditional) | ✅ | ✅ |
| `rectangle_secondary` | ❌ | ✅ | ✅ |
| `in_feed` | ✅ | ❌ | ✅ |

> ⚠️ `rectangle` di homepage hanya tampil jika `siteSettings.featuredVideo` tidak ada.

### 1.4 API Endpoints (`/api/v1/ads`)

**File:** `apps/api/src/modules/ad/ad.controller.ts`

#### Public (Tanpa Auth)

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/public?site=<id>` | Ambil iklan aktif untuk ditampilkan |
| `POST` | `/track/:id?action=impression\|click` | Track impression/click |

#### Admin (superadmin/wapimred)

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/` | List semua iklan site (paginated) |
| `POST` | `/` | Upsert iklan per slot |
| `PATCH` | `/:id` | Update iklan |
| `DELETE` | `/:id` | Hapus iklan |
| `GET` | `/packages` | List paket aktif |
| `POST` | `/packages` | Buat paket baru |
| `PATCH` | `/packages/:id` | Update paket |
| `DELETE` | `/packages/:id` | Hapus paket |
| `GET` | `/bookings/all` | List semua booking |
| `POST` | `/bookings/:id/approve` | Approve booking → sync ke Advertisement |
| `POST` | `/bookings/:id/reject` | Tolak booking |

#### Advertiser

| Method | Path | Fungsi |
|--------|------|--------|
| `POST` | `/bookings` | Buat booking baru |
| `GET` | `/bookings/my` | Riwayat booking sendiri |
| `POST` | `/bookings/:id/pay` | Upload bukti bayar |

### 1.5 Frontend Components

| Component | File | Fungsi |
|-----------|------|--------|
| `AdSpace` | `apps/web/components/ui/AdSpace.tsx` | Render iklan di halaman publik + tracking |
| Ads Dashboard | `apps/web/app/[site]/dashboard/ads/page.tsx` | Panel admin & advertiser (1323 lines) |
| Ad Order Page | `apps/web/app/[site]/dashboard/ads/order/page.tsx` | 4-step wizard pemesanan |
| Marketing Page | `apps/web/components/marketing/AdsMarketingPage.tsx` | Landing page promosi iklan |

### 1.6 Business Flow

```
Advertiser daftar (role=advertiser)
        ↓
Browse paket di /p/ads atau dashboard
        ↓
Booking: pilih paket → upload kreatif → set tanggal → upload bukti bayar
        ↓
Status: PENDING_REVIEW → (bayar) → VERIFYING
        ↓
Superadmin review → APPROVE atau REJECT
        ↓
APPROVE → auto-sync ke Advertisement table (upsert siteId+slot)
        ↓
Iklan tampil di halaman publik → Impression/Click ter-tracking
```

---

## 2. Temuan Issue

### 2.1 CRITICAL

| # | Issue | Detail | File |
|---|-------|--------|------|
| 1 | **No deduplikasi impression/click** | Endpoint `/track/:id` terbuka tanpa auth, rate limit, atau fingerprint. Counter bisa di-inflate trivially oleh siapa pun | `ad.controller.ts:10-33` |
| 2 | **XSS via `dangerouslySetInnerHTML`** | Field `code` di `Advertisement` bisa inject arbitrary HTML/JS ke semua visitor site. Jika admin account compromised → XSS massal | `AdSpace.tsx:132`, `ad.controller.ts:82` |

### 2.2 HIGH

| # | Issue | Detail | File |
|---|-------|--------|------|
| 3 | **`AdBooking.impressions/clicks` selalu 0** | Tracking endpoint hanya update `Advertisement`, tidak pernah update `AdBooking`. Dashboard advertiser selalu tampil 0 impression, 0 click, 0% CTR | `ad.controller.ts:10-33`, `dashboard/ads/page.tsx:316-345` |
| 4 | **Tidak ada cron/expiry** | Booking `ACTIVE` tidak pernah auto-rotate ke `COMPLETED` saat `endDate` lewat. Enum `COMPLETED` ada tapi dead — tidak ada yang set. Iklan tampil selamanya | `ad.controller.ts`, `cron/cron.router.ts` |
| 5 | **Tidak ada rate limiting** | Tracking endpoint mounted tanpa rate limiter. Endpoint lain pakai `apiLimiter`/`authLimiter` | `ad.controller.ts` |
| 6 | **`/bookings/:id/pay` tidak ada ownership check** | Semua advertiser bisa update bukti bayar booking orang lain dengan brute-force ID | `ad.controller.ts:206-221` |
| 7 | **Tidak ada validasi booking creation** | Tidak cek: package exists & active, `endDate > startDate`, `startDate` tidak di masa lalu, double-booking slot yang sama | `ad.controller.ts:169` |
| 8 | **Counter reset saat approve** | Setiap approve booking, counter `impressions`/`clicks` di `Advertisement` di-reset ke 0. History stats hilang | `ad.controller.ts:329-330` |

### 2.3 MEDIUM

| # | Issue | Detail | File |
|---|-------|--------|------|
| 9 | **Iklan tampil selamanya** | Setelah approve, `Advertisement` row tidak pernah di-deactivate meski `endDate` booking sudah lewat | `ad.controller.ts:293-346` |
| 10 | **Tidak ada guard overlapping booking** | Multiple booking untuk site+slot yang sama bisa overlap tanggal. Yang terakhir di-approve akan overwrite yang sebelumnya | `ad.controller.ts` |
| 11 | **Booking creation tidak validasi site access** | Tidak ada `siteMiddleware` di booking endpoints. Advertiser bisa booking slot di site mana pun | `ad.controller.ts:169` |
| 12 | **Approve tidak verifikasi payment status** | Endpoint approve bisa dijalankan pada booking dengan status apa pun (termasuk yang belum bayar atau sudah ditolak) | `ad.controller.ts:293-346` |
| 13 | **Click tracking hilang saat navigasi** | Pakai `fetch()` async tanpa `sendBeacon()`. Request bisa cancelled saat browser navigate ke halaman baru | `AdSpace.tsx:89-96` |
| 14 | **`durationDays` tidak di-enforce** | Package defines durasi, tapi wizard tidak auto-set `endDate`. Advertiser bebas pilih tanggal → bisa booking 7-hari-package untuk 30 hari | `dashboard/ads/page.tsx:369-608` |
| 15 | **5 API calls redundant** | Setiap `AdSpace` component fetch `/ads/public` secara independen. 5 slot = 5 request ke endpoint yang sama, tanpa cache/shared state | `AdSpace.tsx` |

### 2.4 LOW

| # | Issue | Detail | File |
|---|-------|--------|------|
| 16 | **`ad.service.ts` dead code** | File tidak di-import di mana pun. Semua logic inlined di controller | `ad.service.ts` (22 lines) |
| 17 | **`allowedFormat` tidak di-enforce** | Package bisa restrict ke IMAGE/VIDEO/ALL, tapi form booking terima URL apa pun | `dashboard/ads/page.tsx` |
| 18 | **Rekening bank hardcode** | Info pembayaran (BCA, Mandiri, QRIS) hardcode di frontend, tidak configurable per site | `dashboard/ads/page.tsx:547-559` |
| 19 | **`/bookings/all` tidak ada pagination** | Semua booking di-return sekaligus. Akan jadi masalah performa saat data banyak | `ad.controller.ts:284-290` |
| 20 | **Slot `slot` di DB tidak ada enum constraint** | Prisma pakai `String` bebas, validasi hanya di TypeScript layer. Bisa insert slot name invalid via API langsung | `schema.prisma:188` |

---

## 3. Rencana Perbaikan (Fix Plan)

### Phase 1 — Critical & High Priority

#### 3.1 Rate Limiting & Deduplikasi Tracking
- **File:** `ad.controller.ts`
- **Action:**
  - Tambah rate limiter middleware khusus tracking (misal: 10 req/detik per IP)
  - Implementasi deduplikasi impression per IP + ad ID (TTL 30 menit via in-memory/Redis)
  - Pertimbangkan fingerprinting (IP + User-Agent hash)
- **Estimasi:** Sedang

#### 3.2 Update Tracking untuk AdBooking
- **File:** `ad.controller.ts`
- **Action:**
  - Saat track impression/click, cari `AdBooking` yang `ACTIVE` untuk `Advertisement` tersebut
  - Increment juga `AdBooking.impressions` / `AdBooking.clicks`
  - Sinkronisasi data agar dashboard advertiser menampilkan stats yang benar
- **Estimasi:** Sedang

#### 3.3 Cron Job Auto-Expiry
- **File:** `apps/api/src/cron/cron.router.ts` (baru)
- **Action:**
  - Buat cron job `ad-expiry` yang jalan setiap jam
  - Cari `AdBooking` dengan `status=ACTIVE` dan `endDate < now()`
  - Set `status=COMPLETED`
  - Nonaktifkan `Advertisement` row terkait (`isActive=false`)
  - Opsional: simpan counter final sebelum reset
- **Estimasi:** Sedang

#### 3.4 Ownership Check & Validasi Booking
- **File:** `ad.controller.ts`
- **Action:**
  - `/bookings/:id/pay`: tambah check `booking.userId === req.user.userId`
  - `/bookings`: validasi `packageId` exists & active, `endDate > startDate`, `startDate >= today`
  - `/bookings/:id/approve`: verifikasi `paymentStatus === 'VERIFYING'`
  - Tambah `siteMiddleware` ke booking endpoints
- **Estimasi:** Sedang

#### 3.5 Sanitasi HTML Code Field
- **File:** `ad.controller.ts`, `AdSpace.tsx`
- **Action:**
  - Backend: sanitasi `code` field dengan DOMPurify sebelum simpan
  - Frontend: pertimbangkan pakai `<iframe sandbox>` untuk render HTML code
  - Atau: restrict `code` hanya untuk trusted pattern (AdSense specific)
- **Estimasi:** Sedang

### Phase 2 — Medium Priority

#### 3.6 Enforce Duration & Prevent Overlap
- **File:** `ad.controller.ts`, `dashboard/ads/page.tsx`
- **Action:**
  - Auto-set `endDate = startDate + package.durationDays` (frontend & backend)
  - Sebelum approve, cek tidak ada booking lain untuk slot+site yang overlap tanggal
  - Tampilkan warning di UI admin jika overlap terdeteksi
- **Estimasi:** Sedang

#### 3.7 Click Tracking Reliability
- **File:** `AdSpace.tsx`
- **Action:**
  - Ganti `fetch()` dengan `navigator.sendBeacon()` untuk click tracking
  - Fallback ke `fetch()` dengan `keepalive: true` untuk browser yang tidak support
- **Estimasi:** Kecil

#### 3.8 Optimasi Fetch — Shared Cache
- **File:** `AdSpace.tsx`
- **Action:**
  - Implementasi shared fetch cache (React context / SWR / simple Map with TTL)
  - Semua `AdSpace` di satu page share data yang sama
  - Kurangi 5 API calls menjadi 1 per page load
- **Estimasi:** Sedang

#### 3.9 Preserve Counter History
- **File:** `ad.controller.ts`
- **Action:**
  - Saat approve booking baru, simpan counter lama ke `AdBooking` yang sebelumnya (atau log terpisah)
  - Jangan reset counter ke 0 — lanjutkan dari angka sebelumnya, atau pisahkan counter per campaign
- **Estimasi:** Sedang

### Phase 3 — Low Priority & Cleanup

#### 3.10 Cleanup Dead Code
- **Action:** Hapus `ad.service.ts` yang tidak digunakan

#### 3.11 Enforce `allowedFormat`
- **File:** `ad.controller.ts`, `dashboard/ads/page.tsx`
- **Action:** Validasi URL file extension sesuai `allowedFormat` package

#### 3.2 Configurable Bank Details
- **File:** `siteSettings` schema
- **Action:** Pindahkan info rekening ke site settings, bukan hardcode

#### 3.13 Pagination `/bookings/all`
- **File:** `ad.controller.ts`
- **Action:** Tambah `page` & `limit` query params, default 20 per page

#### 3.14 DB-Level Slot Enum
- **File:** `schema.prisma`
- **Action:** Pertimbangkan Prisma enum untuk field `slot` di `Advertisement` (atau validasi ketat di API layer)

---

## 4. Status Tracking

| Phase | Task | Status | Assignee | Notes |
|-------|------|--------|----------|-------|
| 1 | Rate limiting & deduplikasi | ✅ Done | | `adTrackingLimiter` (30 req/min) + Redis dedup (30 min TTL) |
| 1 | Update tracking untuk AdBooking | ✅ Done | | `syncTrackingToBooking()` increment AdBooking counters |
| 1 | Cron job auto-expiry | ✅ Done | | `ad-expiry.ts` + registered di `cron.router.ts` |
| 1 | Ownership check & validasi | ✅ Done | | Ownership check, package/date/approve validation |
| 1 | Sanitasi HTML code | ✅ Done | | `sanitizeAdCode()` blocks dangerous patterns |
| 2 | Enforce duration & prevent overlap | ⬜ Pending | | |
| 2 | Click tracking reliability | ✅ Done | | `navigator.sendBeacon()` with fallback |
| 2 | Optimasi fetch shared cache | ⬜ Pending | | |
| 2 | Preserve counter history | ⬜ Pending | | |
| 3 | Cleanup dead code | ⬜ Pending | | |
| 3 | Enforce allowedFormat | ⬜ Pending | | |
| 3 | Configurable bank details | ⬜ Pending | | |
| 3 | Pagination bookings/all | ⬜ Pending | | |
| 3 | DB-level slot enum | ⬜ Pending | | |

---

## 5. Referensi File

| File | Path |
|------|------|
| Prisma Schema | `apps/api/prisma/schema.prisma` |
| Ad Controller | `apps/api/src/modules/ad/ad.controller.ts` |
| Ad Service | `apps/api/src/modules/ad/ad.service.ts` |
| Rate Limit | `apps/api/src/lib/rateLimit.ts` |
| Redis Cache | `apps/api/src/lib/redis.ts` |
| Cron Router | `apps/api/src/cron/cron.router.ts` |
| Ad Expiry Cron | `apps/api/src/cron/ad-expiry.ts` |
| AdSpace Component | `apps/web/components/ui/AdSpace.tsx` |
| Slot Constants | `apps/web/lib/constants.ts` |
| Dashboard Ads | `apps/web/app/[site]/dashboard/ads/page.tsx` |
| Ad Order Page | `apps/web/app/[site]/dashboard/ads/order/page.tsx` |
| Marketing Page | `apps/web/components/marketing/AdsMarketingPage.tsx` |
| Homepage | `apps/web/components/pages/SiteHomePage.tsx` |
| Article Page | `apps/web/app/[site]/artikel/[slug]/page.tsx` |
| Dashboard Layout | `apps/web/app/[site]/dashboard/layout.tsx` |
| Dashboard Home | `apps/web/app/[site]/dashboard/page.tsx` |

---

## 6. Changelog Phase 1 (2026-06-06)

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `apps/api/src/lib/rateLimit.ts` | Tambah `adTrackingLimiter` — 30 req/menit per IP |
| `apps/api/src/modules/ad/ad.service.ts` | Rewrite: `isDuplicateImpression()`, `syncTrackingToBooking()`, `sanitizeAdCode()` |
| `apps/api/src/modules/ad/ad.controller.ts` | Rate limit + dedup tracking, ownership check, booking validation, approve verification, HTML sanitasi |
| `apps/api/src/cron/ad-expiry.ts` | **Baru**: cron job auto-expiry booking ACTIVE → COMPLETED |
| `apps/api/src/cron/cron.router.ts` | Register endpoint `POST /ad-expiry` |
| `apps/web/components/ui/AdSpace.tsx` | Click tracking pakai `navigator.sendBeacon()` |
