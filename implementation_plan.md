# Rencana Implementasi: Peningkatan Branding, Visual, & UI/UX Portal Berita Karya

Rencana ini bertujuan untuk memodifikasi identitas visual, meningkatkan keterbacaan artikel, membersihkan layout grid agar tidak crowded, serta melengkapi halaman trust & kredibilitas redaksi sesuai standar Dewan Pers Indonesia.

## User Review Required

> [!IMPORTANT]
> **1. Transisi Font Utama:** Kami merekomendasikan penggantian font **Outfit** menjadi **Plus Jakarta Sans** untuk memberikan kesan modern, netral, dan premium. Font *Playfair Display* tetap dipertahankan untuk judul artikel panjang bermodel majalah (*editorial magazine*).
> 
> **2. Pembersihan Kepadatan Teks Kartu Berita:** Kami akan menghapus paragraf ringkasan (*excerpt*) pada kartu berita berukuran medium (grid halaman utama) agar layout portal terlihat lebih bersih, rapi, dan seimbang layaknya Kompas.id atau The Jakarta Post.
> 
> **3. Fallback Halaman Kredibilitas Redaksi:** Jika data `aboutUs`, `editorial`, `codeOfEthics`, atau `mediaSiber` di database situs kosong, kami akan menyediakan struktur teks fallback yang profesional sesuai standar Kode Etik Jurnalistik dan Dewan Pers.

## Proposed Changes

---

### [Component: Visual & Branding System]

#### [MODIFY] [layout.tsx](file:///d:/beritakarya-v1/apps/web/app/layout.tsx)
- Mengimpor font **Plus Jakarta Sans** dari `next/font/google` menggantikan font **Outfit**.
- Memperbarui body class agar menggunakan `--font-plus-jakarta-sans` sebagai variabel sans utama.

#### [MODIFY] [tailwind.config.ts](file:///d:/beritakarya-v1/apps/web/tailwind.config.ts)
- Memetakan font `sans` ke `var(--font-plus-jakarta-sans)` diikuti oleh `var(--font-inter)`.
- Menyesuaikan scale *font-weight* agar headline utama memiliki kontras yang tebal (700-800) dan body text lebih terbaca (400-500).

#### [MODIFY] [globals.css](file:///d:/beritakarya-v1/apps/web/app/globals.css)
- Memperbarui `@import` font Google dari *Inter* menjadi *Plus Jakarta Sans* dan *Inter*.
- Menyesuaikan variabel warna basis pada `:root` dan `.dark` agar kontras warna border (`--dash-border`) dan warna latar sekunder tidak terlalu terang, menjaga harmoni mode gelap yang bersih.
- Menghaluskan transisi *shadow* pada class kartu berita (`.dash-card` dan hover states).

---

### [Component: Header & News Cards]

#### [MODIFY] [Navbar.tsx](file:///d:/beritakarya-v1/apps/web/components/layout/Navbar.tsx)
- Merancang dan menanamkan **Typographic SVG Logo** yang minimalis dan berkarakter kuat untuk menggantikan teks logo fallback `BERITA KARYA` biasa. 
- Logo SVG ini memiliki desain modern dengan kombinasi merah marun (*Crimson Red*) dan putih/abu-abu netral, berkarakter tipografi berita nasional, serta sepenuhnya responsif.

#### [MODIFY] [NewsCard.tsx](file:///d:/beritakarya-v1/apps/web/components/ui/NewsCard.tsx)
- Pada bagian render kartu berita berukuran `medium` (default grid feed), menghapus bagian paragraf `<p className="line-clamp-2 ...">{excerpt}</p>` agar kartu berita hanya memuat Kategori, Judul Utama, Penulis, Tanggal, dan Waktu Baca.
- Menambahkan *hover micro-animation* yang lebih halus (efek scale tipis pada gambar dan elevasi shadow kontainer).

---

### [Component: Legal & Trust Pages]

#### [MODIFY] [page.tsx](file:///d:/beritakarya-v1/apps/web/app/[site]/p/[slug]/page.tsx)
- Menyempurnakan pemanggilan `resolveLegalPage` dengan menyuntikkan template konten fallback (default content) profesional berbahasa Indonesia jika kolom teks di database bernilai kosong/null. Konten fallback yang disediakan meliputi:
  - **Tentang Kami (about):** Visi portal berita independen, akurat, dan tepercaya untuk Nusantara.
  - **Redaksi (editorial):** Struktur kepengurusan redaksi standar (Penanggung Jawab, Pemimpin Redaksi, Sekretaris Redaksi, Jurnalis).
  - **Kode Etik (ethics):** Butir-butir Kode Etik Jurnalistik Dewan Pers.
  - **Pedoman Media Siber (media-siber):** Rujukan resmi Keputusan Dewan Pers mengenai pedoman pemberitaan media siber di Indonesia.

---

## Verification Plan

### Automated Tests
- Menjalankan build Next.js secara lokal untuk memastikan tidak ada kesalahan TypeScript pada impor font baru maupun perubahan JSX:
  ```powershell
  pnpm --filter @beritakarya/web build
  ```

### Manual Verification
- **Verifikasi Visual:**
  - Buka halaman utama dalam mode terang (*light*) dan mode gelap (*dark*), pastikan font *Plus Jakarta Sans* ter-load dengan benar.
  - Periksa rendering logo SVG baru di navigasi utama dalam kondisi terkompresi (*collapsed* saat di-scroll) dan penuh.
- **Verifikasi Kepadatan Teks:**
  - Amati grid artikel halaman depan. Pastikan card berita terlihat bersih dan proporsional tanpa rentetan paragraf deskripsi yang panjang.
- **Verifikasi Halaman Legal:**
  - Navigasikan ke footer, klik link *Tentang Kami*, *Redaksi*, *Kode Etik*, dan *Pedoman Media Siber*. Pastikan seluruh halaman tersebut merender konten fallback yang rapi dan profesional apabila database belum terisi.
