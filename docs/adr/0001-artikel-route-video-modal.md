# ADR-0001 — Artikel sebagai route crawlable, pemutar video tetap modal

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (Tim Produk Melodi Alam) |
| **Terkait** | `FR-003`, `FR-005`, `OBJ-001`, `SCR-02`, `SCR-03` |
| **Supersedes** | Prototipe `index.html`, yang membuka artikel DAN video sebagai modal di satu halaman |

## Konteks

Prototipe satu-berkas (`melodi_alam_editorial_landing_page.html`) membuka baik artikel
maupun pemutar YouTube sebagai *modal* di atas satu halaman. Model itu menguntungkan
untuk demo — semuanya dalam satu berkas — tetapi punya dua masalah nyata untuk produk
media:

1. **Artikel adalah aset SEO.** Judul, ringkasan, dan isi artikel perlu punya URL
   sendiri agar dapat diindeks, dibagikan, dan dideep-link dari bio Instagram.
   Sebuah modal tidak punya URL, sehingga tidak bisa diindeks maupun dibagikan.
2. **Video adalah lampiran pada kanal milik pihak lain.** Nilai pemutar video di sini
   adalah menonton tanpa meninggalkan situs; kanal resmi `@melodialam` tetap menjadi
   sumber kebenaran dan sudah punya halaman sendiri di YouTube.

## Keputusan

Kedua jenis konten diperlakukan berbeda, mengikuti sifatnya masing-masing:

- **Artikel → route nyata.** Setiap artikel dilayani di `/stories/[slug]`, di-*render*
  statis lewat `generateStaticParams`, dengan metadata per-artikel. Ini yang
  terimplementasi pada `app/stories/[slug]/page.tsx`.
- **Video → modal bersama tanpa URL.** Pemutar tetap satu komponen client tunggal
  (`components/VideoModal.tsx`) yang dibuka lewat *custom event* `melodi:watch` dan
  *embed* YouTube di dalam modal. Tidak ada route per-video.

Konsekuensi teknisnya: baris video memakai `components/WatchLink.tsx`, sebuah pembungkus
yang tetap merender `href` YouTube asli sehingga baris tersebut bisa di-*crawl* dan
berfungsi tanpa JavaScript, lalu ditingkatkan oleh JavaScript menjadi pembukaan modal.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| Semua modal, seperti prototipe | Artikel kehilangan URL → hilang dari hasil pencarian dan tidak bisa dibagikan. Bertentangan langsung dengan `OBJ-001`. |
| Semua route, termasuk `/watch/[id]` per video | Menambah ratusan halaman tipis yang bersaing dengan kanal YouTube resmi, dan memecah pengalaman menonton. Manfaat SEO-nya kecil karena kontennya bukan milik kita. |
| Artikel sebagai route **dan** modal paralel | Dua jalur render untuk satu konten; sumber kebenaran ganda untuk tata letak baca. |

## Konsekuensi

**Positif**

- 12 artikel ter-*prerender* dan terindeks; masing-masing punya metadata sendiri.
- Pemutar video hanya satu komponen, sehingga perbaikan *player* berlaku di semua
  tempat yang memutarnya (`/`, `/videos`, `/bicara-melodi` — `/pahlawan-kota` sudah
  dihapus).
- `WatchLink` memberi *fallback* `href` nyata ketika JavaScript gagal.

**Negatif / utang**

- Video tidak dapat dideep-link di dalam situs. Jika nanti dibutuhkan, `/watch/[id]`
  dapat ditambahkan sebagai lapisan tipis di atas modal yang sama.
- Dua jalur interaksi berbeda (navigasi vs modal) berarti dua pola fokus dan `Escape`
  yang harus dijaga; lihat `ACC-002` di `docs/FRONTEND-PLAN.md`.

## Referensi

- `app/stories/[slug]/page.tsx`, `components/VideoModal.tsx`, `components/WatchLink.tsx`
- `docs/FRONTEND-PLAN.md` — inventaris route dan komponen
- `docs/ARCHITECTURE.md` — alur data dan batas server/client

## Catatan Verifikasi

- `TERVERIFIKASI`: route `/stories/[slug]` ada dan membangun 12 halaman; `VideoModal`
  dan `WatchLink` ada dan dipakai; `next build` melaporkan halaman artikel sebagai
  *prerendered*.
- Tidak diverifikasi: perilaku *crawl* Google secara nyata (butuh deploy publik).
