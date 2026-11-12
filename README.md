# Melodi Alam

[![CI](https://github.com/albiruby/melodialam-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/albiruby/melodialam-website/actions/workflows/ci.yml)
[![Production](https://img.shields.io/badge/production-live-2ea44f?logo=vercel&logoColor=white)](https://melodialam-website.vercel.app)
[![Node](https://img.shields.io/badge/node-24.22.1-339933?logo=node.js&logoColor=white)](.nvmrc)
[![License](https://img.shields.io/badge/license-all%20rights%20reserved-lightgrey)](#hak-cipta)

Platform web media musik Indonesia — **Stories & Watch**.

Situs ini menyatukan jurnalisme musik (*Stories* / Discover), katalog video
YouTube `@melodialam` (*Melodi Samsara*), wawancara *Bicara Melodi*, dan jalur
pengiriman demo musisi (*Submit Karya*).

Bagian dari ekosistem *Intellectual Property* PT Infia Pariwara Nusantara
(INFIA Corp).

---

## Menjalankan

Prasyarat: **Node.js 24.22.1** — versinya dicatat di `.nvmrc` dan di
`package.json` (`engines.node: ">=24.22.1 <25"`).

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
publik) dan `lib/content-fallback.ts` dipakai sebagai jaring pengaman bila Sanity tak
terjangkau. Hanya antrean demo dan pratinjau draf yang butuh kredensial.

```bash
cp .env.example .env      # isi SANITY_API_READ_TOKEN, SANITY_REVALIDATE_SECRET,
                          # dan SANITY_PREVIEW_SECRET
```

| Variabel | Wajib untuk | Catatan |
|---|---|---|
| `SANITY_API_READ_TOKEN` | antrean demo + pratinjau draf | **server-only**; baca dataset privat `submissions` + tulis antrean |
| `SANITY_REVALIDATE_SECRET` | webhook revalidasi | dibagi dengan webhook Sanity; **sudah dirotasi 22 Okt 2026** — `SANITY_REVALIDATE_SECRET_PREVIOUS` hanya jembatan sementara |
| `SANITY_PREVIEW_SECRET` | pratinjau draf | wajib untuk membuka tautan pratinjau; tanpa nilai ini rute menjawab **404** (fallback ke secret revalidasi sudah dihapus) |
| `BLOB_READ_WRITE_TOKEN` | unggah audio demo | opsional; Vercel memasangnya saat Blob store dibuat |
| `BLOB_STORE_ID` | verifikasi audio demo | wajib bila unggah audio diaktifkan; tanpa ini pemeriksaan host gagal tertutup |
| `KV_REST_API_URL` · `KV_REST_API_TOKEN` | pembatas laju lintas instans | opsional; pasangan Upstash dengan bentuk REST yang sama juga diterima |
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
| Next.js (App Router, Turbopack, Cache Components) | `^16.4.3` |
| React | `^19.3.1` |
| TypeScript | `^5` |
| Tailwind CSS | `^4` |
| Motion (penerus Framer Motion) | `^14.6.0` |
| Sanity (`@sanity/client`) | `^8.11.0` |
| Portable Text (`@portabletext/react`) | `^8.0.1` |
| Vercel Blob (`@vercel/blob`) | `^2.8.2` |
| Vercel Analytics (`@vercel/analytics`) | `^2.0.1` |
| Vitest | `^5.0.5` |
| Playwright | `^1.64.1` |

Jumlah halaman statis berubah setiap kali rute ditambah atau dihapus; keluaran
`npm run build` adalah sumber kebenarannya, bukan angka yang ditulis di sini.

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
| `npm test` | Unit test Vitest — 9 berkas, 53 kasus |
| `npm run test:e2e` | Uji browser Playwright — 3 spec (`e2e/`) |
| `npm run smoke` | Smoke test terhadap situs yang sedang berjalan |
| `npm run catalogue` | Menghasilkan ulang `lib/catalogue.json` dari hasil scrape |
| `npm run brand` | Menghasilkan ulang aset merek dan ikon `app/` |
| `npm run photos` | Menyalin set foto placeholder ke `public/photos` |
| `npm run seed:sanity` | Menulis ulang konten statis ke Sanity |
| `npm run seed:videos` | Menulis 9 sesi Melodi Samsara ke Sanity |
| `npm run backup` | Mengekspor dataset Sanity ke `backups/` |
| `npm run purge-demos` | Membersihkan antrean demo dari data uji |

> Hentikan dev server sebelum menjalankan `npm run build`; keduanya memakai state
> Turbopack yang sama dan menjalankannya bersamaan membuat halaman tampil kosong.

---

## Halaman

| Route | Isi |
|---|---|
| `/` | Beranda news-first: **Top News** (1 lead + 3 sidebar + 3 More Top News) + **Originals** + **Discover** + **Submit** |
| `/stories` | Halaman **Stories** — grid 4 kolom, 8 kartu; tanpa filter/pencarian |
| `/stories/<slug>` | Satu artikel + blok "More {rubrik}" (3 kartu) + kartu sosial 1200×630 |
| `/bicara-melodi` | Indeks wawancara Season 3 (9 episode) |
| `/videos` | **Melodi Samsara** — 9 sesi + 5 playlist |
| `/discover` | **Discover** — grid 5 kolom urut tanggal, 55 post feed |
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
                sanity-preview.ts, sanity-project.ts, taxonomy.ts, content-fallback.ts,
                catalogue.ts, site.ts, pillars.ts, videos.ts, interviews.ts
                → peta lengkapnya di lib/README.md
scripts/        Generator untuk katalog, aset merek, dan foto; seed ke Sanity
public/         Aset statis; brand/ dan photos/ adalah artefak generated
docs/           Dokumentasi pengembangan (mulai dari docs/README.md)
```

`lib/articles.ts` adalah lapisan data artikel: ia membaca **Sanity** dan jatuh ke
`lib/content-fallback.ts` kalau Sanity tidak dapat dijangkau. Karena itu artikel yang ditulis di
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
| `npm run brand` | `public/brand/*`, `public/og.png`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | `../LOGO2/` — 3 PNG sumber |
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
| [`docs/audit-2026-10-21.md`](docs/audit-2026-10-21.md) | Audit keamanan + codebase + integrasi Sanity/Vercel + SEO |
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

## Status produksi (12 November 2026)

| Area | Status |
|---|---|
| UI *Neo-Brutalist Editorial*, animasi, interaksi hover | Berjalan |
| Artikel, pillar, video, playlist, wawancara | Sanity (dataset `production`, publik) + fallback `lib/content-fallback.ts` |
| Antrean demo | Sanity dataset **privat** `submissions`, dimoderasi; fallback array proses-lokal tanpa token |
| Pratinjau draf | Ada (`/preview/<type>/<slug>`); butuh `SANITY_PREVIEW_SECRET`. Tombol "Buka pratinjau" di Studio belum ada |
| Unggah audio demo | Kodenya ada, **belum hidup** — Blob store belum dibuat di Vercel |
| Notifikasi email | Kodenya ada, **inert** — `RESEND_API_KEY` belum diset |
| Web Analytics | `@vercel/analytics` terpasang, **belum dinyalakan** di dashboard Vercel |
| Domain | `melodialam.id` terdaftar dan terverifikasi di Vercel, tetapi **DNS global masih `NXDOMAIN`** → canonical, sitemap, OG, dan `robots.host` masih menunjuk ke `https://melodialam-website.vercel.app` |
| CI/CD | GitHub Actions `CI`: lint, typecheck, unit test, build, smoke, dan 3 spec Playwright pada setiap push/PR ke `main` |
| Uji otomatis | Vitest — 9 berkas, 53 kasus; Playwright — 3 spec |
| Keamanan | `main` dilindungi status check CI; private vulnerability reporting aktif (lihat [`SECURITY.md`](SECURITY.md)) |

Status tindak lanjut temuan audit F01–F10 — beberapa sudah ditutup, sebagian masih
terbuka — ada di [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md); catatan
awalnya di [`docs/audit-2026-10-21.md`](docs/audit-2026-10-21.md).

Kontribusi: baca [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) dan
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) lebih dulu.

---

## Catatan Verifikasi

Isi README ini dicek terhadap repo `melodi-alam` pada **12 November 2026**:

- **Rute** — dibaca dari `app/` (halaman di `app/(site)/`, route handler di `app/api/`)
  dan diverifikasi terhadap tabel route hasil `npm run build`.
- **Perintah** — dibaca dari `package.json` (`dev`, `build`, `start`, `lint`, `test`,
  `test:e2e`, `catalogue`, `brand`, `photos`, `seed:sanity`, `seed:videos`,
  `backup`, `purge-demos`, `smoke`).
- **Variabel lingkungan** — dibaca dari kode (`lib/site.ts`, `lib/sanity-server.ts`,
  `lib/sanity-preview.ts`, `app/api/revalidate/route.ts`, `app/api/demos/route.ts`)
  dan dari `.env.example`.
- **Teknologi & versi** — dari `package.json` (`0.2.1`).
- **Unit test** — `npm test` → **9 berkas, 53 kasus** (Vitest 5).
- **E2E** — 3 spec Playwright di `e2e/`, dijalankan CI setelah build.
- **Jumlah halaman statis** — sengaja tidak dicantumkan; angka itu berubah tiap
  rute ditambah, dan `npm run build` adalah sumber kebenarannya.
- **Tidak diverifikasi** — isi dashboard Vercel dan Sanity: status Blob store, Resend,
  anggota project, "Trigger on" webhook, dan propagasi DNS `melodialam.id`. Klaim
  soal domain memakai hasil resolusi DNS publik per 12 November 2026, bukan asumsi
  dari dashboard Vercel.

---

## Keamanan

Jangan membuka issue publik untuk kerentanan. Gunakan
[GitHub Private Vulnerability Reporting](https://github.com/albiruby/melodialam-website/security/advisories/new);
detail cakupan dan ekspektasi respons ada di [`SECURITY.md`](SECURITY.md).

## Hak cipta

© 2026 PT Infia Pariwara Nusantara (INFIA Corp). **Semua hak dilindungi.**

Repositori ini publik untuk transparansi, bukan untuk distribusi ulang. Tidak ada
lisensi open source yang diberikan: tanpa izin tertulis dari pemilik, kode tidak
boleh disalin, dimodifikasi, atau dipakai ulang. Aset merek, foto, dan tulisan
tetap milik pemiliknya masing-masing.
