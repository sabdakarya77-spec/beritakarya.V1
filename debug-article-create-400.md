# Debug Session: article-create-400

Status: OPEN

## Gejala
- POST `https://beritakarya-v1-web.vercel.app/api/v1/articles?site=pusat` mengembalikan 400 saat membuat artikel baru.
- UI menampilkan pesan `Nilai untuk siteId, slug sudah terdaftar`.
- Error muncul setelah isi judul, dan tetap muncul setelah menambahkan gambar utama.

## Hipotesis Awal
1. Slug dibuat terlalu dini dari judul, lalu backend langsung memvalidasi unik terhadap data existing dan menemukan duplikasi.
2. Payload create article mengirim `siteId` yang salah, kosong, atau tidak sinkron dengan query `?site=pusat`, sehingga validasi backend gagal.
3. Frontend mengirim request create berulang saat field berubah, sehingga draft pertama sudah tersimpan atau partially reserved lalu request berikutnya bentrok pada slug/siteId.
4. Backend create endpoint menerapkan unique constraint gabungan `siteId + slug`, tetapi frontend tidak mengirim identifier draft/article lama saat melakukan autosave/update.
5. Ada mismatch mapping antara mode "new article" dan "edit draft", sehingga form baru memanggil endpoint create terus-menerus, bukan update/upsert.

## Rencana
- Telusuri alur form `/dashboard/articles/new` di frontend.
- Cari pembentukan payload untuk endpoint `/api/v1/articles`.
- Verifikasi validasi backend dan sumber pesan `Nilai untuk siteId, slug sudah terdaftar`.
- Cocokkan apakah 400 berasal dari duplicate create, payload invalid, atau konflik autosave.

## Temuan
- Backend mengubah error Prisma `P2002` menjadi pesan `Nilai untuk siteId, slug sudah terdaftar`.
- Constraint unik database artikel adalah `@@unique([siteId, slug])`.
- Pengecekan slug di aplikasi (`slugExists`) hanya melihat artikel aktif (`deletedAt: null`), tetapi constraint database tetap berlaku juga untuk artikel yang sudah soft-delete.
- Retry slug saat create dibatasi 5 percobaan total: `wanita`, `wanita-2`, `wanita-3`, `wanita-4`, `wanita-5`.
- Data runtime menunjukkan pada site `pusat` sudah ada artikel soft-delete dengan slug:
  - `wanita`
  - `wanita-2`
  - `wanita-3`
  - `wanita-4`
  - `wanita-5`
- Karena semua 5 kandidat itu masih "terkunci" oleh unique index database, create article baru dengan judul `wanita` gagal terus dan frontend tetap berada pada mode create (`articleId` tidak pernah terisi).
- Akibatnya setiap autosave berikutnya tetap mengirim `POST /articles`, sehingga user melihat error yang sama lagi setelah menambah gambar utama atau mengubah field lain.

## Hipotesis Terkonfirmasi / Ditolak
- H1. Slug konflik dengan data existing: TERKONFIRMASI.
- H2. `siteId` salah atau tidak sinkron: TIDAK ADA BUKTI saat ini.
- H3. Frontend create berulang: SEBAGIAN BENAR, tetapi ini efek lanjutan setelah create pertama gagal.
- H4. Endpoint new memakai create terus tanpa id draft: TERLIHAT BENAR untuk state awal, namun akar error tetap konflik slug.
- H5. Mismatch mode new vs edit draft: BELUM ADA BUKTI kuat.

## Fix Diterapkan
- `slugExists` sekarang memeriksa semua artikel pada site yang sama, termasuk yang sudah soft-delete.
- Dengan perubahan ini, generator slug tidak lagi menganggap slug milik artikel soft-delete sebagai tersedia.
- Dampak langsung untuk kasus `wanita`: generator akan melewati `wanita` s.d. `wanita-5` dan memilih `wanita-6`.

## Verifikasi
- Unit test slug lulus: 5/5.
- Ditambahkan regresi test untuk memastikan slug terus naik sampai kandidat pertama yang benar-benar bebas.
