# Dokumentasi Layout & Ukuran — Homepage & Halaman Artikel

> Snapshot visual & dimensi komponen untuk 2 halaman publik utama BeritaKarya.
> Source: [`apps/web/app/[site]/page.tsx`](../../apps/web/app/[site]/page.tsx) + [`apps/web/app/[site]/artikel/[slug]/page.tsx`](../../apps/web/app/[site]/artikel/[slug]/page.tsx)

---

## Daftar Isi
1. [Design Tokens & Container](#design-tokens--container)
2. [Hompepage (`/app/[site]/page.tsx`)](#1-homepage-appsitepage)
3. [Halaman Artikel (`/app/[site]/artikel/[slug]/page.tsx`)](#2-halaman-artikel-appsitartikelslugpage)
4. [Perbandingan Ringkas](#-perbandingan-ringkas)

---

## Design Tokens & Container

### Container Widths (dari `apps/web/app/globals.css`)

| Token | Nilai | Keterangan |
|---|---|---|
| `--container-max-width` | `72.5rem` (1160px) | `max-w-container` — default page width |
| `--content-max-width` | `47.5rem` (760px) | `max-w-content` — optimal reading |
| `--container-padding-mobile` | `1rem` (16px) | `px-4` |
| `--container-padding-tablet` | `2rem` (32px) | `md:px-8` |
| `--container-padding-desktop` | `2.5rem` (40px) | `lg:px-10` |

### Custom Widths yang Dipakai

| Class | Nilai | Konteks |
|---|---|---|
| `max-w-3xl` | 768px | Hero image artikel |
| `max-w-4xl` | 896px | Card besar (large variant) |
| `max-w-5xl` | 1024px | Header artikel |
| `max-w-[68rem]` | 1088px | Header artikel (2xl) |
| `max-w-[43rem]` | 688px | Article content utama |
| `max-w-[45rem]` | 720px | Article content (2xl) |

### Breakpoints (Tailwind)

| Token | Ukuran | Trigger |
|---|---|---|
| `sm` | 640px | — |
| `md` | 768px | Mobile → Tablet |
| `lg` | 1024px | Tablet → Desktop, **homepage sidebar muncul** |
| `xl` | 1280px | **Floating tools & sticky sidebar artikel** |
| `2xl` | 1536px | Wider content rail |

### Brand Colors

```
brand-red:        #B91C1C  (atau appearance.primaryColor)
brand-black:      hsl black
brand-text-muted: gray
bg-main:          #f8fafc  (slate-50)
dark bg:          #020617  (slate-950)
```

### Font Family

| Token | Font | Penggunaan |
|---|---|---|
| `font-serif` | Playfair Display | Heading, magazine feel |
| `font-sans` | Inter | Body, UI |
| `font-display` | Outfit | Eyebrow/labels |

---

## 1. HOMEPAGE (`/app/[site]/page.tsx`)

Entry: [`SiteHomePage.tsx`](../../apps/web/components/pages/SiteHomePage.tsx) → layout di `PublicSiteLayout`

### Kerangka Visual

```
┌────────────────────────────────────────────────────────────────────┐
│  PUBLIC SITE LAYOUT (Header + Top Nav + Breaking Strip)            │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Container max-w-[1160px] px-4 md:px-8 lg:px-10               │   │
│ │                                                              │   │
│ │  ┌────────────────────────────────────────────────────┐      │   │
│ │  │  AdSpace "leaderboard" (728×90 / 970×250)         │      │   │
│ │  │  rounded-3xl shadow-[0_18px_40px] p-4 md:p-6       │      │   │
│ │  └────────────────────────────────────────────────────┘      │   │
│ │  py-6 md:py-8                                                │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ═══════════════════════════════════════════════════════════════    │
│  HERO SECTION (border-y, gradient bg)                              │
│  py-8 md:py-10                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MagazineBentoHero (lg:h-[450px] / xl:h-[470px])            │  │
│  │  ┌────────────────────────────────┐  ┌──────────────────┐    │  │
│  │  │  LEAD (col-span-8)             │  │ SIDE 1 (col-4)   │    │  │
│  │  │  h-[300px] mobile              │  │ aspect-ratio     │    │  │
│  │  │  object-cover                 │  │ ~16:10           │    │  │
│  │  │  gradient-to-t from-black/95   │  │ title overlay    │    │  │
│  │  │  Title text-[2.35rem]→4.05rem  │  └──────────────────┘    │  │
│  │  └────────────────────────────────┘  ┌──────────────────┐    │  │
│  │                                      │ SIDE 2 (col-4)   │    │  │
│  │                                      └──────────────────┘    │  │
│  │                                      ┌──────────────────┐    │  │
│  │                                      │ SIDE 3 (col-4)   │    │  │
│  │                                      └──────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  mt-10 md:mt-12                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ⚡ FOKUS REDAKSI                                            │  │
│  │  grid-cols-1 md:grid-cols-2 xl:grid-cols-4  gap-8           │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │  │
│  │  │ Card │ │ Card │ │ Card │ │ Card │  (variant="medium")    │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│ ═══════════════════════════════════════════════════════════════    │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │  Container py-10 md:py-12                                    │   │
│ │                                                              │   │
│ │  TRENDING (mb-12)                                            │   │
│ │  📈 [Tag pill] [Tag pill] [Tag pill] ...                     │   │
│ │  rounded-full px-2.5 py-1 text-[10px]                       │   │
│ │                                                              │   │
│ │  ════════════════════════════════════════════════════════    │   │
│ │                                                              │   │
│ │  ┌──────────────────────────────────┬─────────────────────┐   │   │
│ │  │  MAIN FEED (lg:col-span-8)       │  SIDEBAR (col-4)    │   │   │
│ │  │  gap-10                         │  space-y-6          │   │   │
│ │  │                                  │                     │   │   │
│ │  │  ■ BERITA [KATEGORI]             │ ┌─────────────────┐ │   │   │
│ │  │  h-6 w-6 bg-brand-red           │ │ AKSES REDAKSI   │ │   │   │
│ │  │  text-3xl uppercase              │ │ (dark slate-950) │ │   │   │
│ │  │                                  │ │ - WhatsApp       │ │   │   │
│ │  │  ┌────────┐ ┌────────┐           │ │ - Telegram       │ │   │   │
│ │  │  │FEATURED│ │FEATURED│           │ │ - Email          │ │   │   │
│ │  │  │(2 col) │ │(2 col) │           │ │ h-11 w-11 icon   │ │   │   │
│ │  │  └────────┘ └────────┘           │ └─────────────────┘ │   │   │
│ │  │                                  │                     │   │   │
│ │  │  ┌──────────────────────────┐    │ ┌─────────────────┐ │   │   │
│ │  │  │ SPONSORSHIP AD (in-feed) │    │ │ PALING POPULER  │ │   │   │
│ │  │  │ rounded-3xl p-7           │    │ │ □ 01 Top Story  │ │   │   │
│ │  │  └──────────────────────────┘    │ │ □ 02 Trending   │ │   │   │
│ │  │                                  │ │ □ 03 Trending   │ │   │   │
│ │  │  ▶ BERITA LANJUTAN              │ │ ...  (5 item)   │ │   │   │
│ │  │  ┌──────┐ ┌──────┐               │ │ tabular-nums    │ │   │   │
│ │  │  │ Card │ │ Card │               │ │ text-[2.4rem]   │ │   │   │
│ │  │  └──────┘ └──────┘               │ └─────────────────┘ │   │   │
│ │  │  ┌──────┐ ┌──────┐               │                     │   │   │
│ │  │  │ Card │ │ Card │               │ ┌─────────────────┐ │   │   │
│ │  │  └──────┘ └──────┘               │ │ INFO PASAR      │ │   │   │
│ │  │                                  │ │ IHSG / USD/IDR / │   │   │
│ │  │  [MUAT LEBIH BANYAK]             │ │ Emas (gram)      │ │   │   │
│ │  │  LoadMoreArticles button        │ │ text-[1.1rem]   │ │   │   │
│ │  │                                  │ └─────────────────┘ │   │   │
│ │  │                                  │                     │   │   │
│ │  │                                  │ ┌─────────────────┐ │   │   │
│ │  │                                  │ │ VIDEO WIDGET    │ │   │   │
│ │  │                                  │ │ atau AdSpace    │ │   │   │
│ │  │                                  │ │ "rectangle"     │ │   │   │
│ │  │                                  │ └─────────────────┘ │   │   │
│ │  └──────────────────────────────────┴─────────────────────┘   │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ═══════ EDITORIAL EXTRAS (mt-16 space-y-16) ═══════              │
│  (hanya di homepage default, bukan filter category)                │
│                                                                    │
│  ★ PILIHAN EDITOR (3 cards, md:grid-cols-3)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                              │
│  │medium   │ │medium   │ │medium   │  gap-8                        │
│  └─────────┘ └─────────┘ └─────────┘                              │
│                                                                    │
│  ● OPINI & ANALISIS (3 cols, kutipan besar)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                              │
│  │ "Title" │ │ "Title" │ │ "Title" │  text-xl font-serif         │
│  │ excerpt │ │ excerpt │ │ excerpt │  line-clamp-3               │
│  │ avatar  │ │ avatar  │ │ avatar  │  h-6 w-6 round-full         │
│  └─────────┘ └─────────┘ └─────────┘                              │
│                                                                    │
│  ● FOTO JURNALISTIK (3 cols, aspect-[4/5] card)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                              │
│  │  ▓▓▓▓▓  │ │  ▓▓▓▓▓  │ │  ▓▓▓▓▓  │  aspect-4/5                │
│  │  ▓▓▓▓▓  │ │  ▓▓▓▓▓  │ │  ▓▓▓▓▓  │  gradient-t black/90       │
│  │  ▓ IMG │ │  ▓ IMG │ │  ▓ IMG │  title overlay                 │
│  └─────────┘ └─────────┘ └─────────┘                              │
│                                                                    │
│  ⚡ LAPORAN VIDEO EKSKLUSIF (bg-slate-950, dark)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                              │
│  │  ▓▓▓▓▓  │ │  ▓▓▓▓▓  │ │  ▓▓▓▓▓  │  aspect-video               │
│  │  ▶ Play │ │  ▶ Play │ │  ▶ Play │  h-14 w-14 round-full       │
│  │  Title  │ │  Title  │ │  Title  │  px-6 py-8 md:px-8 md:py-12│
│  └─────────┘ └─────────┘ └─────────┘                              │
│                                                                    │
│  PUBLIC SITE LAYOUT FOOTER                                        │
└────────────────────────────────────────────────────────────────────┘
```

### Tabel Ukuran Homepage

| Section / Item | Dimensi / Class | Keterangan |
|---|---|---|
| **Container utama** | `max-w-container` = **1160px** | Default page width |
| **Padding container** | `px-4` (16px) → `md:px-8` (32px) → `lg:px-10` (40px) | Mobile → Tablet → Desktop |
| **Top ad leaderboard** | `AdSpace type="leaderboard"` (728×90 / 970×250) | Di-wrapper `rounded-3xl p-4 md:p-6` |
| **Hero section** | `py-8 md:py-10` | Gradient background |
| **MagazineBentoHero** | `h-[300px]` mobile, `lg:h-[450px]`, `xl:h-[470px]` | Bento grid |
| └─ Lead image | `col-span-8` (~67% dari container) | 16:10 ratio |
| └─ Side images | 3 × `col-span-4` (~33% dibagi 3) | Stack vertikal di xl |
| **Fokus Redaksi** | `mt-10 md:mt-12`, `grid-cols-1/2/4`, `gap-8` | 4 cards variant medium |
| **Trending section** | `mb-12`, flex-wrap | Pills rounded-full |
| └─ Tag pills | `px-2.5 py-1 text-[10px]` | Uppercase tracking 0.12em |
| **Main grid** | `lg:grid-cols-12 gap-10` | 8/4 split |
| **Main feed** | `lg:col-span-8` (~67%) | |
| **Sidebar** | `lg:col-span-4` (~33%) | `space-y-6` antar card |
| **Section heading "BERITA..."** | `text-3xl` uppercase | `h-6 w-6 bg-brand-red` accent |
| **Featured feed** | `grid-cols-1 md:grid-cols-2 gap-8` | 2 cards per row |
| **Inline sponsor** | `rounded-3xl p-7` | `AdSpace type="in-feed"` |
| **Berita Lanjutan** | `grid-cols-1 md:grid-cols-2 gap-8` | 6 cards max |
| **Sidebar - Akses Redaksi** | `rounded-3xl p-5 md:p-6`, `bg-slate-950` | 3 link buttons |
| └─ Icon container | `h-11 w-11 rounded-2xl` | Border + bg color |
| **Sidebar - Popular** | `p-5 md:p-6` | 5 items, no image |
| └─ Number | `text-[2.4rem]` | tabular-nums, `tracking-[-0.05em]` |
| └─ Title | `text-[1.08rem] line-clamp-2` | font-serif, leading-1.16 |
| **Sidebar - Info Pasar** | 3 row: IHSG / USD/IDR / Emas | `text-[1.1rem]` value |
| **Sidebar - Video/Ad** | `rounded-3xl p-5 md:p-6` | `AdSpace "rectangle"` |
| **Pilihan Editor** | `mt-16`, `md:grid-cols-3 gap-8` | 3 cards medium |
| **Opini & Analisis** | `md:grid-cols-3 gap-8` | Quote style |
| └─ Title | `text-xl font-serif line-clamp-3` | `"text"` di dalam quote marks |
| └─ Avatar | `h-6 w-6 rounded-full text-[10px]` | Inisial author |
| **Foto Jurnalistik** | `md:grid-cols-3 gap-6` | `aspect-[4/5]` card |
| └─ Image | `object-cover group-hover:scale-110 duration-5000ms` | Slow zoom on hover |
| └─ Overlay | `bg-gradient-to-t from-black/90 via-black/35` | |
| **Laporan Video** | `bg-slate-950 px-6 py-8 md:px-8 md:py-12` | Dark section |
| └─ Card | `aspect-video rounded-2xl` | |
| └─ Play button | `h-14 w-14 rounded-full backdrop-blur-md` | Border white/40 |
| **Main spacing extras** | `mt-16 space-y-16` | `md:mt-24 md:space-y-20` |

---

## 2. HALAMAN ARTIKEL (`/app/[site]/artikel/[slug]/page.tsx`)

### Kerangka Visual

```
┌────────────────────────────────────────────────────────────────────┐
│  PUBLIC SITE LAYOUT (Header + Nav)                                │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │      │
│  │  ▓   ReadingProgress (sticky top, h-1 brand-red)  ▓   │      │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │      │
│  │                                                          │      │
│  │  ┌─── HEADER SECTION ────────────────────────────────┐ │      │
│  │  │  pt-8 pb-8 md:pt-12 md:pb-12                      │ │      │
│  │  │  border-b border-gray-100                         │ │      │
│  │  │                                                    │ │      │
│  │  │  max-w-5xl 2xl:max-w-[68rem]                      │ │      │
│  │  │                                                    │ │      │
│  │  │  [BADGE] [Kategori] • [Tanggal]                   │ │      │
│  │  │  mb-8 md:mb-10 lg:mb-12                           │ │      │
│  │  │                                                    │ │      │
│  │  │  ╔══════════════════════════════════════════════╗ │ │      │
│  │  │  ║  H1 TITLE (2xl → 5xl font-serif)             ║ │ │      │
│  │  │  ║  leading-1.1 tracking-tighter                ║ │ │      │
│  │  │  ║  mb-8 md:mb-10 lg:mb-12                      ║ │ │      │
│  │  │  ╚══════════════════════════════════════════════╝ │ │      │
│  │  │                                                    │ │      │
│  │  │  border-t pt-8 dark:border-white/10 md:pt-10       │ │      │
│  │  │                                                    │ │      │
│  │  │  ┌─────────┐  [Author Name]                       │ │      │
│  │  │  │ Avatar  │  Staf Redaksi BeritaKarya            │ │      │
│  │  │  │ h-12 w-12│  Lihat Profil →                    │ │      │
│  │  │  └─────────┘                                       │ │      │
│  │  │                                                    │ │      │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────┐       │ │      │
│  │  │  │ 📖 X Menit   │ │ 🖨 X Kata    │ │ 🔖  │       │ │      │
│  │  │  │ h-11 rounded │ │ h-11 rounded │ │ h-11 │       │ │      │
│  │  │  │ full pill    │ │ full pill    │ │ w-11 │       │ │      │
│  │  │  └──────────────┘ └──────────────┘ └──────┘       │ │      │
│  │  └────────────────────────────────────────────────────┘ │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                    │
│  ┌─── HERO IMAGE SECTION (mb-16 md:mb-20) ────────────────────┐  │
│  │  Container                                                    │  │
│  │  ┌───────────────────────────────────────────────────────┐    │  │
│  │  │  <figure> max-w-3xl mx-auto                           │    │  │
│  │  │  rounded-2xl border p-3 md:p-4                        │    │  │
│  │  │  SmartImage width=900 height=600                     │    │  │
│  │  │  object-contain                                       │    │  │
│  │  │  + ring-1 ring-inset + gradient overlay              │    │  │
│  │  │  ─────────────────────────────────────                │    │  │
│  │  │  Caption (italic, text-sm) + "FOTO / DOKUMENTASI"   │    │  │
│  │  └───────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─── CONTENT + SIDEBAR (mb-20 md:mb-28) ────────────────────┐   │
│  │  Container                                                    │   │
│  │  xl:grid-cols-[1.75fr_20rem] 2xl:[1.75fr_22.5rem] gap-12   │   │
│  │                                                               │   │
│  │  ┌─── MAIN COLUMN (xl:grid-cols-[4.25rem_43rem] gap-8) ──┐ │   │
│  │  │                                                          │ │   │
│  │  │  ┌─ FLOATING TOOLS (xl only) ─┐  ┌─ ARTICLE CONTENT ─┐  │ │   │
│  │  │  │  sticky top-32             │  │ max-w-[43rem]     │  │ │   │
│  │  │  │  ArticleFloatingTools      │  │ space-y-12        │  │ │   │
│  │  │  │  (share/bookmark buttons)  │  │                   │  │ │   │
│  │  │  │  w-4.25rem (~68px)         │  │ [BLOCKS]:         │  │ │   │
│  │  │  │                            │  │ • paragraph       │  │ │   │
│  │  │  │                            │  │ • heading (h2/h3) │  │ │   │
│  │  │  │                            │  │ • quote           │  │ │   │
│  │  │  │                            │  │ • image           │  │ │   │
│  │  │  │                            │  │ • imageGrid       │  │ │   │
│  │  │  │                            │  │ • gallery         │  │ │   │
│  │  │  │                            │  │ • embed           │  │ │   │
│  │  │  │                            │  │ • table           │  │ │   │
│  │  │  │                            │  │ • divider         │  │ │   │
│  │  │  │                            │  │                   │  │ │   │
│  │  │  │                            │  │ [Detail tiap      │  │ │   │
│  │  │  │                            │  │  block di bawah]  │  │ │   │
│  │  │  │                            │  │                   │  │ │   │
│  │  │  │                            │  │ ─────────         │  │ │   │
│  │  │  │                            │  │ SHARE & SAVE      │  │ │   │
│  │  │  │                            │  │ border-y py-6     │  │ │   │
│  │  │  │                            │  │                   │  │ │   │
│  │  │  │                            │  │ #tag1 #tag2 #tag3 │  │ │   │
│  │  │  │                            │  │ mt-16 pt-10       │  │ │   │
│  │  │  │                            │  │                   │  │ │   │
│  │  │  │                            │  │ ┌─ COMMENTS ──┐  │  │ │   │
│  │  │  │                            │  │ │ CommentSection│  │  │ │   │
│  │  │  │                            │  │ └──────────────┘  │  │ │   │
│  │  │  │                            │  │                   │  │ │   │
│  │  │  │                            │  │ ─── REKOMENDASI ─ │  │ │   │
│  │  │  │                            │  │ mt-16 pt-12       │  │ │   │
│  │  │  │                            │  │                   │  │ │   │
│  │  │  │                            │  │ ┌──┐┌──┐┌──┐    │  │ │   │
│  │  │  │                            │  │ │C ││C ││C │    │  │ │   │
│  │  │  │                            │  │ └──┘└──┘└──┘    │  │ │   │
│  │  │  │                            │  │ md:grid-cols-3   │  │ │   │
│  │  │  └────────────────────────────┘  └───────────────────┘  │ │   │
│  │  └──────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌─── SIDEBAR (xl only, sticky top-32, space-y-6) ─────────┐  │   │
│  │  │  (Detail di bawah)                                       │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  PUBLIC SITE LAYOUT FOOTER                                        │
└────────────────────────────────────────────────────────────────────┘
```

### Tabel Ukuran Halaman Artikel

| Section / Item | Dimensi / Class | Keterangan |
|---|---|---|
| **Reading Progress** | `fixed/sticky top-0 h-1` | Brand red, animasi width |
| **Header section** | `pt-8 pb-8 md:pt-12 md:pb-12` | Border-b gray-100 |
| **Header inner width** | `max-w-5xl 2xl:max-w-[68rem]` (1024px → 1088px) | Konten dibatasi |
| **Editorial badge** | `size="sm" rounded-full px-3 py-1` | Muncul jika badge variant ada |
| **H1 Title** | `text-2xl md:text-4xl lg:text-5xl` | `font-serif leading-1.1 tracking-tighter` |
| **Author avatar** | `h-12 w-12 rounded-xl` | `bg-brand-red text-lg` inisial |
| **Info pills (3 item)** | `h-11 rounded-full` | Padding `px-4.5 py-2` |
| └─ Inner icon | `h-7 w-7 rounded-full bg-brand-red/10` | 13px icon |
| **Bookmark button** | `h-11 w-11 rounded-full` | Border + backdrop |
| **Hero image container** | `max-w-3xl mx-auto` (768px) | `rounded-2xl p-3 md:p-4` |
| **Hero image** | `width=900 height=600` | `object-contain` (3:2 ratio) |
| **Hero overlay** | Ring + gradient-to-t black/35 | |
| **Caption** | `text-sm italic` + label `text-[9px] uppercase tracking-0.22em` | |
| **Content grid** | `xl:grid-cols-[1.75fr_20rem] 2xl:[1.75fr_22.5rem] gap-12 2xl:gap-16` | |
| **Main inner grid** | `xl:grid-cols-[4.25rem_minmax(0,43rem)] xl:gap-8 2xl:[4.5rem_45rem]` | |
| **Floating tools** | `sticky top-32` (hanya xl+) | Width 4.25rem (68px) |
| **Content max width** | `max-w-[43rem]` (688px) → 2xl: `45rem` (720px) | Optimal reading |
| **Content block spacing** | `space-y-12` (48px antar block) | |
| **Paragraph** | `text-[1.05rem] leading-[2rem] md:text-[1.125rem] md:leading-[2.08rem]` | `var(--article-font-scale)` untuk A11y |
| **Heading 2** | `text-[1.5rem] md:text-[2.35rem]` | `font-serif` |
| **Heading 3** | `text-[1.25rem] md:text-[1.9rem]` | |
| **Heading 4** | `text-[1.125rem] md:text-[1.5rem]` | |
| **Heading margins** | `mt-16 mb-8 md:mt-20 md:mb-10` | Spasi atas besar |
| **Quote** | `my-16 border-l-4 brand-red bg-gray-50` | `px-6 py-10 md:px-10 md:py-12 lg:px-16` |
| └─ Quote text | `text-[1.25rem] md:text-[1.65rem]` italic | leading 1.9/2.5 |
| └─ Decorative " | `text-7xl md:text-8xl` | `opacity-10 text-brand-red` |
| **Image block** | `my-16 aspect-video rounded-xl shadow-lg` | Border gray-100 |
| └─ Caption | `text-sm italic` + `text-[9px] uppercase` | `pb-6 border-b` |
| **Image grid 2-col** | `grid-cols-1 md:grid-cols-2 gap-4` | |
| **Image grid 3-col** | `grid-cols-1 md:grid-cols-3 gap-4` | |
| **Gallery** | `grid-cols-2 md:grid-cols-3 gap-2` | `aspect-square` |
| **Share & Save bar** | `mt-12 border-y py-6 flex-col sm:flex-row` | Label `text-[10px] uppercase` |
| **Bookmark inline** | `h-11 w-11 rounded-full` | Hover scale-105 |
| **Tags section** | `mt-16 md:mt-20 border-t pt-10 md:pt-12` | |
| └─ Tag pills | `px-5 py-2.5 text-[10px] rounded-full` | Hover bg-brand-red |
| **Comments** | `id="comments"` | Komponen CommentSection |
| **Recommended section** | `mt-16 md:mt-20 border-t pt-12 md:pt-14` | |
| └─ Heading accent | `h-8 w-1 bg-brand-red` | + label `text-[10px]` |
| └─ Cards | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8` | variant="medium" |
| **Sidebar (xl+)** | `sticky top-32 space-y-6` | Width 20rem/22.5rem |
| **Sidebar card base** | `rounded-[1.75rem] border p-5 shadow-[0_20px_60px]` | gray-100/white-5 |
| **Sidebar - Share & Save** | `space-y-4` | Share + bookmark (h-10 w-10) |
| **Sidebar - Info Artikel** | 1 author block + 4 mini-cards (2×2) | |
| └─ Author block | Avatar `h-11 w-11 rounded-2xl` | + "Lihat Profil" pill |
| └─ Mini cards | `rounded-2xl p-3.5` 4-item grid | `text-sm font-black` value |
| **Sidebar - Related Categories** | 2 NewsCard variant="minimal" | `space-y-5` |
| **Sidebar - Tags** | `flex flex-wrap gap-2` | max 8 tags |
| └─ Tag pills | `px-3 py-2 text-[10px] rounded-full` | |
| **Sidebar - Ads** | 2 × `AdSpace type="rectangle"` | Label "Advertisement" & "Sponsored" |

---

## 📊 Perbandingan Ringkas

| Aspek | Homepage | Halaman Artikel |
|---|---|---|
| **Container** | 1160px | 1024px (header) + 688px (content) |
| **Grid utama** | 8/4 cols | 1.75fr / 20rem |
| **Hero** | Bento 1+3, h-470px | 1 image 3:2, w-900 h-600 |
| **Cards per row** | 2-4 | 3 (related) |
| **Sidebar** | Populer, akses, iklan, video | Share, info, related, tags, 2 ads |
| **Floating** | Tidak | Floating tools (share/bookmark) di xl |
| **Sidebar trigger** | lg (1024px) | xl (1280px) |
| **Top spacing** | py-10 md:py-12 | pt-8 md:pt-12 |
| **Block spacing** | gap-8 / space-y-10 | space-y-12 |
| **Theme** | Magazine multi-section | Single-column reading-focused |

---

## 📁 File Referensi

| File | Peran |
|---|---|
| [`apps/web/app/[site]/page.tsx`](../../apps/web/app/[site]/page.tsx) | Entry homepage (server component) |
| [`apps/web/components/pages/SiteHomePage.tsx`](../../apps/web/components/pages/SiteHomePage.tsx) | Render utama homepage |
| [`apps/web/components/berita/MagazineBentoHero.tsx`](../../apps/web/components/berita/MagazineBentoHero.tsx) | Hero bento grid |
| [`apps/web/components/ui/NewsCard.tsx`](../../apps/web/components/ui/NewsCard.tsx) | Card artikel (4 variant) |
| [`apps/web/app/[site]/artikel/[slug]/page.tsx`](../../apps/web/app/[site]/artikel/[slug]/page.tsx) | Halaman artikel |
| [`apps/web/components/layout/Container.tsx`](../../apps/web/components/layout/Container.tsx) | Standard container |
| [`apps/web/components/layout/PublicSiteLayout.tsx`](../../apps/web/components/layout/PublicSiteLayout.tsx) | Shell layout publik |
| [`apps/web/app/globals.css`](../../apps/web/app/globals.css) | Design tokens (`--container-max-width`, `--content-max-width`) |
| [`apps/web/tailwind.config.ts`](../../apps/web/tailwind.config.ts) | Tailwind config + brand colors |
