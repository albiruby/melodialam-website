# ADR-0004 — Katalog video tetap di-*generate* saat build, tidak masuk CMS

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Tim Produk Melodi Alam |
| **Terkait** | `OBJ-002`, `FR-005`, `INT-001`, `INT-002`, `DEP-001`, `SCR-05` |
| **Berbeda dari** | ADR-0002, yang memindahkan artikel ke Payload |

## Konteks

`lib/catalogue.json` (192 KB) memuat 292 video, 342 Shorts, 5 playlist, dan angka profil
kanal. Isinya berasal dari scrape `../melodi-alam-data.md` dan dihasilkan oleh
`npm run catalogue`.

Sifat data ini berbeda mendasar dari artikel:

- **Bukan tulisan manusia.** Tidak ada editor yang mengarang barisnya; semuanya adalah
  cerminan kanal YouTube pada satu titik waktu.
- **Sangat banyak dan seragam.** 292 baris dengan bentuk yang sama persis.
- **Sudah usang saat dibuat.** Angka *views* dibulatkan YouTube, dan usia unggahan
  bersifat relatif terhadap tanggal scrape.
- **Tidak perlu disunting.** Tidak ada tindakan editorial yang masuk akal pada
  satu baris video.

Sekaligus ada tekanan untuk memindahkannya: ADR-0002 memindahkan artikel ke database,
dan akan menggoda untuk memindahkan semuanya agar seragam. `INT-002` juga mengusulkan
menarik data video otomatis lewat YouTube Data API v3.

## Keputusan

**Katalog video tetap sebagai artefak yang di-*generate* saat build, dan tidak menjadi
koleksi CMS.**

- `lib/catalogue.json` tetap dihasilkan oleh `scripts/build-catalogue.mjs` dan tetap
  tidak boleh disunting tangan.
- `scripts/build-catalogue.mjs` adalah satu-satunya penulis berkas itu.
- Ia tetap dibaca lewat aksesornya di `lib/catalogue.ts`.

Yang **tidak** diambil dari keputusan ini: sisi kurasi. Menandai video mana yang
ditonjolkan, memilih video untuk beranda, atau menyusun playlist editorial adalah
tindakan editorial yang sah. Jika itu dibutuhkan, bentuknya adalah **koleksi kecil
terpisah yang merujuk `youtubeId`**, bukan memindahkan seluruh katalog ke database.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Pindahkan semua ke Postgres** | Satu sumber kebenaran; kueri fleksibel; siap untuk `INT-002` | 292 baris yang tidak pernah disunting manusia menjadi beban sinkronisasi tanpa manfaat editorial. Setiap re-scrape berarti operasi tulis massal, dan tabel akan selalu berisiko melenceng dari kanal. |
| **Sinkronisasi otomatis dari YouTube Data API v3** | Selalu segar; menghapus langkah scrape manual | Butuh kuota API, penjadwalan, dan penanganan kegagalan. Menambah ketergantungan runtime untuk data yang kualitasnya tidak lebih baik dari snapshot. Tetap mungkin sebagai peningkatan `INT-002`, tetapi bukan alasan untuk memindahkan penyimpanan. |
| **Tabel untuk seluruh katalog, JSON sebagai seed** | Jalur migrasi yang tampak mulus | Menghasilkan dua sumber kebenaran permanen (`ARCH-RISK-003`) untuk data yang tidak seorang pun perlu sunting. |

## Konsekuensi

**Positif**

- Katalog terus dibangun statis: `/videos` tidak menyentuh basis data, tidak menambah
  beban kueri, dan tetap di-*prerender*.
- Satu penulis, satu arah: scrape → generator → JSON → aksesor. Tidak ada risiko drift
  bolak-balik.
- Katalog tetap berfungsi penuh walaupun basis data sedang bermasalah — bagian paling
  banyak halaman (`/videos`) tidak bergantung pada Postgres.
- Tidak ada kueri ke tabel 292 baris pada setiap kunjungan halaman.

**Negatif / utang**

- **`lib/catalogue.json` memerlukan berkas di luar repo.** `scripts/build-catalogue.mjs`
  membaca `../melodi-alam-data.md`, yang tidak ada di dalam repositori ini. *Checkout*
  bersih tidak dapat membangun situs tanpa berkas itu, dan ia tidak tersedia di CI.
  Ini hazard deploy nyata, dicatat di `docs/DEPLOYMENT.md`.
- Katalog hanya segar se-seguh pipeline scrape. Tidak ada pembaruan otomatis;
  `INT-002` tetap terbuka.
- Angka di dalamnya usang menurut desain. Antarmuka harus tetap jujur soal ini — halaman
  `/videos` mencantumkan tanggal scrape agar pembaca tahu kerangkanya.
- Menambahkan bidang ke katalog berarti mengubah generator **dan** `lib/catalogue.ts`
  secara serempak.

## Referensi

- `scripts/build-catalogue.mjs`, `lib/catalogue.ts`, `lib/catalogue.json`
- `app/(site)/videos/page.tsx`, `components/VideoRow.tsx`, `components/YoutubeThumb.tsx`
  — `components/VideosBrowser.tsx` sudah dihapus bersama arsip `/videos/arsip`
- `docs/DEPLOYMENT.md` — ketergantungan di luar repo sebagai hazard deploy
- ADR-0002, ADR-0003

## Catatan Verifikasi

- `TERVERIFIKASI`: `lib/catalogue.json` ada dan 192 KB; `scripts/build-catalogue.mjs`
  membacanya dari `../melodi-alam-data.md`; `npm run catalogue` adalah script yang
  tertulis di `package.json`; `docs/ARCHITECTURE.md` mencatat `ARCH-RISK-003` (edit
  tangan menyebabkan drift).
- `TERVERIFIKASI`: `/videos` ter-*prerender* statis pada `next build`.
- `[PERLU VERIFIKASI]`: apakah `../melodi-alam-data.md` akan ikut masuk repo, ikut
  proses CI, atau digantikan — keputusan pemilik yang belum diambil.
