# TEST-STRATEGY.md — Strategi Pengujian Melodi Alam

> **Catatan (21 Okt 2026):** `components/VideosBrowser.tsx` dan halaman `/videos/arsip`
> sudah dihapus — situs tidak menampilkan daftar 292 video. `/videos` kini merender
> seleksi server (`VideoRow`). Rujukan ke `VideosBrowser` di bawah adalah catatan historis.

> Status fase: **DOCS ONLY.** Tidak ada dependensi yang dipasang, tidak ada berkas test
> yang dibuat, tidak ada perubahan kode. Seluruh referensi test di dokumen ini adalah
> `RENCANA` kecuali dinyatakan `TERVERIFIKASI`.

Stack keputusan (brief §7, `ADR-0006`): **Vitest** untuk unit/logika, **Playwright** untuk
E2E, deploy ke **Vercel**. Vitest **sudah terpasang** (`npm test`, 9 kasus); Playwright belum (lihat §1). Cara membaca label:

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Dibaca langsung di kode, atau dijalankan, pada fase ini |
| `RENCANA` | Direncanakan fase ini; belum ada |
| `ASUMSI` | Diasumsikan; perlu konfirmasi |
| `[PERLU VERIFIKASI]` | Tidak dapat diverifikasi dari workspace |

> **⚠️ Digantikan sebagian — baca ini dulu.**
> Dokumen ini disusun saat backend direncanakan memakai **Payload CMS 3 + Supabase**.
> Sejak itu CMS-nya diganti dengan **Sanity Studio**, dan seluruh kode Payload sudah
> dihapus.
>
> Bagian yang tidak lagi berlaku di dokumen ini: kasus uji yang mengasumsikan
> Postgres/Payload. Lihat
> [`adr/0008-sanity-studio-menggantikan-payload.md`](adr/0008-sanity-studio-menggantikan-payload.md)
> dan [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md) untuk keadaan sekarang. Bagian lain
> di dokumen ini masih relevan sejauh tidak menyangkut backend.

---

## 1. Test Context and Scope (Konteks & Cakupan)

### 1.1 Keadaan saat ini — jujur (`TERVERIFIKASI`)

**Tidak ada test suite dan tidak ada test dependency apa pun.**

Bukti yang dibaca langsung:

- `package.json` (`TERVERIFIKASI`) mendefinisikan 10 skrip (termasuk `test`): `dev`, `build`, `start`,
  `lint`, `catalogue`, `brand`, `photos`. **Tidak ada** skrip `test`, `test:e2e`, atau
  sejenisnya.
- `devDependencies` (`TERVERIFIKASI`): `@tailwindcss/turbopack`, `@types/node`,
  `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `sharp`,
  `tailwindcss`, `typescript`. `dependencies`: `motion`, `next`, `react`, `react-dom`.
  **Vitest sudah terpasang** (`npm test`, `vitest.config.ts`, 9 kasus di `lib/content.test.ts`). Playwright, jest, cypress dan testing-library belum ada.
- `package-lock.json` memuat `"@playwright/test": "^1.51.1"` **hanya** sebagai
  `peerDependencies` opsional milik paket `next` (`peerDependenciesMeta.optional = true`).
  Itu bukan instalasi dan bukan dependensi proyek (`TERVERIFIKASI`).
- Tidak ada `vitest.config.*`, `playwright.config.*`, atau berkas `*.test.*` / `*.spec.*`
  di repositori (`TERVERIFIKASI`).
- Tidak ada direktori `.github/` — **belum ada CI** (`TERVERIFIKASI`).

**Gate otomatis yang benar-benar ada hari ini, hanya dua:**

| Gate | Perintah | Catatan |
|---|---|---|
| Lint | `npm run lint` (→ `eslint`) | `TERVERIFIKASI` — brief §2 menyatakan bersih |
| Type-check | `tsc --noEmit` | Tidak punya skrip sendiri; dijalankan lewat `next build` (`npm run build`) |

Tidak ada yang lain. Tidak ada assertion yang menjaga perilaku. Pernyataan ini
disengaja: dokumen ini **tidak** menyiratkan adanya coverage.

### 1.2 Yang diuji (in scope)

- Logika murni `lib/catalogue.ts` dan invarian data `lib/content.ts` (§4).
- Kontrak `app/api/demos/route.ts` (`GET`, `POST`) (§4.3).
- Journey UI kritis pada rute `/`, `/journal`, `/journal/[slug]`, `/bicara-melodi`,
  `/videos`, `/submit`, 404 (§5).
- Aksesibilitas keyboard/reduced-motion (§5.4, §8).
- Regresi performa yang sudah pernah terjadi (§3, §6.4).

### 1.3 Yang tidak diuji (out of scope, ringkas — detail §11)

Payload CMS, Supabase, unggahan audio nyata, pemutaran iframe YouTube nyata, integrasi
email/WhatsApp, visual regression piksel, beban/scale, dan seluruh aturan yang belum
diimplementasikan (§4.2 `BR-004`, §5 `BR-001`, moderasi `ADR-0005`).

### 1.4 Asumsi (`ASUMSI`)

- Requirement `FR-001`…`FR-007` dan `NFR-001`…`NFR-004` dipakai dengan pemetaan dari
  `docs/FRONTEND-PLAN.md` §4 (yang sendiri menandai sebagiannya `ASUMSI`).
- `ACC-001`/`ACC-003` mengikuti brief §8 dan temuan `FRONTEND-PLAN.md` §10.
- Empat release blocker "PRD §14.2" tidak dapat dibaca dari workspace — lihat §6.3 dan
  Open Questions.

---

## 2. Risk Assessment (Penilaian Risiko)

Bobot utama: **blast radius** × **bukti bahwa ini sudah pernah rusak** (brief §9).
Lima regresi nyata dari brief §9 adalah prioritas tertinggi karena biayanya sudah
dibayar sekali.

| ID | Area | Risiko | Kemungkinan | Dampak | Penekanan uji |
|---|---|---|---|---|---|
| `R1` | `globals.css` + Tailwind scan | Direktori tool baru tanpa `@source not` → **stylesheet gagal dibangun senyap** | Sedang | Kritis (seluruh situs tanpa gaya) | Gate build `P-00` (§6.5) + smoke render E2E |
| `R2` | `next/image` `fill` | Ancestor `static` → gambar ter-upscale 8× | Sedang | Tinggi (kualitas visual) | Unit tak mungkin; E2E/perceptual smoke + invariant SSR |
| `R3` | Frame loop (`scrollWidth` di rAF) | Reflow sinkron → **1 rAF/detik**, `IntersectionObserver` mati, konten `opacity: 0` | Rendah (sudah diperbaiki) | Kritis (konten tak terlihat) | `P-01` perf assertion yang stabil (§6.4) |
| `R4` | SSR hidden state | State tersembunyi dibakar ke HTML → heading **permanen tak terlihat** | Rendah | Kritis | E2E no-JS/heading-visible `A-03` |
| `R5` | Tailwind + interpolasi string | `aspect-[${x}]` → tak ada rule → **12 frame kartu runtuh** | Sedang | Tinggi | Smoke E2E pengukuran tinggi box + lint konvensi |
| `R6` | `POST /api/demos` validasi | Field wajib/`link`/enum lolos atau salah tolak | Sedang | Sedang–Tinggi | Unit/integration matriks batas (§4.3) |
| `R7` | Antrean demo (`module`-level array) | Kebocoran state antar-test → hasil palsu | Tinggi (jika tak diisolasi) | Sedang | Disiplin fixture (§7.3) |
| `R8` | `ACC-002` keyboard | Reveal hover-only; tak ada `:focus-within` | **Tinggi** (`TERVERIFIKASI` gap) | Tinggi (aksesibilitas) | E2E keyboard (§5.4) — **merah hari ini** |
| `R9` | `BR-004` read-time | Aturan tak diimplementasikan | Tinggi (memang belum ada) | Sedang | Unit `U-15` (`RENCANA` — lihat §4.2) |
| `R10` | `BR-001` audio 25 MB | Tidak ada batas ukuran/tipe | Tinggi | Sedang | E2E `E-11` (`RENCANA`) |
| `R11` | `lib/catalogue.json` | Dimutasi test atau di-edit tangan | Rendah | Tinggi | Read-only fixture (§7.2) |
| `R12` | PII `contact` | Kontak tak dipersist, namun bisa bocor ke UI publik | Sedang | Tinggi (privasi) | E2E `E-08` + unit `I-10` |
| `R13` | `ViewCount`/sorting katalog | Parsing "107K" salah → urutan "Top" salah | Sedang | Sedang | Unit `U-01`…`U-08` |

### 2.1 Mengapa setiap regresi §9 layak dijaga murah

| Regresi (brief §9) | Penjaga termurah yang disarankan | Level |
|---|---|---|
| 1. Stylesheet gagal senyap | Assert bahwa `npm run build` menghasilkan CSS non-kosong dan satu selector kunci (`@utility`) ada di output; smoke E2E memastikan elemen ter-style | Build + E2E (`P-00`, `E-01`) |
| 2. `fill` di parent `static` | Unit sumber (lint regex) + E2E mengukur `naturalWidth` vs lebar render pada satu kartu | Static + E2E (`A-02b`) |
| 3. `scale()` melembutkan foto | E2E memastikan parallax memakai kotak oversized (bukan `transform: scale`) | E2E (`A-02b`) |
| 4. rAF 1 fps | Assert konten reveal menjadi terlihat saat scroll (gejala langsung) | `P-01` |
| 5. SSR membawa hidden state | E2E: heading terlihat tanpa menunggu JS/observer | `A-03` |
| 6. Interpolasi Tailwind | Static: kelas dinamis dilarang; E2E: tinggi frame kartu > 0 | Static + E2E (`A-02b`) |

Prinsip: **assert gejala yang terlihat pengguna**, bukan detail implementasi. Deteksi
regresi rAF lewat "konten menjadi terlihat", bukan lewat pembacaan `requestAnimationFrame`
mentah (lihat §6.4).

---

## 3. Test Strategy by Level (Strategi per Level)

Piramida sehat: banyak unit, sedikit E2E. Semua tooling berstatus `RENCANA`.

| Level | Peran | Tooling (`RENCANA`) | Pemilik | Contoh |
|---|---|---|---|---|
| Static | Type, lint, konvensi | `tsc --noEmit`, `eslint`, cek regex kustom | Dev | `next build`; larangan `aspect-[${...}]`; `@source not` lengkap |
| Unit | Logika murni, invarian data | **Vitest** | Dev | `viewCount`, `videosByVenue`, `topVideos`, invarian katalog |
| Integration | Route handler dengan `Request`/`Response` nyata | **Vitest** (import `POST`/`GET` langsung) | Dev | Matriks `POST /api/demos` (§4.3) |
| Component | Interaksi komponen klien terisolasi | **Vitest + jsdom + React Testing Library** | Dev | Filter/paginasi `VideosBrowser`, state `DemoPortal` |
| E2E | Sedikit journey kritis di browser nyata | **Playwright** (Chromium utama) | QA/Dev | Buka artikel; modal video; submit demo |
| Non-fungsional | Aksesibilitas, performa | Playwright (emulasi) + axe (`RENCANA`) | QA | `ACC-001`…`ACC-003`, `P-01` |
| Manual/eksploratif | Kualitas visual, rasa editorial | — | Owner/QA | Estetika, copy |

Catatan kejujuran: **component-level** (jsdom + RTL) bersifat `ASUMSI`/opsional — hanya
diadopsi jika interaksi filter/search terbukti terlalu rapuh/berat untuk dilipat ke E2E.
Untuk v1.0, prioritaskan unit + integration + E2E kritis agar piramida tetap kecil.

---

## 4. Vitest — yang benar-benar layak diuji secara unit

Sumber yang dibaca: `lib/catalogue.ts`, `lib/content.ts`, `app/api/demos/route.ts`.

### 4.1 Accessor katalog (`lib/catalogue.ts`)

Fungsi murni (tanpa I/O) yang layak mendapat test:

| Fungsi | Perilaku terverifikasi | Test ID |
|---|---|---|
| `viewCount(views)` | Bersihkan non `[0-9.,KM]`, buang koma, cocok `^([\d.]+)\s*([KM])?$` (case-insensitive); `K`×1000, `M`×1e6; tak cocok → `-1` | `U-01`…`U-03` |
| `videosByVenue(venue)` | `"all"` → `VIDEOS` apa adanya; selain itu `filter(v => v.venue === venue)` | `U-04` |
| `topVideos(n)` | Salin lalu sort desc by `viewCount`; `slice(0,n)`; **tidak memutasi** `VIDEOS` | `U-05` |
| `latestVideos(n)` | `VIDEOS.slice(0,n)` (urutan JSON = newest-first) | `U-06` |
| `VENUE_COUNTS` | Key = `VENUES`; nilai dari `COUNTS.byVenue[venue] ?? 0` | `U-07` |
| `formatDuration(s)` | `0` → `""`; `<3600` → `m:ss`; `≥3600` → `h:mm:ss`; padding 2 digit | `U-08` |
| `getVideo(id)` / `videosByIds(ids)` | `find`; `ids` mempertahankan urutan dan **membuang** yang tak ketemu | `U-09` |
| `fact(key)` / `factValue(key, fallback)` | fallback default `"-"` | `U-10` |
| `thumbnailFor(id)` | `https://i.ytimg.com/vi/${id}/hqdefault.jpg` | `U-09` |

Edge case penting untuk `viewCount` (invarian perilaku, bukan implementasi):

| Input | Harapan |
|---|---|
| `"107K"` | `107000` |
| `"1.8K"` | `1800` |
| `"1.2M"` | `1200000` |
| `"166"` | `166` |
| `"1,234"` | `1234` |
| `""` | `-1` |
| `"abc"` | `-1` |
| `"1.2.3"` | `-1` (`Number("1.2.3")` → `NaN`) |

> Catatan: string non-numerik apa pun yang tak cocok regex mengembalikan `-1`, sehingga
> `topVideos` menaruh entri tak terparsing di dasar urutan. Ini perilaku yang harus
> dipatok test, bukan diperbaiki di test.

### 4.2 Invarian data (`lib/content.ts`) dan `BR-004`

Invarian yang murah dan bernilai tinggi:

| Invarian | Alasan | Test ID |
|---|---|---|
| `ARTICLES` berjumlah 12 dan `slug` unik | `generateStaticParams` + route `/journal/[slug]` | `U-11` |
| Setiap `GENRE_ROWS[].slug` unik | Kunci render baris `/pahlawan-kota` (fallback statis) | `U-12` |
| `INTERVIEW_ROWS[].videoId` ada di `VIDEOS` | Modal `/bicara-melodi` | `U-12` |
| `COUNTS.videos === VIDEOS.length`; `sum(COUNTS.byVenue) === COUNTS.videos` | Angka di UI konsisten | `U-13` |
| Setiap `SEED_DEMOS[].genre ∈ DEMO_GENRES` dan `program ∈ DEMO_PROGRAMS` | Seed harus valid | `U-14` |

**`BR-004` (read-time `max(1, ceil(words / 200))`) — STATUS: TIDAK DIIMPLEMENTASIKAN.**
`TERVERIFIKASI` dengan grep pada seluruh repositori (`*.ts`, `*.tsx`, `*.mjs`, `*.css`,
`*.json`): tidak ada simbol `readTime`, `readingTime`, atau perhitungan kata/menit;
satu-satunya `Math.ceil` di kode adalah paginasi di `VideosBrowser.tsx`
(`Math.ceil(matches.length / PAGE_SIZE)`), yang tidak berkaitan dengan read-time.
Halaman artikel (`app/journal/[slug]/page.tsx`) menampilkan kategori, tanggal,
`SUMBER`, dan jumlah artikel — **tidak ada** estimasi waktu baca. Jadi tidak ada
fungsi untuk diuji hari ini. Test `U-15` adalah `RENCANA` dan hanya bisa ditulis
setelah aturan diimplementasikan.

### 4.3 Matriks validasi `POST /api/demos` (`TERVERIFIKASI` dari `route.ts`)

Aturan apa adanya:

1. Trim setiap field; non-string → `""` (`str()`).
2. Cap per field (via `str(value, max)`): `artist 120`, `city 80`, `title 160`,
   `genre 60`, `program 80`, `link 500`, `contact 160`, `story 2000`
   (`MAX_FIELD` default = `500`).
3. Wajib: `artist`, `city`, `title`, `story`, `contact`, `link`.
4. `link` cocok `/^https?:\/\/.+/i`, jika tidak → pesan `"Link harus diawali http:// atau https://."`
5. `genre` ∈ `DEMO_GENRES` **bila non-kosong**; jika tidak → `"Genre tidak dikenal."`
6. `program` ∈ `DEMO_PROGRAMS` **bila non-kosong**; jika tidak → `"Program tujuan tidak dikenal."`
7. Body bukan JSON → `400 { error: "Body harus berupa JSON." }`.
8. Validasi gagal → `422 { error, errors }`.
9. Sukses → `201 { ok, entry, queueLength, note }`; `entry.status = "NEW SUBMISSION • JUST NOW"`,
   `entry.submittedAt = YYYY-MM-DD`; `queue.unshift(entry)`.
10. `contact` **tidak** masuk `entry`; hanya muncul di `note` (`TERVERIFIKASI`).

Tabel batas yang wajib ditulis sebagai test (`I-01`…`I-12`):

| Kasus | Input | Harapan | ID |
|---|---|---|---|
| Happy path | semua wajib + genre/program valid | `201`, `entry` ter-echo, `queueLength = len+1` | `I-02` |
| Non-JSON | body `"{"` / teks mentah | `400`, pesan Indonesia | `I-03` |
| Wajib kosong (×6) | `artist` / `city` / `title` / `story` / `contact` / `link` hilang atau `""` | `422` + pesan per-field persis | `I-04` |
| `link` tanpa skema | `"open.spotify.com/x"`, `"ftp://x"` | `422` `errors.link` | `I-05` |
| `link` minimal | `"http://a"` | `201` (regex: ≥1 char setelah `//`) | `I-05b` |
| `genre` tak dikenal | `"Jazz"` / `"  "` | `"  "` → `""` (boleh); `"Jazz"` → `422 errors.genre` | `I-06` |
| `program` tak dikenal | nilai di luar enum | `422 errors.program` | `I-07` |
| `genre`/`program` kosong | `""` | **lolos** (kondisional) → `201` | `I-08` |
| Cap `artist` | 121 char | tersimpan 120 | `I-09` |
| Cap `city`/`title`/`genre`/`program` | 81/161/61/81 | 80/160/60/80 | `I-09` |
| Cap `link`/`contact`/`story` | 501/161/2001 | 500/160/2000 | `I-09` |
| Trim | `"  Skyline  "` | `"Skyline"` | `I-09b` |
| Tipe salah | `artist: 42` | `""` → `422` wajib | `I-09c` |
| `entry` tanpa `contact` | — | `contact` absen dari `entry`, ada di `note` | `I-10` |
| Kombinasi error | banyak field salah bersamaan | `errors` memuat **semua** | `I-12` |
| `submittedAt` | — | cocok `^\d{4}-\d{2}-\d{2}$` | `I-11` |
| `GET` | — | `200 { queue, count }`, `count === queue.length` | `I-01` |

> Pesan error Indonesia harus dipatok **persis** (mis. `"Nama band atau solois wajib diisi."`),
> karena `DemoPortal` menampilkannya mentah; perubahan teks adalah perubahan kontrak.

---

## 5. Playwright — Journey Kritis (E2E)

Turunan dari UI nyata (`VideosBrowser`, `VideoModal`, `DemoPortal`,
`WatchLink`). `baseURL = http://localhost:3100` (port dev/start brief §2). Semua `RENCANA`.

### 5.1 Journal (Stories, `FR-001`)

| ID | Skenario | Harapan |
|---|---|---|
| `E-01` | Buka `/journal`, klik kartu artikel | URL menjadi `/journal/<slug>`; `<h1>` = judul artikel |
| `E-02` | Kunjungi `/journal/<slug>` langsung; lalu `/journal/slug-tidak-ada` | Artikel render; slug tak dikenal → 404 (`app/not-found.tsx`) |
| `E-03` | Buka `/journal` (Stories) | Satu grid tanpa kontrol: tepat 6 kartu feed foto; **tidak ada** filter, pencarian, hitungan, atau header hierarki |
| `E-04` | Cek elemen `#journal-search` & tombol kategori | Tidak ada satu pun di DOM — kontrol dihapus 16 Okt 2026 (penyederhanaan Stories) |

### 5.2 Videos (`FR-002`) & Bicara Melodi

| ID | Skenario | Harapan |
|---|---|---|
| `E-05` | Di `/videos`, klik thumbnail `WatchButton` (`aria-label="Putar …"`) | `role="dialog"` tampil; `aria-label` = judul; iframe `src` memuat `youtube.com/embed/<id>` |
| `E-05b` | Tutup via `Escape`; ulang, tutup via klik backdrop & tombol "Tutup [ESC]" | Dialog hilang di ketiga jalur |
| `E-06` | Di `/bicara-melodi`, klik `WatchButton` | Dialog tampil dengan id video yang sesuai |
| `E-07` | Di `/videos`: klik tab venue; cek hitungan; `NEXT`/`PREV` | Filter menyaring; `PREV` `disabled` di halaman 1; `page` reset ke 0 saat filter/search berubah |
| `E-07b` | Cari istilah tanpa hasil di `#videos-search` | "Tidak ada video yang cocok." tampil |

### 5.3 Submit Demo (`FR-005`, `FR-006`, `ADR-0005`)

| ID | Skenario | Harapan |
|---|---|---|
| `E-08` | Isi form lengkap & kirim | Banner `role="status"` sukses; hitungan queue `+1`; form ter-reset. **Assert privasi:** string `contact` yang dikirim **tidak** muncul di DOM mana pun |
| `E-09` | Kirim dengan field wajib kosong | `role="alert"` per-field tampil dengan pesan Indonesia; queue tidak berubah |
| `E-10` | **Moderasi (`ADR-0005`, `RENCANA`).** Kirim demo baru; cek antrean publik | Antrean publik hanya memuat entri `approved`; entri baru **tidak** tampil sampai disetujui. **Merah hari ini** (route meng-`unshift` ke `queue` yang dirender apa adanya) |

### 5.4 Aksesibilitas keyboard & reduced motion (`ACC-001`…`ACC-003`)

| ID | Skenario | Harapan | Status sekarang |
|---|---|---|---|
| `A-01` | Tab ke tombol play di `/videos`; tekan `Enter` | Dialog terbuka; fokus pindah ke dalam dialog; `Escape` mengembalikan fokus | **Merah** — lihat catatan |
| `A-02` | Tab ke tautan judul artikel (kartu) | Curtain/corner-frame/dash reveal terlihat saat `:focus-within` | **Merah** — reveal `:hover`-only |
| `A-02b` | Ukur `naturalWidth` vs lebar render satu gambar kartu; cek tinggi frame > 0 | Tidak ada upscale; frame tidak runtuh | Penjaga `R2`/`R5` |
| `A-03` | Muat `/` dengan JS tertunda/dimatikan sesaat | Heading (`RevealText`) **terlihat** (tidak `opacity: 0`) | Penjaga `R4` |
| `A-04` | Cek `alt` | Kartu artikel: `alt` = judul; thumbnail video: `alt=""` (dekoratif) | `ACC-003` |
| `A-05` | Dialog: `role="dialog"`, `aria-modal="true"` | Atribut hadir | `ACC-003` |
| `A-06` | Emulasi `prefers-reduced-motion: reduce`; muat halaman berat | `.reveal-section`/`.stagger-item` `opacity: 1`, `transform: none`; durasi transisi ≈0 | `ACC-001` |

> **Penting (`TERVERIFIKASI`):** `globals.css` **tidak memuat satu pun** selektor
> `:focus`/`:focus-within`/`:focus-visible` (grep = 0 hasil). Semua affordance reveal
> hanya `:hover`, dan `.video-action-reveal` ber-`pointer-events: none` +
> `max-width: 0` saat tak hover. Karena itu `A-01`/`A-02` **akan gagal terhadap kode
> hari ini**. Test-nya tetap ditulis sebagai target `ACC-002`; memperbaikinya adalah
> pekerjaan fase berikutnya (bukan fase DOCS ini).

---

## 6. Requirement-to-Test Traceability Matrix

### 6.1 Requirement fungsional & aturan

| Requirement/AC | Risiko | Test IDs | Level | Status |
|---|---|---|---|---|
| `FR-001` Stories/Journal | `R13` | `E-01`, `E-02`, `E-03`, `E-04`, `U-11` | E2E, Unit | `RENCANA` |
| `FR-002` Watch/katalog | `R13`, `R1` | `E-05`, `E-05b`, `E-07`, `E-07b`, `U-01`…`U-09` | E2E, Unit | `RENCANA` |
| `FR-003` Showcase (Spaces/Pahlawan Kota) | `R2`, `R5` | `A-02b`, `E-06` | E2E | `RENCANA` |
| `FR-004` Bicara Melodi | — | `E-06`, `U-12` | E2E, Unit | `RENCANA` |
| `FR-005` Demo submission | `R6`, `R12` | `I-01`…`I-12`, `E-08`, `E-09` | Integration, E2E | `RENCANA` |
| `FR-006` Antrean/moderasi demo | `R7`, `R12` | `E-10`, `I-10` | E2E, Integration | `RENCANA` |
| `FR-007` Metadata/SEO | — | `E-01` (judul `<h1>`), `A-04` | E2E | `RENCANA` |
| `BR-001` Audio ≤ 25 MB + allowlist | `R10` | `E-11` | E2E | `RENCANA` — **belum ada kontrol** (accept `audio/*`, tanpa cek ukuran) |
| `BR-002` [PERLU VERIFIKASI] | — | `[PERLU VERIFIKASI]` | — | Teks PRD belum ada di repo |
| `BR-003` [PERLU VERIFIKASI] | — | `[PERLU VERIFIKASI]` | — | Idem |
| `BR-004` Read-time `max(1, ceil(words/200))` | `R9` | `U-15` | Unit | `RENCANA` — **tidak diimplementasikan** |
| `ACC-001` Reduced motion | — | `A-06` | E2E | `RENCANA` (CSS sudah menghormati — brief §8) |
| `ACC-002` Keyboard reveal | `R8` | `A-01`, `A-02` | E2E | `RENCANA` — **merah terhadap kode hari ini** |
| `ACC-003` Alt/semantik | — | `A-04`, `A-05` | E2E | `RENCANA` |
| `NFR-001` Performa statis | `R3` | `P-01`, `P-02` | Perf | `RENCANA` |
| `NFR-002` SEO | — | `E-01`, `A-04` | E2E | `RENCANA` |
| `NFR-003` Aksesibilitas | `R8` | `A-01`…`A-06` | E2E | `RENCANA` |
| `NFR-004` Reliabilitas | `R6` | `I-01`…`I-12` | Integration | `RENCANA` |

`BR-002`/`BR-003` dan teks persis `NFR-*` tidak tersedia di workspace; ditandai
`[PERLU VERIFIKASI]` (lihat Open Questions).

### 6.2 Invariant arsitektur (regresi §9)

| Invarian | Risiko | Test IDs | Level |
|---|---|---|---|
| Stylesheet ter-build dengan `@source not` lengkap | `R1` | `P-00`, `E-01` | Build, E2E |
| `fill` selalu ber-ancestor berposisi | `R2` | `A-02b` + lint sumber | E2E, Static |
| Parallax memakai kotak oversized, bukan `scale()` | `R2` | `A-02b` | E2E |
| Konten reveal pasti terlihat saat scroll | `R3` | `P-01` | Perf |
| SSR merender state final (tanpa hidden inline) | `R4` | `A-03` | E2E |
| Nama kelas Tailwind literal (tanpa interpolasi) | `R5` | lint `aspect-\[\$\{` + `A-02b` | Static, E2E |

### 6.3 Empat release blocker "PRD §14.2"

Teks `PRD` tidak berada di workspace, jadi pemetaan blocker → test di bawah ini
**`ASUMSI`** dan harus dikonfirmasi terhadap PRD asli. Blocker diberi ID `B1`…`B4`
berdasarkan tema risiko yang paling kuat dan sudah terbukti di kode/dokumen.

| Blocker | Tema | Test IDs yang menutup | Status bukti |
|---|---|---|---|
| `B1` | Pipeline demo submission end-to-end + moderasi + tanpa kebocoran PII | `I-01`…`I-12`, `E-08`, `E-09`, `E-10` | `ASUMSI` |
| `B2` | Aksesibilitas: reduced motion + operabilitas keyboard + alt/semantik | `A-01`…`A-06` | `ASUMSI` (gap `ACC-002` `TERVERIFIKASI`) |
| `B3` | Build bersih & semua rute publik berjalan (termasuk 404, metadata) | `P-00`, `E-01`, `E-02`, `E-12` | `ASUMSI` |
| `B4` | Tidak ada regresi pada interaksi terkunci (`DEC-002`/`DEC-003`) | `E-05`, `E-06`, `A-01`, `A-02` | `ASUMSI` |

---

## 7. Test Case Specifications — Detail Kunci

Format ringkas Given/When/Then untuk kasus yang paling bernilai. Sisanya mengikuti
tabel §4–§6.

### 7.1 `POST /api/demos` — validasi (integration)

**`I-04` (field wajib hilang, per field).**
Given handler `POST` diimpor langsung dari `app/api/demos/route.ts`;
When dikirim `Request` JSON tanpa `artist` (lalu ulang untuk `city`/`title`/`story`/`contact`/`link`);
Then status `422`, `errors.<field>` = pesan Indonesia persis, `queue` di `GET` tidak bertambah.

**`I-05` (skema link).**
Given `link = "open.spotify.com/track/x"`;
When `POST`;
Then `422`, `errors.link = "Link harus diawali http:// atau https://."`.
Boundary: `link = "http://a"` → `201`.

**`I-06`/`I-07` (enum).**
Given `genre = "Jazz"` (di luar `DEMO_GENRES`);
Then `422`, `errors.genre = "Genre tidak dikenal."`.
Boundary: `genre = ""` → diizinkan (`201`).

**`I-09` (cap).**
Given `story` sepanjang 2001 char;
Then `entry.story.length === 2000` (dan `artist` 121→120, dst.).

### 7.2 Journey E2E

**`E-01`.**
Given buka `/journal`;
When klik tautan judul pada kartu pertama;
Then URL = `/journal/<slug-nya>`, `<h1>` memuat teks `article.title`.

**`E-05`.**
Given buka `/videos`;
When klik tombol ber-`aria-label="Putar <judul>"`;
Then elemen `[role="dialog"][aria-modal="true"]` terlihat, `iframe[src*="youtube.com/embed/<id>"]` ada.

**`E-08` (privasi).**
Given isi seluruh field wajib + `contact = "rahasia-manajer"` (nilai sintetis);
When submit;
Then `[role="status"]` memuat teks sukses, hitungan queue naik 1, form kosong;
And `page.content()` **tidak** memuat `"rahasia-manajer"`.

**`A-06` (reduced motion).**
Given konteks Playwright `reducedMotion: "reduce"`;
When buka `/`;
Then elemen `.reveal-section`/`.stagger-item` punya `opacity: 1` dan `transform: none`.

---

## 8. Test Data and Environment Plan

### 8.1 Environment

| Environment | Tujuan | Cara jalan |
|---|---|---|
| Lokal | Unit + E2E | `npm run dev` (port 3100) atau build+start |
| CI (PR) | Gate blokir | Vercel Preview + job test (§9) |
| Staging/Prod | Smoke pasca-deploy | Vercel deployment (`ADR-0006`) |

Tidak ada variabel lingkungan yang dibaca kode hari ini (brief §3) — test **tidak boleh**
mengasumsikan `.env`. Audio diuji sebagai file sintetis di memori.

### 8.2 `lib/catalogue.json` — read-only

- `catalogue.json` **generated** (`npm run catalogue`) dan **tidak boleh** dimutasi test
  (brief §9, poin 8). Import hanya lewat accessor read-only di `lib/catalogue.ts`.
- Jika perlu "fixture katalog" khusus, buat salinan kecil di folder test dan injeksikan
  lewat parameter — jangan menulis ke `lib/catalogue.json`.
- Angka di dalamnya relatif terhadap tanggal scrape (`meta.scrapedAt`). Test **tidak
  boleh** mematok nilai absolut view/umur; patok **bentuk** dan **hubungan** (mis.
  `sum(byVenue) === videos`), bukan angka mentah.
- Untuk test `viewCount`, gunakan string literal di dalam test (bukan dari JSON) agar
  deterministik.

### 8.3 Isolasi store demo (`R7`)

`app/api/demos/route.ts` menyimpan `const queue = [...SEED_DEMOS]` di **level modul**
(`TERVERIFIKASI`). Artinya state bocor antar-test dalam satu proses Vitest.
`DemoPortal.tsx` **tidak lagi** menginisialisasi state dari `SEED_DEMOS` — antrean
klien dihapus 16 Okt 2026.

Cara isolasi yang disarankan (`RENCANA`):

1. Di setiap test integration, **reset modul** sebelum import:
   `vi.resetModules()` lalu `const { POST, GET } = await import("@/app/api/demos/route")`
   di dalam test (`beforeEach`), sehingga array `queue` di-reset ke `SEED_DEMOS`.
2. Jangan pernah mengandalkan urutan test; setiap test harus lolos secara independen.
3. Untuk E2E, sadari `next start` adalah satu proses server: state queue persisten per
   server. Jalankan spec submit secara **serial** (Playwright `workers: 1` untuk project
   submit, atau `test.describe.serial`) dan jangan mematok panjang antrean absolut —
   pematok **delta** (+1) atau **tidak memuat entri**.
4. Jangan mengekspor ulang array ke test sebagai jalan pintas mutasi.

### 8.4 Determinisme waktu & acak

- `id()` memakai `Date.now()` + `Math.random()` (`TERVERIFIKASI`). Test **tidak mematok
  `id`**; hanya pola `demo-`.
- `submittedAt` memakai tanggal hari ini. Patok pola `^\d{4}-\d{2}-\d{2}$`, bukan nilai.
  Jika perlu nilai tetap, gunakan fake timer Vitest (`vi.setSystemTime`) — `RENCANA`.

### 8.5 Perf assertion yang stabil (`R3`, `NFR-001`)

Regresi rAF (1 frame/detik) perlu assertion performa. Untuk menghindari test rapuh:

- **Assert gejala, bukan angka mentah.** Gejala yang andal: saat halaman berat dimuat
  dan di-scroll, konten yang di-`reveal` (`IntersectionObserver`) harus mencapai
  `opacity: 1`/terlihat dalam batas waktu (mis. `5s`). Ini gagal tepat ketika frame loop
  kelaparan, dan tidak bergantung kecepatan mesin.
- **Budget cadangan (advisory, bukan blokir).** Opsional: kumpulkan timestamp
  `requestAnimationFrame` selama beberapa frame saat scroll lalu assert **median interval
  antar-frame < 250 ms** (≈ < 4 fps dianggap gagal). Ambang longgar ini hanya menangkap
  regresi ekstrem (1 fps), bukan variasi normal CI.
- **Kondisi tetap:** hanya Chromium, viewport tetap, tanpa CPU throttling, `--disable-gpu`
  konsisten, retry maksimal 1×. Jangan jalankan di Firefox/WebKit (timing berbeda).
- **Label:** tandai test perf sebagai project Playwright terpisah dan **blocking hanya di
  gate rilis**, **warning di PR** (§9) — perf di runner bersama mudah flaky.

---

## 9. Automation Plan and CI Quality Gates

Konsisten dengan deploy Vercel (`ADR-0006`). Tiap PR → Vercel Preview + job test.

### 9.1 Skrip yang diusulkan (`RENCANA`, tidak ada hari ini)

`package.json` hari ini **tidak punya** skrip test. Usulan (dengan perintah tepat):

| Skrip (`RENCANA`) | Perintah |
|---|---|
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:e2e` | `playwright test` |
| `test:e2e:report` | `playwright show-report` |

Dependensi `RENCANA` (belum dipasang): `vitest`, `@vitest/coverage-v8` (opsional),
`jsdom` + `@testing-library/react` + `@testing-library/user-event` (jika komponen diuji),
`@playwright/test`. Playwright `webServer` diset `npm run dev` dengan
`url: "http://localhost:3100"`.

### 9.2 Gate: blokir vs peringatkan

| Gate | Level | Blokir merge? | Alasan |
|---|---|---|---|
| `npm run lint` | Static | **Ya** | Sudah hijau; regresi mudah ditangkap |
| `next build` (+`tsc --noEmit`) | Static | **Ya** | Menangkap `R1` (stylesheet), tipe, rute |
| `vitest run` (unit + integration) | Unit/Int | **Ya** | Cepat, deterministik, inti `R6`/`R13` |
| `playwright test` — journey kritis (`E-01`,`E-05`,`E-08`, 404) | E2E | **Ya** | Journey yang paling mahal bila rusak |
| `playwright test` — keyboard/reduced-motion (`ACC-002`,`ACC-001`) | E2E | **Ya** untuk `ACC-001`; `ACC-002` **ya setelah perbaikan** | `ACC-002` merah hari ini → jangan blokir sebelum diperbaiki |
| Perf `P-01` | Perf | **Warning** di PR, **blokir** di rilis | Flaky-prone di CI bersama |
| Coverage % | Unit | **Warning** saja | Diagnostic, bukan sasaran |
| axe / a11y scan | Non-fung | **Warning** | Banyak temuan minor; rangkum manual |

### 9.3 Kebijakan test flaky

- Karantina test flaky dengan owner + tenggat (mis. 5 hari kerja) sebelum dihapus/diperbaiki.
- Retry otomatis maksimal 1× **hanya** untuk E2E; unit tidak di-retry (harus deterministik).
- E2E yang menyentuh `/submit` dijalankan serial (§8.3).

---

## 10. Non-Functional Test Plan

| Dimensi | Target | Status target | Test |
|---|---|---|---|
| Performa | Konten reveal terlihat saat scroll; tanpa frame-loop starvation | Mengikuti gejala `R3` | `P-01`, `P-02` |
| Aksesibilitas | Reduced motion dihormati (`ACC-001`); reveal bisa via keyboard (`ACC-002`); alt/semantik (`ACC-003`) | brief §8 | `A-01`…`A-06` |
| SEO | `<title>`, OG, `<h1>` per halaman; artikel punya route crawlable | brief §5 | `E-01`, `A-04` |
| Keamanan input | Validasi batas `POST`; PII `contact` tidak tampil publik | `R12` | `I-01`…`I-12`, `E-08` |
| Kompatibilitas | Chromium (blokir); Firefox/WebKit (advisory) | `ASUMSI` | `E-*` di 3 engine |
| Ketahanan | Body non-JSON, tipe salah, field besar | `R6` | `I-03`, `I-09c` |

Angka target performa (mis. batas ms) **tidak** diambil dari PRD (tidak tersedia);
disajikan sebagai `ASUMSI`/gejala (§8.5).

---

## 11. Yang TIDAK diuji di v1.0 (dan mengapa dapat diterima)

| Tidak diuji | Alasan | Risiko sisa |
|---|---|---|
| Payload CMS & Supabase (OQ-002) | Belum diimplementasikan (docs-only) | Tidak ada — belum ada kode |
| Unggahan audio nyata | Kode hari ini hanya preview lokal; file tak pernah dikirim (`TERVERIFIKASI`) | `BR-001` jadi `RENCANA`; diuji saat fitur dibangun |
| Pemutaran iframe YouTube nyata | Pihak ketiga + jaringan; nondeterministik | Rendah; hanya `src` yang diassert |
| Integrasi email/WhatsApp `contact` | Tidak ada pengiriman hari ini | Celah §6 (dicatat di SECURITY-PRIVACY) |
| Visual regression piksel (screenshot diff) | Rentan flaky di font/render OS | Estimasi: per-owner review manual |
| Beban/stress (k6 dsb.) | Traffic & arsitektur prod belum final | `NFR-001` belum diuji skala |
| Matriks perangkat nyata | Di luar jangkauan fase | Advisory 3 engine browser |
| i18n / multi-bahasa | Tidak ada di PRD yang tersedia | — |
| `scripts/build-catalogue.mjs` (parsing) | Skrip build, bukan runtime; kalah prioritas | Katalog bisa keliru tanpa terdeteksi — kandidat v1.1 |
| `BR-002`, `BR-003` | Teks PRD tidak tersedia di workspace | `[PERLU VERIFIKASI]` |

Semua di atas **disadari** dan dicatat; tidak ada yang diklaim teruji.

---

## 12. Exit Criteria and Release Checklist

Sebuah fase/rilis diterima bila, secara **observable**:

1. **Gate blokir hijau** (§9.2): lint, build/typecheck, `vitest run`, E2E journey kritis.
2. **Traceability terpenuhi**: setiap `FR-001`…`FR-007`, `ACC-001`…`ACC-003` punya ≥1 test
   lulus; `BR-*` dipenuhi atau dieksplisitkan belum diimplementasikan.
3. **Empat blocker `B1`…`B4`** (§6.3) tertutup — atau teks blocker dikonfirmasi lalu
   disesuaikan.
4. **`ACC-002` terpenuhi** (perbaikan `:focus-within` mendarat; `A-01`/`A-02` hijau).
5. **`BR-001`** (batas 25 MB) dan **`BR-004`** (read-time) diputuskan: diimplementasikan +
   diuji, atau dikesampingkan secara eksplisit.
6. **Tidak ada test flaky yang belum ber-owner** (§9.3).
7. **Jumlah halaman statis** tidak turun tanpa alasan (brief §2: 26 halaman).
8. **Verifikasi pasca-deploy**: smoke `E-01`, `E-05`, `E-08` pada URL Vercel production.

---

## Verification Notes

Berkas yang dibaca **langsung** untuk dokumen ini (semua di
`D:\Project Website Melodi Alam\melodi-alam\`):

- `package.json` — 10 skrip (`dev`, `build`, `start`, `lint`, `test`, `catalogue`, `brand`,
  `photos`, `seed:sanity`, `seed:videos`); Vitest terpasang (`test`), Playwright belum.
- `package-lock.json` (baris ~5365–5379) — `@playwright/test` hanya `peerDependencies`
  opsional milik `next`, bukan instalasi.
- `app/api/demos/route.ts` — `GET`/`POST`, `str()`, cap per field, regex `link`, enum
  `genre`/`program` kondisional, `400`/`422`/`201`, `queue.unshift`, `note` berisi
  `contact` (tidak dipersist).
- `lib/content.ts` — `ArticleCategory`, `Article`, `InterviewRow`, `GenreRow`,
  `SpaceItem`, `DemoSubmission`; `DEMO_GENRES` (6), `DEMO_PROGRAMS` (3), `SEED_DEMOS` (3);
  12 artikel.
- `lib/catalogue.ts` — `viewCount`, `videosByVenue`, `topVideos`, `latestVideos`,
  `formatDuration`, `getVideo`, `videosByIds`, `fact`/`factValue`, `VENUES`,
  `VENUE_COUNTS`, `thumbnailFor`.
- `components/DemoPortal.tsx` — submit ke `/api/demos`, `role="status"`/`role="alert"`,
  reset form, revoke audio (antrean `useState(SEED_DEMOS)` dihapus 16 Okt 2026).
- `app/journal/page.tsx` — grid 12 kartu `ArticleCard`, server component; tanpa
  state klien (penyederhanaan Stories, 16 Oktober 2026).
- `components/VideosBrowser.tsx` — `PAGE_SIZE = 12`, tab venue, search, pagination,
  `disabled` PREV di halaman 1, empty state.
- `components/VideoModal.tsx` — event `melodi:watch`, `role="dialog"`, `aria-modal`,
  `Escape`, tutup backdrop, iframe embed; `WatchButton` `relative`.
- `components/WatchLink.tsx` — `href` nyata + dispatch modal (progressive enhancement).
- `components/ArticleCards.tsx` — `FRAME_SHAPE` literal (pelajaran `R5`), `fill` +
  `hover-reveal-*`/`corner-frame`.
- `app/journal/[slug]/page.tsx` — `generateStaticParams`, `generateMetadata`; **tanpa**
  indikasi read-time (`BR-004`).
- `app/submit/page.tsx` — memasang `DemoPortal`.
- `app/globals.css` — `@source not` (`../.codegraph`, `../.gitnexus`, `../.next`);
  utilitas reveal; **0 selektor `:focus*`**; blok `@media (prefers-reduced-motion: reduce)`.
- `next.config.ts` — `cacheComponents`, `partialPrefetching`, remote `i.ytimg.com`,
  Tailwind loader Turbopack.
- `docs/FRONTEND-PLAN.md` §10.2/§10.3/§12–§14, `docs/API-CONTRACTS.md` §6–§7,
  `docs/DATA-MODEL.md` §9.2, `docs/ARCHITECTURE.md` — acuan `BR-001` (25 MB =
  `26214400` byte), gap `ACC-002`, dan tingkat test yang sudah direncanakan.

Pemeriksaan yang dijalankan: grep `vitest|playwright|jest|cypress|describe(|it(|expect(|.spec.|.test.`
di seluruh repositori (hanya cocok di `docs/` dan `package-lock.json` sebagai peer
opsional) → **tidak ada test**; glob `*.config.*` → hanya `next.config.ts`; glob
`.github/**` → kosong; grep read-time/`200` → tidak ada implementasi `BR-004`.

---

## Open Questions, Gaps, dan Known Risks

1. **Empat release blocker "PRD §14.2" tidak dapat diverifikasi.** Teks PRD tidak ada di
   workspace (tidak ada berkas `*PRD*`, tidak ada `docs/PRD*.md`, `docs/PRD-REFERENCE.md`
   belum ditulis). Pemetaan `B1`…`B4` di §6.3 adalah `ASUMSI`. **Butuh teks PRD asli.**
2. **`BR-002`, `BR-003`, dan teks persis `NFR-001`…`NFR-004`** tidak tersedia —
   `[PERLU VERIFIKASI]`.
3. **`BR-004` (read-time) tidak diimplementasikan** (`TERVERIFIKASI`). Perlu keputusan:
   diimplementasikan di fase mana, lalu `U-15` ditulis.
4. **`BR-001` (25 MB) belum ditegakkan.** `accept="audio/*"` dan tidak ada cek ukuran;
   `E-11` hanya bisa hijau setelah fitur unggah dibangun.
5. **`ACC-002` merah terhadap kode hari ini** (reveal `:hover`-only; tak ada
   `:focus-within`). Test keyboard ditulis sebagai target, bukan sebagai kondisi saat ini.
6. **Store demo adalah array level-modul** → wajib `vi.resetModules()` (§8.3). Bila nanti
   pindah ke DB (Payload/Supabase), strategi isolasi ini harus ditulis ulang.
7. **Component-level (jsdom/RTL) masih `ASUMSI`** — putuskan apakah layak, atau lipat
   seluruhnya ke E2E demi piramida kecil.
8. **Ambang performa** bersifat gejala/`ASUMSI`, bukan angka PRD. Konfirmasi apakah
   `NFR-001` menetapkan target ms konkret.
9. **`docs/adr/` belum ada** (`FRONTEND-PLAN.md` §13.2) — `ADR-0005`/`ADR-0006` dirujuk
   lewat ID; berkasnya `RENCANA`.
10. **Nama ADR.** Dokumen lain memakai `ADR-0002`…`ADR-0005` untuk CMS/demo; pastikan
    `ADR-0005` = moderated demo queue dan `ADR-0006` = Vitest + Playwright + Vercel tidak
    bertabrakan nomor.
