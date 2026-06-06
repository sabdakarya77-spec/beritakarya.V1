# 🔍 AUDIT REPORT — BeritaKarya v1

**Tanggal Audit:** 6 Juni 2026
**Lingkup:** Keseluruhan project (arsitektur, keamanan, kode, infrastruktur, testing)
**Status:** Tidak ada file yang diubah selama proses audit ini

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur & Teknologi](#2-arsitektur--teknologi)
3. [Struktur Project](#3-struktur-project)
4. [Temuan Kritis (CRITICAL)](#4-temuan-kritis-critical)
5. [Temuan Tinggi (HIGH)](#5-temuan-tinggi-high)
6. [Temuan Sedang (MEDIUM)](#6-temuan-sedang-medium)
7. [Temuan Rendah (LOW)](#7-temuan-rendah-low)
8. [Analisis Keamanan](#8-analisis-keamanan)
9. [Analisis Kode & TypeScript](#9-analisis-kode--typescript)
10. [Analisis Database](#10-analisis-database)
11. [Analisis Frontend](#11-analisis-frontend)
12. [Analisis Backend API](#12-analisis-backend-api)
13. [Testing & CI/CD](#13-testing--cicd)
14. [SEO & Performa](#14-seo--performa)
15. [Rekomendasi Prioritas](#15-rekomendasi-prioritas)
16. [Lampiran](#16-lampiran)

---

## 1. Ringkasan Eksekutif

BeritaKarya v1 adalah platform CMS berita multi-situs berbasis Turborepo monorepo dengan arsitektur yang **solid secara konseptual** — mencakup multisite, editorial workflow, AI integration, sistem iklan, dan KYC verification. Namun, audit ini menemukan **beberapa masalah keamanan kritis** yang harus segera ditangani, serta konsistensi kode yang perlu diperbaiki.

### Skor Keseluruhan

| Dimensi | Skor | Catatan |
|---------|------|---------|
| **Keamanan** | ⚠️ 5/10 | .env produksi terekspos, CSRF tidak aktif, cron endpoint tidak terproteksi |
| **Kode & TypeScript** | 6/10 | `strict: false` di web, 457+ penggunaan `any`, lint rules dimatikan |
| **Arsitektur** | 8/10 | Pola monorepo bersih, multisite solid, modular |
| **Testing** | 4/10 | Web hanya 3 test file untuk 100+ komponen, E2E hanya 1 spec |
| **Dokumentasi** | 7/10 | README lengkap, tapi `docs/` kosong, tidak ada CLAUDE.md |
| **Infrastruktur** | 6/10 | CI/CD ada, tapi Docker tidak ada, deployment manual |

---

## 2. Arsitektur & Teknologi

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Monorepo | Turborepo + pnpm 10+ workspaces |
| Backend | Express.js 4, TypeScript, ts-node-dev |
| Frontend | Next.js 16 (App Router), React 18, TypeScript |
| Database | PostgreSQL 15 via Supabase, Prisma ORM 5 |
| Cache | Redis 7 (ioredis) — optional |
| Search | Meilisearch v1.6 (circuit breaker via opossum) |
| AI | OpenAI API (GPT-4o default) |
| Auth | JWT in HttpOnly cookies + CSRF tokens |
| Styling | Tailwind CSS 3, Framer Motion |
| Editor | Tiptap 3 (10+ custom extensions) |
| State | Zustand 4 |
| File Storage | Supabase Storage via S3 API (AWS SDK) |
| Image Processing | Sharp |
| Email | Nodemailer (SMTP) |
| Monitoring | Sentry, Winston logging |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions |
| Deployment | Railway (API), Vercel (Web) |

### Pola Arsitektur Utama

- **Multisite CMS**: Setiap site punya domain, settings, kategori, user, dan konten sendiri. Site scoping middleware memastikan isolasi data.
- **Block-based article content**: Artikel menggunakan JSON `blocks` field (mirip Notion/Gutenberg), powered by Tiptap di frontend.
- **Editorial workflow**: Siklus hidup artikel dari draft → submitted → review → revision → approved → scheduled → published.
- **AI integration**: Fitur OpenAI untuk rewrite, grammar, readability, image analysis, dengan kuota per-user/per-role.
- **Ad system**: Platform iklan lengkap dengan packages, booking, payment verification, impression/click tracking.
- **PWA support**: Service worker, install prompts.

---

## 3. Struktur Project

```
beritakarya-v1/
├── apps/
│   ├── api/                    # Backend REST API (Express.js + TypeScript)
│   │   ├── prisma/             # Schema & migrations (17 models, 13 migrations)
│   │   └── src/
│   │       ├── modules/        # Feature modules (article, auth, user, site, kyc, comment, media, analytics, ai, ad, notification, invitation)
│   │       ├── middleware/      # Auth, security, sanitization, rate limiting, site scoping
│   │       ├── lib/            # Redis, logger, env validation, circuit breaker
│   │       ├── admin/          # Admin router
│   │       └── utils/          # AppError, asyncHandler
│   └── web/                    # Frontend (Next.js 16 App Router)
│       ├── app/                # Routes (public + dashboard)
│       ├── components/         # ~80+ komponen (editor, dashboard, layout, ui, berita, legal)
│       ├── hooks/              # 5 custom hooks (useAI, useImageUpload, dll.)
│       ├── store/              # 5 Zustand stores (auth, editor, layout, site, toast)
│       └── lib/                # Utilities, API client, constants, metadata
├── packages/
│   ├── types/                  # Shared TypeScript types (article, block, category, site, user)
│   ├── utils/                  # Shared utilities (slug, format, security, articleBlocks)
│   └── config/                 # Shared config (AI config, site config)
├── .github/workflows/ci.yml   # CI pipeline
├── scripts/                    # Utility scripts
├── scratch/                    # Scratch files (should be cleaned)
└── docs/                       # Empty (referenced docs not populated)
```

### Database Models (17 total)

| Model | Purpose |
|-------|---------|
| `Site` | Multisite CMS settings |
| `User` | User dengan KYC fields, AI quota |
| `Article` | Block-based content, editorial workflow |
| `ArticleVersion` | Version history |
| `Category` | Hierarchical (parent-child) |
| `SiteCategory` | Many-to-many site-category |
| `Media` | Image uploads dengan blur hash |
| `Comment` | Nested comments dengan moderation |
| `Advertisement` / `AdPackage` / `AdBooking` | Sistem iklan lengkap |
| `RefreshToken` / `BlacklistedToken` | JWT token management |
| `AIUsage` | AI request tracking |
| `PageView` | Analytics |
| `AuditLog` | Audit trail |
| `Notification` | In-app notifications |
| `KYCViewLog` | Audit trail KYC access |
| `Invitation` | Admin invitation system |
| `RoleQuota` | AI quota per role |
| `NewsletterSubscriber` | Email newsletter |

### Role System (6 roles)

| Role | Akses |
|------|-------|
| `superadmin` | Full system access, semua site |
| `wapimred` | Editorial management, review, KYC approval |
| `reporter` | Article creation, media upload |
| `kontributor` | Mirip reporter tapi kontributor eksternal |
| `advertiser` | Portal manajemen iklan saja |
| `reader` | Pembaca publik (tidak ada dashboard) |

---

## 4. Temuan Kritis (CRITICAL)

### 🔴 C-01: File `.env` Produksi Terekspos di Git History

**Lokasi:** `apps/api/.env` (4361 bytes, tracked in git)
**Dampak:** Kredensial produksi terekspos publik

Data yang terekspos:
- Supabase PostgreSQL credentials (host, user, password)
- `JWT_SECRET` — bisa dipakai伪造 token
- `RESET_SECRET` — bisa dipakai reset password siapapun
- `S3_ACCESS_KEY` + `S3_SECRET_KEY` — akses penuh ke storage

**Tindakan yang diperlukan:**
1. **SEGERA** rotasi semua kredensial yang terekspos
2. Hapus file dari git history menggunakan BFG Repo-Cleaner atau `git filter-branch`
3. Tambahkan pre-commit hook (`detect-secrets` atau `gitleaks`)

---

### 🔴 C-02: `CRON_SECRET` Masih Placeholder

**Lokasi:** `apps/api/.env` — `CRON_SECRET=generate-with-openssl-rand-hex-32-here`
**Dampak:** Semua cron endpoint bisa diakses tanpa autentikasi

**Tindakan:** Generate secret baru dengan `openssl rand -hex 32` dan set di environment.

---

### 🔴 C-03: `CSRF_SECRET` Kosong

**Lokasi:** `apps/api/.env` — `CSRF_SECRET=` (empty)
**Dampak:** CSRF protection tidak aktif. Attacker bisa membuat form yang mengirim request terotentikasi dari domain lain.

**Tindakan:** Set CSRF_SECRET dan verifikasi middleware CSRF berjalan.

---

## 5. Temuan Tinggi (HIGH)

### 🟠 H-01: `dangerouslySetInnerHTML` Tanpa Sanitasi pada Ad Code

**Lokasi:** `apps/web/components/ui/AdSpace.tsx`
**Dampak:** Jika akun admin terkompromi, attacker bisa inject JavaScript arbitrer ke setiap halaman yang menampilkan iklan.

**Tindakan:** Tambahkan sanitasi DOMPurify sebelum render ad code, atau gunakan sandboxed iframe.

---

### 🟠 H-02: Rate Limiting Tidak Efektif di Serverless

**Lokasi:** `apps/api/src/lib/rateLimit.ts`
**Dampak:** Tanpa Redis yang dikonfigurasi, in-memory rate limiter reset setiap invocation di Vercel serverless.

**Tindakan:** Konfigurasi Redis untuk produksi, atau gunakan platform-native rate limiting (Vercel Firewall, Cloudflare).

---

### 🟠 H-03: `change-password` Validasi Password Lebih Lemah

**Lokasi:** `apps/api/src/modules/auth/auth.controller.ts` (line ~190)
**Dampak:** Registration memerlukan uppercase, lowercase, number, special char. Change-password hanya cek `length < 6`.

**Tindakan:** Gunakan `validatePassword()` yang sama untuk kedua endpoint.

---

### 🟠 H-04: `strict: false` di Web App TypeScript

**Lokasi:** `apps/web/tsconfig.json` (line 10)
**Dampak:** Tidak ada strict null checks, strict function types, atau implicit any errors. `any` bisa propagate tanpa peringatan.

**Tindakan:** Set `strict: true` dan perbaiki error yang muncul secara bertahap.

---

### 🟠 H-05: ESLint Rules Kritis Dimatikan

**Lokasi:** `.eslintrc.cjs`
**Dampak:**
- `@typescript-eslint/no-explicit-any: off` — 457+ penggunaan `any` tidak terdeteksi
- `react-hooks/exhaustive-deps: off` — stale closure bugs tidak terdeteksi
- `no-empty: off` — empty catch blocks menyembunyikan error
- `@typescript-eslint/no-unused-vars: off` di CI

**Tindakan:** Aktifkan rules secara bertahap, mulai dari `warn` lalu `error`.

---

### 🟠 H-06: Sentry Integration Dikomentari

**Lokasi:** `apps/web/app/global-error.tsx` (line 17)
**Dampak:** Error di production tidak ter-track di frontend.

**Tindakan:** Uncomment dan pastikan Sentry DSN dikonfigurasi.

---

### 🟠 H-07: Tidak Ada Supabase Row-Level Security (RLS)

**Lokasi:** Semua tabel di Supabase
**Dampak:** Semua keamanan tergantung pada Express middleware. Jika connection string terekspos, tidak ada pertahanan di level database.

**Tindakan:** Enable RLS pada tabel sensitif (User, KYCViewLog, RefreshToken) sebagai defense-in-depth.

---

## 6. Temuan Sedang (MEDIUM)

### 🟡 M-01: Next.js Frontend Tidak Punya Security Headers

**Lokasi:** `apps/web/next.config.mjs`
**Dampak:** Frontend di Vercel tidak memiliki CSP, X-Frame-Options, dll. (hanya API yang punya).

**Tindakan:** Tambahkan `headers()` di `next.config.mjs`.

---

### 🟡 M-02: CORS Wildcard Terlalu Luas

**Lokasi:** `apps/api/src/main.ts` — pattern `*.vercel.app`
**Dampak:** Semua Vercel deployment bisa membuat credentialed requests.

**Tindakan:** Spesifikkan domain Vercel project (e.g., `beritakarya-web.vercel.app`).

---

### 🟡 M-03: 457+ Penggunaan `any` di Seluruh Codebase

**Lokasi:** 248 di API (56 files), 209 di Web (64 files)
**Dampak:** TypeScript kehilangan nilai proteksi tipenya.

**Tindakan:** Prioritaskan file hot-spot: `SiteHomePage.tsx` (36), `TiptapEditor.tsx` (12), `article.service.test.ts` (27).

---

### 🟡 M-04: `console.error`/`console.log` di Production Code

**Lokasi:** 34 occurrences di 9 file API production
**Dampak:** Tidak ter-standardize, tidak ter-rotate, tidak ter-filter.

**Tindakan:** Gunakan `logger.error()` dari Winston yang sudah ada.

---

### 🟡 M-05: Test Coverage Sangat Rendah di Frontend

**Lokasi:** `apps/web/` — hanya 3 test files untuk 100+ komponen
**Dampak:** Regresi tidak terdeteksi.

**Tindakan:** Prioritaskan test untuk critical paths: editor, auth flow, article rendering.

---

### 🟡 M-06: Tidak Ada Custom 404 Page

**Lokasi:** Tidak ada `not-found.tsx` di level manapun
**Dampak:** User melihat default Next.js 404 page.

**Tindakan:** Buat `not-found.tsx` di root dan `[site]` level.

---

### 🟡 M-07: Sitemap Tidak Di-cache

**Lokasi:** `apps/web/app/[site]/sitemap.ts` — `cache: 'no-store'`
**Dampak:** Setiap request sitemap memicu 3 API calls.

**Tindakan:** Gunakan `next: { revalidate: 3600 }` atau sejenisnya.

---

### 🟡 M-08: `jsx-a11y` Plugin Terinstall Tapi Tidak Dikonfigurasi

**Lokasi:** `.eslintrc.cjs`
**Dampak:** Tidak ada accessibility linting yang aktif.

**Tindakan:** Tambahkan rules `jsx-a11y` ke ESLint config.

---

### 🟡 M-09: Article CRUD Tanpa Database Transactions

**Lokasi:** `apps/api/src/modules/article/article.service.ts`
**Dampak:** Gagal mid-operation bisa meninggalkan state tidak konsisten (article tanpa audit log, version tanpa article).

**Tindakan:** Wrap create/update dalam `$transaction`.

---

### 🟡 M-10: Duplicated Select Clauses di Repository

**Lokasi:** `apps/api/src/modules/article/article.repository.ts`
**Dampak:** Maintenance burden, risk of inconsistency.

**Tindakan:** Extract ke constant `ARTICLE_SELECT_FIELDS`.

---

### 🟡 M-11: Mixed Content Artifacts di Legal Pages

**Lokasi:** `apps/web/lib/legalPages.ts`
**Dampak:** Fallback legal content mengandung karakter Rusia (Cyrillic) dan Cina yang tercampur dengan teks Indonesia — kemungkinan copy-paste error.

**Contoh:** `редакции` (Rusia), `做任何` (Cina) di tengah teks Indonesia.

**Tindakan:** Bersihkan fallback content, pastikan encoding konsisten.

---

## 7. Temuan Rendah (LOW)

### 🟢 L-01: Scratch Files di Production Source

**Lokasi:**
- `apps/api/src/scratch_test.ts`
- `apps/api/temp_homepage.html`
- `apps/api/test-upload.js`
- `apps/api/test-database-readiness.ts`
- `apps/api/verify-database.js` + `verify-database.ts` (duplikat)

**Tindakan:** Hapus file-file ini.

---

### 🟢 L-02: 21 File Menggunakan Raw `<img>` Tags

**Lokasi:** Terutama di dashboard/admin pages
**Dampak:** Bypass Next.js Image optimization.

**Tindakan:** Migrasi ke `SmartImage` component secara bertahap.

---

### 🟢 L-03: Comment Content Tanpa Max-Length Validation

**Lokasi:** `apps/api/src/modules/comment/comment.controller.ts`
**Tindakan:** Tambahkan Zod schema dengan max-length.

---

### 🟢 L-04: `storage.service.ts` Bypass Validated Env Object

**Lokasi:** `apps/api/src/modules/storage/storage.service.ts`
**Dampak:** Membaca `process.env` langsung, tidak melalui Zod validation.

**Tindakan:** Gunakan `env` object dari `lib/env.ts`.

---

### 🟢 L-05: ClamAV Malware Scanning Stubbed

**Lokasi:** `apps/api/src/modules/kyc/kyc.controller.ts`
**Dampak:** Upload file tidak discan untuk malware.

**Tindakan:** Implementasi ClamAV atau layanan scanning lain.

---

### 🟢 L-06: `@deprecated` Export Masih Ada

**Lokasi:** `apps/api/src/modules/article/article.repository.ts:239`
**Tindakan:** Hapus atau tandai untuk removal.

---

### 🟢 L-07: Mixed `axios` dan `fetch` di Web App

**Lokasi:** `apps/web/` — stores pakai `axios`, pages pakai `fetch`
**Tindakan:** Standardisasi ke salah satu (prefer `fetch` untuk Next.js).

---

### 🟢 L-08: `data: data as any` di Prisma Update

**Lokasi:** `apps/api/src/modules/article/article.repository.ts:217`
**Dampak:** Bypass Prisma type safety.

**Tindakan:** Perbaiki type definition agar sesuai.

---

## 8. Analisis Keamanan

### 8.1 Authentication & Authorization

| Aspek | Status | Catatan |
|-------|--------|---------|
| JWT + HttpOnly Cookies | ✅ Baik | Access token 1 jam, refresh token 7 hari |
| Refresh Token Rotation | ✅ Baik | Token lama dihapus dan di-blacklist |
| Token Blacklisting | ✅ Baik | Logout memindahkan token ke BlacklistedToken |
| Password Hashing | ✅ Baik | bcrypt (salt 10 untuk register, 12 untuk change-password — inkonsisten tapi aman) |
| Password Validation | ⚠️ Inkonsisten | Registration: kuat. Change-password: lemah (hanya length >= 6) |
| Account Lockout | ✅ Baik | 5 gagal → lockout 15 menit (Redis atau in-memory) |
| Cross-site Login Prevention | ✅ Baik | User tidak bisa login dari subdomain lain |
| Email Enumeration Prevention | ✅ Baik | Forgot-password selalu return success |
| CSRF Protection | ❌ Tidak aktif | `CSRF_SECRET` kosong |
| Rate Limiting | ⚠️ Lemah | Tidak efektif tanpa Redis di serverless |
| Input Sanitization | ✅ Baik | DOMPurify dengan JSDOM, style hook |
| XSS Test Suite | ✅ Ada | Security test di `src/test/security.test.ts` |

### 8.2 SQL Injection Protection

- ✅ Semua query menggunakan Prisma ORM dengan parameterized queries
- ✅ Raw SQL menggunakan Prisma tagged template literals (`$queryRaw\`...\``)
- ✅ Tidak ada `queryRawUnsafe` atau string concatenation

### 8.3 CORS Configuration

- ✅ Allowed origins: `*.beritakarya.co`, `*.beritakarya.com`, localhost
- ⚠️ `*.vercel.app` wildcard terlalu luas
- ✅ Credentials enabled, methods terbatas

### 8.4 Security Headers (API)

| Header | Status |
|--------|--------|
| X-Frame-Options: DENY | ✅ |
| X-Content-Type-Options: nosniff | ✅ |
| Referrer-Policy | ✅ |
| Permissions-Policy | ✅ |
| HSTS | ✅ |
| CSP | ⚠️ `unsafe-inline` dan `unsafe-eval` di dev |

### 8.5 KYC Document Security

- ✅ File validation dengan Sharp (verify actual format, bukan hanya extension)
- ✅ 5MB limit, minimum 1000x800 resolution
- ✅ Signed URLs dengan 5-minute expiry
- ✅ Failed attempts tracking (3 gagal → lockout 24 jam)
- ✅ Audit logging untuk semua KYC document views
- ✅ IP anonymization sebelum logging
- ⚠️ ClamAV scanning stubbed (placeholder `return true`)

### 8.6 AI Quota System

- ✅ Per-user daily request limits dan monthly budget caps
- ✅ Role-based defaults dengan per-user overrides
- ✅ Feature-level access control per role
- ✅ Model restrictions per role
- ✅ Consent requirement sebelum AI usage
- ✅ Soft warnings di 80% quota

---

## 9. Analisis Kode & TypeScript

### 9.1 TypeScript Configuration

| App | `strict` | `no-explicit-any` | Catatan |
|-----|----------|-------------------|---------|
| Root | `true` | N/A | Baik |
| API | `true` (inherit) | `off` (ESLint) | Strict tapi lint dimatikan |
| Web | `false` (override) | `off` (ESLint) | **Tidak ada type safety** |

### 9.2 `any` Usage Hotspots

**Web App (209 occurrences, 64 files):**
- `SiteHomePage.tsx` — 36 occurrences
- `TiptapEditor.tsx` — 12 occurrences
- `editorStore.ts` — 7 occurrences
- `SmartImage.tsx` — 6 occurrences

**API (248 occurrences, 56 files):**
- `article.service.test.ts` — 27 occurrences
- `site.controller.ts` — 18 occurrences
- `user.controller.ts` — 14 occurrences

### 9.3 Error Handling Patterns

**Kekuatan:**
- `AppError` class dengan `statusCode`, `code`, `isOperational`
- `asyncHandler` wrapper untuk promise rejections
- Centralized error middleware handling Prisma, Zod, Multer, AppError errors
- Production 5xx errors menyembunyikan internal details

**Kelemahan:**
- Inkonsistensi antara `new AppError(...)` dan `Object.assign(new Error(...), { statusCode })`
- Banyak `catch (error: any)` tanpa type narrowing
- `(req as any).user` di beberapa controller padahal type augmentation sudah ada
- Sentry integration dikomentari di frontend error boundary

### 9.4 Code Duplication

- **`useAI.ts`** (505 lines): 10 hooks dengan struktur identik. Bisa di-reduce ke ~100 lines dengan factory pattern.
- **`article.repository.ts`**: Select clause yang sama diulang 6 kali.
- **`CATEGORY_COLORS`** di `constants.ts`: 40+ entries dengan full Tailwind class strings.

### 9.5 Komponen Besar (Perlu Decomposition)

| File | Lines | Masalah |
|------|-------|---------|
| `AIDashboard.tsx` | 864 | Mix data fetching, state, rendering |
| `TiptapEditor.tsx` | 485 | Helper functions 260+ lines dengan `any` |
| `Navbar.tsx` | 420 | Complex scroll, theme, categories, profile |
| `editorStore.ts` | 538 | Module-level side effects di luar store |
| `useAI.ts` | 505 | 10 hooks identik |

---

## 10. Analisis Database

### 10.1 Prisma Schema

- **17 models** dengan relationships yang well-defined
- **13 migrations** dari 2026-05-16 hingga 2026-06-04
- Proper use of enums (`Role`, `ArticleStatus`, `CommentStatus`, `KycStatus`)
- JSON fields untuk flexible data (`blocks`, `settings`, `socialLinks`)

### 10.2 Query Patterns

**Baik:**
- Explicit `select` clauses (bukan SELECT *)
- `Promise.all` untuk parallel queries
- Proper pagination dengan `skip`/`take`

**Perlu Perbaikan:**
- Article CRUD tidak menggunakan `$transaction`
- N+1 risk di notification loop saat submit for review
- `data: data as any` cast di update bypass type safety

### 10.3 Migrations

13 migrations mencakup:
- Initial schema
- Advertiser role & ad system
- Blur hash & dominant color
- Role enum migration (jurnalis → reporter)
- Category hierarchy
- Article excerpt
- Site categories
- Ad impressions/clicks

---

## 11. Analisis Frontend

### 11.1 Routing Architecture

**Root-level routes:**
- `/` — Landing page (pusat)
- `/login`, `/register` — Auth pages
- `/auth/forgot-password`, `/auth/reset-password` — Password flows

**Dynamic `[site]` routes:**
- `/{site}` — Site homepage
- `/{site}/artikel/{slug}` — Article detail
- `/{site}/penulis` — Authors listing
- `/{site}/penulis/{id}` — Author profile
- `/{site}/kebijakan-privasi` — Privacy policy
- `/{site}/p/{slug}` — Generic info/legal/marketing page

**Dashboard routes (`/{site}/dashboard/`):**
- Overview, Articles (list/new/edit), Media, Profile, KYC
- Review queue, KYC queue, Calendar, Categories
- Ads & banners, Comments, Team monitoring
- Users, Invitations, Audit log, Settings
- Site management, AI usage dashboard (superadmin only)

### 11.2 Middleware (proxy.ts)

- Site resolution dari subdomain/URL path/query param
- Dashboard auth guard (cookie-based)
- URL rewriting untuk multisite
- Cookie & header injection

### 11.3 Komponen Utama

| Kategori | Jumlah | Komponen Kunci |
|----------|--------|----------------|
| Editor | ~30 | TiptapEditor, AI Panel, SEO, Media Library |
| Dashboard | 13 | KPI Cards, Kanban, Traffic Chart, Notifications |
| Layout | 10 | Navbar, Footer, Mobile Nav, Container |
| UI | ~25 | NewsCard, SmartImage, CommentSection, Search |
| Berita | 5 | Hero, Gallery, Share |
| Legal | 5 | About, Ethics, Terms, Privacy |
| Marketing | 1 | Ads landing page |

### 11.4 State Management (Zustand)

| Store | Lines | Purpose |
|-------|-------|---------|
| `editorStore` | 538 | Full article editor lifecycle, auto-save, undo |
| `authStore` | ~150 | Login, register, logout, persist |
| `layoutStore` | ~80 | AI layout suggestions |
| `siteStore` | ~30 | Current site context |
| `toastStore` | ~40 | Toast notification queue |

### 11.5 Custom Hooks

| Hook | Lines | Purpose |
|------|-------|---------|
| `useAI` | 505 | 10 AI features (rewrite, grammar, SEO, dll.) |
| `useImageUpload` | ~100 | Upload dengan validation, progress |
| `useKeyboardShortcuts` | ~50 | Generic shortcut registration |
| `useMediaLibrary` | ~120 | Paginated media dengan infinite scroll |
| `useSavedArticles` | ~40 | Reactive saved articles count |

---

## 12. Analisis Backend API

### 12.1 API Modules

| Module | Purpose |
|--------|---------|
| `auth` | Login, register, refresh, logout, forgot/reset password |
| `article` | CRUD, publish, review workflow, search |
| `user` | User management, roles |
| `site` | Site settings, categories |
| `category` | Category CRUD dengan hierarchy |
| `media` | File upload, management |
| `comment` | Comment CRUD, moderation |
| `kyc` | KYC submission, review, verification |
| `analytics` | Page views, stats |
| `ai` | AI features, quota management |
| `ad` | Advertisement management |
| `notification` | In-app notifications |
| `invitation` | Team invitations |

### 12.2 Middleware Stack

```
trust proxy → timeout → helmet → cors → securityHeaders → cookieParser
→ jwtVerify → json → sanitize → requestId → httpLogger → performance
→ rate limit
```

### 12.3 API Documentation

- Swagger tersedia via `swagger-jsdoc` + `swagger-ui-express`
- Endpoint documentation di setiap module

---

## 13. Testing & CI/CD

### 13.1 Test Coverage

| Area | Unit Tests | E2E Tests | Coverage |
|------|-----------|-----------|----------|
| API | 13 files | — | Target 70% lines/functions |
| Web | 3 files | 1 spec | Target 65% lines/functions |
| Packages | 2 files | — | — |

**Test files yang ada:**
- API: articles, auth, categories, media, sites, security, AI
- Web: Container.test.tsx, editorStore.test.ts, legalPages.test.ts
- Packages: articleBlocks.test.ts, slug.test.ts
- E2E: container-layout.spec.ts

### 13.2 CI/CD Pipeline

**GitHub Actions** (`ci.yml`):
1. **build-and-test** job:
   - Install dependencies
   - Generate Prisma
   - Run migrations
   - Run tests
   - Security audit (`pnpm audit --audit-level=high`)
   - Lint
   - Type-check
   - Build
2. **e2e-playwright** job:
   - Playwright dengan Chromium
   - Artifact upload on failure

**Services:** PostgreSQL 15 Alpine + Redis 7 Alpine

### 13.3 Gap Testing

- Frontend: 100+ komponen dengan hanya 3 test files
- Tidak ada test untuk critical paths: article rendering, auth flow, editor
- E2E hanya 1 spec (container layout)
- `vitest.config.ts` exclude `app/` directory dari coverage
- Tidak ada visual regression testing

---

## 14. SEO & Performa

### 14.1 SEO Implementation

| Fitur | Status |
|-------|--------|
| Open Graph metadata | ✅ `constructMetadata()` |
| Twitter Card | ✅ |
| Canonical URLs | ✅ |
| JSON-LD Structured Data | ✅ Organization, WebSite, NewsArticle, Breadcrumb |
| Dynamic Sitemap | ✅ (tapi tidak di-cache) |
| Robots.txt | ✅ Block dashboard, login, API |
| PWA Manifest | ✅ Per-site |
| Apple Web App | ✅ |

### 14.2 Performa Concerns

| Issue | Impact |
|-------|--------|
| Sitemap `cache: 'no-store'` | Setiap request → 3 API calls |
| 21 raw `<img>` tags | Bypass Next.js Image optimization |
| Inconsistent page caching | Beberapa `no-store`, beberapa `revalidate` |
| Meilisearch tanpa circuit breaker | Sudah di-handle dengan opossum ✅ |
| Redis optional | Cache layer bisa tidak tersedia |

---

## 15. Rekomendasi Prioritas

### 🔴 Segera (Minggu Ini)

| # | Tindakan | Effort |
|---|----------|--------|
| 1 | Rotasi semua kredensial yang terekspos (.env) | 1 jam |
| 2 | Hapus .env dari git history (BFG Repo-Cleaner) | 30 menit |
| 3 | Generate dan set `CRON_SECRET` | 5 menit |
| 4 | Generate dan set `CSRF_SECRET` | 5 menit |
| 5 | Tambahkan sanitasi pada AdSpace `dangerouslySetInnerHTML` | 1 jam |
| 6 | Fix `change-password` validation (gunakan `validatePassword()`) | 15 menit |

### 🟠 Bulan Ini

| # | Tindakan | Effort |
|---|----------|--------|
| 7 | Set `strict: true` di web tsconfig (bertahap) | 2-3 hari |
| 8 | Aktifkan ESLint rules (`no-explicit-any`, `exhaustive-deps`) secara `warn` | 1 hari |
| 9 | Konfigurasi Redis untuk production rate limiting | 2 jam |
| 9 | Tambahkan security headers di Next.js config | 1 jam |
| 10 | Uncomment Sentry integration di frontend | 30 menit |
| 11 | Tambahkan `not-found.tsx` custom 404 page | 1 jam |
| 12 | Fix sitemap caching (`revalidate` instead of `no-store`) | 30 menit |

### 🟡 Kuartal Ini

| # | Tindakan | Effort |
|---|----------|--------|
| 13 | Reduce `any` usage di hot-spot files | 3-5 hari |
| 14 | Tambahkan test coverage untuk critical paths | 1-2 minggu |
| 15 | Wrap article CRUD dalam database transactions | 1 hari |
| 16 | Enable Supabase RLS pada tabel sensitif | 2-3 hari |
| 17 | Aktifkan `jsx-a11y` ESLint rules | 1 hari |
| 18 | Bersihkan scratch files dan dead code | 2 jam |
| 19 | Refactor `useAI.ts` ke generic factory pattern | 1 hari |
| 20 | Decompose large components (AIDashboard, TiptapEditor, Navbar) | 2-3 hari |

### 🟢 Best Practice (Ongoing)

| # | Tindakan |
|---|----------|
| 21 | Implementasi ClamAV untuk file scanning |
| 22 | Standardisasi error handling (semua gunakan `AppError`) |
| 23 | Consolidate `axios` vs `fetch` usage |
| 24 | Tambahkan E2E tests untuk critical user flows |
| 25 | Implementasi visual regression testing |
| 26 | Populate `docs/` directory dengan dokumentasi arsitektur |
| 27 | Buat `CLAUDE.md` untuk project context |

---

## 16. Lampiran

### A. Environment Variables Required

**API (`apps/api/.env.example`):**
```
NODE_ENV, PORT (3001), API_URL
DATABASE_URL, DIRECT_URL (Supabase PostgreSQL)
JWT_SECRET, RESET_SECRET, CSRF_SECRET
CORS_ORIGIN, COOKIE_DOMAIN
OPENAI_API_KEY, AI_MODEL (gpt-4o)
EMAIL_ENABLED, EMAIL_FROM_ADDRESS, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_FORCE_PATH_STYLE, S3_BUCKET, S3_MEDIA_BUCKET
SUPABASE_STORAGE_PUBLIC_URL
SENTRY_DSN
```

**Web (`apps/web/.env.example`):**
```
NODE_ENV
NEXT_PUBLIC_API_URL (http://localhost:3001)
NEXT_PUBLIC_URL (http://localhost:3000)
NEXT_PUBLIC_GA_ID (optional)
NEXT_PUBLIC_SITE_ID (optional, e.g., "pusat")
```

### B. File Counts

| Area | Files |
|------|-------|
| API source | ~80+ TypeScript files |
| Web components | ~80+ component files |
| Web pages | ~30+ page/layout files |
| Shared packages | ~10 source files |
| Prisma models | 17 |
| Migrations | 13 |
| Test files (API) | 13 |
| Test files (Web) | 3 |
| Test files (E2E) | 1 |

### C. Tools & Dependencies Count

| Category | Count |
|----------|-------|
| API production deps | 25+ |
| Web production deps | 20+ |
| Tiptap extensions | 10+ |
| Custom hooks | 5 |
| Zustand stores | 5 |
| Middleware files | 10+ |
| API modules | 13 |

---

**Audit ini dilakukan tanpa mengubah file apapun dalam project.**

*Laporan dibuat pada 6 Juni 2026*
