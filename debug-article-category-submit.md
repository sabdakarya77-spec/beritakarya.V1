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
