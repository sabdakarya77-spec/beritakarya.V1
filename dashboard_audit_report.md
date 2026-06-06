# 🔍 Dashboard Audit Report — BeritaKarya v1

**Tanggal:** 6 Juni 2026
**Lingkup:** Seluruh halaman Dashboard (27 file, ~10.000+ baris kode)
**Metode:** File-by-file audit + cross-cutting analysis

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Temuan Kritis (CRITICAL)](#2-temuan-kritis-critical)
3. [Temuan Tinggi (HIGH)](#3-temuan-tinggi-high)
4. [Temuan Sedang (MEDIUM)](#4-temuan-sedang-medium)
5. [Temuan Rendah (LOW)](#5-temuan-rendah-low)
6. [Audit per File](#6-audit-per-file)
7. [API Integration Layer](#7-api-integration-layer)
8. [Stores & State Management](#8-stores--state-management)
9. [Rekomendasi Prioritas](#9-rekomendasi-prioritas)

---

## 1. Ringkasan Eksekutif

Dashboard BeritaKarya terdiri dari **27 file** dengan total **~10.000+ baris kode**, mencakup 19 halaman utama, 3 sub-komponen admin, layout, loading, error boundary, dan 5 custom hooks.

### Skor Dashboard

| Dimensi | Skor | Catatan |
|---------|------|---------|
| **Fungsionalitas** | 7/10 | Semua fitur utama berjalan, beberapa dead buttons |
| **Keamanan** | 5/10 | Token di URL, missing RBAC di 10 halaman |
| **Konsistensi Kode** | 5/10 | 5 pola error handling berbeda, 18 file console.log |
| **Performa** | 6/10 | 3 file >800 baris, window.confirm blocking UI |
| **Aksesibilitas** | 4/10 | Banyak tombol tanpa aria-label, dead buttons |
| **Maintainability** | 5/10 | Duplikasi kode, hardcoded values, file terlalu besar |

---

## 2. Temuan Kritis (CRITICAL)

### 🔴 D-C-01: JWT Token Terekspos di URL (KYC Review)

**File:** `review/kyc/[userId]/page.tsx` (line 113)
**Masalah:** `localStorage.getItem('accessToken')` dipakai untuk construct URL dokumen KYC. Token JWT muncul di URL query parameter — bisa di-log oleh proxy, browser history, dan server logs.
**Kontradiksi:** `layout.tsx` line 56 menyatakan "Token disimpan di httpOnly cookie — tidak bisa diakses via JS"
**Fix:** Gunakan cookie-based auth untuk KYC document URLs, atau buat signed URL di server.

### 🔴 D-C-02: `publishArticle` dan `submitForReview` Tanpa Error Handling

**File:** `store/editorStore.ts` (lines 448, 463)
**Masalah:** Kedua fungsi melakukan API call tanpa try/catch. Jika gagal (network error, 403, 500), promise rejection tidak tertangani. Status artikel bisa tidak sinkron dengan UI.
**Fix:** Bungkus dengan try/catch, update UI state pada error.

### 🔴 D-C-03: Missing Role-Based Access Control di 10 Halaman

**Halaman tanpa client-side role guard:**

| Halaman | Risiko |
|---------|--------|
| `comments/page.tsx` | Semua user bisa approve/reject komentar |
| `categories/page.tsx` | Semua user bisa CRUD kategori |
| `media/page.tsx` | Semua user bisa akses media library |
| `calendar/page.tsx` | Semua user bisa lihat kalender editorial |
| `users/page.tsx` | Semua user bisa lihat kelola user |
| `invitations/page.tsx` | Semua user bisa lihat invitations |
| `team/page.tsx` | Semua user bisa monitor tim |
| `ads/order/page.tsx` | Semua user bisa akses order iklan |
| `review/kyc/page.tsx` | Semua user bisa lihat antrean KYC |
| `review/kyc/[userId]/page.tsx` | Semua user bisa review dokumen KYC |

**Catatan:** Layout sidebar membatasi navigasi, tapi halaman bisa diakses langsung via URL. API juga punya middleware, tapi defense-in-depth seharusnya ada di frontend juga.

---

## 3. Temuan Tinggi (HIGH)

### 🟠 D-H-01: 5 Pola Error Handling Berbeda

| Pola | Halaman |
|------|---------|
| `alert()` | articles, media, ads (12+ instances), audit |
| `console.error` only | comments, team, calendar, review/kyc |
| `useToastStore` | users, review |
| Custom toast state | categories, invitations, admin |
| Inline error message | profile, kyc, settings |

**Dampak:** UX tidak konsisten. `alert()` memblokir UI. `console.error` tanpa feedback user.

### 🟠 D-H-02: `useAI.ts` Bypass Auth Interceptor

**File:** `hooks/useAI.ts` (line 118-131)
**Masalah:** `callOpenAI` menggunakan raw `fetch` bukan `api` axios instance. AI requests tidak punya `X-Site-ID` header dan tidak dapat auto token refresh.
**Fix:** Ganti dengan `api.post('/ai/chat', ...)`.

### 🟠 D-H-03: `checkAuth` Treats Network Error as Logout

**File:** `store/authStore.ts` (line 92-94)
**Masalah:** Semua error di `checkAuth` menghasilkan `user: null`. Jika API down, user dianggap logout padahal sesi masih valid di server.
**Fix:** Bedakan 401 (expired) dari network error. Preserve user state pada network error.

### 🟠 D-H-04: Tidak Ada Notifikasi Session Expired

**File:** `layout.tsx` + `AuthInit.tsx`
**Masalah:** Ketika session expired, user langsung redirect ke login tanpa pesan. Jika sedang menulis artikel, tidak ada peringatan data hilang.
**Fix:** Tampilkan toast/modal "Sesi Anda telah berakhir" sebelum redirect.

### 🟠 D-H-05: `window.confirm` / `window.prompt` Memblokir UI

**File-file:**
- `articles/page.tsx` (lines 159, 170)
- `comments/page.tsx` (line 74)
- `users/page.tsx` (lines 259, 286, 308)
- `review/page.tsx` (line 440)
- `media/page.tsx` (line 57)

**Masalah:** Native browser dialogs memblokir main thread dan terlihat tidak profesional. Project sudah punya modal pattern yang seharusnya digunakan konsisten.

### 🟠 D-H-06: Network Errors Hanya di-console.log

**8+ halaman** hanya `console.error` tanpa feedback ke user:
- `page.tsx`, `articles/page.tsx`, `team/page.tsx`, `calendar/page.tsx`, `comments/page.tsx`, `audit/page.tsx`, `review/page.tsx`, `review/kyc/page.tsx`

**Dampak:** Jika API down, user melihat loading spinner tanpa henti atau halaman kosong tanpa penjelasan.

---

## 4. Temuan Sedang (MEDIUM)

### 🟡 D-M-01: 3 File Terlalu Besar (>800 baris)

| File | Lines | Isi |
|------|-------|-----|
| `ads/page.tsx` | 1797 | 4 komponen (AdSlotCard, LeaderboardManager, LeaderboardBannerRow, main) |
| `settings/page.tsx` | 1603 | Rich text editor + full settings form |
| `page.tsx` (dashboard) | 843 | 3 sub-komponen (KYCRequestsWidget, AuditLogsWidget, AdvertiserDashboardOverview) |

### 🟡 D-M-02: Dead Buttons (Tombol Tanpa Handler)

| File | Line | Tombol |
|------|------|--------|
| `media/page.tsx` | 127 | Filter button |
| `comments/page.tsx` | 221 | ChevronRight button |
| `team/page.tsx` | 123 | MoreVertical button |
| `team/page.tsx` | 166 | "Profil Lengkap" button |
| `KanbanBoard.tsx` | 53 | Plus button di setiap kolom |

### 🟡 D-M-03: `INITIAL_TIMESTAMP` Module-Level Stale

**File:** `page.tsx` (line 3), `review/page.tsx` (line 3)
**Masalah:** `Date.now()` di-capture sekali saat module load. Jika halaman dibuka berjam-jam, queue age calculation makin tidak akurat.

### 🟡 D-M-04: Missing Loading State

| File | Masalah |
|------|---------|
| `calendar/page.tsx` | Tidak ada loading indicator sama sekali |
| `categories/page.tsx` | Tidak ada skeleton, hanya loading di tombol submit |

### 🟡 D-M-05: Hardcoded Values yang Seharusnya Constants

| Value | File | Line |
|-------|------|------|
| WhatsApp `628123456789` | `page.tsx` | 749 |
| Email `support.beritakarya@gmail.com` | `page.tsx` | 176 |
| Bank BCA `829-0123-456` | `ads/page.tsx`, `ads/order/page.tsx` | 674, 543 |
| Bank Mandiri `137-00-1234567-8` | `ads/page.tsx`, `ads/order/page.tsx` | 679, 553 |
| `BIO_MIN_LENGTH = 80` | `profile/page.tsx`, `kyc/page.tsx` | duplikat |
| `LIMIT = 25` | `audit/page.tsx` | 188 + 162 |
| `localhost:4000` fallback | `review/kyc/[userId]/page.tsx` | 112 |

### 🟡 D-M-06: `error.tsx` Double Negative

**File:** `dashboard/error.tsx` (line 45)
**Masalah:** "Perubahan yang belum tersimpan kemungkinan **tidak akan** hilang" — kontradiktif.
**Fix:** "Perubahan yang belum tersimpan mungkin hilang."

### 🟡 D-M-07: Memory Leak di KYC Page

**File:** `kyc/page.tsx` (lines 75, 77)
**Masalah:** `URL.createObjectURL` dipanggil untuk preview tapi `URL.revokeObjectURL` tidak pernah dipanggil.

### 🟡 D-M-08: `invitations/page.tsx` Custom Toast Bukan Shared

**File:** `invitations/page.tsx` (lines 76-81, 96-100)
**Masalah:** Implementasi toast sendiri padahal `useToastStore` sudah ada. Inconsistent.

---

## 5. Temuan Rendah (LOW)

### 🟢 D-L-01: Console Debug Log di Production

**File:** `layout.tsx` (line 100-104)
**Masalah:** `useEffect` yang log setiap navigasi dengan styled console output. Debug code yang seharusnya dihapus.

### 🟢 D-L-02: Duplicated ROLE_LABELS

**File:** `page.tsx` (line 170) mendefinisikan ulang `ROLE_LABELS` yang sudah ada di `lib/constants.ts`.

### 🟢 D-L-03: Unused Imports

**File:** `settings/page.tsx` — `Eye as EyeIcon` duplikat, beberapa alignment icons hanya dipakai di nested component.

### 🟢 D-L-04: Accessibility Issues

- Banyak icon-only buttons tanpa `aria-label`
- Search input di `layout.tsx` (line 491) tanpa `aria-label`
- Color-only status indicators tanpa text alternatives

### 🟢 D-L-05: `any` Type Usage

Dashboard pages menggunakan `any` untuk data API responses:
- `page.tsx`: `trafficData`, `topContent`, `engagementStats` (lines 59-63)
- `TopContent.tsx`: `topContent: any[]` prop

### 🟢 D-L-06: `SLOT_ASPECT_RATIOS` Inside Component

**File:** `ads/page.tsx` (line 120)
**Masalah:** Object literal di dalam component, recreated setiap render. Pindahkan ke luar component.

---

## 6. Audit per File

| # | File | Lines | Issues | Severity |
|---|------|-------|--------|----------|
| 1 | `page.tsx` | 843 | console.error, hardcoded values, `any` types, INITIAL_TIMESTAMP | Medium |
| 2 | `layout.tsx` | 534 | console.log debug, missing aria-label, no loading during redirect | Low |
| 3 | `loading.tsx` | 97 | Clean | ✅ |
| 4 | `error.tsx` | 73 | Double negative message | Low |
| 5 | `articles/page.tsx` | 673 | alert(), dead `filtered` var, stale closure risk | Medium |
| 6 | `articles/new/page.tsx` | 15 | Clean | ✅ |
| 7 | `articles/[id]/page.tsx` | 15 | Clean | ✅ |
| 8 | `comments/page.tsx` | 248 | **No RBAC**, dead button, hardcoded stats | Critical |
| 9 | `categories/page.tsx` | 661 | document.querySelector, emoji icons, no initial loading | Medium |
| 10 | `media/page.tsx` | 315 | alert(), dead Filter button, no clipboard error handling | Medium |
| 11 | `profile/page.tsx` | 467 | Read-only fields in state, duplicated BIO constants | Low |
| 12 | `settings/page.tsx` | 1603 | **Oversized**, deprecated execCommand, expensive isDirty | High |
| 13 | `team/page.tsx` | 175 | console.error, 2 dead buttons | Medium |
| 14 | `users/page.tsx` | 340 | window.confirm, role promotion risk | High |
| 15 | `invitations/page.tsx` | 252 | Custom toast, token exposure risk | Medium |
| 16 | `audit/page.tsx` | 476 | console.error, alert(), hardcoded LIMIT | Low |
| 17 | `calendar/page.tsx` | 209 | **No loading state**, console.error | Medium |
| 18 | `kyc/page.tsx` | 429 | Memory leak (createObjectURL), duplicated constants | Medium |
| 19 | `review/page.tsx` | 552 | INITIAL_TIMESTAMP, window.confirm, eslint-disable | Medium |
| 20 | `review/kyc/page.tsx` | 347 | console.error only | Low |
| 21 | `review/kyc/[userId]/page.tsx` | 288 | **JWT in URL**, localhost fallback | Critical |
| 22 | `ads/page.tsx` | 1797 | **Oversized**, 12x alert(), hardcoded banks | High |
| 23 | `ads/order/page.tsx` | 737 | Duplicated fallbacks, no file size validation | Medium |
| 24 | `admin/page.tsx` | 459 | No cascade warning on delete | Low |
| 25 | `admin/ai-usage/page.tsx` | 10 | Clean | ✅ |
| 26 | `CategoryTreePicker.tsx` | 205 | Clean, good accessibility | ✅ |
| 27 | `SiteCategoriesDialog.tsx` | 261 | Clean, proper portal usage | ✅ |

---

## 7. API Integration Layer

### `lib/api.ts` (160 baris)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Token refresh mutex | ✅ Baik | Prevents concurrent refresh storms |
| Max retry cap (3) | ✅ Baik | Prevents infinite loops |
| Site ID injection | ✅ Baik | Cookie + URL path fallback |
| Auth endpoint exclusion | ✅ Baik | No refresh on auth routes |
| Request timeout | ❌ Missing | Tidak ada timeout configured |
| Network error retry | ❌ Missing | Hanya 401 yang di-retry |
| 403 UI feedback | ❌ Missing | Hanya di-log, tidak ke user |

### `store/authStore.ts` (109 baris)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Login/Register error parsing | ✅ Baik | Extract nested validation details |
| Logout backend failure handling | ✅ Baik | Always clears local state |
| Network error → logout | ⚠️ Masalah | Semua error dianggap logout |
| localStorage stale data | ⚠️ Masalah | Brief window dengan data lama |

### `store/editorStore.ts` (538 baris)

| Aspek | Status | Catatan |
|-------|--------|---------|
| `saveArticle` error handling | ✅ Baik | try/catch + error state |
| Auto-save (60s forced + 15s debounce) | ✅ Baik | Defensive checks |
| `publishArticle` | ❌ **No try/catch** | Unhandled rejection |
| `submitForReview` | ❌ **No try/catch** | Unhandled rejection |

---

## 8. Stores & State Management

| Store | Lines | Issues |
|-------|-------|--------|
| `authStore.ts` | 109 | Network error treated as logout |
| `editorStore.ts` | 538 | 2 unhandled API calls |
| `siteStore.ts` | 27 | Silent error swallowing |
| `toastStore.ts` | ~40 | Clean ✅ |
| `layoutStore.ts` | ~80 | Clean ✅ |

### Custom Hooks

| Hook | Lines | Issues |
|------|-------|--------|
| `useAI.ts` | 505 | Bypasses auth interceptor (raw fetch), massive duplication |
| `useImageUpload.ts` | 84 | Clean ✅ |
| `useKeyboardShortcuts.ts` | 37 | Clean ✅ |
| `useMediaLibrary.ts` | 78 | console.error only |
| `useSavedArticles.ts` | 28 | Clean ✅ |

---

## 9. Rekomendasi Prioritas

### 🔴 Segera (Minggu Ini)

| # | Tindakan | Effort | File |
|---|----------|--------|------|
| 1 | Fix JWT token di URL (KYC review) — pakai cookie auth | 1 jam | `review/kyc/[userId]/page.tsx` |
| 2 | Tambah try/catch di `publishArticle` dan `submitForReview` | 30 menit | `store/editorStore.ts` |
| 3 | Tambah role guard di 10 halaman yang missing | 2-3 jam | 10 file |
| 4 | Hapus console.log debug di layout | 5 menit | `layout.tsx` |

### 🟠 Bulan Ini

| # | Tindakan | Effort |
|---|----------|--------|
| 5 | Standardisasi error handling → pakai `useToastStore` di semua halaman | 1-2 hari |
| 6 | Ganti `window.confirm` dengan modal components | 1 hari |
| 7 | Fix `useAI.ts` → pakai `api` axios instance | 2 jam |
| 8 | Fix `checkAuth` → bedakan network error vs 401 | 30 menit |
| 9 | Tambah loading state di `calendar/page.tsx` | 30 menit |
| 10 | Fix memory leak di `kyc/page.tsx` (revokeObjectURL) | 15 menit |
| 11 | Fix error message double negative di `error.tsx` | 5 menit |

### 🟡 Kuartal Ini

| # | Tindakan | Effort |
|---|----------|--------|
| 12 | Decompose `ads/page.tsx` (1797 baris) ke file terpisah | 1 hari |
| 13 | Decompose `settings/page.tsx` (1603 baris) ke sub-components | 1 hari |
| 14 | Extract hardcoded values ke constants | 2 jam |
| 15 | Hapus dead buttons / tambahkan handler | 1 jam |
| 16 | Tambah `aria-label` di semua icon-only buttons | 2 jam |
| 17 | Standardisasi `INITIAL_TIMESTAMP` → gunakan `Date.now()` di render | 30 menit |
| 18 | Pindahkan `SLOT_ASPECT_RATIOS` ke luar component | 5 menit |

### 🟢 Best Practice (Ongoing)

| # | Tindakan |
|---|----------|
| 19 | Tambah `timeout` di axios instance |
| 20 | Tambah network error retry logic |
| 21 | Session expiry notification (toast sebelum redirect) |
| 22 | Consolidate `axios` vs `fetch` usage |
| 23 | Reduce `any` type usage di dashboard pages |

---

**Audit ini dilakukan tanpa mengubah file apapun dalam project.**

*Laporan dibuat pada 6 Juni 2026*
