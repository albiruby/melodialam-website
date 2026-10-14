# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/), dan versi
mengikuti [Semantic Versioning](https://semver.org/lang/id/).

> **Catatan kejujuran riwayat.** Repositori ini baru memiliki satu commit di Git
> (*"Initial commit from Create Next App"*). Seluruh pekerjaan di bawah ini berada di
> working tree dan **belum pernah di-commit** sebelum entri ini disusun. Karena itu
> bagian `0.1.0` mencatat keadaan yang dicapai, bukan riwayat commit per commit.
> Semua klaim di sini dapat diverifikasi terhadap kode di repositori saat ini.

---

## [Unreleased]

Belum ada.

---

## [0.1.0] — 2026-10-14

Rilis pertama yang berjalan: port dari prototipe satu-berkas menjadi aplikasi Next.js
multi-halaman, terhubung ke katalog YouTube yang di-scrape dan ke set aset merek.

### Added

**Struktur aplikasi**

- Aplikasi Next.js 16 App Router dengan React 19 dan TypeScript. Build produksi
  menghasilkan 26 halaman statis.
- Delapan route: `/`, `/journal`, `/journal/[slug]`, `/bicara-melodi`, `/videos`,
  `/pahlawan-kota`, `/spaces`, `/submit`, plus route handler `/api/demos`.
- `app/not-found.tsx` untuk halaman yang tidak ada.

**Konten**

- `lib/content.ts` memuat 12 artikel lengkap dengan isi multi-paragraf, ditambah baris
  wawancara, baris genre, item ruang, item ticker, dan data seed demo.
- `lib/catalogue.json` — katalog **generated** berisi 292 video, 342 Shorts, 5 playlist,
  dan angka profil kanal. Dihasilkan dari hasil scrape kanal YouTube.
- `lib/catalogue.ts` — aksesor bertipe di atas katalog: filter per venue, pencarian,
  paginasi, `viewCount()`.

**Integrasi YouTube**

- `components/VideoModal.tsx` — pemutar modal bersama yang dibuka lewat *custom event*
  `melodi:watch`, tanpa route per-video.
- `components/WatchLink.tsx` — baris video yang tetap merender `href` nyata sehingga
  dapat di-*crawl* dan berfungsi tanpa JavaScript.
- Filter venue (Melodi Samsara, Melodi Taman, Interview, Arsip & Lainnya), pencarian, dan
  paginasi pada `/videos`.

**Pengiriman demo**

- `app/api/demos/route.ts` — `GET` dan `POST` dengan validasi per-field yang mengembalikan
  `422` beserta pesan per kolom. Batas panjang setiap field ditegakkan di batas route.
- `components/DemoPortal.tsx` — formulir demo dengan pratinjau audio lokal di peramban
  (berkas tidak pernah diunggah).

**Aset merek**

- `components/BrandMark.tsx` — medallion sebagai simbol situs, dan wordmark sub-merek
  Melodi Samsara. Keduanya dengan ambang ukuran render minimum yang terdokumentasi.
- `npm run brand` menghasilkan aset dari berkas sumber, termasuk `app/favicon.ico`
  multi-ukuran yang dibangun sendiri (16/32/48 dengan payload PNG) untuk menggantikan
  favicon bawaan Next.js.

**Fotografi**

- `npm run photos` menyalin set placeholder ke `public/photos`; 23 slot gambar diisi 23
  foto berbeda. Seluruh rujukan Unsplash dihapus, bersama `remotePatterns`-nya.

**Tipografi**

- Empat wajah huruf: **Inter** (teks badan, variable), **Red Hat Display** (judul pajang,
  variable), **Instrument Serif** (takarir miring), **JetBrains Mono** (metadata).

**Gerak**

- `components/motion/`: `MotionRoot` (jaminan `prefers-reduced-motion` secara global),
  `RevealText` (reveal bertopeng per kata), `ParallaxImage`, `CountUp`, dan `MarqueeTape`.
- Ticker atas kini digerakkan Motion dengan kecepatan terkopel ke velocity scroll.
- Delapan rujukan desain dipertahankan: reveal tanda strip, reveal gugus aksi baris,
  tirai gambar, bingkai siku, kartu keras, dan seterusnya.

**Dokumentasi**

- Sepuluh dokumen pengembangan di `docs/`, termasuk ketertelusuran requirement PRD, model
  data target, kontrak API, strategi uji, rencana deployment, dan audit keamanan.
- Tujuh Architecture Decision Record di `docs/adr/`.

### Changed

- Prototipe satu-berkas dipecah menjadi route. Beberapa perilaku sengaja berubah:
  - Artikel dibaca di `/journal/[slug]`, bukan di modal (`ADR-0001`).
  - Katalog video terhubung ke seluruh 292 video, bukan beberapa baris contoh.
- Port dev dan produksi dipindah dari 3000 ke **3100**, dipatok di skrip npm.
- `next/image` bermigrasi dari `priority` ke `preload` mengikuti deprecation di Next 16.
- Angka kanal di footer dibaca dari katalog generated, bukan ditulis tangan, sehingga
  tidak dapat melenceng dari hasil scrape.

### Fixed

Delapan regresi nyata ditemukan dan diperbaiki selama pengembangan. Sebagian besar
sempat tampak baik-baik saja, dan justru itu masalahnya.

- **Stylesheet gagal dibangun seluruhnya tanpa error.** Scanner konten Tailwind menyisir
  `.codegraph/` dan menabrak berkas SQLite yang terkunci, membuat Turbopack *panic* dan
  menghasilkan CSS kosong. Diperbaiki dengan direktif `@source not`.
- **Foto tampak buram karena pembungkus di-skala.** `transform: scale(1.22)` membuat
  browser me-*raster* pada ukuran layout lalu meng-*upscale* bitmap; gambar 1328 px
  dirender ke 1581 px. Diganti dengan kotak yang diperbesar.
- **Delapan gambar `fill` memiliki induk `static`.** Gambar 160 px direntangkan ke
  1296 px — upscale 8×. Diperbaiki dengan menambahkan `position: relative`.
- **Halaman hanya mendapat 1 `requestAnimationFrame` per detik.** Pembacaan `scrollWidth`
  di dalam *frame loop* memaksa reflow sinkron setiap frame, yang menghentikan callback
  `IntersectionObserver` dan membuat seluruh konten tertahan di `opacity: 0`. Diperbaiki
  dengan `ResizeObserver` dan penghentian saat di luar viewport.
- **Judul permanen tidak terlihat.** Keadaan tersembunyi ter-*bake* ke HTML
  server-rendered, sehingga satu callback yang terlewat membuatnya tidak pernah muncul.
  Prinsipnya dibalik: SSR merender keadaan akhir, animasi hanya memperkaya.
- **Dua belas bingkai kartu kolaps ke tinggi nol.** Kelas `aspect-[${ratio}]` dibangun
  lewat interpolasi, sehingga scanner Tailwind tidak pernah melihatnya; `aspect-[square]`
  juga bukan nilai valid. Diganti dengan pemetaan kelas literal.
- **Ikon tab masih menampilkan favicon Next.js.** ICO bawaan memuat entri 48/32/16
  sehingga lebih dipilih peramban daripada `icon.png` 512 px. Diganti dengan ICO merek.
- **`.gitnexus/run.cjs` ikut ter-*lint*** dan menghasilkan tiga error. Direktori tool
  ditambahkan ke `ignore` ESLint.

### Known Issues

Dicatat apa adanya, belum diperbaiki. Rincian di `docs/PRD-REFERENCE.md`.

- **Antrean demo hilang saat server restart.** Penyimpanannya array proses-lokal.
- **Berkas audio 25 MB tidak ditegakkan** (`BR-001`). Input memakai `accept="audio/*"`
  tanpa pemeriksaan ukuran, di klien maupun server.
- **Kontak PIC tidak pernah disimpan.** Ia hanya dikembalikan di dalam string `note`,
  sehingga kurator tidak punya cara menghubungi pengirim.
- **Tidak ada satu pun selektor `:focus`** di `globals.css`, sehingga seluruh interaksi
  reveal hanya bekerja pada hover dan tidak pada keyboard (`ACC-002`).
- **Waktu baca artikel belum dihitung** (`BR-004`).
- **Tidak ada fallback `onerror` pada gambar** (`NFR-001`).
- **`editorial-paper` dipakai di lima tempat tetapi tidak pernah didefinisikan.**
  Kelas mati.
- **`text-green-400` dipakai delapan kali** — hijau bawaan Tailwind, di luar palet merek.
- **Nama merek belum konsisten.** Header memakai wordmark berbunyi "MELODI SAMSARA";
  metadata dan footer memakai "MELODI ALAM".
- **Checkout bersih tidak dapat meregenerasi aset**, karena tiga skrip membaca berkas di
  luar repositori.
- **Tidak ada uji otomatis, CI, maupun analytics.**
