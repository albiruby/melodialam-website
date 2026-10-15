# Melodi Alam

Platform web media musik Indonesia — **Stories, Spaces & Instruments**.

Situs ini menyatukan jurnalisme musik (*Stories*), katalog video YouTube
`@melodialam` (*Watch*), dan jalur pengiriman demo musisi (*Submit Demo*).

Bagian dari ekosistem *Intellectual Property* PT Infia Pariwara Nusantara (INFIA Corp).

> Halaman `/pahlawan-kota` dan `/spaces` sudah dihapus atas permintaan; keduanya kini
> mengembalikan 404. Data pendukungnya (`GENRE_ROWS`, `SPACE_ITEMS`) masih ada di
> `lib/content.ts` beserta catatan alasannya.

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

Situs **berjalan penuh tanpa `.env`**: artikel dibaca dari `lib/content.ts` dan antrean
demo memakai array proses-lokal. Untuk mengaktifkan CMS, salin contohnya dan isi dua
nilai wajib:

```bash
cp .env.example .env      # isi PAYLOAD_SECRET dan DATABASE_URL
npm run db:migrate        # buat tabel di Postgres
```

| Variabel | Wajib untuk | Catatan |
|---|---|---|
| `PAYLOAD_SECRET` | `/admin`, API | string acak panjang |
| `DATABASE_URL` | `/admin`, antrean demo persisten | connection string Supabase (pooler) |
| `NEXT_PUBLIC_SITE_URL` | canonical, sitemap, JSON-LD | default `http://localhost:3100` |
| `PAYLOAD_CACHE_COMPONENTS_ENABLED` | panel admin | `true` saat `cacheComponents` aktif |
| `S3_*` (5 buah) | unggahan ke Supabase Storage | opsional; tanpa ini berkas jatuh ke disk lokal |

Tanpa `DATABASE_URL`, `lib/payload.ts` mengembalikan `null` dan situs memakai fallback
statis. Itu perilaku yang disengaja, bukan kegagalan.

---

## Teknologi

| Komponen | Versi |
|---|---|
| Next.js (App Router, Turbopack) | `16.4.0` |
| React | `19.3.0` |
| TypeScript | `^5` |
| Tailwind CSS | `^4` |
| Motion (penerus Framer Motion) | `^14.2.0` |
| Payload CMS | `^3.90.2` |
| Postgres (Supabase) | `17` |

Build produksi menghasilkan **27 halaman statis**.

---

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server di port 3100 |
| `npm run build` | Build produksi |
| `npm run start` | Menyajikan build produksi di port 3100 |
| `npm run lint` | ESLint |
| `npm run catalogue` | Menghasilkan ulang `lib/catalogue.json` dari hasil scrape |
| `npm run brand` | Menghasilkan ulang aset merek dan ikon `app/` |
| `npm run photos` | Menyalin set foto placeholder ke `public/photos` |
| `npm run generate:types` | Menulis `payload-types.ts` dari koleksi |
| `npm run generate:importmap` | Menyegarkan `app/(payload)/admin/importMap.js` |
| `npm run db:migrate` | Menjalankan migrasi Postgres |
| `npm run db:migrate:create` | Membuat berkas migrasi baru |

> Hentikan dev server sebelum menjalankan `npm run build`; keduanya memakai state
> Turbopack yang sama dan menjalankannya bersamaan membuat halaman tampil kosong.

> Skrip `payload *` memakai `--disable-transpile` karena loader `tsx` crash di Node 24.
> Pakai skrip npm-nya, jangan `npx payload` langsung.

---

## Halaman

| Route | Isi |
|---|---|
| `/` | Beranda: artikel utama, teaser tiap seksi |
| `/journal` | Seluruh artikel, filter kategori, pencarian |
| `/journal/[slug]` | Satu artikel — 12 statis dari repo, sisanya dari CMS |
| `/bicara-melodi` | Indeks wawancara |
| `/videos` | Katalog penuh 292 video, filter, pencarian, paginasi |
| `/submit` | Formulir demo dan antrean kiriman |
| `/admin` | Panel Payload CMS (butuh `DATABASE_URL`) |
| `/api/demos` | Route handler `GET` dan `POST` untuk antrean demo |
| `/api/articles` | API koleksi artikel milik Payload |

---

## Struktur

```
app/            Route, layout, dan route handler; app/(site) dan app/(payload)
components/     Komponen UI; components/motion/ untuk primitif gerak
collections/    Definisi koleksi Payload CMS
migrations/     Migrasi Postgres (generated)
lib/            Lapisan data: articles.ts, content.ts, payload.ts, catalogue.ts, site.ts
scripts/        Generator untuk katalog, aset merek, dan foto
public/         Aset statis; brand/ dan photos/ adalah artefak generated
docs/           Dokumentasi pengembangan
```

`lib/articles.ts` adalah lapisan data artikel: ia membaca **Payload saat basis data
terjangkau** dan jatuh ke `lib/content.ts` saat tidak. Karena itu artikel yang ditulis di
`/admin` langsung render di situs tanpa ubah kode, sementara checkout bersih tetap
berfungsi. `lib/catalogue.json` adalah artefak **generated** dan tidak boleh disunting
tangan.

Alur lengkapnya — termasuk cara menambah koleksi baru dan jebakan yang sudah ditemukan —
ada di [`docs/PAYLOAD-INTEGRATION.md`](docs/PAYLOAD-INTEGRATION.md).

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
| [`docs/PAYLOAD-INTEGRATION.md`](docs/PAYLOAD-INTEGRATION.md) | **Integrasi web ↔ CMS: tulis di `/admin`, render di halaman mana** |
| [`docs/PRD-REFERENCE.md`](docs/PRD-REFERENCE.md) | Ketertelusuran requirement PRD → status implementasi |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Batas modul, alur data, arsitektur target |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | Entitas, skema Postgres target, RLS, migrasi |
| [`docs/API-CONTRACTS.md`](docs/API-CONTRACTS.md) | Endpoint, payload, model error |
| [`docs/FRONTEND-PLAN.md`](docs/FRONTEND-PLAN.md) | Route, komponen, batas server/client, gap a11y |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Token, utility, aturan interaksi yang dikunci |
| [`docs/TEST-STRATEGY.md`](docs/TEST-STRATEGY.md) | Prioritas uji berbasis risiko, gerbang CI |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build, lingkungan, pipeline, rollback |
| [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md) | Temuan keamanan, penanganan PII, kontrol abuse |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Alur kerja dan konvensi kode |
| [`docs/adr/`](docs/adr/) | Tujuh catatan keputusan arsitektur |

---

## Status

Antarmuka berjalan penuh, dan backend CMS-nya sudah hidup: artikel yang ditulis di
`/admin` render di situs tanpa ubah kode.

| Area | Status |
|---|---|
| UI *Neo-Brutalist Editorial*, animasi, interaksi hover | Berjalan |
| Artikel | Payload + Supabase, fallback ke `lib/content.ts` — [`docs/PAYLOAD-INTEGRATION.md`](docs/PAYLOAD-INTEGRATION.md) |
| Katalog video | Dari repo (statis, artefak build-time — [`ADR-0004`](docs/adr/0004-katalog-video-build-time.md)) |
| Antrean demo | Payload + Supabase, moderasi; fallback array proses-lokal tanpa basis data |
| CMS, basis data, autentikasi kurator | Berjalan — [`ADR-0002`](docs/adr/0002-payload-supabase.md), [`ADR-0003`](docs/adr/0003-supabase-postgres-storage.md) |
| Uji otomatis | Belum ada — [`ADR-0006`](docs/adr/0006-vitest-playwright-vercel.md) |
| Notifikasi email | Belum ada — Payload menulis email ke console |
| Analytics | Belum ada |

Kontribusi: baca [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) lebih dulu.
