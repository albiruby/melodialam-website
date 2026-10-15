# ADR-0008 — CMS: Sanity Studio menggantikan Payload CMS 3 + Supabase

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` — **diimplementasikan dan diuji** |
| **Tanggal** | 15 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (Tim Produk Melodi Alam) |
| **Menggantikan** | ADR-0002 (Payload CMS 3 + Supabase). ADR-0003 (Supabase sebagai Postgres + storage) tidak lagi dipakai kode, tetapi project Supabase-nya sengaja dibiarkan hidup. |
| **Terkait** | `OQ-002`, `USR-003`, ADR-0005 |

## Konteks

ADR-0002 memilih Payload CMS 3 berjalan di dalam aplikasi Next.js ini, dengan Supabase
sebagai Postgres dan object storage. Implementasinya selesai: enam koleksi, satu migrasi
yang diterapkan, panel admin yang berfungsi, dan artikel CMS yang sudah render di
`/journal`.

Setelah dipakai, pemilik produk memutuskan untuk menggantinya dengan Sanity Studio.
Alasan yang dicatat di sini adalah alasan yang benar-benar muncul saat implementasi,
bukan alasan yang dibayangkan sebelumnya:

1. **Beban operasional Payload di lingkungan ini lebih besar dari perkiraan.** Loader
   `tsx` milik Payload crash di Node 24, sehingga setiap skrip `payload *` harus memakai
   `--disable-transpile`, dan impor relatif di `payload.config.ts` terpaksa membawa
   ekstensi `.ts` eksplisit. Panel adminnya juga menuntut `app/(payload)/layout.tsx`
   sendiri agar tidak menghasilkan `<html>` bersarang.
2. **Skema adalah kode yang harus dimigrasikan.** Setiap perubahan koleksi berarti satu
   berkas migrasi baru untuk ditulis, ditinjau, dan dijalankan. Untuk tim sekecil ini,
   biaya itu tidak sebanding dengan manfaatnya.
3. **Supabase menambah satu sistem yang harus dijaga** — project, connection string,
   pooler, kredensial storage — padahal yang dibutuhkan hanya "editor bisa menulis".

## Keputusan

Memakai **Sanity Studio**, di-*embed* di dalam aplikasi Next.js ini pada rute `/studio`,
dengan **dua dataset** yang sengaja dipisah:

| Dataset | ACL | Isi | Dibaca oleh |
|---|---|---|---|
| `production` | publik | artikel, gambar | `lib/articles.ts`, tanpa token, bisa lewat CDN |
| `submissions` | **privat** | kiriman demo + kontak manajer | `lib/sanity-server.ts` saja, wajib token |

Pemisahan itu bukan hiasan. Antrean demo menyimpan nomor WhatsApp manajer, dan dataset
Sanity yang publik dapat dibaca siapa pun yang tahu project id. Dua dataset adalah cara
menjaga artikel tetap tokenless dan CDN-*cacheable* sementara PII tetap tertutup.

Konsekuensi yang mengikat:

1. **Tidak ada lagi basis data milik sendiri.** Tidak ada Postgres, tidak ada migrasi,
   tidak ada tabel. Skema hidup di `sanity/schemaTypes/` dan diterapkan oleh Sanity.
2. **`lib/content.ts` tetap menjadi fallback.** Aturan lama dipertahankan: CMS menang
   saat terkonfigurasi, berkas statis dipakai saat tidak. Checkout bersih tanpa `.env`
   tetap membangun situs yang utuh.
3. **Token tidak pernah menyentuh bundel klien.** `lib/sanity.ts` tidak memuat token dan
   aman diimpor dari mana saja; `lib/sanity-server.ts` yang memuatnya, dan tidak boleh
   diimpor komponen klien.
4. **Rute `/studio` adalah root layout sendiri**, karena layout situs hidup di route
   group `(site)` dan route group bukan penyedia layout untuk rute di luarnya.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Tetap di Payload** | Sudah berjalan; artikel CMS sudah render | Beban operasional dan migrasi skema seperti diuraikan di Konteks. |
| **Sanity dengan satu dataset privat** | Paling sederhana; semua di satu tempat | Artikel ikut kehilangan pembacaan tanpa token dan cache CDN, padahal artikel bukan rahasia. |
| **Sanity dengan satu dataset publik** | Artikel dapat CDN | Menaruh nomor kontak musisi di dataset yang dapat dibaca publik. Tidak dapat diterima. |
| **Kembali ke `lib/content.ts` saja** | Nol infrastruktur | Editor non-teknis kembali tidak bisa mempublikasikan apa pun — masalah `USR-003` yang justru alasan seluruh fase ini. |

> Catatan penting: ADR-0002 menolak Sanity dengan alasan "menambah satu sistem eksternal,
> satu deploy, dan satu sumber kebenaran tipe di luar repo". Alasan itu benar untuk Sanity
> yang di-*hosting* terpisah. Studio yang di-*embed* membatalkannya: tidak ada deploy
> tambahan, dan skema tetap kode di dalam repo ini. Keputusan lama itu tidak salah pada
> saat diambil; premisnya yang berubah.

## Konsekuensi

**Positif**

- Tidak ada basis data untuk dijaga, dimigrasikan, atau dibayar. Project Supabase masih
  hidup tetapi tidak lagi dipanggil kode mana pun.
- Editor mendapat Studio dengan pratinjau, riwayat versi, dan kolaborasi bawaan.
- Skema tetap kode di dalam repo, di `sanity/schemaTypes/`.
- Artikel tetap dapat di-*prerender* dan tetap dibaca tanpa token.

**Negatif / utang**

- **Ketergantungan pada layanan pihak ketiga.** Kalau Sanity tidak dapat dijangkau,
  pembacaan artikel jatuh ke `lib/content.ts` (12 artikel lama), bukan ke keadaan
  terakhir. Itu fallback yang jujur tetapi bukan cermin dari isi terkini.
- **Dua workspace di satu Studio** menambah satu konsep yang harus dipahami editor:
  "Konten" dan "Antrean Demo" adalah dua dataset berbeda.
- **Kontak musisi kini berada di CMS.** Sebelumnya di Postgres yang terpisah dari
  alat editorial. Mitigasinya adalah dataset privat, dan sudah diuji: kueri tanpa token
  mengembalikan `null` untuk dokumen yang kueri sama kembalikan dengan token.
- **Pratinjau draf belum dibangun.** Publikasi langsung terlihat; menyunting draf
  belum dapat dipratinjau di situs.

## Referensi

- [`../SANITY-INTEGRATION.md`](../SANITY-INTEGRATION.md) — panduan integrasi lengkap
- `lib/sanity.ts`, `lib/sanity-server.ts`, `lib/articles.ts`
- `sanity.config.ts`, `sanity/schemaTypes/`
- `app/api/demos/route.ts`, `app/api/revalidate/route.ts`
- ADR-0005 (antrean demo dimoderasi) — masih berlaku, hanya tempat simpannya berubah

## Catatan Verifikasi

Diperiksa dengan menjalankan, bukan membaca:

- **Artikel CMS render.** `/journal/uji-coba-sanity` → 200, dengan urutan blok
  `p, h2, p, ul, blockquote, p`; `<h2>` berbunyi "Subjudul dari rich text", dua `<li>`
  terisi, `<blockquote>` terisi, drop cap `60px` warna `rgb(27, 59, 43)`, dan penanda
  "dari CMS" muncul.
- **Isolasi PII.** Menulis satu dokumen berisi `+62-000-RAHASIA-UJI` ke dataset
  `submissions`: kueri tanpa token mengembalikan `result: null`; kueri dengan token
  mengembalikan nilainya.
- **Antrean demo.** `POST /api/demos` → 201 dengan status `IN REVIEW`; kontak tidak ada
  di badan respons; `GET /api/demos` → `count 0` (baris IN REVIEW tidak publik).
- **Webhook revalidasi.** Tanpa secret, secret salah, dan secret sepanjang benar tetapi
  isinya salah → semuanya **401**; hanya secret tepat → 200 `{revalidated: true}`.
- **Studio.** `/studio` dan `/studio/content` → 200; Studio terhubung ke project
  (`03sgar5q`) dan menampilkan halaman masuk Sanity.
- **Build.** `npm run lint` dan `npx tsc --noEmit` bersih; `npm run build` menghasilkan
  **28 halaman statis** dengan tabel rute menunjukkan `Revalidate 1m · Expire 1h` untuk
  `/journal`.
- **Payload benar-benar hilang.** Tidak ada paket `payload*`, `pg`, `graphql`, atau
  `sass` di `package.json`; tidak ada `payload.config.ts`, `payload-types.ts`,
  `collections/`, `migrations/`, `app/(payload)/`, atau `lib/payload.ts`.
- `[PERLU VERIFIKASI]`: perilaku Sanity saat layanan tidak dapat dijangkau di produksi
  (fallback statis diuji secara logika, bukan dengan memutus jaringan).
