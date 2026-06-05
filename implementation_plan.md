# Rencana Implementasi: Integrasi Video Hosting Mux & Fitur Tipe Artikel Video

Rencana ini memuat rancangan arsitektur lengkap untuk mendukung video hosting mandiri menggunakan **Mux** pada portal BeritaKarya. Ini mencakup perubahan skema database (Prisma), pembuatan endpoint API backend, pengerjaan webhook Mux, serta pembuatan antarmuka drag-and-drop khusus "Tipe Artikel: Video" pada editor CMS.

---

## User Review Required

> [!IMPORTANT]
> **Biaya Layanan Mux (Pay-as-you-go):**
> Integrasi ini membutuhkan Mux API Credentials (`MUX_TOKEN_ID` dan `MUX_TOKEN_SECRET`). Mux adalah layanan berbayar yang menghitung biaya berdasarkan durasi video masuk (encoding), penyimpanan bulanan, dan durasi tonton (streaming). Mohon siapkan akun Mux di dashboard mereka.

> [!WARNING]
> **Skema Migrasi Database (Prisma):**
> Kita akan melakukan migrasi database untuk menambahkan kolom video pada tabel `Media` dan `Article`. Disarankan untuk mencadangkan database produksi sebelum migrasi dijalankan.

---

## Open Questions

> [!NOTE]
> **Penyimpanan di Galeri Media:**
> Apakah video Mux yang diunggah penulis harus muncul di "Galeri Media" umum (`/dashboard/media`) bersama gambar-gambar biasa? 
> *Rencana ini mengasumsikan **Ya**, video akan disimpan di tabel `Media` dengan tipe `VIDEO` agar penulis dapat menggunakan kembali video tersebut di artikel lain tanpa perlu upload ulang.*

---

## Proposed Changes

### Database (Prisma Schema)

Kita perlu memperluas skema database agar dapat mencatat status video, asset ID dari Mux, `playback_id` untuk streaming HLS, serta data pendukung seperti durasi video.

#### [MODIFY] [schema.prisma](file:///d:/beritakarya-v1/apps/api/prisma/schema.prisma)
* Tambahkan enum `MediaType` atau kolom string `mediaType` pada model `Media`.
* Tambahkan kolom berikut pada model `Media`:
  * `mediaType` (default: `"IMAGE"`) - membedakan gambar dan video.
  * `muxAssetId` (String?) - ID aset di Mux.
  * `muxPlaybackId` (String?) - ID pemutaran HLS di Mux.
  * `duration` (Float?) - Durasi video dalam detik.
  * `status` (String) (default: `"READY"`) - status kesiapan media (`"PROCESSING"`, `"READY"`, `"FAILED"`).
* Tambahkan kolom berikut pada model `Article`:
  * `videoPlaybackId` (String?) - Tautan langsung ke `playback_id` Mux untuk mempercepat query halaman publik.

---

### Backend API (apps/api)

Backend akan menangani pembuatan URL unggah langsung (Direct Upload) dan memproses callback webhook dari Mux ketika video selesai diproses.

#### [MODIFY] [package.json](file:///d:/beritakarya-v1/apps/api/package.json)
* Tambahkan dependensi `@mux/mux-node` untuk interaksi SDK resmi Mux.

#### [NEW] [mux.service.ts](file:///d:/beritakarya-v1/apps/api/src/services/mux.service.ts)
* Inisialisasi Mux Client menggunakan environment variables: `MUX_TOKEN_ID` & `MUX_TOKEN_SECRET`.
* Buat fungsi `createDirectUpload()`: Menghubungi Mux API untuk meminta secure upload URL.
* Buat fungsi `getPlaybackUrl(playbackId)`: Mengembalikan URL HLS (`https://stream.mux.com/{playbackId}.m3u8`).

#### [MODIFY] [media.controller.ts](file:///d:/beritakarya-v1/apps/api/src/modules/media/media.controller.ts)
* Tambahkan endpoint **`POST /api/v1/media/mux/upload-url`** (Memerlukan Auth):
  * Memanggil `createDirectUpload()` dari `MuxService`.
  * Membuat record baru di tabel `Media` dengan `mediaType: "VIDEO"`, `status: "PROCESSING"`, dan mencatat `muxAssetId`.
  * Mengembalikan `uploadUrl` (URL tujuan unggah dari browser) dan `mediaId` ke frontend.
* Tambahkan endpoint publik **`POST /api/v1/media/mux/webhook`** (Tanpa Auth):
  * Menerima notifikasi dari server Mux.
  * Memvalidasi signature Mux (opsional/rekomendasi keamanan).
  * Menangani event `video.asset.ready`: Mengambil `playback_id` & `duration` lalu memperbarui record `Media` yang cocok menjadi `status: "READY"`.
  * Menangani event `video.asset.errored`: Mengubah status `Media` menjadi `status: "FAILED"`.

#### [MODIFY] [media.repository.ts](file:///d:/beritakarya-v1/apps/api/src/modules/media/media.repository.ts)
* Perbarui fungsi `createMedia` dan `findMediaBySite` untuk mendukung filter bertipe `VIDEO` dan penyimpanan kolom Mux.

---

### Frontend Dashboard & Editor (apps/web)

Frontend akan dimodifikasi agar memiliki tab pilihan "Tipe Artikel: Video" yang secara otomatis menampilkan area drag-and-drop file video.

#### [MODIFY] [package.json](file:///d:/beritakarya-v1/apps/web/package.json)
* Tambahkan dependensi `@mux/mux-player` atau `@mux/mux-player-react` untuk merender pemutar video premium.

#### [MODIFY] [TabSettings.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/tabs/TabSettings.tsx)
* Tambahkan selektor **Tipe Post** di bagian atas Settings: `Standard Article` | `Foto Jurnalistik` | `Video Eksklusif`.
* Logika otomatis:
  * Jika memilih `Video Eksklusif`, otomatis centang badge **Eksklusif** dan arahkan kategori default ke **Video**.
  * Jika memilih `Foto Jurnalistik`, arahkan kategori default ke **Galeri Foto**.

#### [NEW] [VideoUploadZone.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/VideoUploadZone.tsx)
* Tampilan area Drag-and-Drop file video (.mp4, .mov, .avi) menggunakan native file selector / drag events.
* Alur unggah video:
  1. Penulis drag file video ke area unggah.
  2. Frontend memanggil API `/api/v1/media/mux/upload-url` untuk meminta URL unggah.
  3. Frontend mengunggah berkas video mentah langsung ke server Mux menggunakan Axios `PUT` dengan progress bar interaktif.
  4. Sambil Mux memproses encoding di server mereka, frontend secara berkala melakukan polling (atau menunggu status dari backend) hingga video berstatus `READY`.
  5. Setelah siap, tampilkan preview pemutar video menggunakan `@mux/mux-player-react`.

#### [MODIFY] [Editor.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/Editor.tsx)
* Jika tipe artikel adalah `Video`, sembunyikan kanvas Tiptap standar (atau minimalkan teks editor hanya untuk kolom "Deskripsi Video") dan tampilkan komponen `VideoUploadZone` di area canvas utama secara dominan.

---

### Frontend Public Website (apps/web)

#### [MODIFY] [SiteHomePage.tsx](file:///d:/beritakarya-v1/apps/web/components/pages/SiteHomePage.tsx)
* Pada section **Laporan Video Eksklusif** (baris 849-887), ganti elemen gambar statis/YouTube embed dengan `<MuxPlayer>` yang memuat `playback_id` dari artikel video Mux secara native dan tanpa iklan.

---

## Foto Jurnalistik

Bagian ini menangani integrasi fitur **Foto Jurnalistik** yang memungkinkan penulis mengunggah galeri foto dengan caption, credit, dan alt text per gambar.

### Frontend Dashboard & Editor - Foto Jurnalistik

#### [NEW] [PhotoGalleryUpload.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/PhotoGalleryUpload.tsx)
* Area drag-and-drop untuk multi-image upload (batch upload).
* Support format: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
* Fitur per-image:
  * **Caption** - Deskripsi singkat untuk setiap foto.
  * **Credit** - Sumber/nama fotografer.
  * **Alt Text** - Untuk SEO dan accessibility.
  * **Preview thumbnail** - Thumbnail sebelum upload.
* Preview grid dengan kemampuan reorder via drag-and-drop.
* Batasan: Maksimal 20 foto per galeri.
* Progress bar untuk setiap image yang diunggah.
* Tombol hapus untuk setiap image.

#### [NEW] [ImageGalleryBlock.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/blocks/ImageGalleryBlock.tsx)
* Component untuk menampilkan dan mengedit gallery di dalam editor.
* Mendukung layout modes:
  * **Grid** - Tampilan grid 2 atau 3 kolom.
  * **Slider/Carousel** - Tampilan slide horizontal.
  * **Masonry** - Tampilan masonry/pinterest style.
* Edit caption, credit, alt text langsung dari editor.
* Reorder images via drag-and-drop.

#### [MODIFY] [EditorContent.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/EditorContent.tsx)
* Jika tipe artikel adalah `Foto Jurnalistik`:
  * Tampilkan `PhotoGalleryUpload` di area utama editor.
  * Tiptap editor tetap tersedia untuk paragraph introduksi/artikel pembuka.
  * Otomatis set category default ke `foto-jurnalistik`.
  * Set badge label: **Galeri Foto**.

#### [MODIFY] [FloatingMenu.tsx](file:///d:/beritakarya-v1/apps/web/components/editor/menus/FloatingMenu.tsx)
* Tambahkan opsi "Galeri Foto" di floating menu untuk inserting gallery block di tengah artikel.
* Tambahkan opsi "Grid Foto" untuk image grid block.

#### [NEW] [useImageUpload.ts](file:///d:/beritakarya-v1/apps/web/hooks/useImageUpload.ts)
* Custom hook untuk handle multi-image upload logic.
* Mendukung:
  * Batch upload dengan progress tracking.
  * Image compression sebelum upload (optional).
  * Validation: file size (max 10MB), dimensions, format.
  * Retry mechanism untuk failed uploads.

### Backend API - Foto Jurnalistik

#### [MODIFY] [media.controller.ts](file:///d:/beritakarya-v1/apps/api/src/modules/media/media.controller.ts)
* Tambahkan endpoint **`POST /api/v1/media/batch`** (Memerlukan Auth):
  * Upload multiple images dalam satu request.
  * Accept array of files dengan metadata (caption, credit, altText).
  * Return array of created media records.
* Update endpoint **`PATCH /api/v1/media/:id`**:
  * Support update caption, credit, altText untuk setiap image.

#### [MODIFY] [media.repository.ts](file:///d:/beritakarya-v1/apps/api/src/modules/media/media.repository.ts)
* Tambahkan fungsi `createMediaBatch()` untuk bulk insert.
* Update `findMediaBySite` untuk support filtering `mediaType: "IMAGE"`.

### Frontend Public Website - Foto Jurnalistik

#### [NEW] [ArticleGalleryViewer.tsx](file:///d:/beritakarya-v1/apps/web/components/berita/ArticleGalleryViewer.tsx)
* Component untuk menampilkan galeri foto di halaman artikel publik.
* Fitur:
  * **Lightbox** - Full-screen viewer saat klik gambar.
  * **Thumbnail strip** - Navigasi cepat di bagian bawah lightbox.
  * **Keyboard navigation** - Arrow keys, ESC to close.
  * **Swipe support** - Untuk mobile touch devices.
  * **Lazy loading** - Images load on-demand.
  * **Zoom** - Pinch-to-zoom di mobile, scroll-to-zoom di desktop.
  * Display caption dan credit di overlay lightbox.

#### [MODIFY] [artikel/[slug]/page.tsx](file:///d:/beritakarya-v1/apps/web/app/[site]/artikel/[slug]/page.tsx)
* Jika artikel bertipe `Foto Jurnalistik`:
  * Render `ArticleGalleryViewer` dengan images dari blocks.
  * Tampilkan intro text dari article content.
  * Matikan layout sidebar article (full-width gallery view).

#### [MODIFY] [SiteHomePage.tsx](file:///d:/beritakarya-v1/apps/web/components/pages/SiteHomePage.tsx)
* Pada section **Galeri Foto Jurnalistik**:
  * Tampilkan featured photos dari artikel `foto-jurnalistik` terbaru.
  * Link ke halaman artikel galeri saat diklik.
  * Grid layout dengan hover effect dan caption preview.

---

## Verification Plan

### Automated Tests
* Uji coba validitas kompilasi typescript dan bundling aplikasi:
  ```powershell
  pnpm type-check
  pnpm build
  ```

### Manual Verification
1. **Direct Upload Flow:**
   - Masuk to editor `/dashboard/articles/new`.
   - Pilih tipe artikel **"Video Eksklusif"**.
   - Seret video berformat `.mp4` ke dropzone.
   - Amati progress bar berjalan s.d 100%.
2. **Webhook & Processing:**
   - Setelah upload 100%, sistem menunjukkan status "Menyiapkan video...".
   - Webhook Mux terpanggil, database terupdate dengan `playback_id`.
   - UI editor berubah menampilkan Mux Player dengan preview video yang diunggah.
3. **Public Homepage Playback:**
   - Terbitkan artikel video tersebut.
   - Buka beranda publik situs, navigasikan ke section "Laporan Video Eksklusif" di bagian bawah.
   - Klik tombol putar dan pastikan video berjalan mulus dengan Mux Player premium tanpa logo YouTube.

### Foto Jurnalistik Verification
4. **Photo Gallery Upload:**
   - Masuk ke editor `/dashboard/articles/new`.
   - Pilih tipe artikel **"Foto Jurnalistik"**.
   - Upload 5-10 foto dengan drag-and-drop.
   - Isi caption dan credit untuk setiap foto.
   - Reorder foto dengan drag.
5. **Gallery Viewer:**
   - Terbitkan artikel foto jurnalistik.
   - Buka artikel di halaman publik.
   - Klik salah satu foto untuk membuka lightbox.
   - Navigasi antar foto dengan arrow keys atau thumbnail strip.
   - Pastikan caption dan credit tampil dengan benar.