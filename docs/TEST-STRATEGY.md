# TEST-STRATEGY.md — Strategi Pengujian Melodi Alam

Dokumen ini menjelaskan **keadaan pengujian saat ini** dan rencana lapisan yang
belum ada. Satu-satunya suite yang benar-benar berjalan hari ini adalah unit
test Vitest.

> **Status fase (21 Okt 2026):** ada **satu** berkas test — `lib/content-fallback.test.ts`,
> 20 kasus — yang dijalankan oleh `npm test` (`vitest run`). Belum ada Playwright,
> belum ada testing-library, belum ada Coverage, dan belum ada uji end-to-end.
> **CI sudah ada** (`.github/workflows/ci.yml`): lint, typecheck, test, dan build
> pada setiap push ke `main` dan setiap pull request. Lapisan di luar unit test
> dan CI di dokumen ini ditulis sebagai `RENCANA`, bukan sebagai kondisi yang
> sudah ada.

Stack keputusan: **Vitest** untuk unit/logika (`ADR-0006`). Playwright untuk E2E
masih **rencana** — belum terpasang, tidak ada `playwright.config.*`, dan tidak
ada dependensi `@playwright/test` di `package.json`.

Cara membaca label:

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Dibaca langsung di kode, atau dijalankan, pada fase ini |
| `RENCANA` | Direncanakan; belum ada di repo |
| `ASUMSI` | Diasumsikan; perlu konfirmasi |
| `[PERLU VERIFIKASI]` | Tidak dapat diverifikasi dari workspace ini |

---

## 1. Test Context and Scope (Konteks & Cakupan)

### 1.1 Keadaan saat ini (`TERVERIFIKASI`)

**Ada satu suite unit test: 20 kasus di 1 berkas. Tidak ada apa pun di atas
level itu.**

Bukti yang dibaca langsung:

- `package.json` mendefinisikan **10 skrip**: `dev`, `build`, `start`, `lint`,
  `test`, `catalogue`, `brand`, `photos`, `seed:sanity`, `seed:videos`.
  Skrip `test` = `vitest run`.
- `vitest.config.ts` (`TERVERIFIKASI`): alias `@` → root repo, `environment:
 $1node"`, `include: ["**/*.test.ts"]`, `exclude: ["node_modules/**",
 $1.next/**"]`. Tidak ada setup file, tidak ada coverage, tidak ada reporter
  khusus.
- Satu-satunya berkas test di repo: `lib/content-fallback.test.ts`. **Tidak ada**
  `*.spec.ts`, tidak ada `tests/`, tidak ada `__tests__/`.
- `npm test` dijalankan pada fase ini: **9 passed / 1 file** (Vitest 3.2.7).
- `devDependencies`: `@tailwindcss/turbopack`, `@types/node`, `@types/react`,
  `@types/react-dom`, `eslint`, `eslint-config-next`, `sharp`, `tailwindcss`,
  `typescript`, **`vitest ^3.2.7`**. `dependencies`: `@portabletext/react`,
  `@sanity/client`, `@sanity/image-url`, `@vercel/analytics`, `@vercel/blob`,
  `motion`, `next 16.4.2`, `react 19.3.0`, `react-dom 19.3.0`.
  **Tidak ada** `jsdom`, `@testing-library/*`, `@playwright/test`,
  `@vitest/coverage-v8`.
- `package-lock.json` memuat `"@playwright/test": "^1.51.1"` **hanya** sebagai
  `peerDependencies` opsional milik paket `next` (`peerDependenciesMeta.optional
  = true`). Itu bukan instalasi dan bukan dependensi proyek.
- Direktori `.github/` **ada** → `.github/workflows/ci.yml` menjalankan lint, typecheck, test, dan build pada setiap push ke `main` dan setiap pull request.

**Gerbang otomatis yang benar-benar ada hari ini, tiga:**

| Gate | Perintah | Status |
|---|---|---|
| Lint | `npm run lint` (→ `eslint`) | `TERVERIFIKASI` — dijalankan, bersih |
| Type-check | `npx tsc --noEmit` | `TERVERIFIKASI` — dijalankan, bersih. Tidak punya skrip sendiri; `npm run build` juga menjalankan TypeScript |
| Unit test | `npm test` (→ `vitest run`) | `TERVERIFIKASI` — 20/20 lulus |

Ditambah build produksi `npm run build` (Next.js 16.4.2, Turbopack) yang
menghasilkan **33 halaman statis** (`TERVERIFIKASI` — dijalankan pada fase ini;
rinciannya di §9.2).

Tidak ada assertion yang menjaga perilaku rendering, tidak ada uji aksesibilitas,
dan tidak ada pemantau regresi visual. Pernyataan ini disengaja: dokumen ini
**tidak** menyiratkan adanya coverage.

### 1.2 Yang diuji (in scope)

- Fungsi murni di `lib/content-fallback.ts` dan `lib/pillars-shared.ts` serta
  `lib/taxonomy.ts` (§4).
- Kontrak `app/api/demos/route.ts` (`GET`, `POST`) dan
  `app/api/revalidate/route.ts` (`POST`) — belum ada testnya (§4.4, `RENCANA`).
- Invariant data: 12 artikel statis di `lib/content-fallback.ts`, 9 baris wawancara,
  pool kurasi, dan angka yang tampil di UI (`RENCANA`).
- Journey UI kritis pada `/`, `/stories`, `/stories/[slug]`, `/bicara-melodi`,
  `/videos`, `/kurasi`, `/submit`, 404 (`RENCANA`, §5).
- Aksesibilitas keyboard dan reduced-motion (§5.3, `RENCANA`).

### 1.3 Yang tidak diuji (out of scope, ringkas — detail §11)

Sanity Studio dan dataset `submissions`, unggah audio sungguhan ke Vercel Blob,
pemutaran iframe YouTube nyata, pengiriman email/Resend, visual regression
piksel, uji beban, dan integrasi webhook Sanity.

### 1.4 Asumsi (`ASUMSI`)

- Requirement `FR-001`…`FR-007` dan `NFR-001`…`NFR-004` memakai pemetaan dari
  `docs/FRONTEND-PLAN.md` §4 (yang sendiri menandai sebagiannya `ASUMSI`).
- Empat release blocker "PRD §14.2" tidak dapat dibaca dari workspace — lihat
  §6.3 dan Open Questions.

---

## 2. Risk Assessment (Penilaian Risiko)

Bobot utama: **blast radius** × **bukti bahwa ini sudah pernah rusak**.
Baris "Kondisi" menyatakan apakah risiko itu masih terbuka di kode hari ini.

| ID | Area | Risiko | Kondisi | Penekanan uji |
|---|---|---|---|---|
| `R1` | `globals.css` + pemindaian Tailwind | Direktori tool baru tanpa `@source not` → **stylesheet gagal dibangun senyap** | **Terbuka** (`@source not` ada untuk `.codegraph`, `.gitnexus`, `.next`) | Gate build + smoke render |
| `R2` | `next/image` `fill` | Ancestor `static` → gambar ter-*upscale* | **Terbuka** — aturan "induk harus `relative`" berlaku, tapi tidak ada penjaga otomatis | Uji sumber + pengukuran di browser |
| `R3` | Pembacaan geometri di frame loop | Reflow sinkron → 1 rAF/detik, `IntersectionObserver` mati | **Tertutup di `MarqueeTape`** (`ResizeObserver`, bukan per-frame). `RevealText` membaca `getBoundingClientRect` di event scroll/resize, bukan di loop | Sanity check + assert gejala |
| `R4` | SSR menyalin state tersembunyi | Judul permanen tak terlihat | **Tertutup untuk `RevealText`** (`initial={false}`). **Masih terbuka untuk `components/motion/Reveal.tsx`**: kelas `reveal-section` mulai di `opacity: 0`, jadi isi section baru terlihat setelah JS jalan | Uji tanpa JS |
| `R5` | Tailwind + interpolasi string | `aspect-[${x}]` → tak ada rule → bingkai kartu runtuh | **Terbuka** | Lint konvensi + ukur tinggi bingkai |
| `R6` | Validasi `POST /api/demos` | Field wajib / `link` / enum lolos atau salah tolak | **Terbuka** — aturan ada, tidak ada testnya | Unit/integration matriks batas (§4.4) |
| `R7` | State level-modul di route | `memoryQueue` bocor antar-test → hasil palsu | **Terbuka** (`const memoryQueue` di `app/api/demos/route.ts:30`) | Disiplin fixture (§8.3) |
| `R8` | Keyboard | Affordance reveal hanya saat hover | **Tertutup** — `globals.css` kini punya `:focus-visible` (1) dan pasangan `:focus-within` (8) | Regression check (jangan sampai hilang lagi) |
| `R9` | Waktu baca artikel | Aturan `max(1, ceil(words/200))` berubah diam-diam | **Tertutup** — sudah ada di `lib/content-fallback.ts` dan dipatok 5 test | Sudah ada (`U-01`…`U-05`) |
| `R10` | Audio demo ≤ 25 MB | Tidak ada batas ukuran/tipe | **Tertutup** — `DEMO_AUDIO_MAX_BYTES` ditegakkan di route; `audioUrl` harus `https` + ekstensi sah | Tambahkan test (§4.4) |
| `R11` | `lib/catalogue.json` | Dimutasi test atau disunting tangan | **Terbuka** | Read-only fixture (§8.2) |
| `R12` | PII `contact` | Kontak bocor ke UI publik | **Tertutup** — kontak disimpan terpisah (`demoContact` / `memoryContacts`), tidak pernah ada di `entry` | Regression check |
| `R13` | `viewCount` katalog | Parsing "107K" salah → urutan "Top" salah | **Terbuka** — `lib/catalogue.ts` punya accessor murni yang belum diuji | Unit `U-11`…`U-14` |
| `R14` | Kartu satu `<Link>` | Kembali ke "link judul + `::after`" → klik di area teks mati | **Terbuka** — regresi yang pernah dilaporkan | Uji klik pada area teks kartu (`E-13`) |
| `R15` | Thumbnail YouTube | Varian `maxres` 404 → gambar rusak | **Terbuka** — fallback `maxres → sd → hq` ada, belum diuji | Uji fallback (`E-14`) |
| `R16` | Angka antar halaman | `/` = 4 kartu, `/stories` = 8, detail = 3 "More", kurasi = 6 per pilar | **Terbuka** — semuanya diturunkan dari satu `latestStories(8)` dan satu `allPillarPosts()` | Uji konsistensi angka (`E-15`) |

### 2.1 Regresi lama yang sudah tertutup — penjaga yang dipakai sekarang

| Regresi | Penjaga termurah | Level |
|---|---|---|
| Stylesheet gagal senyap | Gate build: `npm run build` gagal kalau CSS kosong | Build |
| `fill` di induk `static` | Uji sumber: setiap `fill` punya induk `relative` | Static |
| rAF 1 fps | `ResizeObserver` di `MarqueeTape`; assert gejala, bukan angka mentah | Source + Perf |
| SSR membawa hidden state | `initial={false}` di `RevealText`; `reveal-section` masih hides lalu | Source + E2E |
| Interpolasi Tailwind | Lint: dilarang `aspect-[${` | Static |
| Waktu baca salah | 5 test `readingTimeMinutes` — sudah ada | Unit |
| Batas audio dilanggar | `DEMO_AUDIO_MAX_BYTES` di route — perlu test | Integration |
| Kartu tidak bisa diklik di teks | Satu `<Link>`/`<a>` membungkus kartu | E2E |

Prinsip: **assert gejala yang terlihat pengguna**, bukan detail implementasi.

---

## 3. Test Strategy by Level (Strategi per Level)

Piramida saat ini sangat kecil: hanya lapisan unit yang ada.

| Level | Peran | Tooling | Status | Contoh nyata |
|---|---|---|---|---|
| Static | Tipe, lint, konvensi | `npx tsc --noEmit`, `npm run lint` | **`TERVERIFIKASI`** | `npm run build`; larangan `aspect-[${...}]`; `@source not` lengkap |
| Unit | Logika murni, invarian data | **Vitest 3.2** (`npm test`) | **`TERVERIFIKASI`** | `readingTimeMinutes`, `pillarDate`, `isArticleCategory` (20 kasus) |
| Integration | Route handler dengan `Request`/`Response` nyata | Vitest (impor `POST`/`GET` langsung) | **`RENCANA`** | Matriks `POST /api/demos` (§4.4) |
| Component | Interaksi komponen klien terisolasi | Vitest + jsdom + React Testing Library | **`RENCANA`** | `KurasiBrowser` (cari + chip), `SiteHeader` (drawer), `DemoPortal` (validasi klien) |
| E2E | Sedikit journey kritis di browser nyata | **Playwright** (Chromium utama) | **`RENCANA`** | Buka artikel; modal video; kirim demo |
| Non-fungsional | Aksesibilitas, performa | Playwright (emulasi) + axe | **`RENCANA`** | `ACC-001`…`ACC-003`, `P-01` |
| Manual/eksploratif | Kualitas visual, rasa editorial | — | Manual | Estetika, copy, hierarki editorial |

Catatan kejujuran: **component-level** (jsdom + RTL) tetap `ASUMSI`/opsional.
Untuk v1.0, prioritaskan unit + integration + E2E kritis agar piramida tetap
kecil; jangan menambah lapisan sebelum ada yang benar-benar menyakitkan.

---

## 4. Vitest — apa yang ada dan apa yang belum

### 4.1 Suite yang ada (`TERVERIFIKASI`)

`lib/content-fallback.test.ts` — 20 kasus, 3 `describe`, lingkungan `node` (tanpa DOM).

| ID | `describe` | Yang dipatok | Skor |
|---|---|---|---|
| `U-01` | `readingTimeMinutes` | Tidak pernah di bawah 1 menit (`""` → 1, `"satu dua tiga"` → 1) | 1 |
| `U-02` | `readingTimeMinutes` | Satu halaman penuh (200 kata) = 1 menit | 1 |
| `U-03` | `readingTimeMinutes` | Pembulatan ke atas: 201 kata → 2, 1200 kata → 6 | 1 |
| `U-04` | `readingTimeMinutes` | Paragraf dan string lepas dihitung sama (`"dua kata"` + 400 kata → 3) | 1 |
| `U-05` | `readingTimeMinutes` | `articleReadingTime` menghitung judul + ringkasan + isi (200 kata isi → 2) | 1 |
| `U-06` | `pillarDate` | Format ISO seperti kartu: `"2026-03-04"` → `"4 Mar 2026"`, `"2026-10-12"` → `"12 Okt 2026"` | 1 |
| `U-07` | `pillarDate` | Tanggal kosong → `""` (`null`, `""`, `"bukan-tanggal"`) | 1 |
| `U-08` | `isArticleCategory` | Menerima desk yang dikenal: `"Fakta Musik"` → `true` | 1 |
| `U-09` | `isArticleCategory` | Menolak yang lain, termasuk non-string (`"Berita Panas"`, `undefined`, `42`) → `false` | 1 |

Yang **tidak** dipatok suite ini: konstanta `WORDS_PER_MINUTE = 200` sendiri
(hanya terlihat lewat kasus 200/201/1200 kata), dan `articleReadingTime` yang
menghitung `title + excerpt + body` — kasus terakhirnya sudah ter-*cover* oleh
`U-05`.

### 4.2 Kandidat unit test berikutnya (`RENCANA`)

Semuanya fungsi murni tanpa I/O, jadi murah dan deterministik.

| ID | Target | Perilaku yang perlu dipatok | Prioritas |
|---|---|---|---|
| `U-10` | `lib/articles.ts` `formatDate` (belum diekspor) | `2026-03-04` → `"4 Maret 2026"`; tanggal tak valid dikembalikan apa adanya | Rendah |
| `U-11` | `lib/catalogue.ts` `viewCount` | `"107K"` → `107000`, `"1.8K"` → `1800`, `"1.2M"` → `1200000`, `"1,234"` → `1234`, `""`/`"abc"`/`"1.2.3"` → `-1` | Tinggi |
| `U-12` | `lib/catalogue.ts` `formatDuration` | `0` → `""`; `< 3600` → `m:ss`; `≥ 3600` → `h:mm:ss` | Sedang |
| `U-13` | `lib/catalogue.ts` `topVideos` / `latestVideos` / `getVideo` | `topVideos` menyalin lalu mengurutkan turun dan **tidak memutasi** `VIDEOS`; `getVideo` id tak dikenal → `undefined` | Sedang |
| `U-14` | `lib/pillars-shared.ts` `PHOTO_PILLARS` / `REEL_PILLARS` | Empat pillar foto dan empat pillar reel; `meme-humor` tidak ada di salah satunya | Rendah |
| `U-15` | `lib/content-fallback.ts` `ARTICLES` | 12 artikel, `slug` unik, `mediaType` hanya `"foto"`/`"reel"` | Tinggi |
| `U-16` | `lib/content-fallback.ts` `INTERVIEW_ROWS` | 9 baris, `videoId` terisi, `slug` unik | Sedang |
| `U-17` | `lib/taxonomy.ts` enum | `DEMO_GENRES` 6, `DEMO_PROGRAMS` 3, `DEMO_INITIAL_STATUS` = `"IN REVIEW"`, `DEMO_APPROVED_STATUSES` = 2 status | Tinggi |
| `U-18` | `lib/taxonomy.ts` `DEMO_AUDIO_MAX_BYTES` | `25 * 1024 * 1024` = `26214400`; `DEMO_AUDIO_EXTENSIONS` = `.mp3 .wav .ogg` | Tinggi |
| `U-19` | `lib/site.ts` `PRIMARY_NAV` | Lima entri: `/`, `/stories`, `/bicara-melodi`, `/videos`, `/kurasi` | Rendah |

> Angka katalog (`lib/catalogue.json`) bersifat relatif terhadap tanggal scrape.
> Test **tidak boleh** mematok nilai absolut view; patok **bentuk** dan
> **hubungan** (mis. `sum(counts.byVenue) === counts.videos`).

### 4.3 Angka tampilan yang harus sinkron (`RENCANA`)

| ID | Invariant | Kenapa |
|---|---|---|
| `U-20` | `/` = 4 kartu `FrontCard` + strip 4 kartu `PillarCard` | Beranda mengambil `latestStories(8).slice(0, 4)` dan 4 post kurasi foto terbaru |
| `U-21` | `/stories` = 8 kartu `ArticleCard` | `latestStories(8)` → grid 4 kolom × 2 baris |
| `U-22` | Detail artikel = 3 kartu "More {rubrik}" | Desk sama dulu, dilengkapi dari desk lain |
| `U-23` | `/kurasi` = 6 post per pilar tanpa pencarian/filter | `PILLAR_LIMIT = 6` di `components/KurasiBrowser.tsx`; dengan pencarian/filter naik ke `SEARCH_LIMIT = 48` |
| `U-24` | Pool kurasi = 55 post aktif | Data CMS (`pillarPost`): fakta-musik 16 · lirik 3 · trivia 2 · kutipan 6 · rekomendasi 8 · ulas-melodi 3 · clipper 17. Pilar `similar-song` dan `meme-humor` ada di skema tapi 0 post |
| `U-25` | 12 artikel statis = 6 foto + 6 reel | `lib/content-fallback.ts`; CMS menyimpan 6 foto + 6 reel. Delapan yang tampil di `/stories` = 6 foto + 2 reel terbaru |

> `U-20`…`U-25` butuh data Sanity untuk sebagiannya, jadi lebih tepat jadi
> integration test dengan stub, atau dipindah jadi smoke test E2E (`E-15`).

### 4.4 Matriks validasi `POST /api/demos` (`RENCANA`, aturan `TERVERIFIKASI` dari `app/api/demos/route.ts`)

Aturan apa adanya di route hari ini:

1. Body lebih dari `MAX_BODY_BYTES = 16 * 1024` → `413 { error: "Kiriman terlalu besar." }`.
2. Body bukan JSON → `400 { error: "Body harus berupa JSON." }`.
3. Body JSON tapi bukan objek (`null`, array, angka) → `400 { error: "Body harus berupa objek JSON." }`.
4. `str(value, max)`: non-string → `""`; lalu `trim()` dan `slice(0, max)`.
   Cap per field: `artist 120`, `city 80`, `title 160`, `genre 60`, `program 80`,
   `link 500`, `contact 160`, `story 2000`, `audioName 200`, `audioUrl 500`.
   `audioSize` dibaca lewat `bytes()`: angka, atau string angka.
5. Wajib: `artist`, `city`, `title`, `story`, `contact`, `link` → masing-masing
   punya pesan Indonesia sendiri (lihat tabel di bawah).
6. `link` harus cocok `/^https?:\/\/.+/i` → jika tidak, `"Link harus diawali http:// atau https://."`.
7. `genre` harus ada di `DEMO_GENRES` **bila tidak kosong** → `"Genre tidak dikenal."`.
8. `program` harus ada di `DEMO_PROGRAMS` **bila tidak kosong** → `"Program tujuan tidak dikenal."`.
9. `audioName`: ekstensi harus salah satu dari `.mp3 .wav .ogg` → `"Format berkas harus .mp3, .wav, .ogg."`; `audioSize > 26214400` → `"Ukuran berkas melebihi batas 25 MB."`.
10. `audioUrl`: harus berakhir dengan ekstensi yang diizinkan **dan** mengarah ke
    host milik sendiri (`*.blob.vercel-storage.com`, `https` saja) →
    `"Tautan audio tidak dikenal."`.
11. Ada error → `422 { error: "Periksa kembali isian formulir.", errors }`.
12. Sukses → `201 { ok, entry, queueLength, note }`; `entry.status` =
    `"IN REVIEW"` (`DEMO_INITIAL_STATUS`); `entry.submittedAt` = `YYYY-MM-DD`.
13. `contact` **tidak pernah** masuk ke `entry`. Tanpa Sanity ia disimpan di
    `memoryContacts`; dengan Sanity ia jadi dokumen `demoContact` terpisah.
14. Gagal menulis ke Sanity → `503 { error: "Pengiriman demo sedang tidak bisa disimpan. Coba lagi nanti." }`.
15. `GET` → `{ queue, count }`. Dengan Sanity terpasang, queue hanya berisi status
    yang disetujui (`SHORTLISTED (SAMSARA)`, `APPROVED (ARTICLE)`); tanpa Sanity,
    queue adalah array in-memory.

Tabel batas yang wajib ditulis sebagai test (`I-01`…`I-14`):

| Kasus | Input | Harapan | ID |
|---|---|---|---|
| Happy path | semua wajib + genre/program valid | `201`, `entry` ter-echo, `queueLength` = jumlah antrean | `I-02` |
| Body terlalu besar | > 16 KB | `413`, `"Kiriman terlalu besar."` | `I-00` |
| Non-JSON | `"{"` / teks mentah | `400`, `"Body harus berupa JSON."` | `I-03` |
| JSON non-objek | `null`, `[]`, `42` | `400`, `"Body harus berupa objek JSON."` | `I-03b` |
| Wajib kosong (×6) | `artist`/`city`/`title`/`story`/`contact`/`link` hilang atau `""` | `422` + `errors.<field>` persis | `I-04` |
| `link` tanpa skema | `"open.spotify.com/x"`, `"ftp://x"` | `422` `errors.link` | `I-05` |
| `link` minimal | `"http://a"` | `201` (regex: ≥1 karakter setelah `//`) | `I-05b` |
| `genre` tak dikenal | `"Jazz"` | `422 errors.genre` | `I-06` |
| `program` tak dikenal | di luar enum | `422 errors.program` | `I-07` |
| `genre`/`program` kosong | `""` | **lolos** (kondisional) → `201` | `I-08` |
| Cap field | `artist` 121 char; `city` 81; `title` 161; `genre` 61; `program` 81; `link` 501; `contact` 161; `story` 2001 | tersimpan 120/80/160/60/80/500/160/2000 | `I-09` |
| Trim | `"  Skyline $1` | `"Skyline"` | `I-09b` |
| Tipe salah | `artist: 42` | `""` → `422` wajib | `I-09c` |
| Audio format salah | `audioName: "demo.aac"` | `422 errors.audioName` | `I-13` |
| Audio terlalu besar | `audioSize: 26214401` | `422 errors.audioName` | `I-14` |
| `audioSize` sebagai string angka | `audioSize: "26214401"` | tetap terbaca sebagai byte → `422 errors.audioName` | `I-14c` |
| `audioUrl` host asing | `"https://contoh.com/a.mp3"` | `422 errors.audioUrl` | `I-14b` |
| `audioUrl` http / ekstensi salah | `"http://x.blob.vercel-storage.com/a.mp3"`, `"https://x.blob.vercel-storage.com/a.aac"` | `422 errors.audioUrl` | `I-14b` |
| `entry` tanpa `contact` | — | `contact` absen dari `entry` | `I-10` |
| Kombinasi error | banyak field salah bersamaan | `errors` memuat **semua** field yang salah | `I-12` |
| `submittedAt` | — | cocok `^\d{4}-\d{2}-\d{2}$` | `I-11` |
| `status` | — | `"IN REVIEW"` | `I-11b` |
| `GET` | — | `200 { queue, count }`, `count === queue.length` | `I-01` |

> Pesan error Indonesia harus dipatok **persis**, karena `DemoPortal`
> menampilkannya mentah; perubahan teks adalah perubahan kontrak.

---

## 5. Lapisan di atas unit test — semuanya `RENCANA`

Playwright belum terpasang. `baseURL` yang dipakai kalau nanti dipasang:
`http://localhost:3100` (port `dev` dan `start`).

### 5.1 Stories (`FR-001`)

| ID | Skenario | Harapan |
|---|---|---|
| `E-01` | Buka `/stories`, klik kartu artikel | URL menjadi `/stories/<slug>`; `<h1>` = judul artikel |
| `E-02` | Kunjungi `/stories/<slug>` langsung; lalu slug tak dikenal | Artikel render; slug tak dikenal → 404 (`app/(site)/not-found.tsx`) |
| `E-03` | Buka `/stories` | Tepat **8** kartu `ArticleCard` dalam grid 4 kolom; **tanpa** filter, pencarian, atau hitungan |
| `E-04` | Cek elemen filter/pencarian lama | Tidak ada satu pun di DOM — kontrol filter dan pencarian sudah dihapus dari `/stories` |
| `E-13` | Klik **area teks** kartu (bukan gambarnya) | Navigasi tetap terjadi — kartu adalah satu `<Link>` atau `<a>` utuh |
| `E-15` | Bandingkan angka kartu beranda vs `/stories` vs detail | Beranda 4 + 4 kurasi; `/stories` 8; detail 3 "More" |

### 5.2 Video, Bicara Melodi, Curated News (`FR-002`, `FR-004`)

| ID | Skenario | Harapan |
|---|---|---|
| `E-05` | Di `/videos`, klik tombol `WatchButton` (`aria-label="Putar …"`) | `role="dialog"` + `aria-modal="true"` tampil; `iframe` `src` memuat `youtube.com/embed/<id>` |
| `E-05b` | Tutup via `Escape`; ulang, tutup via backdrop & tombol "Tutup [ESC]" | Dialog hilang di ketiga jalur |
| `E-06` | Di `/bicara-melodi`, klik `WatchButton` | Dialog tampil dengan id video yang sesuai; 9 baris episode |
| `E-07` | Di `/videos`, hitung baris sesi | 9 baris `VideoRow` (grup `Melodi Samsara`) + blok playlist |
| `E-14` | Paksa `maxresdefault.jpg` gagal (404) | Komponen turun ke `sddefault`, lalu `hqdefault`; tidak ada ikon gambar rusak |
| `E-16` | Buka `/kurasi`, ketik di kotak cari | Hasil terfilter; chip per pilar bekerja; jumlah post per pilar ≤ 6 tanpa filter |
| `E-17` | Buka `/kurasi`, klik chip pillar | Hanya post pillar itu yang tampil; anchor `#fakta-musik` dan friends ada |

### 5.3 Submit demo (`FR-005`, `FR-006`, `ADR-0005`)

| ID | Skenario | Harapan |
|---|---|---|
| `E-08` | Isi form lengkap & kirim | Banner `role="status"` sukses; queue `+1`; form ter-reset. **Assert privasi:** string `contact` yang dikirim **tidak** muncul di DOM mana pun |
| `E-09` | Kirim dengan field wajib kosong | `role="alert"` per-field tampil dengan pesan Indonesia; queue tidak berubah |
| `E-10` | Moderasi (`ADR-0005`) | Antrean publik hanya memuat entri berstatus disetujui; entri baru berstatus `IN REVIEW` tidak tampil |
| `E-11` | Unggah audio > 25 MB | Ditolak di peramban dengan pesan batas ukuran; tanpa audio pun formulir tetap terkirim |

### 5.4 Aksesibilitas keyboard & reduced motion (`ACC-001`…`ACC-003`)

| ID | Skenario | Harapan | Kondisi hari ini |
|---|---|---|---|
| `A-01` | Tab ke tombol play di `/videos`; tekan `Enter` | Dialog terbuka; fokus berpindah ke dalam dialog; `Escape` mengembalikan fokus | `RENCANA` |
| `A-02` | Tab ke tautan kartu artikel | Tirai hijau dan bingkai siku terlihat saat `:focus-within` | **`TERVERIFIKASI` sudah ada** di `globals.css` — 8 pasangan `:focus-within` + `:focus-visible` global |
| `A-02b` | Ukur `naturalWidth` vs lebar render satu gambar kartu; cek tinggi bingkai > 0 | Tidak ada upscale; bingkai tidak runtuh | Penjaga `R2`/`R5` |
| `A-03` | Muat `/` dengan JS dimatikan | Heading (`RevealText`) **terlihat**; isi di dalam `Reveal` masih `opacity: 0` → **ketidaksamaan yang harus diputuskan** (`R4`) | `RENCANA` |
| `A-04` | Cek `alt` | Kartu artikel: `alt` = judul; thumbnail YouTube: `alt=""` (dekoratif) | `ACC-003` |
| `A-05` | Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Atribut hadir | `ACC-003` |
| `A-06` | Emulasi `prefers-reduced-motion: reduce`; muat halaman berat | `.reveal-section`/`.stagger-item` `opacity: 1`, `transform: none`; durasi transisi ≈ 0 | `RENCANA` |

> **Perubahan penting sejak versi lama dokumen ini:** gap `:focus` **sudah
> ditutup**. `app/globals.css` sekarang memuat `:focus-visible` global (outline
> `2px solid var(--color-forest)`) dan pasangan `.group:focus-within` untuk
> `text-outline-muted`, `editorial-img`, `hover-reveal-curtain`,
> `hover-reveal-tag`, `corner-frame`, `dash-reveal-prefix`, dan
> `video-action-reveal`. Test `A-02` sekarang harus hijau — tugasnya berubah
> dari "menulis target" menjadi "menjaga agar tidak hilang lagi".

---

## 6. Requirement-to-Test Traceability Matrix

### 6.1 Requirement fungsional & aturan

| Requirement/AC | Risiko | Test IDs | Level | Status |
|---|---|---|---|---|
| `FR-001` Stories | `R16` | `E-01`, `E-02`, `E-03`, `E-04`, `E-13`, `U-15`, `U-21` | E2E, Unit | `RENCANA` (kecuali `U-15` yang bisa ditulis hari ini) |
| `FR-002` Watch/katalog | `R13`, `R15` | `E-05`, `E-05b`, `E-07`, `E-14`, `U-11`…`U-13` | E2E, Unit | `RENCANA` |
| `FR-004` Bicara Melodi | — | `E-06`, `U-16` | E2E, Unit | `RENCANA` |
| `FR-005` Demo submission | `R6`, `R10` | `I-01`…`I-14`, `E-08`, `E-09`, `E-11` | Integration, E2E | `RENCANA` |
| `FR-006` Antrean/moderasi demo | `R7`, `R12` | `E-10`, `I-01`, `I-10` | E2E, Integration | `RENCANA` |
| `FR-007` Metadata/SEO | — | `E-01`, `A-04` | E2E | `RENCANA` |
| `BR-001` Audio ≤ 25 MB + allowlist | `R10` | `I-13`, `I-14`, `I-14b`, `E-11` | Integration, E2E | `RENCANA` — **aturan sudah ditegakkan di route, test belum ada** |
| `BR-002` Status demo | — | `I-11b` | Integration | `RENCANA` — `DEMO_INITIAL_STATUS` = `"IN REVIEW"` sudah ada |
| `BR-003` [PERLU VERIFIKASI] | — | `[PERLU VERIFIKASI]` | — | Teks PRD belum ada di repo |
| `BR-004` Read-time `max(1, ceil(words/200))` | `R9` | `U-01`…`U-05` | Unit | **`TERVERIFIKASI`** — sudah ada dan sudah dipatok |
| `ACC-001` Reduced motion | — | `A-06` | E2E | `RENCANA` (blok CSS sudah menghormati) |
| `ACC-002` Keyboard reveal | `R8` | `A-01`, `A-02` | E2E | `RENCANA` — **sudah tertutup di CSS**, tinggal dijaga |
| `ACC-003` Alt/semantik | — | `A-04`, `A-05` | E2E | `RENCANA` |
| `NFR-001` Performa statis | `R3` | `P-01`, `P-02` | Perf | `RENCANA` |
| `NFR-002` SEO | — | `E-01`, `A-04` | E2E | `RENCANA` |
| `NFR-003` Aksesibilitas | `R8` | `A-01`…`A-06` | E2E | `RENCANA` |
| `NFR-004` Reliabilitas | `R6` | `I-01`…`I-14` | Integration | `RENCANA` |

`BR-003` dan teks persis `NFR-*` tidak tersedia di workspace; ditandai
`[PERLU VERIFIKASI]` (lihat Open Questions).

### 6.2 Invariant arsitektur (regresi §9)

| Invariant | Risiko | Test IDs | Level |
|---|---|---|---|
| Stylesheet ter-build dengan `@source not` lengkap | `R1` | `P-00`, `E-01` | Build, E2E |
| `fill` selalu ber-ancestor berposisi | `R2` | `A-02b` + lint sumber | E2E, Static |
| Konten reveal pasti terlihat saat scroll | `R3` | `P-01` | Perf |
| SSR merender keadaan final | `R4` | `A-03` | E2E |
| Nama kelas Tailwind literal | `R5` | lint `aspect-\[\$\{` + `A-02b` | Static, E2E |
| Kartu adalah satu elemen link | `R14` | `E-13` | E2E |
| Thumbnail YouTube punya fallback | `R15` | `E-14` | E2E |
| Angka kartu konsisten antar halaman | `R16` | `E-15`, `U-20`…`U-25` | E2E, Unit |

### 6.3 Empat release blocker "PRD §14.2"

Teks `PRD` tidak berada di workspace, jadi pemetaan blocker → test di bawah ini
**`ASUMSI`** dan harus dikonfirmasi terhadap PRD asli.

| Blocker | Tema | Test IDs yang menutup | Status bukti |
|---|---|---|---|
| `B1` | Pipeline demo submission end-to-end + moderasi + tanpa kebocoran PII | `I-01`…`I-14`, `E-08`, `E-09`, `E-10`, `E-11` | `ASUMSI` |
| `B2` | Aksesibilitas: reduced motion + operabilitas keyboard + alt/semantik | `A-01`…`A-06` | `ASUMSI` (gap `:focus` sudah tertutup) |
| `B3` | Build bersih & semua rute publik berjalan (termasuk 404, metadata) | `P-00`, `E-01`, `E-02`, `E-15` | `ASUMSI` |
| `B4` | Tidak ada regresi pada interaksi terkunci (modal video, kartu) | `E-05`, `E-06`, `E-13`, `A-01`, `A-02` | `ASUMSI` |

---

## 7. Test Case Specifications — Detail Kunci

Format ringkas Given/When/Then untuk kasus yang paling bernilai.

### 7.1 `POST /api/demos` — validasi (integration, `RENCANA`)

**`I-04` (field wajib hilang, per field).** Given handler `POST` diimpor langsung
dari `app/api/demos/route.ts`; When dikirim `Request` JSON tanpa `artist` (lalu
ulang untuk `city`/`title`/`story`/`contact`/`link`); Then status `422`,
`errors.<field>` = pesan Indonesia persis, antrean tidak bertambah.

**`I-05` (skema link).** Given `link = "open.spotify.com/track/x"`; When `POST`;
Then `422`, `errors.link = "Link harus diawali http:// atau https://."`.
Boundary: `link = "http://a"` → `201`.

**`I-09` (cap).** Given `story` sepanjang 2001 char; Then `entry.story.length ===
2000` (dan `artist` 121→120, dst.).

**`I-14` (batas audio).** Given `audioName = "demo.mp3"` dan `audioSize =
26214401`; Then `422`, `errors.audioName = "Ukuran berkas melebihi batas 25 MB."`.
Boundary: `audioSize = 26214400` → lolos.

### 7.2 Journey E2E (`RENCANA`)

**`E-01`.** Given buka `/stories`; When klik kartu artikel; Then URL =
`/stories/<slug-nya>` dan `<h1>` memuat teks `article.title`.

**`E-05`.** Given buka `/videos`; When klik tombol ber-`aria-label="Putar <judul>"`;
Then elemen `[role="dialog"][aria-modal="true"]` terlihat dan
`iframe[src*="youtube.com/embed/<id>"]` ada.

**`E-08` (privasi).** Given isi seluruh field wajib + `contact = "rahasia-manajer"`
(nilai sintetis); When submit; Then `[role="status"]` memuat teks sukses, queue
naik 1, form kosong; And `page.content()` **tidak** memuat `"rahasia-manajer"`.

**`E-13` (kartu satu link).** Given buka `/stories`; When klik pada paragraf
ringkasan kartu pertama; Then URL berubah ke `/stories/<slug>` — klik pada teks
harus secepat klik pada gambar.

**`A-06` (reduced motion).** Given konteks Playwright `reducedMotion: "reduce"`;
When buka `/`; Then elemen `.reveal-section`/`.stagger-item` punya `opacity: 1`
dan `transform: none`.

---

## 8. Test Data and Environment Plan

### 8.1 Environment

| Environment | Tujuan | Cara jalan |
|---|---|---|
| Lokal | Unit + E2E | `npm run dev` (port 3100) atau `npm run build` lalu `npm run start` |
| CI (PR) | Gate blokir | **Belum ada** — lihat §9 |
| Produksi | Smoke pasca-deploy | Deployment Vercel otomatis dari `main` |

Variabel lingkungan yang dibaca kode: `NEXT_PUBLIC_SITE_URL`,
`SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `SANITY_PREVIEW_SECRET`,
`RESEND_API_KEY`, plus `DEMO_NOTIFY_FROM`/`DEMO_NOTIFY_TO` untuk email demo.
Untuk unit test tidak ada satupun yang perlu diset — `vitest.config.ts` memakai
`environment: "node"` dan tidak memuat `setupFiles`. Audio diuji sebagai file
sintetis di memori.

### 8.2 `lib/catalogue.json` — read-only

- `catalogue.json` **dihasilkan** oleh `npm run catalogue` dan **tidak boleh**
  dimutasi test.
- Jika perlu fixture katalog khusus, buat salinan kecil di folder test dan
  injeksikan lewat parameter — jangan menulis ke `lib/catalogue.json`.
- Angka di dalamnya relatif terhadap tanggal scrape (`meta.scrapedAt`). Test
  **tidak boleh** mematok nilai absolut view/umur; patok **bentuk** dan
  **hubungan** (mis. `sum(byVenue) === videos`), bukan angka mentah.
- Untuk test `viewCount`, gunakan string literal di dalam test (bukan dari JSON)
  agar deterministik.

### 8.3 Isolasi store demo (`R7`)

`app/api/demos/route.ts` menyimpan `const memoryQueue = [...SEED_DEMOS]` di
**level modul** (`app/api/demos/route.ts:30`) plus `memoryContacts` sebagai
`Map`. Artinya state bocor antar-test dalam satu proses Vitest.

Cara isolasi yang disarankan (`RENCANA`):

1. Di setiap test integration, **reset modul** sebelum import:
   `vi.resetModules()` lalu `const { POST, GET } = await import("@/app/api/demos/route")`
   di dalam `beforeEach`, sehingga `memoryQueue` kembali ke `SEED_DEMOS`.
2. Jangan pernah mengandalkan urutan test; setiap test harus lolos secara
   independen.
3. Untuk E2E, sadari `next start` adalah satu proses server: state queue
   persisten per server. Jalankan spec submit secara **serial** dan jangan
   mematok panjang antrean absolut — pematok **delta** (+1) atau **tidak memuat
   entri**.
4. Jangan mengekspor ulang array ke test sebagai jalan pintas mutasi.

> Catatan: dengan `SANITY_API_READ_TOKEN` terpasang, `submissionsClient` bukan
> `null` dan route menulis ke dataset privat Sanity, bukan ke array in-memory.
> Test integration **harus** berjalan tanpa token itu, atau memalsukan client —
> kalau tidak, test mengubah data produksi.

### 8.4 Determinisme waktu & acak

- `id()` memakai `Date.now()` + `Math.random()`. Test **tidak mematok `id`**;
  hanya pola `demo-`.
- `submittedAt` memakai tanggal hari ini. Patok pola `^\d{4}-\d{2}-\d{2}$`, bukan
  nilai. Jika perlu nilai tetap, gunakan fake timer Vitest (`vi.setSystemTime`) —
  `RENCANA`.

### 8.5 Perf assertion yang stabil (`R3`, `NFR-001`)

- **Assert gejala, bukan angka mentah.** Gejala yang andal: saat halaman dimuat
  dan di-scroll, konten yang di-*reveal* harus terlihat dalam batas waktu
  (mis. `5s`). Ini gagal tepat ketika frame loop kelaparan.
- **Budget cadangan (advisory).** Opsional: kumpulkan timestamp
  `requestAnimationFrame` selama beberapa frame saat scroll lalu assert
  **median interval antar-frame < 250 ms**.
- **Kondisi tetap:** hanya Chromium, viewport tetap, tanpa CPU throttling,
  retry maksimal 1×.
- **Label:** tandai test perf sebagai project Playwright terpisah dan
  **blocking hanya di gate rilis**, **warning di PR** (§9.2).

---

## 9. Automation Plan and CI Quality Gates

**Belum ada CI.** Direktori `.github/` tidak ada di repo, jadi tidak ada satu
pun workflow yang berjalan otomatis. Yang ada hanyalah **preview** dari
Vercel: integrasi Git membuatkan *preview deployment* untuk setiap pull
request, dan *merge ke `main`* memicu deploy produksi otomatis. Preview Vercel
adalah hasil build, **bukan** gate test: tidak ada test, lint, atau type-check
yang memblokir deployment.

### 9.1 Skrip yang sudah ada (`TERVERIFIKASI`)

| Skrip | Perintah | Status |
|---|---|---|
| `test` | `vitest run` | Ada |
| `lint` | `eslint` | Ada |
| `dev` / `build` / `start` | `next dev -p 3100` / `next build` / `next start -p 3100` | Ada |
| `catalogue`, `brand`, `photos`, `seed:sanity`, `seed:videos` | skrip node | Ada |

Skrip yang **belum ada** (`RENCANA`): `test:watch` (`vitest`), `test:e2e`
(`playwright test`), `test:e2e:report` (`playwright show-report`), `typecheck`
(`tsc --noEmit`).

Dependensi `RENCANA` (belum dipasang): `@playwright/test`, `jsdom` +
`@testing-library/react` + `@testing-library/user-event` (bila komponen diuji),
`@vitest/coverage-v8` (opsional). Playwright `webServer` diset `npm run dev`
dengan `url: "http://localhost:3100"`.

### 9.2 Gate yang disarankan (`RENCANA`)

| Gate | Level | Blokir merge? | Alasan |
|---|---|---|---|
| `npx tsc --noEmit` | Static | **Ya** | Cepat, menangkap tipe |
| `npm run lint` | Static | **Ya** | Sudah hijau; regresi mudah ditangkap |
| `npm run build` | Static | **Ya** | Menangkap `R1` (stylesheet), rute, 33 halaman statis |
| `npm test` (unit + integration) | Unit/Int | **Ya** | Cepat, deterministik |
| `playwright test` — journey kritis (`E-01`, `E-05`, `E-08`, 404) | E2E | **Ya** | Journey yang paling mahal bila rusak |
| `playwright test` — keyboard/reduced-motion (`A-01`, `A-02`, `A-06`) | E2E | **Ya** | `ACC-002` sudah tertutup di CSS, jadi bisa jadi blocking |
| Perf `P-01` | Perf | **Warning** di PR, **blokir** di rilis | Flaky-prone di runner bersama |
| Coverage % | Unit | **Warning** saja | Diagnostic, bukan sasaran |
| axe / a11y scan | Non-fung | **Warning** | Banyak temuan minor; rangkum manual |

### 9.3 Kebijakan test flaky

- Karantina test flaky dengan owner + tenggat (mis. 5 hari kerja) sebelum
  dihapus/diperbaiki.
- Retry otomatis maksimal 1× **hanya** untuk E2E; unit tidak di-retry (harus
  deterministik).
- E2E yang menyentuh `/submit` dijalankan serial (§8.3).

---

## 10. Non-Functional Test Plan

| Dimensi | Target | Status target | Test |
|---|---|---|---|
| Performa | Konten reveal terlihat saat scroll; tanpa kelaparan frame | Mengikuti gejala `R3` | `P-01`, `P-02` |
| Aksesibilitas | Reduced motion dihormati (`ACC-001`); reveal bisa via keyboard (`ACC-002`); alt/semantik (`ACC-003`) | `ACC-002` sudah tertutup di CSS | `A-01`…`A-06` |
| SEO | `<title>`, OG, `<h1>` per halaman; artikel punya route crawlable | — | `E-01`, `A-04` |
| Keamanan input | Validasi batas `POST`; `contact` tidak tampil publik | `R6`, `R12` | `I-01`…`I-14`, `E-08` |
| Kompatibilitas | Chromium (blokir); Firefox/WebKit (advisory) | `ASUMSI` | `E-*` di 3 engine |
| Ketahanan | Body non-JSON, body terlalu besar, tipe salah, field besar | `R6` | `I-00`, `I-03`, `I-09c` |

Angka target performa (mis. batas ms) **tidak** diambil dari PRD (tidak
tersedia); disajikan sebagai `ASUMSI`/gejala (§8.5).

---

## 11. Yang TIDAK diuji di v1.0 (dan mengapa dapat diterima)

| Tidak diuji | Alasan | Risiko sisa |
|---|---|---|
| Sanity Studio & dataset `submissions` | Suite lokal tidak punya kredensial dataset privat | `I-*` harus jalan tanpa token, atau dengan stub |
| Unggahan audio nyata ke Blob | Butuh Blob store; file tidak pernah melewati serverless | `BR-001` sudah ditegakkan di route, jadi risikonya kecil |
| Pemutaran iframe YouTube nyata | Pihak ketiga + jaringan; nondeterministik | Rendah; hanya `src` yang di-*assert* |
| Integrasi email/Resend | `RESEND_API_KEY` belum diset di produksi | Notifikasi diam; submission tetap tersimpan |
| Visual regression piksel (screenshot diff) | Rentan *flaky* di font/render OS | Estimasi: review manual per-owner |
| Beban/stress | Traffic & arsitektur prod belum final | `NFR-001` belum diuji skala |
| Matriks perangkat nyata | Di luar jangkauan fase | Advisory 3 engine browser |
| i18n / multi-bahasa | Tidak ada di PRD yang tersedia | — |
| `scripts/build-catalogue.mjs` (parsing) | Skrip build, bukan runtime | Katalog bisa keliru tanpa terdeteksi — kandidat v1.1 |
| `BR-003` | Teks PRD tidak tersedia di workspace | `[PERLU VERIFIKASI]` |

Semua di atas **disadari** dan dicatat; tidak ada yang diklaim teruji.

---

## 12. Exit Criteria and Release Checklist

Sebuah fase/rilis diterima bila, secara **observable**:

1. **Gate blokir hijau** (§9.2): type-check, lint, build, `npm test`, E2E
   journey kritis.
2. **Traceability terpenuhi**: setiap `FR-001`…`FR-007`, `ACC-001`…`ACC-003`
   punya ≥1 test lulus; `BR-*` dipenuhi atau dieksplisitkan belum diimplementasikan.
3. **Empat blocker `B1`…`B4`** (§6.3) tertutup — atau teks blocker dikonfirmasi
   lalu disesuaikan.
4. **`ACC-002` tetap tertutup** (`:focus-visible` dan pasangan `:focus-within`
   tidak boleh hilang dari `globals.css`).
5. **Angka kartu konsisten** antar beranda, `/stories`, detail artikel, dan
   `/kurasi` (`E-15`).
6. **Tidak ada test flaky yang belum ber-owner** (§9.3).
7. **Jumlah halaman statis** tidak turun tanpa alasan (build saat ini: 33).
8. **Verifikasi pasca-deploy**: smoke `E-01`, `E-05`, `E-08` pada URL Vercel
   production.

---

## Catatan Verifikasi

Berkas yang dibaca **langsung** untuk dokumen ini (semua di
`D:\Project Website Melodi Alam\melodi-alam\`):

- `package.json` — 10 skrip (`dev`, `build`, `start`, `lint`, `test`,
  `catalogue`, `brand`, `photos`, `seed:sanity`, `seed:videos`); `vitest`
  `^3.2.7` di `devDependencies`; Playwright, jsdom, dan testing-library tidak ada.
- `vitest.config.ts` — alias `@`, `environment: "node"`, `include: ["**/*.test.ts"]`,
  tanpa `setupFiles`, tanpa coverage.
- `lib/content-fallback.test.ts` — 20 kasus dalam 3 `describe`; dipetakan ke `U-01`…`U-09`.
- `npm test` — **dijalankan**: 9 passed / 1 file (Vitest 3.2.7).
- `npm run build` — **dijalankan**: Next.js 16.4.2, "Generating static pages
  using 11 workers (33/33)", 33 halaman statis, TypeScript bersih.
- `npm run lint` — **dijalankan**: bersih.
- `npx tsc --noEmit` — **dijalankan**: bersih.
- `app/api/demos/route.ts` — `GET`/`POST`, `str()`, `bytes()`, `isOwnBlobUrl()`,
  cap per field, `MAX_BODY_BYTES` 16 KB, body harus objek JSON, regex `link`,
  enum `genre`/`program` kondisional, aturan audio (`DEMO_AUDIO_MAX_BYTES`,
  ekstensi, `audioUrl` ke host `*.blob.vercel-storage.com`),
  `400`/`413`/`422`/`503`/`201`, `memoryQueue`/`memoryContacts` level-modul,
  `demoContact` terpisah. **Berkas ini berubah saat dokumen ini ditulis** —
  aturan `bytes()` dan `isOwnBlobUrl()` ditambahkan di tengah pekerjaan, jadi
  bacalah ulang file-nya sebelum menulis test.
- `app/api/demo-audio/route.ts` — token unggah Blob, batas 25 MB, jawaban 400 bila
  Blob belum siap.
- `app/api/revalidate/route.ts` — 6 tag (`articles`, `pillar-posts`, `interviews`,
  `siteSettings`, `videos`, `videos-page`), `timingSafeEqual`, 500/401.
- `lib/content-fallback.ts` — `readingTimeMinutes` (`WORDS_PER_MINUTE = 200`),
  `articleReadingTime`, `ARTICLES` (12 artikel, 6 `mediaType: "reel"`),
  `INTERVIEW_ROWS` (9 baris), `TICKER_ITEMS`, `SEED_DEMOS`.
- `lib/taxonomy.ts` — `ARTICLE_CATEGORY_VALUES` (4), `DEMO_GENRES` (6),
  `DEMO_PROGRAMS` (3), `DEMO_STATUSES` (4), `DEMO_INITIAL_STATUS`,
  `DEMO_APPROVED_STATUSES` (2), `DEMO_AUDIO_MAX_BYTES`, `DEMO_AUDIO_EXTENSIONS`.
- `lib/catalogue.ts` — `viewCount`, `topVideos`, `latestVideos`, `formatDuration`,
  `getVideo`, `VENUES`, `COUNTS`, `VIDEOS`, `SHORTS`, `PLAYLISTS`. `videosByVenue`,
  `videosByIds`, dan `thumbnailFor` **sudah dihapus**.
- `lib/articles.ts` — `latestStories(count = 8)` (foto dulu, lalu reel),
  `articleBySlug`, `staticArticleSlugs`, `ARTICLES_TAG`.
- `lib/pillars-shared.ts` / `lib/pillars.ts` — `PILLAR_LABELS`, `PHOTO_PILLARS` (4),
  `REEL_PILLARS` (4), `pillarDate`, `allPillarPosts`.
- `lib/site-settings.ts` — `cardCurtain` = `articleLabel` + `articleCta`;
  `curationNote` fallback `"kurasi redaksi"`.
- `components/ArticleCards.tsx` — `COVER_FRAME = "aspect-[4/5]"`, `ArticleCard`
  (satu `<Link>`, `titleFirst`, badge "Reel"), `FrontCard` (satu `<Link>`, sampul
  4:5 di kiri, "BACA SELENGKAPNYA ").
- `components/PillarCards.tsx` — `PillarCard` (satu `<a>`, 4:5 `object-cover`),
  `PillarHead`.
- `components/KurasiBrowser.tsx` — `PILLAR_LIMIT = 6`, `SEARCH_LIMIT = 48`, kotak
  cari, chip per pillar, blok BACA/TONTON.
- `components/YoutubeThumb.tsx` — `srcset` 320w/480w/1280w, fallback
  `maxresdefault → sddefault → hqdefault`, placeholder "poster tidak tersedia".
- `components/VideoRow.tsx`, `components/VideoModal.tsx`, `components/WatchLink.tsx`
  — `aria-label="Putar <judul>"`, `role="dialog"`, `aria-modal`, `Escape`,
  `href` YouTube asli sebagai fallback.
- Halaman: `app/(site)/page.tsx`, `stories/page.tsx`, `stories/[slug]/page.tsx`,
  `kurasi/page.tsx`, `videos/page.tsx`, `bicara-melodi/page.tsx` — jumlah kartu,
  grid, dan sumber datanya.
- `app/globals.css` — `@source not` (`../.codegraph`, `../.gitnexus`, `../.next`);
  `:focus-visible` global; 8 pasangan `:focus-within`; blok
  `@media (prefers-reduced-motion: reduce)`.
- `components/motion/Reveal.tsx`, `components/motion/RevealText.tsx`,
  `components/motion/MarqueeTape.tsx` — `reveal-section` mulai `opacity: 0`;
  `RevealText` memakai `initial={false}`; `MarqueeTape` mengukur lewat
  `ResizeObserver`.
- `next.config.ts` — `cacheComponents`, `partialPrefetching`, CSP, remote patterns
  `i.ytimg.com` + `cdn.sanity.io`, loader Turbopack untuk CSS.
- `.github/workflows/ci.yml` — ada: lint, `tsc --noEmit`, `npm test`, `npm run build`.
- `CHANGELOG.md` (entri `0.2.0`) — konfirmasi jumlah post kurasi per pilar
  (total 55), 9 sesi panggung, 5 playlist, 12 artikel (6 foto + 6 reel), dan
  daftar komponen yang dihapus.
- Vercel MCP (`list_projects`, `list_deployments`) — proyek `melodialam-website`,
  deployment `target: production` dengan `githubCommitRef: "main"`; deploy
  produksi berjalan otomatis dari `main`.

Tidak diverifikasi dari workspace: isi dataset Sanity secara langsung (angka 55
post kurasi, 6 foto + 6 reel, dan 9 sesi panggung diambil dari `CHANGELOG.md`
dan brief acuan), serta environment Vercel (nilai env tidak dibaca).

---

## Open Questions, Gaps, dan Known Risks

1. **`BR-003` dan teks persis `NFR-001`…`NFR-004`** tidak tersedia di
   workspace — `[PERLU VERIFIKASI]`.
2. **Empat release blocker "PRD §14.2"** tidak dapat diverifikasi; pemetaan
   `B1`…`B4` di §6.3 adalah `ASUMSI`. **Butuh teks PRD asli.**
3. **`R4` belum tuntas.** `RevealText` aman, tetapi `components/motion/Reveal.tsx`
   merender `reveal-section` yang mulai `opacity: 0`. Tanpa JS, isi section
   (termasuk grid `/stories`) tidak terlihat. Perlu keputusan: apakah ini
   diterima, atau `reveal-section` diubah agar degrade ke state terlihat.
4. **`R7` masih terbuka.** `memoryQueue` adalah array level-modul; test
   integration wajib `vi.resetModules()` dan wajib berjalan tanpa
   `SANITY_API_READ_TOKEN`.
5. **Component-level (jsdom/RTL) masih `ASUMSI`** — putuskan apakah layak
   (`KurasiBrowser` dan `DemoPortal` adalah kandidat utama), atau lipat
   seluruhnya ke E2E demi piramida kecil.
6. **Ambang performa** bersifat gejala/`ASUMSI`, bukan angka PRD. Konfirmasi
   apakah `NFR-001` menetapkan target ms konkret.
7. **CI belum ada.** Preview Vercel bukan gate test. Urutan memasang
   Playwright lalu menulis workflow GitHub Actions perlu diputuskan: repo
   tidak punya `.github/` sama sekali, dan browser Playwright belum pernah
   diunduh di mesin ini.
8. **Dokumen lain masih menyebut kondisi lama.** `docs/DEPLOYMENT.md` dan
   `docs/ARCHITECTURE.md` masih menulis "belum ada yang ter-deploy" dan
 $1belum ada CI", padahal deploy produksi berjalan otomatis dari `main` —
kini CI GitHub Actions sudah ada (22 Okt 2026).
   `[PERLU VERIFIKASI]` apakah dokumen itu memang disengaja atau tertinggal.
