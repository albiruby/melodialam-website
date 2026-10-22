# ADR-0002 — Backend & CMS: Payload CMS 3 di dalam aplikasi Next.js, dengan Supabase

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` — **digantikan ADR-0008** (dokumen ini sejarah) |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (Tim Produk Melodi Alam) |
| **Terkait** | `OQ-002`, `FR-001`…`FR-007`, `OBJ-001`, `OBJ-003`, `USR-003` |
| **Bergantung pada** | ADR-0003 (Supabase sebagai Postgres + object storage) |

## Konteks

Konten editorial hari ini adalah kode. `lib/content-fallback.ts` memuat 12 artikel beserta
seluruh baris wawancara, genre, dan item ruang; `lib/catalogue.json` adalah artefak
*generated* dari hasil scrape kanal YouTube. Untuk pembaca ini bekerja baik: seluruh
situs terbangun statis dan cepat.

Masalahnya adalah tim redaksi (`USR-003`). Hari ini mempublikasikan satu artikel berarti
mengubah berkas TypeScript, membuka *pull request*, menunggu tinjauan, lalu menunggu
deploy. Itu hambatan yang tidak sebanding untuk publikasi rutin, dan tidak dapat
dilakukan oleh editor yang tidak bekerja dengan git.

Yang dibutuhkan adalah antarmuka pengelolaan konten untuk `Article`,
`VideoSession` (sisi kurasi, bukan sinkronisasi otomatis), dan `DemoSubmission` —
tanpa membuang sifat statis dan cepat dari situs yang sudah ada.

## Keputusan

Memakai **Payload CMS 3 yang berjalan di dalam aplikasi Next.js ini**, dengan
**Supabase** sebagai Postgres dan *object storage* (ADR-0003).

Payload 3 dipasang sebagai bagian dari aplikasi yang sama: panel adminnya adalah route
Next.js, koleksinya didefinisikan sebagai kode di dalam repo ini, dan tipe datanya
diturunkan dari definisi koleksi tersebut.

Konsekuensi arsitektural yang mengikat:

1. **Satu repo, satu deploy.** Tidak ada studio yang di-*hosting* terpisah dan tidak ada
   langkah sinkronisasi antar-sistem. Batasan modulnya ada di `docs/ARCHITECTURE.md`.
2. **Konten tetap terbaca saat *build*.** Halaman tetap dapat di-*render* statis dengan
   membaca dari Postgres pada waktu build; sifat statis situs dipertahankan.
3. **`lib/content-fallback.ts` dibekukan sebagai sumber kebenaran selama migrasi.** Migrasi
   dilakukan per-halaman, bukan serentak, dan berkas itu menjadi *read-only* sampai
   halaman terakhir pindah. Lihat `ARCH-RISK-005` di `docs/ARCHITECTURE.md`.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Sanity Studio** (di-*hosting* terpisah) | *Onboarding* editor paling mulus, kolaborasi *real-time*, pratinjau bagus | Menambah satu sistem eksternal, satu *deploy*, dan satu sumber kebenaran tipe di luar repo. Untuk tim sekecil ini, biaya operasionalnya tidak sebanding. |
| **Tetap di repo** (`lib/content-fallback.ts` / MDX) | Nol infrastruktur tambahan; sudah berjalan | Editor non-teknis tidak bisa mempublikasikan apa pun. Tidak menyelesaikan masalah `USR-003`, yang justru alasan utama fase ini. |
| **WordPress headless** | Familiar bagi banyak tim redaksi | Menambah satu *stack* (PHP) dan satu *deploy* yang tidak berhubungan dengan Next.js; tipe data tidak pernah benar-benar sinkron dengan kode. |
| **Payload di repo terpisah** | Pemisahan tanggung jawab yang lebih tegas | Dua deploy yang harus dijaga serempak, dan tipe koleksi tidak lagi satu paket dengan aplikasi yang memakainya. |

## Konsekuensi

**Positif**

- Editor mendapat antarmuka nyata untuk membuat dan menyunting artikel; publikasi tidak
  lagi bergantung pada `git`.
- Definisi koleksi adalah kode di dalam repo, sehingga tipe `Article` dan skema basis
  data tidak bisa melenceng satu sama lain.
- Satu deploy, satu set variabel lingkungan, satu pipeline.
- Halaman tetap dapat di-*prerender*, sehingga performa baca tidak dikorbankan.

**Negatif / utang**

- **Payload terikat pada versi Next.js.** Ini tercatat sebagai `ARCH-RISK-006` di
  `docs/ARCHITECTURE.md`; versi harus dipin dan setiap *upgrade* Next diuji di
  *preview* lebih dulu.
- Selama migrasi ada dua sumber kebenaran editorial (`ARCH-RISK-005`).
- Menambah permukaan serangan baru: panel admin, sesi autentikasi, dan `service role
  key` Supabase. Ditangani di `docs/SECURITY-PRIVACY.md`.
- Menambah permukaan yang perlu diuji (autentikasi kurator, alur moderasi) yang belum
  ada padanannya hari ini.

## Referensi

- `docs/ARCHITECTURE.md` — batas modul dan alur data target
- `docs/DATA-MODEL.md` — koleksi Payload dan skema Postgres
- `docs/API-CONTRACTS.md` — permukaan REST/GraphQL
- ADR-0003, ADR-0004, ADR-0005

## Catatan Verifikasi

- `TERVERIFIKASI`: hari ini tidak ada `payload` maupun klien Supabase di
  `package.json`; konten memang hidup di `lib/content-fallback.ts`; tidak ada berkas `.env`.
- `RENCANA`: seluruh keputusan di atas. **Fase ini hanya dokumen** — tidak ada paket
  yang dipasang dan tidak ada kode yang diubah.
- `[PERLU VERIFIKASI]`: dukungan resmi Payload 3 pada Next.js `16.4.0` secara spesifik,
  dan apakah panel adminnya bertabrakan dengan route handler `/api/demos` yang sudah
  ada (lihat Open Questions di `docs/API-CONTRACTS.md`).
- **Pembaruan 21 Okt 2026** (`TERVERIFIKASI`): Payload CMS 3 sempat diimplementasikan
  lengkap — enam koleksi, satu migrasi, dan panel admin yang berfungsi — lalu
  **digantikan Sanity Studio** (ADR-0008). Tidak ada paket `payload*`, `pg`, atau
  `graphql` yang tersisa di `package.json`, dan tidak ada `payload.config.ts`,
  `collections/`, `migrations/`, `app/(payload)/`, atau `lib/payload.ts`. Keputusan
  dalam dokumen ini sudah tidak berlaku dan kini dibaca sebagai catatan sejarah.
