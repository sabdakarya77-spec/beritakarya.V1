# Rencana Implementasi: Restrukturisasi Layout, Section Logic & Visual Portal Berita Karya

Rencana ini mencakup dua fokus utama: **(A) Restrukturisasi urutan section dan logika distribusi artikel**, serta **(B) Peningkatan branding visual, tipografi, dan halaman trust redaksi**.

---

## User Review Required

> [!IMPORTANT]
> **Layout & Sidebar Rule — Keputusan Desain Kritis:**
> Kami merekomendasikan aturan **"Sidebar hanya aktif untuk section feed utama berita harian"** dan dikosongkan (full-width) untuk section editorial khusus seperti Fokus Redaksi, Iklan, Opini, dan Foto Jurnalistik. Lihat rincian zona layout di bawah.

> [!WARNING]
> **Perubahan logika slicing array artikel:** Seluruh logika `.slice()` di `SiteHomePage.tsx` akan diganti dengan fungsi `distributeArticles()` yang lebih ketat dan terstruktur agar artikel tidak overlap antar section.

---

## Bagian A — Restrukturisasi Section & Layout Logic

### Masalah yang Ditemukan (Berdasarkan Gambar Upload)

| # | Masalah | Penjelasan |
|---|---------|------------|
| 1 | **Ukuran gambar kartu sama semua** | Grid 2-kolom memiliki proporsi gambar yang identik dari atas ke bawah, membuat layout terasa monoton |
| 2 | **Sidebar aktif sampai bawah halaman** | Sidebar menempel terus bahkan saat konten di bawah (Opini, Foto, Video) lebih baik ditampilkan full-width |
| 3 | **Tidak ada jarak visual antar section** | Section Fokus Redaksi, Trending, Berita Terbaru, dan Iklan tidak memiliki pembeda visual yang jelas |
| 4 | **Logika distribusi artikel longgar** | Berita yang muncul di Hero bisa overlap dengan yang tampil di Fokus Redaksi karena `slice()` tidak terpisah ketat |

---

### Arsitektur Section Baru (Urutan Top → Bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  HERO SECTION — artikel[0..3]                     │
│  MagazineBentoHero + slider otomatis                           │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  FOKUS REDAKSI — artikel[4..7]                    │
│  Grid 4 kolom (xl) / 2 kolom (md) — isFeatured/isExclusive     │
│  Kartu LEBIH BESAR, variasi ukuran (1 besar + 3 kecil)         │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  TRENDING TOPICS — tag/topik hangat               │
│  Horizontal pill strip — tidak membutuhkan artikel              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬───────────────────────────────────┐
│  [8/12] BERITA TERBARU      │  [4/12] SIDEBAR KANAN             │
│  artikel[8..9] — 2 kartu    │  • Akses Redaksi (WA/TG/Email)   │
│  "featured" horizontal besar │  • Paling Populer               │
│  —————————————————————————  │  • Info Pasar                    │
│  [INLINE AD — full 8col]    │  • Video/Iklan Kecil             │
│  —————————————————————————  │                                  │
│  artikel[10..15] — 6 kartu  │  [SIDEBAR BERHENTI DI SINI]      │
│  grid 2-kolom, ukuran medium │                                  │
└─────────────────────────────┴───────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  PILIHAN EDITOR — artikel[isFeatured filter]      │
│  Grid 3 kolom — kartu BESAR dengan gambar portrait              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  OPINI & ANALISIS — artikel filter opini/analisis │
│  Layout khusus: teks dominan, foto kecil di kanan               │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  FOTO JURNALISTIK — grid 3 kolom portrait         │
│  Gambar BESAR dan mencolok, teks overlay minimal                │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  VIDEO EKSKLUSIF — dark background               │
│  Grid 3 kolom, aspect-ratio video 16:9                         │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  [FULL WIDTH]  LOAD MORE / INFINITE SCROLL                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Aturan Sidebar: Aktif vs Full-Width

| Section | Layout | Alasan |
|---------|--------|--------|
| Hero | Full-width | Perlu ruang penuh untuk gambar utama |
| Fokus Redaksi | Full-width | Butuh 4 kolom; sidebar mengurangi bobot visual |
| Trending Topics | Full-width | Strip horizontal — sidebar tidak relevan |
| **Berita Terbaru** | **8+4 col (ada sidebar)** | Butuh akses redaksi, populer, dan iklan di sisi kanan |
| **Berita Lanjutan** | **8+4 col (ada sidebar)** | Meneruskan grid dengan sidebar yang sama |
| Pilihan Editor | Full-width | 3-kolom memerlukan ruang penuh, terasa premium |
| Opini & Analisis | Full-width | Format teks panjang, tidak cocok dengan sidebar |
| Foto Jurnalistik | Full-width | Gambar perlu ruang penuh untuk dampak visual |
| Video Eksklusif | Full-width | Background gelap + 3 kolom butuh penuh |

> **Catatan UX:** Sidebar dikosongkan setelah grid "Berita Lanjutan" selesai. Secara teknis ini berarti `aside` ada dalam elemen grid yang berbeda dari section bawahnya — section editorial di bawah menggunakan `Container` penuh tanpa pembagian `grid-cols-12`.

---

### Logika Distribusi Artikel Baru — fungsi `distributeArticles()`

Menggantikan seluruh logika `.slice()` yang tersebar di `SiteHomePage.tsx` dengan satu fungsi deterministik:

```typescript
function distributeArticles(articles: any[]) {
  // Slot 0–3: Hero (4 artikel terbaru)
  const hero = articles.slice(0, 4);

  // Slot 4–7: Fokus Redaksi (diprioritaskan isFeatured/isExclusive)
  // Filter terlebih dahulu artikel bertanda featured/exclusive yang
  // belum masuk hero, lalu fallback ke artikel urutan berikutnya
  const featuredPool = articles
    .slice(4)
    .filter(a => a.isFeatured || a.isExclusive)
    .slice(0, 4);
  const fokusRedaksi = featuredPool.length >= 4
    ? featuredPool
    : articles.slice(4, 8); // fallback

  // Kumpulkan ID yang sudah terpakai
  const usedIds = new Set([
    ...hero.map(a => a.id),
    ...fokusRedaksi.map(a => a.id),
  ]);

  // Sisa artikel yang belum terpakai (untuk feed utama ke bawah)
  const remaining = articles.filter(a => !usedIds.has(a.id));

  // Slot Feed Utama (Berita Terbaru — di samping sidebar)
  const feedFeatured = remaining.slice(0, 2);   // 2 kartu hero-horizontal besar
  const feedStream   = remaining.slice(2, 8);   // 6 kartu grid medium

  // Slot Editorial Extras (full-width, di bawah sidebar)
  const remainingAfterFeed = remaining.slice(8);
  const editorChoice  = remainingAfterFeed.filter(a => a.isFeatured).slice(0, 3);
  const opinion       = remainingAfterFeed.slice(0, 3);    // fallback posisi
  const photoJournal  = remainingAfterFeed.slice(3, 6);
  const videoStories  = remainingAfterFeed.slice(6, 9);

  // Sidebar: Populer dari pool terluas (hindari overlap hero)
  const popular = articles.filter(a => !hero.some(h => h.id === a.id)).slice(0, 5);

  return {
    hero, fokusRedaksi, feedFeatured, feedStream,
    editorChoice, opinion, photoJournal, videoStories, popular
  };
}
```

---

### Variasi Ukuran Kartu untuk Menghindari Monoton

#### Section: Fokus Redaksi (Full-Width, 4 Artikel)
```
┌──────────────────────────┬───────────┬───────────┐
│                          │  Kartu 2  │  Kartu 3  │
│   Kartu 1 (BESAR)        │ (medium)  │ (medium)  │
│   col-span-2, row-span-2 ├───────────┴───────────┤
│   gambar aspect-[4/3]    │        Kartu 4        │
│                          │  (horizontal strip)   │
└──────────────────────────┴───────────────────────┘
```
Implementasi: `grid-cols-3` dengan `col-span-2` untuk artikel pertama.

#### Section: Berita Terbaru (Bagian Atas — sebelum inline ad)
- 2 kartu pertama: `variant="horizontal"` — gambar di kiri, teks panjang di kanan (lebih besar dari medium)
- 6 kartu stream: `variant="medium"` — grid 2 kolom seperti biasa

#### Section: Pilihan Editor (Full-Width)
- Grid 3 kolom dengan gambar aspect-ratio **portrait** `aspect-[3/4]` — lebih tinggi dari kartu biasa
- Memberikan kesan majalah premium

---

## Bagian B — Peningkatan Branding Visual & Trust Pages

### [Component: Visual & Branding System]

#### [MODIFY] [layout.tsx](file:///d:/beritakarya-v1/apps/web/app/layout.tsx)
- Mengimpor font **Plus Jakarta Sans** dari `next/font/google` menggantikan **Outfit**.
- Variabel CSS: `--font-plus-jakarta-sans` → `sans` di Tailwind.

#### [MODIFY] [tailwind.config.ts](file:///d:/beritakarya-v1/apps/web/tailwind.config.ts)
- Memetakan font `sans` ke `var(--font-plus-jakarta-sans)`, `var(--font-inter)`.

#### [MODIFY] [globals.css](file:///d:/beritakarya-v1/apps/web/app/globals.css)
- Memperbarui Google Fonts import ke Plus Jakarta Sans.
- Menambahkan CSS custom class `section-divider` (separator visual antar section agar jeda section terasa jelas).

#### [MODIFY] [Navbar.tsx](file:///d:/beritakarya-v1/apps/web/components/layout/Navbar.tsx)
- Mengganti fallback teks logo dengan **SVG logo tipografi premium**.

---

### [Component: Core — SiteHomePage.tsx]

#### [MODIFY] [SiteHomePage.tsx](file:///d:/beritakarya-v1/apps/web/components/pages/SiteHomePage.tsx)

Ini adalah file utama yang paling banyak berubah:

1. **Menambahkan fungsi `distributeArticles()`** — menggantikan seluruh logika `.slice()` yang tersebar.
2. **Menyusun ulang urutan JSX section** sesuai arsitektur baru di atas.
3. **Memisahkan zona 8+4 (sidebar) dan zona full-width** secara struktural di JSX — tidak lagi membungkus semua section dalam satu `grid-cols-12`.
4. **Menambahkan Section Fokus Redaksi** dengan grid asimetris (1 besar + 3 kecil).
5. **Mengubah 2 kartu teratas Berita Terbaru** menjadi `variant="horizontal"` agar proporsi lebih berkesan.

---

### [Component: NewsCard]

#### [MODIFY] [NewsCard.tsx](file:///d:/beritakarya-v1/apps/web/components/ui/NewsCard.tsx)
- Menghapus `<p>{excerpt}</p>` pada render `medium` default agar kartu bersih.
- Menambahkan micro-animation hover yang lebih halus.

---

### [Component: Trust & Legal Pages]

#### [MODIFY] [page.tsx — /p/[slug]](file:///d:/beritakarya-v1/apps/web/app/[site]/p/[slug]/page.tsx)
- Menambahkan konten fallback profesional berbahasa Indonesia jika database kosong:
  - **Tentang Kami:** Visi, misi, dan komitmen editorial
  - **Redaksi:** Struktur kepengurusan standar
  - **Kode Etik:** Butir-butir KEJ Dewan Pers
  - **Pedoman Media Siber:** Keputusan Dewan Pers No. 5/2008

---

## Verification Plan

### Automated Tests
```powershell
pnpm --filter @beritakarya/web build
```

### Manual Verification

| Pengujian | Target |
|-----------|--------|
| Tidak ada artikel yang muncul di dua section berbeda | `distributeArticles()` tidak overlap |
| Section Hero → Fokus Redaksi → Trending → Feed+Sidebar terbaca urut | Visual scroll dari atas ke bawah |
| Fokus Redaksi menampilkan 1 kartu besar + 3 kecil | Grid asimetris berfungsi |
| 2 kartu atas Berita Terbaru memakai `variant="horizontal"` | Proporsi berbeda |
| Section Pilihan Editor, Opini, Foto, Video = full-width (tidak ada sidebar) | Sidebar berhenti setelah Berita Lanjutan |
| Kartu medium tidak menampilkan excerpt | Teks bersih |
| Halaman /p/about, /p/editorial, /p/ethics menampilkan konten fallback | Trust pages tampil baik |
