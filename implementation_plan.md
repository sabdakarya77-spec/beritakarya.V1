# Rencana Implementasi: Redesign Kategori & Rubrikasi Dashboard ke Bento Grid Card Layout

Rencana ini bertujuan untuk mendesain ulang halaman [page.tsx](file:///d:/beritakarya-v1/apps/web/app/[site]/dashboard/categories/page.tsx) di menu Kategori & Rubrikasi dari format tabel vertikal panjang ke Bento Grid Card Layout (Alternatif 2).

## Proposed Changes

---

### [Component: Dashboard Categories]

#### [MODIFY] [page.tsx](file:///d:/beritakarya-v1/apps/web/app/[site]/dashboard/categories/page.tsx)
- **Mengganti Tabel Vertikal dengan Card Grid Layout:**
  - Area kanan (`lg:col-span-8`) yang sebelumnya merender tabel HTML hierarkis diubah menjadi layout grid responsif (`grid grid-cols-1 md:grid-cols-2 gap-5`).
- **Penyusunan Desain Kartu (Parent Cards):**
  - Setiap Kategori Utama (Parent) dirender sebagai kartu terpisah (*card container*) dengan styling modern (dark mode support, shadow lembut, border radius `rounded-2xl`).
  - Menambahkan bar warna penanda di bagian kiri/atas kartu menggunakan kategori warna otomatis (`getCategoryColor(parent.name)`).
  - Di header kartu: menampilkan nama kategori parent (teks tebal), badge scope (GLOBAL / SITE), nilai urutan (order), serta tombol aksi edit (`✏️`) dan hapus (`🗑️`).
- **Penyusunan Chip Subkategori (Subcategory Chips):**
  - Di dalam badan kartu (*card body*), subkategori dirender sebagai barisan chips/pills horizontal (`flex flex-wrap gap-2`) yang ringkas.
  - Setiap subkategori pill menampilkan nama subkategori dan tombol aksi mini (edit & hapus) di dalamnya untuk meminimalkan penggunaan ruang visual.
  - Menyediakan penanganan kondisi kosong (*empty state handler*) jika kategori parent belum memiliki subkategori.
- **Peningkatan UX Interaktivitas Form:**
  - Di footer kartu, ditambahkan tombol aksi cepat `+ Tambah Sub` yang jika diklik otomatis akan mengisi field `parentId` di form kiri dengan kategori parent ini dan memfokuskan kursor ke input nama kategori baru, mempermudah entri data subkategori tanpa kebingungan mencari opsi dropdown parent menu.

---

## Verification Plan

### Automated Tests
- Menjalankan Next.js build verification secara lokal untuk memastikan tidak ada error kompilasi TypeScript atau linting pada page dashboard:
  ```powershell
  pnpm --filter @beritakarya/web build
  ```

### Manual Verification
- **Uji Coba Fungsionalitas CRUD:**
  - Tambah kategori utama dan subkategori baru, lalu pastikan langsung ter-render sebagai kartu dan chips baru secara instan.
  - Lakukan edit dan hapus pada kategori utama (lewat tombol aksi di header kartu) serta subkategori (lewat tombol aksi mini di dalam chip pill) dan pastikan data ter-update di database dengan benar.
  - Coba klik tombol `+ Tambah Sub` di bawah salah satu kartu parent, pastikan dropdown pilihan induk di form kiri terisi otomatis ke kategori induk tersebut secara instan.
- **Verifikasi Layout & Responsivitas:**
  - Periksa halaman pada layar desktop: Pastikan layout grid membagi kartu ke dalam 2 kolom yang rapi tanpa perlu melakukan scrolling vertikal yang sangat panjang.
  - Periksa halaman pada layar mobile: Pastikan grid bertransisi mulus menjadi 1 kolom penuh yang nyaman diusap.
