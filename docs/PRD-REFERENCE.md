# PRD Reference — Ketertelusuran Requirement

> **Catatan (20 Okt 2026):** halaman `/pahlawan-kota` dan `lib/pahlawan.ts` sudah
> dihapus dari repo. `GENRE_ROWS` di `lib/content.ts` dan dokumen `pahlawanRow`
> di Sanity disimpan sebagai arsip. Bagian dokumen ini yang masih menyebut
> direktori tersebut adalah catatan historis.

Dokumen ini adalah **indeks ketertelusuran** untuk PRD *Melodi Alam Digital Editorial &
Music Ecosystem Platform* v1.0.0 (14 Oktober 2026). Ia bukan salinan PRD.

**Kenapa dokumen ini ada.** PRD tersebut belum berada di dalam repositori, dan selama
penyusunan dokumen pendukung beberapa dokumen terpaksa menandai pemetaan ke ID PRD
sebagai `ASUMSI` karena teks aslinya tidak dapat dibaca. Dokumen ini menutup celah itu:
ia mencatat **isi mengikat** setiap ID dan **di mana ia berdiri hari ini**, sehingga
pemetaan di dokumen lain dapat diverifikasi alih-alih diasumsikan.

> **Status PRD:** `DRAFT — REVIEW REQUIRED`. Spesifikasi fungsional, aturan bisnis, dan
> kriteria penerimaan siap diimplementasikan; sejumlah keputusan arsitektur backend
> disisakan terbuka (kini sudah dijawab — lihat [Keputusan yang Sudah Diambil](#keputusan-yang-sudah-diambil)).

> **⚠️ Digantikan sebagian — baca ini dulu.**
> Dokumen ini disusun saat backend direncanakan memakai **Payload CMS 3 + Supabase**.
> Sejak itu CMS-nya diganti dengan **Sanity Studio**, dan seluruh kode Payload sudah
> dihapus.
>
> Bagian yang tidak lagi berlaku di dokumen ini: status implementasi requirement yang
> menyangkut CMS dan basis data. Lihat
> [`adr/0008-sanity-studio-menggantikan-payload.md`](adr/0008-sanity-studio-menggantikan-payload.md)
> dan [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md) untuk keadaan sekarang. Bagian lain
> di dokumen ini masih relevan sejauh tidak menyangkut backend.

---

## Cara membaca kolom Status

| Label | Arti |
|---|---|
| `TERVERIFIKASI-ADA` | Terimplementasi dan dapat dibaca di kode saat ini |
| `SEBAGIAN` | Sebagian terimplementasi; kekurangannya disebutkan |
| `BELUM` | Belum ada sama sekali — murni `RENCANA` |
| `BERTENTANGAN` | Ada, tetapi berperilaku berbeda dari yang diminta PRD |

---

## 1. Functional Requirements

| ID | Isi mengikat (ringkas) | Status | Bukti / catatan |
|---|---|---|---|
| `FR-001` | ~~1 artikel hero penuh + 3 artikel sub-grid~~ → **4 kartu grid 2×2** (keputusan 20 Okt 2026) | `BERTENTANGAN` |
| `FR-002` | Grid artikel 4 kolom berselang-seling (kolom ganjil gambar-dulu, genap judul-dulu), filter kategori, pencarian real-time, *empty state* + `Reset Filter` | `BERTENTANGAN` | Grid 4 kolom + pola berselang-seling (`ArticleCard` `titleFirst`) **ada dan terverifikasi** (16 Okt 2026). **Filter/pencarian/empty-state dihapus atas permintaan** pada tanggal yang sama (penyederhanaan Stories) — PRD lama tidak lagi diikuti pada bagian itu; lihat `docs/FRONTEND-PLAN.md` |
| `FR-003` | Pembaca artikel penuh: rubrik, kota, tanggal, estimasi waktu baca, penulis, gambar, seluruh paragraf, tautan YouTube, tutup via `✕` / backdrop / `Escape`, *scroll-lock* | `BERTENTANGAN` | Artikel adalah **route** `/stories/[slug]`, bukan drawer (ADR-0001). Karena itu tidak ada `✕`, backdrop, `Escape`, atau scroll-lock — navigasi browser yang menggantikannya. **Estimasi waktu baca belum ada** |
| `FR-004` | Indeks wawancara tipografi kontras: nama artis *Serif*, judul *Bold Uppercase Sans*, tag miring berkurung di bawah kanan foto | `SEBAGIAN` | `app/bicara-melodi/page.tsx` menampilkan nama artis dan judul dengan kontras tersebut. **Perlu diverifikasi:** keberadaan tag berkurung `(bicara melodi s3)` / `(profile)` |
| `FR-005` | Daftar video bernomor dengan state awal `Gambar — Headline — Deskripsi` dan hover `[ ▶ ] — [ M \| WATCH ↗ ]`, filter program `ALL`/`MELODI SAMSARA`/`BICARA MELODI`/`MELODI TAMAN`, paginasi | `SEBAGIAN` | `app/videos/page.tsx` + `components/VideosBrowser.tsx` punya nomor urut, filter venue, pencarian, paginasi, dan reveal aksi pada hover. **Kekurangan:** reveal hanya bekerja pada hover, belum pada `:focus-within` → melanggar `ACC-002` |
| `FR-006` | Formulir demo 7 bagian: metadata band, kota, genre, kontak PIC, tautan EPK, file audio `.mp3`/`.wav`/`.ogg` maks 25 MB + cerita lagu, tujuan kurasi radio | `SEBAGIAN` | `components/DemoPortal.tsx` + `app/api/demos/route.ts` memvalidasi seluruh field teks. **Kekurangan:** batas 25 MB dan tipe MIME **tidak ditegakkan** (input memakai `accept="audio/*"`); `contact` tidak pernah disimpan |
| `FR-007` | Etalase *Spaces & Instruments* dengan tinggi kartu berselang-seling + hard-shadow `6px 6px 0`, dan direktori *Pahlawan Musik Kota* dengan reveal `[ ▶ ] — [ M \| EXPLORE ↗ ]` | `BERTENTANGAN` | Seksi Spaces **dihapus atas permintaan** (404; data `SPACE_ITEMS` diarsipkan di `lib/content.ts`). Direktori `/pahlawan-kota` aktif lewat Sanity (`pahlawanRow`) tetapi **tanpa** reveal — grup aksi READ/WATCH dihapus atas permintaan |

## 2. Business Rules

| ID | Aturan | Status | Catatan |
|---|---|---|---|
| `BR-001` | File demo hanya audio (`audio/mpeg`, `audio/wav`, `audio/ogg`, ekstensi `.mp3`/`.wav`) dan ≤ 25 MB (25 × 1024 × 1024 byte); tolak instan di klien dan server | `BELUM` | Tidak ada pemeriksaan ukuran maupun MIME di `DemoPortal.tsx` atau `route.ts`. Prioritas tinggi: ini salah satu release blocker |
| `BR-002` | Kiriman baru berstatus awal `IN REVIEW`; hanya kurator boleh mengubahnya ke `SHORTLISTED (SAMSARA)` / `APPROVED (ARTICLE)`; pengirim publik tidak dapat mengubah status | `SEBAGIAN` | Hari ini `status` bertipe `string` dengan nilai `"NEW SUBMISSION • JUST NOW"`, bukan enum. Tidak ada jalur perubahan status sama sekali. Diganti oleh enum di `docs/DATA-MODEL.md` dan ADR-0005 |
| `BR-003` | Pada desktop ≥ 1024px: indeks genap → `[Gambar → Judul → Excerpt]`, indeks ganjil → `[Judul → Gambar → Excerpt]`; mobile boleh diseragamkan | `SEBAGIAN` | `components/ArticleCards.tsx` punya prop `titleFirst` yang mengimplementasikan pembalikan ini. **Perlu diverifikasi:** apakah pemanggilnya benar-benar menyalakan pola ganjil/genap |
| `BR-004` | Waktu baca = `max(1, ceil(jumlah kata ÷ 200))`, atau ditetapkan editor; minimum `1 min read` | `BELUM` | Tidak ada logika waktu baca di seluruh repo. Satu-satunya `Math.ceil` adalah paginasi di `VideosBrowser.tsx` |

## 3. UX & Interaction Requirements yang Dikunci

Ini aturan yang diminta untuk dipertahankan; jangan diganti dengan sudut membulat atau
menghapus perilaku hover-nya.

| Aturan | Isi | Status |
|---|---|---|
| Seksi 9.2 | `border-radius: 0px` di semua kartu/bingkai/kotak; tidak ada *soft drop-shadow* (`blur > 0`). Satu-satunya elemen bulat adalah tombol Play melingkar | `TERVERIFIKASI-ADA` |
| Seksi 9.3A (`DEC-002`) | Tajuk `Home`/`Journal`/`All Articles` dan strip kategori: state awal teks murni **tanpa** tanda `—`; `—` muncul menggeser teks saat hover | `TERVERIFIKASI-ADA` — utility `dash-reveal-*` di `app/globals.css` |
| Seksi 9.3B (`DEC-003`) | Baris video & direktori: state awal `Gambar — Headline — Deskripsi`; hover memunculkan `[ ▶ ] — [ M + WATCH/EXPLORE ]` | `SEBAGIAN` — utility `video-action-reveal` ada, tetapi hover-only (lihat `ACC-002`) |
| Seksi 9.3C | Hover thumbnail artikel: tirai gelap `#0D0D0D`/`#1B3B2B` naik dari bawah + bingkai siku di sudut | `TERVERIFIKASI-ADA` — utility `hover-reveal-curtain` + `corner-frame` |

## 4. Accessibility (`ACC`)

| ID | Requirement | Status |
|---|---|---|
| `ACC-001` | Kontras teks utama `#0D0D0D` di atas `#FFFFFF` / `#F6F5F2` ≥ 15:1 | `TERVERIFIKASI-ADA` menurut nilai warna; **belum ada pengukuran otomatis** |
| `ACC-002` | Elemen hover-reveal wajib setara lewat keyboard (`:focus-within`) | `SESUAI` — `app/globals.css` punya `:focus-visible` + kembaran `:focus-within` untuk setiap affordance hover |
| `ACC-003` | Mendukung `@media (prefers-reduced-motion: reduce)` | `TERVERIFIKASI-ADA` — blok global di `globals.css` + `MotionConfig reducedMotion="user"` di `components/motion/MotionRoot.tsx` |

## 5. Non-Functional Requirements (`NFR`)

| ID | Requirement | Status |
|---|---|---|
| `NFR-001` | Gambar punya fallback `onerror` dan `aspect-ratio` eksplisit agar CLS nihil dan tidak ada gambar pecah | `SEBAGIAN` — rasio eksplisit ada di seluruh tempat pemakaian (`aspect-*`, `next/image` dengan `fill`), tetapi **tidak ada fallback `onerror`** |
| `NFR-002` | Animasi hover memakai properti ramah GPU (`transform`, `opacity`, `cubic-bezier(0.16, 1, 0.3, 1)`) tanpa memicu *layout thrashing* | `TERVERIFIKASI-ADA` setelah perbaikan — `--ease-editorial` = kurva tersebut. Satu pelanggaran nyata pernah terjadi (`ARCH-RISK-001`) dan sudah diperbaiki |
| `NFR-003` | Proporsional di Mobile ≥ 360px, Tablet ≥ 768px, Desktop ≥ 1280px; Chrome/Safari/Edge/Firefox 2 tahun terakhir | `TERVERIFIKASI-ADA` pada 360/390/768/1280/1440/1920: nol overflow horizontal, konten presisi tengah. **Belum diuji lintas peramban** |
| `NFR-004` | Input formulir dan pencarian disanitasi terhadap injeksi HTML/XSS sebelum dirender ke DOM | `TERVERIFIKASI-ADA` — nol `dangerouslySetInnerHTML` di repo; React meng-*escape* secara bawaan. Rincian di `docs/SECURITY-PRIVACY.md` |

## 6. Success Metrics (`MET`) dan Analytics (`ANA`)

| ID | Metrik / Event | Status |
|---|---|---|
| `MET-01` / `ANA-01` | *Article Read Completion Rate* (`article_scroll_75`); event `article_opened` | `BELUM` — tidak ada analitik terpasang |
| `MET-02` / `ANA-02` | *YouTube Hub Play Conversion*; event `video_modal_played` | `BELUM` — tidak ada analitik |
| `MET-03` / `ANA-03` | *Demo Submission Completion Rate*; event `demo_submitted` | `BELUM` |
| `MET-04` / `ANA-04` | *Ecosystem Outbound CTR*; event `ecosystem_card_clicked` | `BELUM` |

> Tidak ada analitik apa pun di repositori ini, dan tidak ada ID analitik yang
> dikonfigurasi. Seluruh baris di atas adalah `RENCANA`.

## 7. Risks (`RISK`)

| ID | Risiko | Status mitigasi |
|---|---|---|
| `RISK-001` | Spam / unggahan berbahaya pada form demo | `BELUM` — tidak ada *rate limit*, CAPTCHA, maupun autentikasi di `POST /api/demos` |
| `RISK-002` | Beban bandwidth & biaya penyimpanan dari unggahan WAV/MP3 | `BELUM` — pengunggahan memang belum terjadi (pratinjau lokal saja), jadi risikonya belum aktif. Kebijakan retensi 90 hari belum ada |
| `RISK-003` | Pembatasan pemutaran embed pada sebagian video YouTube | `SEBAGIAN` — tombol `Buka Langsung di YouTube ↗` ada di `VideoModal.tsx`, tetapi bukan sebagai fallback yang muncul saat embed gagal |

> **Catatan namespace.** Dokumen ini memakai `RISK-*` sesuai PRD.
> `docs/ARCHITECTURE.md` memakai namespace terpisah `ARCH-RISK-*` untuk register risiko
> arsitekturalnya sendiri, supaya kedua daftar tidak tertukar.

## 8. Keputusan yang Sudah Diambil

Tiga pertanyaan prioritas di PRD §20.2 sudah dijawab pemilik produk, dan masing-masing
punya ADR.

| Pertanyaan | Jawaban | ADR |
|---|---|---|
| `OQ-001` — moderasi antrean demo | **Moderated queue.** Privat sampai kurator menyetujui | [ADR-0005](adr/0005-moderated-demo-queue.md) |
| `OQ-002` — CMS & backend | **Payload CMS 3 di dalam Next.js + Supabase** | [ADR-0002](adr/0002-payload-supabase.md), [ADR-0003](adr/0003-supabase-postgres-storage.md) |
| Halaman detail: modal vs URL | **Artikel = route crawlable, video = modal** | [ADR-0001](adr/0001-artikel-route-video-modal.md) |

Dua keputusan tambahan yang belum ada di PRD:

| Topik | Jawaban | ADR |
|---|---|---|
| Test & hosting | **Vitest + Playwright, deploy Vercel** | [ADR-0006](adr/0006-vitest-playwright-vercel.md) |
| Katalog video: CMS atau build-time | **Tetap build-time (generated JSON)** | [ADR-0004](adr/0004-katalog-video-build-time.md) |

## 9. Release Blockers (PRD §14.2)

| # | Kondisi yang memblokir rilis | Status saat ini |
|---|---|---|
| B1 | Kesalahan sintaksis membuat daftar artikel, video, atau demo gagal dirender | Tidak ada — build bersih, 26 halaman statis |
| B2 | Video YouTube di Cinema Modal gagal dimuat atau memutar ID yang salah | Belum diuji otomatis. Modal dan konstruksi URL `youtubeId` ada |
| B3 | Form demo mengizinkan kiriman kosong, atau mengekspos nomor WhatsApp/email ke halaman publik | **Kiriman kosong ditolak (`422`).** Kontak tidak bocor — tetapi hanya karena tidak pernah disimpan. ADR-0005 yang membuatnya aman secara desain |
| B4 | Gambar rusak tampil tanpa mekanisme fallback | **Belum selesai** — tidak ada `onerror` fallback (`NFR-001`) |

## 10. Penyimpangan dari PRD yang Perlu Direkonsiliasi

Daftar jujur hal-hal di mana implementasi (atau keputusan yang lebih baru) berbeda dari
teks PRD. PRD perlu diperbarui, bukan implementasinya dikembalikan.

| # | Isi PRD | Kenyataan | Rujukan |
|---|---|---|---|
| 1 | `DEC-001`: tipografi `Instrument Serif + Plus Jakarta Sans` | Inter + Red Hat Display + Instrument Serif + JetBrains Mono | ADR-0007 |
| 2 | `FR-003`: artikel dibaca di *drawer/modal* dengan `✕`, backdrop, `Escape`, scroll-lock | Artikel adalah route `/stories/[slug]` | ADR-0001 |
| 3 | `FR-006`: file audio `.mp3`/`.wav`/`.ogg` maks 25 MB | Input memakai `accept="audio/*"`, tanpa batas ukuran | `BR-001` |
| 4 | `FR-006`: field `(05) Tautan Streaming/EPK` dan `(06) File Audio` sebagai dua input | Form memiliki `link` (wajib) dan unggahan opsional — sejalan, tetapi `contact` tidak dipersistensi | `docs/API-CONTRACTS.md` |
| 5 | `DEC-001` & Seksi 9: aksen `--accent-forest` `#1B3B2B` | Terimplementasi sebagai `--color-forest` | `app/globals.css` |
| 6 | PRD §5.4 menempatkan Dashboard Kurator di Fase 2 (`P2`) | ADR-0005 menaikkannya menjadi prasyarat, karena tanpa jalur tinjau tidak ada demo yang bisa disetujui | ADR-0005 |

## 11. Open Questions yang Masih Terbuka

Selain `OQ-001`/`OQ-002` yang sudah dijawab di §8.

| ID | Pertanyaan | Kenapa penting |
|---|---|---|
| `OQ-003` | Reservasi meja Samsara: cukup arahkan ke `@samsara.bogor`/WhatsApp, atau bangun formulir reservasi sendiri? | Jalur saat ini hanya tautan keluar; menentukan apakah perlu entitas dan alur baru di `docs/DATA-MODEL.md` |
| — | Apakah `../melodi-alam-data.md`, `../logobulet.png`, `../logotext.png`, dan `../FOTO PLACEHOLDER MELODI ALAM/` ikut masuk repo? | **Tanpa ini, checkout bersih tidak dapat membangun situs.** Seluruh artefak katalog, brand, dan foto bergantung pada berkas di luar repo. Hazard deploy nyata — lihat `docs/DEPLOYMENT.md` |
| — | Nama brand mana yang benar: **Melodi Alam** atau **Melodi Samsara**? | Header memakai wordmark gambar berbunyi "MELODI SAMSARA" dengan `alt="Melodi Samsara"`, sementara metadata dan footer memakai `SITE.name = "MELODI ALAM"`. Dua nama berbeda di satu halaman membingungkan mesin pencari dan pembaca layar |
| — | Siapa yang meninjau antrean demo, dan seberapa sering? | ADR-0005 menaikkan panel kurator menjadi prasyarat; tanpa komitmen operasional, antrean akan menumpuk dan `FR-006` justru mundur |

---

## Catatan Verifikasi

**Diperiksa dengan membaca kode:** `lib/content.ts` (keempat bentuk entitas dan enum),
`lib/catalogue.ts`, `app/api/demos/route.ts` (setiap baris), `app/globals.css` (seluruh
utility), kedelapan `app/*/page.tsx`, `components/*` termasuk `motion/*`, `package.json`,
`next.config.ts`. Status `FR-*` yang ditandai `SEBAGIAN` sebagian diambil dari temuan
`docs/FRONTEND-PLAN.md` dan `docs/SECURITY-PRIVACY.md` yang membaca berkas yang sama.

**Dijalankan:** `npm run build` (26 halaman statis), `npm run lint` (bersih),
`tsc --noEmit` (bersih), dan pemeriksaan responsivitas pada 360/390/768/1280/1440/1920 px
di enam route (nol overflow horizontal).

**Tidak diperiksa:** analitik (`MET-01`…`MET-04`) — tidak ada yang terpasang; perilaku
lintas peramban nyata di Safari/Firefox; indeksasi mesin pencari nyata; teks lengkap PRD
asli selain yang dikutip di percakapan ini, sehingga ringkasan isi mengikat di §1–§7
berasal dari kutipan tersebut dan sebaiknya ditinjau pemilik produk.

**Perlu tindakan pemilik:** berkas PRD asli sebaiknya dimasukkan ke repo sebagai
`docs/PRD.md` agar ketertelusuran ini dapat diverifikasi terhadap teks sumber, bukan
terhadap ringkasan.
