# Melodi Alam

Platform web media musik Indonesia — **Stories, Spaces & Instruments**.

Situs ini menyatukan jurnalisme musik (*Stories*), katalog video YouTube
`@melodialam` (*Watch*), jalur pengiriman demo musisi (*Submit Demo*), dan etalase
ekosistem fisik Samsara / Svarga / Acasa serta perangkat audio SVVARA.

Bagian dari ekosistem *Intellectual Property* PT Infia Pariwara Nusantara (INFIA Corp).

---

## Menjalankan

Prasyarat: **Node.js >= 20**.

```bash
npm install
npm run dev
```

Buka **http://localhost:3100**.

Port 3000 sengaja dihindari; seluruh skrip npm sudah dipatok ke 3100. Untuk port lain:

```bash
npm run dev -- -p 4321
```

Tidak ada variabel lingkungan yang diperlukan dan tidak ada berkas `.env`.

---

## Teknologi

| Komponen | Versi |
|---|---|
| Next.js (App Router, Turbopack) | `16.4.0` |
| React | `19.3.0` |
| TypeScript | `^5` |
| Tailwind CSS | `^4` |
| Motion (penerus Framer Motion) | `^14.2.0` |

Build produksi menghasilkan **26 halaman statis**.

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

> Hentikan dev server sebelum menjalankan `npm run build`; keduanya memakai state
> Turbopack yang sama dan menjalankannya bersamaan membuat halaman tampil kosong.

---

## Halaman

| Route | Isi |
|---|---|
| `/` | Beranda: artikel utama, teaser tiap seksi |
| `/journal` | Seluruh artikel, filter kategori, pencarian |
| `/journal/[slug]` | Satu artikel, 12 halaman statis, metadata sendiri |
| `/bicara-melodi` | Indeks wawancara |
| `/videos` | Katalog penuh 292 video, filter, pencarian, paginasi |
| `/pahlawan-kota` | Direktori genre dan skena kota |
| `/spaces` | Etalase ruang dengar dan perangkat |
| `/submit` | Formulir demo dan antrean kiriman |
| `/api/demos` | Route handler `GET` dan `POST` untuk antrean demo |

---

## Struktur

```
app/            Route, layout, dan route handler
components/     Komponen UI; components/motion/ untuk primitif gerak
lib/            Lapisan data: content.ts, catalogue.ts, catalogue.json, site.ts
scripts/        Generator untuk katalog, aset merek, dan foto
public/         Aset statis; brand/ dan photos/ adalah artefak generated
docs/           Dokumentasi pengembangan
```

`lib/content.ts` memuat seluruh konten editorial. `lib/catalogue.json` adalah artefak
**generated** dan tidak boleh disunting tangan.

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

Repositori ini berada di **Fase Alfa**. Antarmuka sudah berjalan penuh di sisi klien,
tetapi artikel, katalog video, dan antrean demo masih memakai data di dalam repo.

| Area | Status |
|---|---|
| UI *Neo-Brutalist Editorial*, animasi, interaksi hover | Berjalan |
| Artikel dan katalog video | Dari repo (statis) |
| Antrean demo | Array proses-lokal — **hilang saat server restart** |
| CMS, basis data, autentikasi kurator | Belum ada — [`ADR-0002`](docs/adr/0002-payload-supabase.md), [`ADR-0003`](docs/adr/0003-supabase-postgres-storage.md) |
| Uji otomatis | Belum ada — [`ADR-0006`](docs/adr/0006-vitest-playwright-vercel.md) |
| Analytics | Belum ada |

Kontribusi: baca [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) lebih dulu.
