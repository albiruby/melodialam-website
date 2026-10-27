# PRD Reference — Ketertelusuran Requirement

> **Catatan (21 Okt 2026).** Dokumen ini **diperbarui** terhadap kondisi sistem
> yang berjalan sekarang. Yang berubah sejak versi sebelumnya:
>
> - CMS-nya **Sanity Studio**, bukan Payload CMS 3 + Supabase (ADR-0008).
> - Halaman daftar artikel pindah ke **`/stories`** (dengan redirect 308 dari
>   `/journal`) dan menampilkan **8 kartu**, bukan 6.
> - Ada permukaan baru: **`/kurasi`** (Curated News) dengan pencarian + chip
>   pillar.
> - **`/videos` = Melodi Samsara** (9 sesi + 5 playlist); bagian Bicara Melodi
>   **dihapus** dari sana dan punya halaman sendiri `/bicara-melodi`.
> - Form demo **menyimpan kontak** di dataset privat dan **mengunggah audio ke
>   Vercel Blob** (sebelumnya dibuang / hanya pratinjau lokal).
> - Ada **`/tentang`**, **`/rss.xml`**, **`/sitemap.xml`**, **pratinjau draf**,
>   dan redirect 308 `/journal` → `/stories`.
>
> Referensi ke `JournalBrowser`, `/pahlawan-kota`, `/spaces`, dan
> `/videos/arsip` **dihapus** — semuanya sudah tidak ada di repo.

Dokumen ini adalah **indeks ketertelusuran** untuk PRD *Melodi Alam Digital
Editorial & Music Ecosystem Platform* v1.0.0 (14 Oktober 2026). Ia bukan salinan
PRD.

**Kenapa dokumen ini ada.** PRD tersebut belum berada di dalam repositori, dan
selama penyusunan dokumen pendukung beberapa dokumen terpaksa menandai pemetaan
ke ID PRD sebagai `ASUMSI` karena teks aslinya tidak dapat dibaca. Dokumen ini
menutup celah itu: ia mencatat **isi mengikat** setiap ID dan **di mana ia
berdiri hari ini**, sehingga pemetaan di dokumen lain dapat diverifikasi alih-alih
diasumsikan.

> **Status PRD:** `DRAFT — REVIEW REQUIRED`. Spesifikasi fungsional, aturan
> bisnis, dan kriteria penerimaan siap diimplementasikan; keputusan arsitektur
> backend sudah dijawab (lihat §8).

---

## Cara membaca kolom Status

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Terimplementasi **dan** diverifikasi ke kode atau ke isi data saat ini |
| `SEBAGIAN` | Sebagian terimplementasi; kekurangannya disebutkan eksplisit |
| `RENCANA` | Belum ada di sistem yang berjalan — murni rencana |
| `BERTENTANGAN` | Ada, tetapi berperilaku berbeda dari yang diminta PRD |
| `ASUMSI` | Diduga, belum dapat dipastikan |
| `[PERLU VERIFIKASI]` | Tidak dapat dikonfirmasi dari sumber yang tersedia di repo |

Label `TERVERIFIKASI` di dokumen ini berarti "sudah dicek ke kode/konten",
bukan "kayaknya ada". Kalau tidak bisa dipastikan, labelnya
`ASUMSI` atau `[PERLU VERIFIKASI]`.

---

## 1. Functional Requirements

| ID | Isi mengikat (ringkas) | Status | Bukti / catatan |
|---|---|---|---|
| `FR-001` | ~~1 artikel hero penuh + 3 artikel sub-grid~~ → **4 kartu grid 2×2** (keputusan 20 Okt 2026) | `BERTENTANGAN` | Beranda membuka dengan grid 2×2 **empat** kartu `FrontCard` (`app/(site)/page.tsx:64-68`), diambil dari `latestStories(8)` → 4 pertama. Kartu pertama diberi badge "Cover Story" (`components/ArticleCards.tsx:155`) tetapi **ukuran dan posisinya sama** dengan tiga lainnya — tidak ada lagi satu kartu hero selebar layar. |
| `FR-002` | Grid artikel 4 kolom berselang-seling (kolom ganjil gambar-dulu, genap judul-dulu), filter kategori, pencarian real-time, *empty state* + `Reset Filter` | `BERTENTANGAN` | Grid 4 kolom + pola berselang-seling **ada**: `/stories` merender 8 kartu `ArticleCard` dengan `titleFirst={i % 2 === 1}` (`app/(site)/stories/page.tsx:30-41`). **Filter dan pencarian tidak ada di halaman ini** — komponen `JournalBrowser` (filter kategori + pencarian substring) **dihapus** dari repo. Pencarian kini hidup di **`/kurasi`**: kotak cari + chip pillar + *empty state* ("Belum ada post yang cocok") di `components/KurasiBrowser.tsx`. |
| `FR-003` | Pembaca artikel penuh: rubrik, kota, tanggal, estimasi waktu baca, penulis, gambar, seluruh paragraf, tautan YouTube, tutup via `✕` / backdrop / `Escape`, *scroll-lock* | `SEBAGIAN` | Artikel adalah **route** `/stories/<slug>`, bukan drawer (ADR-0001) — jadi tidak ada `✕`, backdrop, `Escape`, atau scroll-lock; navigasi browser yang menggantikannya. **Estimasi waktu baca sudah ada** (`articleReadingTime()` → "N menit baca", `lib/content-fallback.ts:57-70`, diuji di `lib/content-fallback.test.ts`). **Kota tidak ada** — tidak ada field kota di `article`. **Penulis tidak per-artikel**: footer menulis "SUMBER: REDAKSI MELODI ALAM (@MELODI.ALAM)" dan JSON-LD memakai `Organization`. **Tautan YouTube tidak ada** field-nya. |
| `FR-004` | Indeks wawancara tipografi kontras: nama artis *Serif*, judul *Bold Uppercase Sans*, tag miring berkurung di bawah kanan foto | `BERTENTANGAN` | `/bicara-melodi` merender 9 episode Season 3 (9 dokumen Sanity `interview` + 9 baris statis sebagai fallback). **Judul** memang *bold uppercase* ✓ dan **tag berkurung** ada (`({caption} ↗)` dalam `font-serif italic`) ✓. **Nama artis bukan Serif**: memakai `font-display`, dan `--font-display` = Red Hat Display (sans-serif) — Serif (`--font-serif` = Instrument Serif) dipakai untuk caption dan strapline. |
| `FR-005` | Daftar video bernomor dengan state awal `Gambar — Headline — Deskripsi` dan hover `[ ▶ ] — [ M \| WATCH ↗ ]`, filter program `ALL`/`MELODI SAMSARA`/`BICARA MELODI`/`MELODI TAMAN`, paginasi | `BERTENTANGAN` | Komponen `VideosBrowser` **dihapus**. `/videos` kini = **Melodi Samsara**: 9 sesi bernomor (`VideoRow`: nomor, thumbnail, judul, durasi, Featuring, tombol Watch), baris "Sesi lainnya ada di kanal YouTube", lalu **5 playlist**. **Tanpa filter program, tanpa paginasi, tanpa baris deskripsi.** Bagian **"Bicara Melodi" dihapus dari `/videos`** — episodenya punya halaman sendiri `/bicara-melodi`. Reveal aksi bekerja pada hover **dan** `:focus-within` (`app/globals.css:392-393`) ✓ |
| `FR-006` | Formulir demo 7 bagian: metadata band, kota, genre, kontak PIC, tautan EPK, file audio `.mp3`/`.wav`/`.ogg` maks 25 MB + cerita lagu, tujuan kurasi radio | `TERVERIFIKASI` | Form `/submit` (`components/DemoPortal.tsx`) punya **9 bagian** berlabel (01)–(09): nama band, kota, judul lagu/EP, genre (select), tujuan submit (select), link streaming/EPK, kontak WhatsApp/email manajer, file audio opsional, cerita singkat — semua elemen PRD ada. **Audio opsional via Vercel Blob** (`/api/demo-audio` → signed upload), maks 25 MB dan tipe dipaksa di peramban **dan** server. **Kontak kini tersimpan** — di dokumen `demoContact` terpisah di dataset privat `submissions`, bukan lagi dibuang. |
| `FR-007` | Etalase *Spaces & Instruments* dengan tinggi kartu berselang-seling + hard-shadow `6px 6px 0`, dan direktori *Pahlawan Musik Kota* dengan reveal `[ ▶ ] — [ M \| EXPLORE ↗ ]` | `BERTENTANGAN` | Seksi Spaces **dihapus** — rute `/spaces` dan `SPACE_ITEMS` sudah tidak ada. Direktori `/pahlawan-kota` beserta `lib/pahlawan.ts` **juga dihapus**; tipe `pahlawanRow` masih ada di Studio sebagai arsip (3 dokumen) tetapi **tidak dirender** di halaman mana pun. Tidak ada reveal READ/WATCH di kedua tempat. |

---

## 2. Business Rules

| ID | Aturan | Status | Catatan |
|---|---|---|---|
| `BR-001` | File demo hanya audio (`audio/mpeg`, `audio/wav`, `audio/ogg`, ekstensi `.mp3`/`.wav`) dan ≤ 25 MB (25 × 1024 × 1024 byte); tolak instan di klien dan server | `TERVERIFIKASI` | `DEMO_AUDIO_MAX_BYTES = 25 * 1024 * 1024` (`lib/taxonomy.ts:76`), plus `DEMO_AUDIO_TYPES` dan `DEMO_AUDIO_EXTENSIONS`. Tiga lapis: peramban (`onPickAudio`), server (`POST /api/demos`), dan token unggah (`handleUpload` dengan `allowedContentTypes` + `maximumSizeInBytes`). **Catatan:** `audio/x-wav` juga diterima. |
| `BR-002` | Kiriman baru berstatus awal `IN REVIEW`; hanya kurator boleh mengubahnya ke `SHORTLISTED (SAMSARA)` / `APPROVED (ARTICLE)`; pengirim publik tidak dapat mengubah status | `TERVERIFIKASI` | `DEMO_STATUSES` = 4 nilai: `IN REVIEW`, `SHORTLISTED (SAMSARA)`, `APPROVED (ARTICLE)`, `ARCHIVED`. Kiriman publik **selalu** dibuat `IN REVIEW` — `DEMO_INITIAL_STATUS` dipaksa di `app/api/demos/route.ts:306`, request tidak bisa menentukan status. Kurator memindahkannya di Studio (workspace "Submit Karya"). Antrean publik hanya membaca dua status disetujui (`APPROVED_QUERY`). |
| `BR-003` | Pada desktop ≥ 1024px: indeks genap → `[Gambar → Judul → Excerpt]`, indeks ganjil → `[Judul → Gambar → Excerpt]`; mobile boleh diseragamkan | `TERVERIFIKASI` (dengan catatan) | `ArticleCard` punya prop `titleFirst` dan pemanggilnya **aktif**: `titleFirst={i % 2 === 1}` (`app/(site)/stories/page.tsx:35`) → kartu ke-1, 3, 5 (index 0, 2, 4) **gambar dulu**, ke-2, 4, 6, 8 **judul dulu**. Cocok dengan PRD bila "indeks" dibaca 0-based; **terbalik** bila dibaca 1-based. |
| `BR-004` | Waktu baca = `max(1, ceil(jumlah kata ÷ 200))`, atau ditetapkan editor; minimum `1 min read` | `TERVERIFIKASI` (sebagian) | `readingTimeMinutes()` di `lib/content-fallback.ts:57` menghitung **judul + ringkasan + isi**, lalu `max(1, ceil(words / 200))`. Dipakai di kartu artikel ("N menit") dan header detail ("N menit baca"). Diuji di `lib/content-fallback.test.ts` (20 kasus lulus). **Cabang "ditetapkan editor" tidak diimplementasikan** — nilainya selalu dihitung. |

---

## 3. UX & Interaction Requirements yang Dikunci

Ini aturan yang diminta untuk dipertahankan; jangan diganti dengan sudut membulat
atau menghapus perilaku hover-nya.

| Aturan | Isi | Status |
|---|---|---|
| Seksi 9.2 | `border-radius: 0px` di semua kartu/bingkai/kotak; tidak ada *soft drop-shadow* (`blur > 0`). Satu-satunya elemen bulat adalah tombol Play melingkar | `TERVERIFIKASI` — tidak ada utilitas `rounded-*` pada kartu/bingkai/kotak mana pun; semua bayangan adalah *hard shadow* (`shadow-[4px_4px_0px_#0D0D0D]`, blur 0). **Catatan kecil:** `rounded-full` juga dipakai untuk dua titik dekoratif yang berdenyut (indikator ticker dan indikator rekaman di modal), bukan hanya tombol Play |
| Seksi 9.3A (`DEC-002`) | Tajuk `Home`/`Journal`/`All Articles` dan strip kategori: state awal teks murni **tanpa** tanda `—`; `—` muncul menggeser teks saat hover | `TERVERIFIKASI` — utility `dash-reveal-*` di `app/globals.css:347-374` (`:hover` **dan** `:focus-within`) |
| Seksi 9.3B (`DEC-003`) | Baris video & direktori: state awal `Gambar — Headline — Deskripsi`; hover memunculkan `[ ▶ ] — [ M + WATCH/EXPLORE ]` | `TERVERIFIKASI` — utility `video-action-reveal` (`app/globals.css:378-399`) dipakai `VideoRow`; reveal dipicu `:hover` **dan** `:focus-within` (jadi `ACC-002` terpenuhi). 25 Okt 2026: badge `M` dan panah `↗` dilepas; gugus kini `[ ▶ ] — [ WATCH ]` dengan WATCH sebagai tautan langsung ke video. 26 Okt 2026: di bawah `md` gugus selalu tampil (sentuh tanpa hover); modal memakai stage 16:9 ber-`max-h` sehingga pemutar tidak pernah setinggi 0 |
| Seksi 9.3C | Hover thumbnail artikel: tirai gelap `#0D0D0D`/`#1B3B2B` naik dari bawah + bingkai siku di sudut | `TERVERIFIKASI` — utility `hover-reveal-curtain` + `corner-frame` (`app/globals.css:271-343`), `:hover` **dan** `:focus-within` |

---

## 4. Accessibility (`ACC`)

| ID | Requirement | Status |
|---|---|---|
| `ACC-001` | Kontras teks utama `#0D0D0D` di atas `#FFFFFF` / `#F6F5F2` ≥ 15:1 | `TERVERIFIKASI` menurut nilai warna (`--color-ink: #0d0d0d`, `--color-paper: #f6f5f2`, `app/globals.css:21-22`); **belum ada pengukuran otomatis** |
| `ACC-002` | Elemen hover-reveal wajib setara lewat keyboard (`:focus-within`) | `TERVERIFIKASI` — `app/globals.css` punya kembaran `:focus-within` untuk `hover-reveal-curtain`, `hover-reveal-tag`, `corner-frame`, `dash-reveal-prefix`, dan `video-action-reveal` |
| `ACC-003` | Mendukung `@media (prefers-reduced-motion: reduce)` | `TERVERIFIKASI` — blok global di `app/globals.css:455-481` + `MotionConfig reducedMotion="user"` di `components/motion/MotionRoot.tsx` |

---

## 5. Non-Functional Requirements (`NFR`)

| ID | Requirement | Status |
|---|---|---|
| `NFR-001` | Gambar punya fallback `onerror` dan `aspect-ratio` eksplisit agar CLS nihil dan tidak ada gambar pecah | `SEBAGIAN` — rasio eksplisit ada di hampir semua pemakaian (`aspect-[4/5]`, `next/image` dengan `fill`), dan **thumbnail YouTube punya fallback berjenjang** (`components/YoutubeThumb.tsx`: maxres → sd → hq → "poster tidak tersedia"). **Tidak ada `onError` pada `next/image` mana pun** — `onError` satu-satunya di repo ada di `YoutubeThumb` |
| `NFR-002` | Animasi hover memakai properti ramah GPU (`transform`, `opacity`, `cubic-bezier(0.16, 1, 0.3, 1)`) tanpa memicu *layout thrashing* | `TERVERIFIKASI` — `--ease-editorial: cubic-bezier(0.16, 1, 0.3, 1)` (`app/globals.css:33`), transisi memakai `transform`/`opacity`/`max-width` |
| `NFR-003` | Proporsional di Mobile ≥ 360px, Tablet ≥ 768px, Desktop ≥ 1280px; Chrome/Safari/Edge/Firefox 2 tahun terakhir | `[PERLU VERIFIKASI]` — pemeriksaan responsivitas sebelumnya (360/390/768/1280/1440/1920 px) melaporkan nol overflow horizontal, tapi **tidak diulang** pada versi dokumen ini. **Belum diuji lintas peramban** |
| `NFR-004` | Input formulir dan pencarian disanitasi terhadap injeksi HTML/XSS sebelum dirender ke DOM | `TERVERIFIKASI` — tidak ada `dangerouslySetInnerHTML` yang memuat input pengguna. Dua pemakaian `dangerouslySetInnerHTML` di repo semuanya JSON-LD `<script>` (`app/layout.tsx:148` dan `app/(site)/stories/[slug]/page.tsx:109`), dan isinya di-*escape* (`<` → `\u003c`). React meng-*escape* input secara bawaan. Rincian di `docs/SECURITY-PRIVACY.md` |

---

## 6. Success Metrics (`MET`) dan Analytics (`ANA`)

| ID | Metrik / Event | Status |
|---|---|---|
| `MET-01` / `ANA-01` | *Article Read Completion Rate* (`article_scroll_75`); event `article_opened` | `RENCANA` — `@vercel/analytics` sudah terpasang dan `<Analytics />` ter-*mount* di `app/layout.tsx:181`, **tapi Web Analytics belum dinyalakan di dashboard Vercel**, jadi belum ada data. **Event kustom tidak ada** di repo |
| `MET-02` / `ANA-02` | *YouTube Hub Play Conversion*; event `video_modal_played` | `RENCANA` — modal pemutar ada (`components/VideoModal.tsx`) tetapi tidak ada event yang dikirim |
| `MET-03` / `ANA-03` | *Demo Submission Completion Rate*; event `demo_submitted` | `RENCANA` — `POST /api/demos` menjawab 201 dan form menampilkan banner sukses, tapi tidak ada event `demo_submitted` |
| `MET-04` / `ANA-04` | *Ecosystem Outbound CTR*; event `ecosystem_card_clicked` | `RENCANA` — `/tentang` memuat tautan ekosistem, tapi tidak ada event |

> Analitik **dasar** (page view cookieless) sudah terpasang di kode; yang belum
> dinyalakan adalah dashboard-nya, dan **tidak ada satu pun event kustom** dari
> PRD di repo. Keempat event di atas masih murni rencana.

---

## 7. Risks (`RISK`)

| ID | Risiko | Status mitigasi |
|---|---|---|
| `RISK-001` | Spam / unggahan berbahaya pada form demo | **Sebagian tertutup 22 Okt 2026** — rate limit, `Idempotency-Key`, dan honeypot sudah ada; CAPTCHA belum — `POST /api/demos` dan `POST /api/demo-audio` **tidak punya** rate limit, CAPTCHA, idempotensi, atau autentikasi. Tiap kiriman = 2 tulis Sanity + 1 email. Rencana ada di `docs/audit-2026-10-21.md` §7 (P0) |
| `RISK-002` | Beban bandwidth & biaya penyimpanan dari unggahan WAV/MP3 | `RENCANA` — unggahan **belum pernah terjadi** di produksi: `BLOB_READ_WRITE_TOKEN` belum di-set, jadi `POST /api/demo-audio` menjawab 400. Kebijakan retensi 90 hari belum ada dan tidak ada job pembersih objek |
| `RISK-003` | Pembatasan pemutaran embed pada sebagian video YouTube | `SEBAGIAN` — `components/VideoModal.tsx` memuat tautan **"Buka Langsung di YouTube "** di panel modal sebagai jalan keluar. **Belum ada** fallback otomatis saat embed gagal (tidak ada penanganan `onError` pada `<iframe>`) |

> **Catatan namespace.** Dokumen ini memakai `RISK-*` sesuai PRD.
> `docs/ARCHITECTURE.md` memakai namespace terpisah `ARCH-RISK-*` untuk register
> risiko arsitekturalnya sendiri, supaya kedua daftar tidak tertukar.

---

## 8. Keputusan yang Sudah Diambil

Pertanyaan prioritas di PRD §20.2 sudah dijawab pemilik produk, dan
masing-masing punya ADR.

| Pertanyaan | Jawaban | ADR | Status |
|---|---|---|---|
| `OQ-001` — moderasi antrean demo | **Moderated queue.** Privat sampai kurator menyetujui | [ADR-0005](adr/0005-moderated-demo-queue.md) | `TERVERIFIKASI` — dibuat: dataset `submissions` privat, `demoContact` terpisah, antrean publik hanya membaca dua status disetujui. **Belum:** audit siapa/kapan memutuskan, dan penghapusan otomatis kontak + objek audio |
| `OQ-002` — CMS & backend | ~~Payload CMS 3 di dalam Next.js + Supabase~~ → **Sanity Studio dengan dua dataset** (`production` publik + `submissions` privat), Studio di repo terpisah `melodialam-sanity` | [ADR-0008](adr/0008-sanity-studio-menggantikan-payload.md) **menggantikan** [ADR-0002](adr/0002-payload-supabase.md) & [ADR-0003](adr/0003-supabase-postgres-storage.md) | `TERVERIFIKASI` — seluruh kode Payload/Supabase dihapus dari repo; tidak ada `payload`/`pg`/`drizzle` di `package.json` |
| Halaman detail: modal vs URL | **Artikel = route crawlable, video = modal** | [ADR-0001](adr/0001-artikel-route-video-modal.md) | `TERVERIFIKASI` |

Keputusan tambahan yang belum ada di PRD:

| Topik | Jawaban | ADR | Status |
|---|---|---|---|
| Test & hosting | **Vitest, deploy Vercel** | [ADR-0006](adr/0006-vitest-playwright-vercel.md) | `SEBAGIAN` — **Vitest** terpasang dan punya 20 kasus di `lib/content-fallback.test.ts`; **Playwright tidak terpasang** dan tidak ada `.github/` → **belum ada CI** |
| Katalog video: CMS atau build-time | **Tetap build-time (generated JSON)** | [ADR-0004](adr/0004-katalog-video-build-time.md) | `TERVERIFIKASI` — `lib/catalogue.json` (292 video, 342 Shorts, 5 playlist) tetap jadi arsip cadangan; Sanity menimpa per `youtubeId` |
| Tipografi | Inter + Red Hat Display + Instrument Serif + JetBrains Mono | [ADR-0007](adr/0007-tipografi-inter-red-hat-display.md) | `TERVERIFIKASI` — lihat §5 `--font-display` / `--font-serif` |

---

## 9. Release Blockers (PRD §14.2)

| # | Kondisi yang memblokir rilis | Status saat ini |
|---|---|---|
| B1 | Kesalahan sintaksis membuat daftar artikel, video, atau demo gagal dirender | **Tidak ada** — build bersih. *Jumlah halaman statis:* **33** per build 21 Okt 2026 yang dicatat di ADR-0008; angka di dokumen lain (26 / 28 / 32) berasal dari build lebih lama dan **tidak dihitung ulang** pada versi ini |
| B2 | Video YouTube di Cinema Modal gagal dimuat atau memutar ID yang salah | **Belum diuji otomatis.** Modal dan konstruksi URL `youtubeId` ada; skema Sanity memvalidasi `youtubeId` 11 karakter, tetapi `VideoModal` hanya memeriksa non-kosong sebelum menyisipkan id ke URL embed |
| B3 | Form demo mengizinkan kiriman kosong, atau mengekspos nomor WhatsApp/email ke halaman publik | **Kiriman kosong ditolak** (`422` dengan peta error per field). Kontak **tidak bocor**: `APPROVED_QUERY` tidak memproyeksi `contact`, dan kontak berada di dokumen terpisah di dataset privat. **Yang tersisa:** `audioUrl` masih menerima host mana pun yang berakhiran ekstensi audio (temuan F01) |
| B4 | Gambar rusak tampil tanpa mekanisme fallback | **Sebagian.** Thumbnail YouTube punya fallback berjenjang (`components/YoutubeThumb.tsx`). **`next/image` tidak punya `onError` sama sekali** — satu-satunya `onError` di repo ada di `YoutubeThumb` |

---

## 10. Penyimpangan dari PRD yang Perlu Direkonsiliasi

Daftar jujur hal-hal di mana implementasi (atau keputusan yang lebih baru)
berbeda dari teks PRD. PRD perlu diperbarui, bukan implementasinya dikembalikan.

| # | Isi PRD | Kenyataan | Rujukan |
|---|---|---|---|
| 1 | `DEC-001`: tipografi `Instrument Serif + Plus Jakarta Sans` | Inter + Red Hat Display + Instrument Serif + JetBrains Mono | ADR-0007 |
| 2 | `FR-003`: artikel dibaca di *drawer/modal* dengan `✕`, backdrop, `Escape`, scroll-lock | Artikel adalah route `/stories/<slug>` | ADR-0001 |
| 3 | `FR-002`: filter kategori + pencarian + `Reset Filter` di daftar artikel | Komponen `JournalBrowser` dihapus; pencarian pindah ke **`/kurasi`** (Curated News) dengan kotak cari + chip pillar | `components/KurasiBrowser.tsx` |
| 4 | `FR-006`: `contact` "tidak pernah disimpan" | **Kontak sekarang disimpan** di dokumen `demoContact` (dataset privat `submissions`); `audioUrl` menunjuk objek **Vercel Blob** | `docs/DATA-MODEL.md` §5 |
| 5 | `FR-005`: filter program + paginasi + bagian Bicara Melodi di `/videos` | `/videos` = **Melodi Samsara** (9 sesi + 5 playlist), tanpa filter/paginasi; Bicara Melodi pindah ke `/bicara-melodi` | commit `0b88aec` |
| 6 | `FR-007`: etalase Spaces & direktori Pahlawan Kota | Keduanya **dihapus**; `pahlawanRow` disimpan sebagai arsip di Studio | commit `d2226a5` |
| 7 | `OQ-002`: backend Payload CMS 3 + Supabase | **Sanity Studio**, dua dataset, Studio di repo terpisah | ADR-0008 |
| 8 | `DEC-001` & Seksi 9: aksen `--accent-forest` `#1B3B2B` | Terimplementasi sebagai `--color-forest` | `app/globals.css` |
| 9 | PRD §5.4 menempatkan Dashboard Kurator di Fase 2 (`P2`) | Tidak ada dashboard kustom: **Sanity Studio (workspace "Submit Karya") yang jadi panel kurator** | ADR-0005 + ADR-0008 |
| 10 | PRD belum menyebut perpindahan alamat `/journal` | Halaman daftar artikel pindah ke **`/stories`** dengan redirect **308** permanen; `/kurasi` (Curated News) adalah permukaan baru yang tidak ada di PRD | commit `a974b50` |

---

## 11. Permukaan yang Ada Sekarang

Peta rute yang dipakai untuk menafsirkan status di atas. Semuanya **TERVERIFIKASI**
dari kode dan dari isi dataset `production` (21 Oktober 2026).

| Rute | Isi | Sumber data |
|---|---|---|
| `/` | "Latest News" + catatan `(kurasi redaksi)`; grid **2×2 = 4 kartu** (`FrontCard`: thumbnail 4:5 di kiri, rubrik + tanggal, judul, ringkasan, "BACA SELENGKAPNYA "); baris hitung "8 artikel di journal • 9 sesi panggung" + "Semua artikel "; lalu strip **"Curated News"**: 4 post foto terbaru (`PillarCard`) + "Semua kurasi " | `latestStories(8)`, `allPillarPosts()`, `allVideos()` |
| `/stories` | "Stories" + `(kurasi redaksi)`; grid **4 kolom, 8 kartu** (`ArticleCard`; kartu ke-1, 3, 5 (index 0, 2, 4) gambar dulu, ke-2, 4, 6, 8 judul dulu; cover 4:5, judul, ringkasan; footer: rubrik + badge **"Reel"** bila `mediaType === "reel"` + menit baca + tanggal); baris bawah "Konten kurasi dari feed @melodi.alam" + "Curated News " | `latestStories(8)` |
| `/stories/<slug>` | header (rubrik, tanggal, menit baca, sumber), h1, ringkasan, cover 4:5 `max-w-md`, `ArticleBody` (Portable Text), footer, blok "More {rubrik}" 3 kartu; kartu sosial 1200×630 (`opengraph-image.tsx`, `twitter-image.tsx`) | `articleBySlug()` + `latestStories(8)` |
| `/bicara-melodi` | 9 episode wawancara Season 3: nama artis (besar), judul/headline, durasi, thumbnail 160 px, tautan | `allInterviews()` + statistik dari `lib/videos.ts` |
| `/videos` | **Melodi Samsara**: h1 "MELODI SAMSARA" (dari `videosPage.samsaraTitle`), **9 baris sesi** (`VideoRow`: nomor, thumbnail, judul, durasi, Featuring, tombol Watch), baris "Sesi lainnya ada di kanal YouTube" + tombol "YouTube ", lalu **5 playlist**. **Bagian Bicara Melodi tidak ada di sini** | `allVideos()` + `allPlaylists()` + `getVideosPageCopy()` |
| `/kurasi` | **Curated News**: kotak cari + chip per pillar (total 55 post), blok "BACA — dari feed @melodi.alam" (Fakta Musik, Lirik, Trivia, Kutipan) dan "TONTON" (Rekomendasi Melodi, Ulas Melodi, Clipper), 6 post per pillar, anchor per pillar (`/kurasi#fakta-musik`) | `allPillarPosts()` |
| `/tentang` | Profil redaksi, kontak (dua surel), alamat **Samsara Listening Space & Resto** di Bogor, kanal resmi (Instagram, YouTube, Threads, TikTok, Linktree), 3 blok (Stories / Watch / Curated News) | statis |
| `/submit` | Formulir demo 9 bagian (band, kota, judul, genre, tujuan, link streaming/EPK, kontak manajer, file audio opsional, cerita singkat) | `POST /api/demos` |
| `/preview/<type>/<slug>?secret=…` | Pratinjau draf (jenis `journal` atau `kurasi`), `noindex`, 404 bila secret salah | Sanity `perspective: "drafts"` |
| `/journal`, `/journal/<slug>` | **308 permanen** → `/stories` dan `/stories/<slug>` (route handler, bukan halaman) | — |
| `/rss.xml` · `/sitemap.xml` · `/robots.txt` | Feed 8 cerita; sitemap 7 halaman + 8 cerita; robots menutup `/api/` | `latestStories(8)` |
| `/api/demos` | GET (antrean publik, hanya status disetujui) + POST (buat kiriman) | dataset `submissions` |
| `/api/demo-audio` | Token unggah Blob (maks 25 MB, hanya audio) | `@vercel/blob` |
| `/api/revalidate` | Membuang 6 tag cache, butuh `SANITY_REVALIDATE_SECRET` | — |

**Isi data terkurasi saat ini** (dihitung ulang dari dataset `production`):
12 artikel (6 foto + 6 reel) · 55 post kurasi (fakta-musik 16, lirik 3, trivia 2,
kutipan 6, rekomendasi 8, ulas-melodi 3, clipper 17; `similar-song` dan
`meme-humor` 0 post) · 9 interview · 9 video · 5 playlist.

---

## 12. Open Questions yang Masih Terbuka

Selain `OQ-001`/`OQ-002` yang sudah dijawab di §8.

| ID | Pertanyaan | Kenapa penting |
|---|---|---|
| `OQ-003` | Reservasi meja Samsara: cukup arahkan ke `@samsara.bogor`/WhatsApp, atau bangun formulir reservasi sendiri? | Jalur saat ini hanya tautan keluar; menentukan apakah perlu entitas dan alur baru di `docs/DATA-MODEL.md` |
| — | Apakah `../melodi-alam-data.md`, `../logobulet.png`, `../logotext.png`, dan `../FOTO PLACEHOLDER MELODI ALAM/` ikut masuk repo? | **Tanpa ini, checkout bersih tidak dapat membangun situs.** Seluruh artefak katalog, brand, dan foto bergantung pada berkas di luar repo. Hazard deploy nyata — lihat `docs/DEPLOYMENT.md` |
| — | Nama brand mana yang benar: **Melodi Alam** atau **Melodi Samsara**? | Header memakai wordmark gambar berbunyi "MELODI SAMSARA" dengan `alt="Melodi Samsara"`, sementara metadata dan footer memakai `SITE.name = "MELODI ALAM"`. Dua nama berbeda di satu halaman membingungkan mesin pencari dan pembaca layar |
| — | Siapa yang meninjau antrean demo, dan seberapa sering? | Panel kuratornya **sudah ada** (Studio, workspace "Submit Karya"), jadi ini murni soal komitmen operasional: tanpa jadwal tinjau, antrean `IN REVIEW` akan menumpuk |
| — | Berapa lama `demoContact` (PII) dan objek audio demo disimpan? | Tidak ada job pembersih. Menghapus kiriman di Studio **tidak** menghapus kontak maupun audio — lihat temuan F07 |
| — | Apa yang dilakukan dengan empat cerita `reel` yang tidak tertaut dari halaman mana pun? | `wsatcc`, `hanin`, `sheila`, `a7x` punya URL sendiri tetapi tidak muncul di beranda, `/stories`, sitemap, RSS, atau blok "More" |
| — | Pillar `similar-song` (0 post) dan `meme-humor` (0 post, bahkan tidak masuk set mana pun) — diisi atau dibuang? | `meme-humor` ada di skema dan label tapi tidak di `PHOTO_PILLARS`/`REEL_PILLARS`, jadi tidak akan pernah tampil |
| — | Kapan Web Analytics dinyalakan, dan kapan event kustom `MET-01`…`MET-04` dipasang? | `<Analytics />` sudah terpasang, tetapi dashboard-nya belum dinyalakan dan tidak ada event kustom sama sekali |
| — | Kapan `SANITY_PREVIEW_SECRET` dipisah dari `SANITY_REVALIDATE_SECRET`? | Saat ini satu secret melayani dua kapabilitas, dan secret diterima lewat query string (temuan F03) |

---

## Catatan Verifikasi

**Diperiksa dengan membaca kode** (21 Oktober 2026):

- `lib/articles.ts` (penuh) — `SiteArticle`, `latestStories()`,
  `articleBySlug()`, `ARTICLES_TAG`, `mediaType` mapping.
- `lib/content-fallback.ts` (penuh) — `Article`, `ARTICLES` (12, 6 foto + 6 reel),
  `INTERVIEW_ROWS` (9), `TICKER_ITEMS` (4), `SEED_DEMOS` (3),
  `readingTimeMinutes()` / `articleReadingTime()`.
- `lib/taxonomy.ts` (penuh) — `ARTICLE_CATEGORY_VALUES`, `CATEGORY_LABELS`,
  `DEMO_STATUSES`, `DEMO_INITIAL_STATUS`, `DEMO_APPROVED_STATUSES`,
  `DEMO_GENRES`, `DEMO_PROGRAMS`, `DEMO_AUDIO_MAX_BYTES`, `DEMO_AUDIO_TYPES`,
  `DEMO_AUDIO_EXTENSIONS`.
- `lib/pillars-shared.ts`, `lib/pillars.ts` (penuh) — `PILLAR_LABELS`,
  `PHOTO_PILLARS`, `REEL_PILLARS`, `PillarPost`, `allPillarPosts()`.
- `lib/interviews.ts`, `lib/videos.ts`, `lib/videos-page.ts`,
  `lib/site-settings.ts`, `lib/site.ts`, `lib/catalogue.ts` (penuh).
- `lib/sanity.ts`, `lib/sanity-server.ts`, `lib/sanity-preview.ts`,
  `lib/sanity-project.ts` — pembagian token.
- `app/api/demos/route.ts` (penuh) — validasi, cap field, jalur `413`/`400`/`422`/
  `201`/`503`, `APPROVED_QUERY`, pembuatan dua dokumen, notifikasi email.
- `app/api/demo-audio/route.ts`, `app/api/revalidate/route.ts` (penuh).
- `app/(site)/page.tsx`, `stories/page.tsx`, `stories/[slug]/page.tsx`,
  `kurasi/page.tsx`, `videos/page.tsx`, `bicara-melodi/page.tsx`,
  `submit/page.tsx`, `preview/[type]/[slug]/page.tsx`, `sitemap.ts`,
  `journal/route.ts`, `journal/[slug]/route.ts`, `rss.xml/route.ts`,
  `robots.ts` (penuh).
- `components/ArticleCards.tsx`, `KurasiBrowser.tsx`, `DemoPortal.tsx`,
  `YoutubeThumb.tsx`, `VideoRow.tsx` (penuh), `VideoModal.tsx` (grep),
  `motion/MotionRoot.tsx`.
- `app/globals.css` — utility `hover-reveal-curtain`, `hover-reveal-tag`,
  `corner-frame`, `dash-reveal-*`, `video-action-reveal`, blok
  `prefers-reduced-motion`, `--ease-editorial`, `--font-display`, `--font-serif`.
- `app/layout.tsx` — mount `<Analytics />` dan `<Ticker>`.
- `package.json` — dependensi & skrip; dikonfirmasi **tidak ada** `payload`,
  `pg`, `drizzle`, `playwright`, atau `puppeteer`; `vitest` ada.
- `docs/adr/0008-sanity-studio-menggantikan-payload.md`,
  `docs/SANITY-INTEGRATION.md`, `docs/audit-2026-10-21.md`.
- `docs/ARCHITECTURE.md`, `docs/SECURITY-PRIVACY.md`, `docs/TEST-STRATEGY.md`,
  `docs/API-CONTRACTS.md`, `docs/DEPLOYMENT.md` — **di-*grep*** untuk istilah
  usang (RLS, Postgres, `feedArticles`, "6 kartu"), bukan dibaca penuh.

**Diverifikasi ke isi data** (kueri GROQ anonim ke dataset `production`,
perspektif `published`, API `2026-05-19`, 21 Oktober 2026):

- 12 `article` = 6 `foto` + 6 `reel`; daftar slug, tanggal, rubrik.
- 55 `pillarPost`: fakta-musik 16, lirik 3, trivia 2, kutipan 6, rekomendasi 8,
  ulas-melodi 3, clipper 17, similar-song 0, meme-humor 0 (25 foto + 30 reel).
- 9 `interview`, 9 `video` (semua `venue: "Melodi Samsara"`), 5 `playlist`
  (`count` kosong semua), 1 `siteSettings`, 1 `videosPage`, 3 `pahlawanRow`.
- 0 `demoSubmission` dan 0 `demoContact` di dataset privat.
- `siteSettings` live: `cardCurtain` masih menyimpan dua kunci lama
  (`featureLabel`, `featureCta`) yang sudah dilepas dari skema.
- `videosPage` live: `samsaraNote: ""`, `playlistsNote` belum diisi.

**Dijalankan:**

- `npm test` → **20/20 lulus** (`lib/content-fallback.test.ts`, Vitest 3.2.7).
- `node -e` (read-only) atas `lib/catalogue.json` untuk menghitung `counts`,
  `byVenue`, nilai `ageBucket`, dan jumlah kunci `profile`.

**Tidak diperiksa (dan karena itu tidak diklaim):**

- `npm run build` **tidak** dijalankan ulang pada versi ini. Angka **33 halaman
  statis** di §9 diambil dari catatan build ADR-0008 (21 Okt 2026), bukan dari
  build saya sendiri.
- Pemeriksaan responsivitas di enam lebar layar **tidak** diulang (`NFR-003`
  ditandai `[PERLU VERIFIKASI]`).
- Perilaku lintas peramban nyata di Safari/Firefox; indeksasi mesin pencari
  nyata.
- Teks lengkap PRD asli selain yang dikutip di sini, sehingga ringkasan isi
  mengikat di §1–§7 berasal dari kutipan tersebut dan sebaiknya ditinjau
  pemilik produk.
- Keadaan dashboard Vercel (Web Analytics, Blob store, Resend) dan pengaturan
  webhook Sanity — diambil dari `docs/audit-2026-10-21.md`, bukan diukur ulang.

**Perlu tindakan pemilik:** berkas PRD asli sebaiknya dimasukkan ke repo sebagai
`docs/PRD.md` agar ketertelusuran ini dapat diverifikasi terhadap teks sumber,
bukan terhadap ringkasan.

**Selisih yang ditemukan antara dokumen lain dan sumber nyata** (pemeriksaan
ulang per 21 Okt 2026, sore — beberapa dokumen lain sedang direvisi
bersamaan, jadi daftar ini berumur pendek):

1. ~~`docs/SANITY-INTEGRATION.md` §3/§6 masih menyebut `feedArticles()`~~ **Tertutup
   21 Okt 2026** — sebutan itu dihapus dan `feedArticles()` dihapus dari kode.
   "grid 6 kartu" (2×); kenyataannya semua halaman memakai `latestStories(8)`
   dan `/stories` menampilkan 8 kartu.
2. `docs/ARCHITECTURE.md:358,415` masih mendaftarkan dan menjelaskan
   halaman mana pun**.
3. `docs/SECURITY-PRIVACY.md` sudah diberi catatan bahwa istilah RLS/Postgres/
   Storage Supabase tidak berlaku lagi; dokumen ini konsisten dengan catatan
   itu.
4. `docs/API-CONTRACTS.md` dan `docs/DEPLOYMENT.md` sudah menandai sisa era
   Supabase di `.env` lokal (`DATABASE_URL` dan friends) sebagai sisa, bukan
   sebagai bagian sistem yang berjalan — konsisten dengan dokumen ini.
5. `docs/TEST-STRATEGY.md` sudah dikoreksi pada sore yang sama: `/stories`
   dicatat sebagai 8 kartu `ArticleCard`, dan "Payload CMS & Supabase" dicatat
   sebagai keputusan yang sudah terjawab.
6. Angka jumlah halaman statis berbeda antar dokumen (26 / 28 / 32 / 33)
   karena build dilakukan pada tanggal berbeda; ADR-0008 mencatat **33** untuk
   build 21 Oktober 2026.
