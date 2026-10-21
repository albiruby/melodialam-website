# Melodi Alam

Platform web media musik Indonesia — **Stories & Watch**.

Situs ini menyatukan jurnalisme musik (*Stories* / Curated News), katalog video
YouTube `@melodialam` (*Melodi Samsara*), wawancara *Bicara Melodi*, dan jalur
pengiriman demo musisi (*Submit Karya*).

Bagian dari ekosistem *Intellectual Property* PT Infia Pariwara Nusantara
(INFIA Corp).

> Direktori `/pahlawan-kota` dan `/spaces` sudah dihapus; `pahlawanRow` disimpan
> sebagai arsip di Sanity, `GENRE_ROWS`/`SPACE_ITEMS` diarsipkan di
> `lib/content.ts`. Halaman `/videos/arsip` (katalog 292 video) juga dihapus —
> `/videos` kini hanya merender seleksi sesi yang hidup sebagai dokumen `video`.

---

## Menjalankan

Prasyarat: **Node.js >= 20**.

```bash
npm install
npm run dev
```

Buka **http://localhost:3100**.

Di Windows, `dev.cmd` mengerjakan hal yang sama plus beberapa pemeriksaan lebih dulu
(Node ada di PATH, `node_modules` sudah terpasang, port 3100 tidak dipegang server
lama). Klik dua kali berkasnya, atau jalankan dari terminal:

```bat
dev.cmd            :: nyalakan server, lalu buka browser begitu server menjawab
dev.cmd noopen     :: nyalakan tanpa membuka browser
```

Skrip itu hanya menghentikan proses yang benar-benar memegang port 3100 — tidak pernah
semua `node.exe`, karena itu juga akan mematikan server MCP lokal.

Port 3000 sengaja dihindari; seluruh skrip npm sudah dipatok ke 3100. Untuk port lain:

```bash
npm run dev -- -p 4321
```

### Variabel lingkungan

Situs **berjalan penuh tanpa `.env`**: artikel dibaca dari Sanity (dataset `production`
publik) dan `lib/content.ts` dipakai sebagai jaring pengaman bila Sanity tak
terjangkau. Hanya antrean demo dan pratinjau draf yang butuh kredensial.

```bash
cp .env.example .env      # isi SANITY_API_READ_TOKEN dan SANITY_REVALIDATE_SECRET
```

| Variabel | Wajib untuk | Catatan |
|---|---|---|
| `SANITY_API_READ_TOKEN` | antrean demo + pratinjau draf | **server-only**; baca dataset privat `submissions` + tulis antrean |
| `SANITY_REVALIDATE_SECRET` | webhook revalidasi | dibagi dengan webhook Sanity; **belum dirotasi** (lihat `docs/SECURITY-PRIVACY.md`) |
| `SANITY_PREVIEW_SECRET` | pratinjau draf | opsional; kalau kosong, pratinjau jatuh ke `SANITY_REVALIDATE_SECRET` |
| `BLOB_READ_WRITE_TOKEN` | unggah audio demo | opsional; Vercel memasangnya saat Blob store dibuat |
| `RESEND_API_KEY` | notifikasi email redaksi | opsional; tanpa ini notifikasi **inert** |
| `DEMO_NOTIFY_TO` · `DEMO_NOTIFY_FROM` | tujuan & pengirim email | opsional; ada default di `app/api/demos/route.ts` |
| `NEXT_PUBLIC_SITE_URL` | canonical, sitemap, JSON-LD, robots | default `https://melodialam.id` |

Project id dan nama dataset **bukan** variabel lingkungan — keduanya literal di
`lib/sanity-project.ts`, karena `sanity.config.ts` dibangun dua bundler berbeda yang
m mengekspos env var dengan cara berbeda. Lihat berkas itu untuk penjelasannya.

Membaca artikel **tidak butuh kredensial sama sekali**: dataset `production` publik dan
project id-nya ada di kode. Tanpa `.env` situs tetap jalan penuh; hanya antrean demo
yang jatuh ke memori, karena `lib/sanity-server.ts` mengembalikan `null` tanpa token.

> **Penting:** `SANITY_API_READ_TOKEN` memberi akses ke nomor kontak musisi. Ia hanya
> boleh diimpor dari kode server. Lihat `docs/SANITY-INTEGRATION.md` §9.

---

## Teknologi

| Komponen | Versi |
|---|---|
| Next.js (App Router, Turbopack, Cache Components) | `16.4.0` |
| React | `19.3.0` |
| TypeScript | `^5` |
| Tailwind CSS | `^4` |
| Motion (penerus Framer Motion) | `^14.2.0` |
| Sanity (`@sanity/client`) | `^8.9.0` |
| Portable Text (`@portabletext/react`) | `^8.0.1` |
| Vercel Blob (`@vercel/blob`) | `^2.8.2` |
| Vercel Analytics (`@vercel/analytics`) | `^2.0.1` |
| Vitest | `^3.2.7` |

Build produksi menghasilkan **33 halaman statis**.

> Studio Sanity-nya **tidak** ada di repo ini. Ia berdiri sendiri di
> [`albiruby/melodialam-sanity`](https://github.com/albiruby/melodialam-sanity) dan
> di-host di **https://melodi-alam.sanity.studio**.

---

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server di port 3100 |
| `npm run build` | Build produksi |
| `npm run start` | Menyajikan build produksi di port 3100 |
| `npm run lint` | ESLint |
| `npm test` | Unit test (Vitest) — `lib/content.test.ts`, 9 kasus |
| `npm run catalogue` | Menghasilkan ulang `lib/catalogue.json` dari hasil scrape |
| `npm run brand` | Menghasilkan ulang aset merek dan ikon `app/` |
| `npm run photos` | Menyalin set foto placeholder ke `public/photos` |
| `npm run seed:sanity` | Menulis ulang konten statis ke Sanity |
| `npm run seed:videos` | Menulis 9 sesi Melodi Samsara ke Sanity |

> Hentikan dev server sebelum menjalankan `npm run build`; keduanya memakai state
> Turbopack yang sama dan menjalankannya bersamaan membuat halaman tampil kosong.

---

## Halaman

| Route | Isi |
|---|---|
| `/` | Beranda: blok **Latest News** (grid 2×2, 4 kartu) + strip **Curated News** (4 kartu) |
| `/stories` | Halaman **Stories** — grid 4 kolom, 8 kartu; tanpa filter/pencarian |
| `/stories/<slug>` | Satu artikel + blok "More {rubrik}" (3 kartu) + kartu sosial 1200×630 |
| `/bicara-melodi` | Indeks wawancara Season 3 (9 episode) |
| `/videos` | **Melodi Samsara** — 9 sesi + 5 playlist |
| `/kurasi` | **Curated News** — 55 post kurasi, dikelompokkan per pillar |
| `/tentang` | Profil, ekosistem, kontak & partnership (statis) |
| `/submit` | Formulir demo musisi (9 bagian) |
| `/preview/<type>/<slug>?secret=…` | Pratinjau draf (`journal` / `kurasi`), `noindex`, 404 bila secret salah |
| `/journal` · `/journal/<slug>` | Redirect **308** → `/stories` · `/stories/<slug>` |
| `/api/demos` | `GET` + `POST` antrean demo (dataset privat Sanity) |
| `/api/demo-audio` | `POST` — menerbitkan token unggah audio ke Vercel Blob |
| `/api/revalidate` | `POST` — webhook Sanity, membuang 6 tag cache |
| `/rss.xml` · `/sitemap.xml` · `/robots.txt` | Feed, peta situs, aturan crawler |

---

## Struktur

```
app/            Route, layout, dan route handler; app/(site)
components/     Komponen UI; components/motion/ untuk primitif gerak
lib/            Lapisan data: articles.ts, sanity.ts, sanity-server.ts,
                sanity-preview.ts, sanity-project.ts, taxonomy.ts, content.ts,
                catalogue.ts, site.ts, pillars.ts, videos.ts, interviews.ts
scripts/        Generator untuk katalog, aset merek, dan foto; seed ke Sanity
public/         Aset statis; brand/ dan photos/ adalah artefak generated
docs/           Dokumentasi pengembangan (mulai dari docs/README.md)
```

`lib/articles.ts` adalah lapisan data artikel: ia membaca **Sanity** dan jatuh ke
`lib/content.ts` kalau Sanity tidak dapat dijangkau. Karena itu artikel yang ditulis di
Studio langsung render di situs tanpa ubah kode. `lib/catalogue.json` adalah artefak
**generated** dan tidak boleh disunting tangan.

Semua daftar cerita di situs berasal dari **satu** fungsi, `latestStories(8)` di
`lib/articles.ts` — beranda, `/stories`, sitemap, RSS, dan blok "More" memakai daftar
yang sama, sehingga angkanya tidak bisa berbeda antar halaman.

Alur lengkapnya — termasuk cara mengubah skema dan jebakan yang sudah ditemukan — ada
di [`docs/SANITY-INTEGRATION.md`](docs/SANITY-INTEGRATION.md).

---

## Aset yang dihasilkan

Tiga skrip menghasilkan berkas. Jangan menyunting hasilnya langsung — perubahan akan
hilang pada regenerasi berikutnya.

| Perintah | Menghasilkan | Membaca |
|---|---|---|
| `npm run catalogue` | `lib/catalogue.json` | `../melodi-alam-data.md` |
| `npm run brand` | `public/brand/*`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | `../logobulet.png`, `../logotext.png` |
| `npm run photos` | `public/photos/*` | `../FOTO PLACEHOLDER MELODI ALAM/` |

Hasilnya sudah ikut ter-commit, jadi situs tetap dapat dibangun tanpa berkas sumber itu.
Namun **regenerasi tidak akan bekerja** tanpa ketiganya. Rinciannya di
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Dokumentasi

Mulai dari [`docs/README.md`](docs/README.md).

| Dokumen | Isi |
|---|---|
| [`docs/SANITY-INTEGRATION.md`](docs/SANITY-INTEGRATION.md) | **Integrasi web ↔ CMS: tulis di Studio, render di halaman mana** |
| [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md) | Temuan keamanan, PII, kontrol anti-penyalahgunaan |
| [`docs/AUDIT-2026-10-21.md`](docs/AUDIT-2026-10-21.md) | Audit keamanan + codebase + integrasi Sanity/Vercel + SEO |
| [`docs/PRD-REFERENCE.md`](docs/PRD-REFERENCE.md) | Ketertelusuran requirement PRD → status implementasi |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Batas modul, alur data, arsitektur target |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | Entitas, skema data, migrasi |
| [`docs/API-CONTRACTS.md`](docs/API-CONTRACTS.md) | Endpoint, payload, model error |
| [`docs/FRONTEND-PLAN.md`](docs/FRONTEND-PLAN.md) | Route, komponen, batas server/client, gap a11y |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Token, utility, aturan interaksi yang dikunci |
| [`docs/TEST-STRATEGY.md`](docs/TEST-STRATEGY.md) | Prioritas uji berbasis risiko, gerbang CI |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build, lingkungan, pipeline, rollback |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Alur kerja dan konvensi kode |
| [`docs/adr/`](docs/adr/) | Delapan catatan keputusan arsitektur |

Riwayat perubahan: [`CHANGELOG.md`](CHANGELOG.md).

---

## Status produksi (21 Oktober 2026)

| Area | Status |
|---|---|
| UI *Neo-Brutalist Editorial*, animasi, interaksi hover | Berjalan |
| Artikel, pillar, video, playlist, wawancara | Sanity (dataset `production`, publik) + fallback `lib/content.ts` |
| Antrean demo | Sanity dataset **privat** `submissions`, dimoderasi; fallback array proses-lokal tanpa token |
| Pratinjau draf | Ada (`/preview/<type>/<slug>`), belum ada tombol "Buka pratinjau" di dalam Studio |
| Unggah audio demo | Kodenya ada, **belum hidup** — Blob store belum dibuat di Vercel |
| Notifikasi email | Kodenya ada, **inert** — `RESEND_API_KEY` belum diset |
| Web Analytics | `@vercel/analytics` terpasang, **belum dinyalakan** di dashboard Vercel |
| Domain | `melodialam.id` **belum resolve** → canonical, sitemap, OG, dan `robots.host` masih menunjuk ke `https://melodialam-website.vercel.app` |
| CI/CD | **Belum ada** — repo tidak punya `.github/`, tidak ada workflow yang menjalankan build atau test |
| Uji otomatis | Unit test Vitest saja (`npm test`, 9 kasus); belum ada uji end-to-end |

Temuan audit yang masih terbuka (F01–F10, semuanya `needs_validation`) ada di
[`docs/AUDIT-2026-10-21.md`](docs/AUDIT-2026-10-21.md) dan
[`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md).

Kontribusi: baca [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) lebih dulu.

---

## Catatan Verifikasi

Isi README ini dicek terhadap repo `melodi-alam` pada **21 Oktober 2026**:

- **Rute** — dibaca dari `app/` (halaman di `app/(site)/`, route handler di `app/api/`)
  dan diverifikasi terhadap tabel route hasil `npm run build`.
- **Perintah** — dibaca dari `package.json` (`dev`, `build`, `start`, `lint`, `test`,
  `catalogue`, `brand`, `photos`, `seed:sanity`, `seed:videos`).
- **Variabel lingkungan** — dibaca dari kode (`lib/site.ts`, `lib/sanity-server.ts`,
  `lib/sanity-preview.ts`, `app/api/revalidate/route.ts`, `app/api/demos/route.ts`)
  dan dari `.env.example`.
- **Teknologi & versi** — dari `package.json` (`0.2.0`).
- **Jumlah halaman statis** — `npm run build` → **33 halaman statis**.
- **Unit test** — `npm test` → **9/9 lulus** (`lib/content.test.ts`, Vitest 3.2.7).
- **Tidak diverifikasi** — isi dashboard Vercel dan Sanity: status Blob store, Resend,
  anggota project, "Trigger on" webhook, dan apakah `melodialam.id` sudah diarahkan.
  Klaim soal domain memakai nilai `NEXT_PUBLIC_SITE_URL` di Vercel
  (`https://melodialam-website.vercel.app`), bukan default `https://melodialam.id`
  di `lib/site.ts:18`.
