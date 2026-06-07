# Debug Session: article-category-submit

Status: OPEN

## Gejala
- Kategori artikel masih terlihat setelah autosave/save biasa lalu keluar-masuk halaman edit.
- Kategori hilang dari UI editor setelah klik submit, keluar halaman, lalu masuk lagi ke halaman edit.
- Patch awal pada dropdown kategori belum menyelesaikan gejala.

## Hipotesis Awal
1. Endpoint `GET /articles/:id` mengembalikan data kategori berbeda antara status `draft` dan `submitted`.
2. Ada proses frontend setelah submit yang menimpa `categoryId` di store menjadi `null` atau nilai lain.
3. Daftar kategori editor tidak memuat entri yang cocok dengan kategori artikel setelah reload.
4. Request lanjutan setelah submit mengirim payload parsial yang menimpa kategori terakhir.
5. Ada perbedaan cache/router state saat membuka ulang editor artikel submitted.

## Rencana
- Tambahkan instrumentasi minimal pada load/save/submit editor.
- Rekam payload request dan respons artikel terkait kategori dan status.
- Bandingkan perilaku sebelum submit, saat submit, dan setelah reload edit.
- Tentukan hipotesis yang benar berdasarkan log runtime.

## Temuan
- Bukti runtime menunjukkan kategori masih ada tepat sebelum submit:
  - `submitForReview before status update` mencatat `categoryId: "peristiwa"`.
  - `saveArticle payload` untuk draft juga mencatat `payloadCategoryId: "peristiwa"`.
- Setelah submit dan login ulang, `loadArticle` untuk artikel yang sama mengembalikan:
  - `status: "submitted"`
  - `categoryId: null`
  - `categorySlug: null`
- Jadi kategori bukan sekadar gagal ditampilkan di UI; nilainya memang sudah tersimpan `null` setelah request submit diproses.
- Akar masalah ada di validator backend:
  - `optionalCategoryId` mengubah `undefined` menjadi `null`.
  - Pada update artikel dengan payload hanya `{ status: "submitted" }`, field `categoryId` yang tidak dikirim ikut diparse sebagai `null`.
  - Service lalu masuk ke cabang `if (input.categoryId !== undefined)` dan menyimpan `categoryId = null`.

## Status Hipotesis
- H1. Endpoint `GET /articles/:id` mengembalikan kategori berbeda antara draft dan submitted: TERKONFIRMASI.
- H2. Frontend menimpa `categoryId` menjadi `null` setelah submit: TIDAK ADA BUKTI.
- H3. Dropdown kategori gagal mencocokkan data: DITOLAK sebagai akar utama.
- H4. Request submit/update parsial menimpa kategori: TERKONFIRMASI melalui jalur validasi backend.
- H5. Cache/router state menyebabkan mismatch: TIDAK ADA BUKTI.

## Fix Diterapkan
- Validator artikel backend kini hanya mengubah `categoryId` kosong (`''`) menjadi `null`.
- `categoryId` yang tidak dikirim akan tetap `undefined`, sehingga update status saja tidak lagi menghapus kategori.
- Ditambahkan regresi test untuk memastikan:
  - payload `{ status: 'submitted' }` tidak menghasilkan `categoryId: null`
  - payload `{ categoryId: '' }` tetap bisa dipakai untuk menghapus kategori secara eksplisit

## Verifikasi
- Test lulus:
  - `src/modules/article/article.validator.test.ts`
  - `src/modules/article/article.service.test.ts`
