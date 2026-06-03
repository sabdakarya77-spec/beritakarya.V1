# Perbandingan dengan Media Nasional & Global

> Analisis komparatif layout & fitur BeritaKarya dengan media nasional Indonesia dan media global tier-1.
> Snapshot per Juni 2026.

---

## Daftar Isi
1. [Homepage — Perbandingan](#a-homepage--perbandingan-layout)
2. [Halaman Artikel — Perbandingan](#b-artikel--perbandingan-layout)
3. [Keunggulan BeritaKarya](#c-keunggulan-beritakarya-vs-kompetitor)
4. [Posisi Pasar](#d-posisi-pasar)
5. [Kesimpulan](#e-kesimpulan)

---

## A. Homepage — Perbandingan Layout

### BeritaKarya (saat ini)
- **Hero**: Bento grid 1+3 ([MagazineBentoHero](../../apps/web/components/berita/MagazineBentoHero.tsx))
- **Sections**: Top Ad → Bento Hero → Fokus Redaksi → Trending Tags → Main Feed (8/4 split) → Editorial Extras (4 sections: Pilihan Editor, Opini, Foto, Video)
- **Sidebar**: Akses Redaksi (WA/Telegram/Email) + Populer + Info Pasar (IHSG/USD/Emas) + Video Widget
- **Style**: Magazine modern, multiple sectioned

### Media Nasional Indonesia

| Media | Hero Style | Content Width | Sidebar | Sections | Ciri Khas |
|---|---|---|---|---|---|
| **detik.com** | Carousel besar | ~1200px | Populer+Iklan | Populer, Video, Foto, Trending Top 10 | Dense, banyak iklan, ticker breaking news |
| **kompas.com** | Lead image + 4 medium | ~1200px | Populer+Iklan | Nasional, Internasional, Olahraga | Tradisional, "JENDELA" feature |
| **tempo.co** | Lead image besar | ~1140px | Related+Iklan | Investigasi, Kolom, Opini, Foto | Magazine-style, editorial premium |
| **tirto.id** | Lead + sidebar 2-3 | ~1100px | Related+Newsletter | Investigasi, Opini, Reportase | Clean, banyak whitespace, narasi |
| **kumparan.com** | Card-based | Responsive | Minimal | Topic-based | Mobile-first, social news |
| **cnnindonesia.com** | Lead image besar | ~1200px | Trending+Video | Nasional, Internasional, Olahraga, Teknologi | Video-forward, multi-bagian |
| **liputan6.com** | Lead + grid | ~1200px | Video+Populer | News, Showbiz, Sport, Tekno | Banyak widget, video integrasi |

### Media Global

| Media | Hero Style | Content Width | Sidebar | Sections | Ciri Khas |
|---|---|---|---|---|---|
| **nytimes.com** | Lead image 1 besar | ~1200px | Minimal | Opinion, Cooking, Wirecutter, The Athletic | Editorial excellence, multi-brand |
| **bbc.com** | Lead + category chips | ~1200px | Related | News, Sport, Culture, Travel | Sticky category nav, red accent kuat |
| **theguardian.com** | 3-column grid | ~1200px | Opinion | Opinion, Sport, Lifestyle, Culture | Long-form, blue accent |
| **washingtonpost.com** | Multi-section grid | ~1200px | Newsletter | Politics, Opinion, Sports | Newsletter CTA prominent |
| **bloomberg.com** | Lead + market ticker | ~1280px | Markets/Stock | Markets, Tech, Politics, Opinion | Data-driven, premium feel |
| **reuters.com** | Headlines heavy | ~1200px | Related | World, Business, Markets | Factual, no image priority |
| **medium.com** | Card feed | ~1200px | None | Personal publications | Reading-focused, minimal design |
| **cnn.com** | Wide hero | ~1280px | Video+Related | Top Stories, US, World, Business | Live blog, video-heavy |

### Tabel Perbandingan Detail Homepage

| Aspek | BeritaKarya | detik | kompas | tempo | tirto | NYT | BBC | Guardian | Bloomberg |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Magazine feel** | ✅ Kuat | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | Sedang | Sedang |
| **Bento/Asymmetric grid** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Multi-section eksplisit** | ✅ (4 extras) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trending tags** | ✅ Pills | ✅ Top 10 | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Real-time ticker** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ Live | ✅ | ✅ | ✅ |
| **Newsletter CTA** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Video section eksplisit** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Opini section** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Fotografi section** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Live blog/breaking** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Podcast section** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Market data widget** | ✅ IHSG/USD/Emas | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Akses redaksi CTA** | ✅ WA/Telegram | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ad density** | Medium-Tinggi | Sangat Tinggi | Tinggi | Medium | Rendah | Medium | Medium | Medium | Medium |

---

## B. Artikel — Perbandingan Layout

### BeritaKarya (saat ini)
- **Header**: Badge + Kategori + Tanggal → H1 → Author + pills (Reading Time, Word Count) + Bookmark
- **Hero image**: 900×600 max-w-3xl centered
- **Content**: max-w-43rem (688px) di xl dengan floating tools
- **Sidebar (xl+)**: Share+Save → Info Artikel (author+4 mini-cards) → Related Categories → Tags → 2 Ads
- **End**: Share/Save bar → Tags → Comments → Recommended (3)

### Tabel Perbandingan Detail Artikel

| Aspek | BeritaKarya | detik | kompas | tempo | tirto | NYT | Medium | Guardian | Bloomberg |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Content max-width** | 688-720px | ~700 | ~720 | ~700 | ~700 | ~600 | ~700 | ~720 | ~720 |
| **Sidebar trigger** | xl (1280px) | md | lg | lg | none | none | none | lg | lg |
| **Sticky share tools** | ✅ (xl) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reading time pill** | ✅ (prominent) | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Word count pill** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Reading progress bar** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Font size control** | ✅ (A11y) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Bookmark inline** | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Image lightbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Pull quote style** | ✅ (brand-red border) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gallery block** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Related below** | 3 cards | 6 cards | 4 cards | 4 cards | 3 cards | 5 cards | 4 cards | 4 cards | 4 cards |
| **Native comments** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Author bio** | ❌ (mini card only) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **TOC (table of content)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Save-for-later CTA** | ✅ Bookmark | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Newsletter inline** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **More from author** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Ad density di body** | Rendah (2 ads sidebar) | Sangat Tinggi | Tinggi | Medium | Rendah | Medium | None | Medium | Tinggi |
| **Hero image overlay style** | Gradient-to-t + ring | None | None | None | None | None | None | None | None |

---

## C. Keunggulan BeritaKarya (vs Kompetitor)

### Yang Sudah Unggul

| Fitur | Keterangan |
|---|---|
| **Bento Hero** | Belum ada media Indonesia yang pakai. NYT & Bloomberg pakai. **Modern, beda dari kompetitor lokal** |
| **Font Size Control** | Fitur A11y (aksesibilitas). Tidak ada di kompetitor manapun. **Unique selling point** |
| **Reading Progress + Sticky Tools** | Kombinasi lengkap seperti Medium + Bloomberg, tapi belum ada di media Indonesia |
| **Magazine Bento** | Gaya Tempo/Tirto + teknologi modern NYT. **Hybrid terbaik** |
| **Section Eksplisit (Opini, Foto, Video)** | Seperti Tempo, tapi dengan kartu modern. **Editorial premium** |
| **PWA Per-Situs** | Multi-site PWA dengan branding konsisten. **Tidak ada di kompetitor** |
| **Komentar Native** | Bukan Disqus/Facebook. **Privasi lebih baik** |
| **Info Pasar (IHSG/USD/Emas)** | Widget mini market data. Bloomberg-grade tapi hemat tempat |
| **Akses Redaksi CTA** | WA/Telegram/Email prominent. Inovatif untuk korporasi media |

### Yang Bisa Dilengkapi (Trend Industri 2024-2026)

| Fitur | Kompetitor yang Punya | Komponen Existing | Effort |
|---|---|---|---|
| **Breaking news ticker** | detik, kompas, tempo, BBC, CNN, Bloomberg | ✅ Sudah ada [BreakingNewsTicker.tsx](../../apps/web/components/ui/BreakingNewsTicker.tsx), tinggal integrate ke homepage | Kecil |
| **Live blog/breaking coverage** | BBC, CNN, Bloomberg, detik | ❌ | Besar — perlu real-time backend (WebSocket/SSE) |
| **Newsletter inline** | NYT, Bloomberg, Guardian, Tirto, Tempo | ✅ Sudah ada [NewsletterForm.tsx](../../apps/web/components/ui/NewsletterForm.tsx) | Sedang |
| **Podcast section** | BBC, Guardian, Washington Post, detik | ❌ | Besar — perlu hosting audio + CMS podcast |
| **More from author** | NYT, Tempo, Tirto, Medium | Query backend sudah ada | Sedang |
| **TOC (Table of Contents)** | Bloomberg, long-form media | ❌ | Sedang — bisa auto-generate dari heading blocks |
| **Author bio card** | NYT, Tempo, Tirto, Medium | ✅ Sudah ada [AuthorCard.tsx](../../apps/web/components/ui/AuthorCard.tsx), tinggal integrate | Kecil |
| **Related inline (mid-article)** | BBC, CNN | ❌ | Sedang — tambahkan 1 module di tengah block |
| **Premium/long-form section** | NYT, Bloomberg, Medium, Tirto | ❌ | Besar — perlu product baru |

---

## D. Posisi Pasar

### Spektrum Layout

```
MAGAZINE FEEL ────────────────► NEWS DENSITY
   Tirto
   Tempo
   NYT
   Bloomberg
   **BeritaKarya** ←── di sini, magazine feel + modern tech
   Guardian
   Kompas
   BBC
   CNN
   Reuters
   Detik
```

### BeritaKarya = **"Magazine-grade Indonesian news with NYT-level tech"**

| Aspek | Posisi |
|---|---|
| Kualitas visual & layout | Setara NYT/Tempo (premium) |
| Tech (PWA, font scale, a11y) | Lebih maju dari media Indonesia |
| Ad density | Lebih bersih dari Detik/Kompas |
| Komentar native | Lebih privat dari media yang pakai Disqus |
| Multi-site (PWA per situs) | **Tidak ada kompetitor** |

### Rekomendasi Strategi (jika diminta nanti)

1. **Banggakan Bento Hero** — pembeda visual dengan kompetitor Indonesia
2. **Highlight font scale & A11y** — fitur unik yang belum ada di kompetitor
3. **Tambah breaking news ticker** — standar industri yang belum ada (komponen sudah ada)
4. **Tambah newsletter inline** — untuk membangun database pembaca
5. **Tambah "More from author"** — meningkatkan loyalitas & retensi
6. **Kembangkan PWA offline** — tidak ada kompetitor yang punya
7. **Pertimbangkan live blog untuk breaking news** — standar 2024+

---

## E. Kesimpulan

| Aspek | Penilaian |
|---|:---:|
| **Kualitas visual** | ⭐⭐⭐⭐⭐ Setara Tempo/NYT premium tier |
| **Fitur unik** | ⭐⭐⭐⭐ PWA per-situs, font scale (no competitor) |
| **Standar industri** | ⭐⭐⭐ 80% covered (kurang: breaking ticker, newsletter inline, podcast) |
| **Konsistensi UX** | ⭐⭐⭐⭐ Magazine feel konsisten di homepage + artikel |
| **Ad-friendliness** | ⭐⭐⭐ Medium — 2-3 placements per page, balanced |

**Verdict**: BeritaKarya sudah **di atas rata-rata media Indonesia** dalam hal UX & tech, dan **setara dengan media global tier-1** untuk layout magazine.

**Gap utama**: **Real-time features** (ticker, live blog) dan **content marketing** (newsletter inline, podcast).

### Peluang Cepat Menang (Quick Wins)

Komponen sudah ada di codebase, tinggal diintegrate:

- ✅ [BreakingNewsTicker.tsx](../../apps/web/components/ui/BreakingNewsTicker.tsx) → tinggal mount di homepage
- ✅ [NewsletterForm.tsx](../../apps/web/components/ui/NewsletterForm.tsx) → tinggal mount inline di artikel
- ✅ [AuthorCard.tsx](../../apps/web/components/ui/AuthorCard.tsx) → tinggal mount di bawah byline
- ✅ [SavedArticlesFeed.tsx](../../apps/web/components/ui/SavedArticlesFeed.tsx) → sudah terpasang di homepage untuk `?cat=tersimpan`

### Peluang Jangka Panjang

- **Live blog module** — WebSocket/SSE backend + frontend module baru
- **Podcast section** — hosting audio + episode CMS
- **Premium/long-form section** — product baru (membership)
- **AI features** — auto-summary, translation (komponen [AISummary.tsx](../../apps/web/components/ui/AISummary.tsx) sudah ada)

---

## 📁 File Referensi BeritaKarya

| File | Peran |
|---|---|
| [`apps/web/app/[site]/page.tsx`](../../apps/web/app/[site]/page.tsx) | Entry homepage |
| [`apps/web/components/pages/SiteHomePage.tsx`](../../apps/web/components/pages/SiteHomePage.tsx) | Render utama homepage |
| [`apps/web/components/berita/MagazineBentoHero.tsx`](../../apps/web/components/berita/MagazineBentoHero.tsx) | Hero bento grid |
| [`apps/web/app/[site]/artikel/[slug]/page.tsx`](../../apps/web/app/[site]/artikel/[slug]/page.tsx) | Halaman artikel |
| [`apps/web/components/ui/NewsCard.tsx`](../../apps/web/components/ui/NewsCard.tsx) | Card artikel (4 variant) |
| [`apps/web/components/ui/ReadingProgress.tsx`](../../apps/web/components/ui/ReadingProgress.tsx) | Reading progress bar |
| [`apps/web/components/ui/FontSizeControl.tsx`](../../apps/web/components/ui/FontSizeControl.tsx) | A11y font scaling |
| [`apps/web/components/ui/BreakingNewsTicker.tsx`](../../apps/web/components/ui/BreakingNewsTicker.tsx) | Breaking news ticker (existing, belum integrated) |
| [`apps/web/components/ui/NewsletterForm.tsx`](../../apps/web/components/ui/NewsletterForm.tsx) | Newsletter signup (existing, belum integrated) |
| [`apps/web/components/ui/AuthorCard.tsx`](../../apps/web/components/ui/AuthorCard.tsx) | Author bio card (existing, belum integrated) |
| [`apps/web/components/ui/AISummary.tsx`](../../apps/web/components/ui/AISummary.tsx) | AI summary (existing, future feature) |
| [`docs/LAYOUT_DIMENSIONS.md`](./LAYOUT_DIMENSIONS.md) | Detail layout & ukuran internal BeritaKarya |
