# Melodi Alam

Platform web media musik Indonesia — **Stories & Watch**.

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
cp .env.example .env      # isi NEXT_PUBLIC_SANITY_PROJECT_ID dan SANITY_API_READ_TOKEN
```

| Variabel | Wajib untuk | Catatan |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Studio, artikel dari CMS | `03sgar5q` |
| `NEXT_PUBLIC_SANITY_DATASET` | Studio, artikel dari CMS | `production` (publik) |
| `NEXT_PUBLIC_SANITY_SUBMISSIONS_DATASET` | antrean demo | `submissions` (**privat**) |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | Studio | `http://localhost:3100/studio` |
| `SANITY_API_READ_TOKEN` | antrean demo | **server-only**; baca dataset privat + tulis antrean |
| `SANITY_REVALIDATE_SECRET` | webhook revalidasi | dibagi dengan webhook Sanity |
| `NEXT_PUBLIC_SITE_URL` | canonical, sitemap, JSON-LD | default `http://localhost:3100` |

Tanpa env Sanity, `lib/articles.ts` jatuh ke `lib/content.ts` dan
`lib/sanity-server.ts` mengembalikan `null` sehingga antrean demo memakai memori. Itu
perilaku yang disengaja, bukan kegagalan.

> **Penting:** `SANITY_API_READ_TOKEN` memberi akses ke nomor kontak musisi. Ia hanya
> boleh diimpor dari kode server. Lihat `docs/SANITY-INTEGRATION.md` §8.

---

## Teknologi

| Komponen | Versi |
|---|---|
| Next.js (App Router, Turbopack) | `16.4.0` |
| React | `19.3.0` |
| TypeScript | `^5` |
| Tailwind CSS | `^4` |
| Motion (penerus Framer Motion) | `^14.2.0` |
| Sanity Studio | `^6.19.0` |
| next-sanity | `^13.3.4` |

Build produksi menghasilkan **28 halaman statis**.

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
| `npm run sanity` | Sanity CLI (`npm run sanity -- dataset list`, dst.) |
| `npm run sanity:deploy` | Deploy Studio ke hosting Sanity (opsional) |

> Hentikan dev server sebelum menjalankan `npm run build`; keduanya memakai state
> Turbopack yang sama dan menjalankannya bersamaan membuat halaman tampil kosong.

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
| `/studio` | Sanity Studio (dua workspace: Konten, Antrean Demo). Versi hosted: **[melodi-alam.sanity.studio](https://melodi-alam.sanity.studio)** |
| `/api/demos` | Route handler `GET` dan `POST` untuk antrean demo |
| `/api/revalidate` | Webhook Sanity → buang cache artikel |

---

## Struktur

```
app/            Route, layout, dan route handler; app/(site) dan app/studio
components/     Komponen UI; components/motion/ untuk primitif gerak
sanity/         Skema Sanity Studio
lib/            Lapisan data: articles.ts, sanity.ts, sanity-server.ts, taxonomy.ts,
                content.ts, catalogue.ts, site.ts
scripts/        Generator untuk katalog, aset merek, dan foto
public/         Aset statis; brand/ dan photos/ adalah artefak generated
docs/           Dokumentasi pengembangan
```

`lib/articles.ts` adalah lapisan data artikel: ia membaca **Sanity saat terkonfigurasi**
dan jatuh ke `lib/content.ts` saat tidak. Karena itu artikel yang ditulis di `/studio`
langsung render di situs tanpa ubah kode, sementara checkout bersih tetap berfungsi.
`lib/catalogue.json` adalah artefak **generated** dan tidak boleh disunting tangan.

Alur lengkapnya — termasuk cara menambah tipe konten dan jebakan yang sudah ditemukan —
ada di [`docs/SANITY-INTEGRATION.md`](docs/SANITY-INTEGRATION.md).

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
| [`docs/PRD-REFERENCE.md`](docs/PRD-REFERENCE.md) | Ketertelusuran requirement PRD → status implementasi |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Batas modul, alur data, arsitektur target |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | Entitas, skema data, migrasi |
| [`docs/API-CONTRACTS.md`](docs/API-CONTRACTS.md) | Endpoint, payload, model error |
| [`docs/FRONTEND-PLAN.md`](docs/FRONTEND-PLAN.md) | Route, komponen, batas server/client, gap a11y |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Token, utility, aturan interaksi yang dikunci |
| [`docs/TEST-STRATEGY.md`](docs/TEST-STRATEGY.md) | Prioritas uji berbasis risiko, gerbang CI |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build, lingkungan, pipeline, rollback |
| [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md) | Temuan keamanan, penanganan PII, kontrol abuse |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Alur kerja dan konvensi kode |
| [`docs/adr/`](docs/adr/) | Delapan catatan keputusan arsitektur |

---

## Status

Antarmuka berjalan penuh, dan CMS-nya hidup: artikel yang ditulis di `/studio` render di
situs tanpa ubah kode.

| Area | Status |
|---|---|
| UI *Neo-Brutalist Editorial*, animasi, interaksi hover | Berjalan |
| Artikel | Sanity + fallback `lib/content.ts` — [`docs/SANITY-INTEGRATION.md`](docs/SANITY-INTEGRATION.md) |
| Katalog video | Dari repo (statis, artefak build-time — [`ADR-0004`](docs/adr/0004-katalog-video-build-time.md)) |
| Antrean demo | Sanity dataset privat, moderasi; fallback array proses-lokal tanpa env |
| CMS | Sanity Studio — embedded di `/studio`, hosted di [melodi-alam.sanity.studio](https://melodi-alam.sanity.studio) — [`ADR-0008`](docs/adr/0008-sanity-studio-menggantikan-payload.md) (menggantikan [`ADR-0002`](docs/adr/0002-payload-supabase.md)) |
| Pratinjau draf | Belum ada |
| Uji otomatis | Belum ada — [`ADR-0006`](docs/adr/0006-vitest-playwright-vercel.md) |
| Analytics | Belum ada |

Kontribusi: baca [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) lebih dulu.
