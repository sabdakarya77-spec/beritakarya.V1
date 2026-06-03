# Refactoring Report - File yang Perlu Dipisah

> **Tanggal Audit:** 1 Juni 2026  
> **Status:** Pending - Perlu Refactoring  
> **Total File yang Perlu Dipisah:** 10

---

## Daftar File yang Perlu Dipecah

### Prioritas Tinggi (Perlu perhatian segera)

| No | File | Baris | Priority | Kategori | Risiko |
|----|------|-------|----------|----------|--------|
| 1 | `apps/web/app/[site]/dashboard/page.tsx` | 843 | 🔴 Tinggi | React Page | 🟠 Sedang |
| 2 | `apps/api/src/modules/article/article.service.ts` | 672 | 🔴 Tinggi | API Service | 🔴 Tinggi |
| 3 | `apps/web/components/pages/SiteHomePage.tsx` | 620 | 🔴 Tinggi | React Component | 🟡 Rendah |
| 4 | `apps/web/store/editorStore.ts` | 516 | 🔴 Tinggi | State Management | 🔴 Tinggi |
| 5 | `apps/web/components/editor/TiptapEditor.tsx` | 478 | 🔴 Tinggi | React Component / Editor | 🟠 Sedang |
| 6 | `apps/api/src/modules/media/media.controller.ts` | 334 | 🔴 Tinggi | API Controller | 🟠 Sedang |

### Prioritas Sedang

| No | File | Baris | Priority | Kategori | Risiko |
|----|------|-------|----------|----------|--------|
| 7 | `apps/api/src/modules/article/article.repository.ts` | 295 | 🟡 Sedang | Data Access | 🟡 Rendah |
| 8 | `apps/web/components/editor/tabs/TabSettings.tsx` | 329 | 🟡 Sedang | React Component | 🟡 Rendah |
| 9 | `apps/web/components/ui/CommentSection.tsx` | 222 | 🟡 Sedang | React Component | 🟡 Rendah |
| 10 | `apps/web/components/editor/ai/AIPanel.tsx` | ~103 | 🟡 Sedang | React Component / AI | 🟡 Rendah |

---

## Detail Per File

### 1. `apps/web/app/[site]/dashboard/page.tsx` — 843 baris

**Masalah:** File ini adalah yang PALING BESAR di project. Mencampur banyak komponen dalam satu file.

**Komponen dalam file:**
- `DashboardOverview` (line 55-543) - Main dashboard untuk reporter/kontributor/wapimred/superadmin
- `AdvertiserDashboardOverview` (line 545-762) - Dashboard khusus advertiser
- `KYCRequestsWidget` (line 764-808) - Widget KYC requests
- `AuditLogsWidget` (line 810-843) - Widget audit logs

**Saran Pemisahan:**
```
apps/web/app/[site]/dashboard/
├── page.tsx (hanya routing & layout dasar)
├── components/
│   ├── DashboardOverview.tsx
│   ├── AdvertiserDashboardOverview.tsx
│   └── widgets/
│       ├── KYCRequestsWidget.tsx
│       └── AuditLogsWidget.tsx
└── hooks/
    └── useDashboardData.ts
```

**Sudah tercatat di:** `docs/AUDIT_REPORT.md` sebagai UX-001

---

### 2. `apps/api/src/modules/article/article.service.ts` — 672 baris

**Masalah:** File ini memiliki terlalu banyak tanggung jawab. Mencampur:
- Article CRUD operations
- Publish workflow
- Scheduled publishing
- Versioning
- Notifications (inline)
- Google indexing
- Cache management
- Workflow state machine
- Slug resolution

**Saran Pemisahan:**
```
apps/api/src/modules/article/
├── article.service.ts (core CRUD)
├── services/
│   ├── article-publish.service.ts (publish workflow)
│   ├── article-scheduler.service.ts (scheduled publishing)
│   ├── article-versioning.service.ts (version management)
│   ├── article-notification.service.ts (notifications)
│   └── article-indexing.service.ts (Google indexing)
└── utils/
    └── article-workflow.ts (state machine logic)
```

---

### 3. `apps/web/components/pages/SiteHomePage.tsx` — 620 baris

**Masalah:** Halaman ini sangat besar dengan:
- Data fetching logic inline
- UI sections yang berulang
- CSS classes yang di-hardcode berulang
- Market data widget
- Multiple conditional sections

**Saran Pemisahan:**
```
apps/web/components/pages/
├── SiteHomePage.tsx (container)
└── sections/
    ├── HeroSection.tsx
    ├── TrendingSection.tsx
    ├── FeaturedFeed.tsx
    ├── PopularSidebar.tsx
    ├── MarketWidget.tsx
    └── EditorialExtras.tsx
```

**Hooks:**
```
apps/web/hooks/
└── useSiteData.ts (data fetching)
```

---

### 4. `apps/web/store/editorStore.ts` — 516 baris

**Masalah:** Zustand store ini memiliki:
- State definitions
- Action implementations
- Auto-save logic
- Word count calculation
- Validation logic
- API calls

**Saran Pemisahan:**
```
apps/web/store/
├── editorStore.ts (state & basic actions)
├── editorActions.ts (complex actions)
└── utils/
    └── editorAutoSave.ts (auto-save logic)
```

**Validators:**
```
apps/web/utils/
└── editorValidation.ts (getMissingRequirements, getCompletionScore)
```

---

### 5. `apps/web/components/editor/TiptapEditor.tsx` — 478 baris

**Masalah:** File ini memiliki baris kode yang besar dikarenakan memuat fungsi penanganan data dan konversi format Tiptap JSON <-> Blok API yang sangat panjang.

**Fungsi dalam file:**
- `convertTiptapToBlocks` (Konversi data Tiptap ke schema block database)
- `extractTextContent` (Ekstraksi text dengan HTML markup)
- `extractListItems`
- `convertBlocksToHTML` (Konversi schema block ke format HTML Tiptap)

**Saran Pemisahan:**
```
apps/web/components/editor/
├── TiptapEditor.tsx (Inisialisasi ekstensi Tiptap & layout wrapper)
└── utils/
    └── editorMapper.ts (Fungsi-fungsi konversi data Tiptap <-> Block API)
```

---

### 6. `apps/api/src/modules/media/media.controller.ts` — 334 baris

**Masalah:** Controller ini menangani terlalu banyak hal (business & image processing logic):
- File upload handling
- Image processing (Sharp library)
- Watermark SVG generation
- Thumbnail generation
- BlurHash extraction
- Dominant color extraction
- Static file serving
- CRUD operations

**Saran Pemisahan (Thin Controller):**
Pindahkan pemrosesan gambar dan library Sharp sepenuhnya ke service layer agar Controller tetap bersih.
```
apps/api/src/modules/media/
├── media.controller.ts (routes, request validation & parsing)
├── services/
│   ├── image-processor.service.ts (Sharp processing, blurHash, dominant color)
│   ├── watermark.service.ts (watermark generation)
│   └── thumbnail.service.ts (thumbnail generation)
└── middleware/
    └── media-upload.middleware.ts
```

---

### 7. `apps/api/src/modules/article/article.repository.ts` — 295 baris

**Estimasi Risiko:** 🟡 Rendah — Query helpers bersifat terisolasi, perubahan tidak menyebar luas.

**Masalah:** Banyak fungsi query dengan select statements yang berulang.

**Saran:** Gunakan query builder pattern atau extract common selects ke type/interface.

**Saran Pemisahan:**
```
apps/api/src/modules/article/
├── article.repository.ts (basic queries)
├── types/
│   └── article.select.ts (common select objects)
└── utils/
    └── article.query-helpers.ts
```

---

### 8. `apps/web/components/editor/tabs/TabSettings.tsx` — 329 baris ⚠️ [NEW]

**Estimasi Risiko:** 🟡 Rendah — Komponen terisolasi di dalam sidebar editor.

**Masalah:** File ini mencampur **5 tanggung jawab berbeda** dalam satu komponen:
- Upload gambar utama + integrasi `useImageUpload`
- Flatten & render dropdown kategori (termasuk logika `CATEGORIES_CONFIG`)
- Tag management dengan state lokal sendiri
- Editorial badge handler (isBreaking, isExclusive, isFeatured)
- Kontrol tampilan `MediaLibraryModal`

File ini lebih padat dari `CommentSection.tsx` (222 baris) yang sudah masuk daftar, namun selama ini terlewat dari audit.

**Saran Pemisahan:**
```
apps/web/components/editor/tabs/
├── TabSettings.tsx (layout & komposisi)
└── components/
    ├── FeaturedImageUpload.tsx (upload zone + preview)
    ├── CategoryDropdown.tsx (dropdown + flatten logic)
    ├── TagsInput.tsx (tag management)
    └── EditorialBadges.tsx (toggle badge Breaking/Eksklusif/Featured)
```

---

### 9. `apps/web/components/ui/CommentSection.tsx` — 222 baris

**Estimasi Risiko:** 🟡 Rendah — Komponen terisolasi, tidak digunakan secara global.

**Masalah:** Mencampur UI component dengan API calls dan state management.

**Saran Pemisahan:**
```
apps/web/components/ui/
├── CommentSection.tsx (presentational)
└── hooks/
    └── useComments.ts (data fetching)

apps/web/components/
└── CommentForm.tsx (form component - jika perlu dipisah lebih lanjut)
```

---

### 10. `apps/web/components/editor/ai/AIPanel.tsx` — ~103 baris ⚠️ [NEW]

**Estimasi Risiko:** 🟡 Rendah — Komponen terisolasi hanya digunakan di EditorSidebar.

**Masalah:** Meskipun sub-tab AI sudah terpisah (`WriteTab`, `OptimizeTab`, `ValidateTab`, `ImageTab`, `SEOAuditTab`), `AIPanel.tsx` mengimport dan mengorkestrasi semuanya **tanpa struktur yang jelas**: state manajemen tab, header panel, footer model info, dan logika `isOpen/onClose` semuanya inline dalam satu komponen.

Selain itu, sub-tab AI saat ini tidak mengikuti konvensi folder yang sama dengan tab editor utama (`editor/tabs/`) sehingga membingungkan untuk navigasi kode.

**Saran Pemisahan & Standardisasi:**
```
apps/web/components/editor/ai/
├── AIPanel.tsx (container: tab routing + header + footer)
├── AITabNav.tsx (komponen navigasi tab pill AI)
└── tabs/
    ├── WriteTab.tsx (sudah ada)
    ├── OptimizeTab.tsx (sudah ada)
    ├── ValidateTab.tsx (sudah ada)
    ├── ImageTab.tsx (sudah ada)
    └── SEOAuditTab.tsx (sudah ada)
```

**Catatan:** Saat redesign Panel Editor dieksekusi, `AIPanel.tsx` adalah **kandidat pertama** yang perlu dirapikan karena menjadi entry point seluruh fitur AI.

---

## Estimasi Risiko — Panduan Prioritas Eksekusi

> Mulailah dari risiko **Rendah** sebelum menyentuh risiko **Tinggi** untuk menjaga stabilitas sistem.

| Level | Keterangan | File |
|-------|-----------|------|
| 🔴 **Tinggi** | Digunakan oleh banyak komponen lain, perubahan berdampak luas | `editorStore.ts`, `article.service.ts` |
| 🟠 **Sedang** | Digunakan terbatas, tetapi memiliki integrasi API atau state global | `dashboard/page.tsx`, `TiptapEditor.tsx`, `media.controller.ts` |
| 🟡 **Rendah** | Komponen terisolasi, mudah di-refactor tanpa efek samping | `SiteHomePage.tsx`, `TabSettings.tsx`, `CommentSection.tsx`, `AIPanel.tsx`, `article.repository.ts` |

**Urutan Eksekusi yang Direkomendasikan (Aman):**
1. Mulai dari semua 🟡 Rendah dulu
2. Lanjut ke 🟠 Sedang
3. Selesaikan 🔴 Tinggi terakhir, dengan test coverage yang kuat

---

## Checklist Refactoring

### 🟡 Risiko Rendah (Mulai dari sini)
- [ ] 3. Pecah `SiteHomePage.tsx` (620 baris)
- [ ] 7. Optimasi `article.repository.ts` (295 baris)
- [ ] 8. Pecah `TabSettings.tsx` (329 baris) — **[NEW]**
- [ ] 9. Pecah `CommentSection.tsx` (222 baris)
- [ ] 10. Rapikan `AIPanel.tsx` + standardisasi folder — **[NEW]**

### 🟠 Risiko Sedang
- [ ] 1. Pecah `dashboard/page.tsx` (843 baris)
- [ ] 5. Pecah `TiptapEditor.tsx` (478 baris) — **[NEW]**
- [ ] 6. Pecah `media.controller.ts` (334 baris)

### 🔴 Risiko Tinggi (Kerjakan Terakhir)
- [ ] 4. Pecah `editorStore.ts` (516 baris)
- [ ] 2. Pecah `article.service.ts` (672 baris)

---

## Catatan Tambahan & Prosedur Keselamatan

1. **Urutan Berdasarkan Risiko:** Ikuti urutan checklist di atas — mulai dari 🟡 Rendah, lanjut ke 🟠 Sedang, selesaikan dengan 🔴 Tinggi.
2. **Jaring Pengaman Tipe (TypeScript Compilation):** 
   Setiap kali selesai memecah komponen, jalankan pengecekan tipe secara global untuk menangkap *broken imports* secara instan:
   ```bash
   pnpm --filter web typecheck
   pnpm --filter api typecheck
   ```
3. **Penerapan Thin Controller (Backend):** 
   Pastikan tidak ada logika Sharp atau watermark di `media.controller.ts`. Pindahkan logika pemrosesan biner murni ke file service masing-masing.
4. **Standardisasi Folder AI:** Saat mengerjakan `AIPanel.tsx`, selaraskan struktur foldernya dengan konvensi `editor/tabs/` yang sudah ada di bagian editor utama.
5. **Pastikan Test Coverage:** Lakukan pengujian unit sebelum memulai pemisahan pada item 🔴 Risiko Tinggi.
6. **Gunakan Feature Branches:** Buat branch fitur khusus untuk setiap file yang di-refactor.
7. **Lakukan Code Review:** Mintalah review setelah setiap refactoring selesai.

---

*Report ini diperbarui secara komprehensif pada 1 Juni 2026*