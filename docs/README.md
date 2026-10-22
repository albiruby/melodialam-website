# Dokumentasi Melodi Alam

Kumpulan dokumen pendukung pengembangan untuk platform web Melodi Alam.
Mulai dari sini.

**Siapa yang membaca apa.** Tidak semua dokumen ditujukan untuk semua orang; tabel di
bawah menandai audiensnya supaya tidak ada yang membaca 50 KB dokumen yang tidak
diperlukannya.

**Status per 21 Oktober 2026.** Kolom **Status** pada setiap tabel berarti:

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Isi dokumen sudah dicek ke kode yang ada sekarang |
| `RENCANA` | Bagian yang sengaja ditulis sebagai rencana — belum ada di kode |

---

## Status fase

Repositori ini sudah **berjalan di produksi** dengan backend **Sanity Studio** (repo
terpisah `melodialam-sanity`). Yang benar hari ini:

- Antarmuka *Neo-Brutalist Editorial* berjalan penuh di sisi klien.
- **Artikel, pillar, video, playlist, dan wawancara** dibaca dari Sanity Studio
  (dataset `production`, publik), dengan `lib/content-fallback.ts` sebagai fallback — lihat
  [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md).
- **Studio Sanity** berada di repo terpisah, `melodialam-sanity`, bukan di sini. Repo ini
  hanya membaca.
- **Antrean demo** tersambung ke dataset Sanity **privat** `submissions` dan dimoderasi
  (ADR-0005). Formulir juga benar-benar menyimpan PII: kontak manajer di dokumen
  `demoContact`, berkas audio di Vercel Blob.
- **Katalog video** tetap artefak build-time di dalam repo (ADR-0004); `/videos` hanya
  merender seleksi yang hidup di Sanity.
- **Unit test** sudah ada: tiga berkas, 20 kasus (`npm test`), dan **CI** GitHub
  Actions sudah jalan pada setiap push ke `main` (lint + typecheck + test + build).
  Playwright, uji end-to-end, dan coverage belum.
- Yang masih `RENCANA` di luar kode: Blob store di Vercel, `RESEND_API_KEY`, domain
  `melodialam.id`, dan pengaktifan Web Analytics.

> **Sebagian dokumen di folder ini sudah usang.** Dokumen-dokumen itu disusun saat
> backend direncanakan memakai Payload CMS 3 + Supabase; CMS-nya sejak itu diganti
> dengan Sanity Studio dan seluruh kode Payload dihapus. Setiap dokumen yang terdampak
> membawa banner di bagian atas yang menunjuk ke
> [`adr/0008`](adr/0008-sanity-studio-menggantikan-payload.md) dan
> [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md).

---

## Daftar dokumen

Folder `docs/` berisi **13 berkas** di root dan **8 catatan keputusan** di `adr/`.
Semua tercakup di bawah ini.

### Orientasi

| Dokumen | Untuk | Isi | Status |
|---|---|---|---|
| [`../README.md`](../README.md) | Semua orang | Apa proyek ini, cara menjalankannya, daftar perintah dan rute, status produksi | `TERVERIFIKASI` |
| [`README.md`](README.md) | Semua orang | Indeks dokumen ini | `TERVERIFIKASI` |
| [`PRD-REFERENCE.md`](PRD-REFERENCE.md) | PM, QA, engineer | Ketertelusuran ID requirement PRD → status implementasi, penyimpangan, pertanyaan terbuka | `TERVERIFIKASI` |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Kontributor | Alur kerja, konvensi, gerbang mutu, perintah yang sudah diverifikasi | `TERVERIFIKASI` |

### Arsitektur & data

| Dokumen | Untuk | Isi | Status |
|---|---|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Engineer | Batas modul, alur data, arsitektur target, jejak fitur yang sudah dihapus | `TERVERIFIKASI` |
| [`DATA-MODEL.md`](DATA-MODEL.md) | Engineer backend | Dua dataset Sanity (`production` publik, `submissions` privat) + katalog JSON cadangan; tanpa tabel/RLS/migrasi | `TERVERIFIKASI` |
| [`API-CONTRACTS.md`](API-CONTRACTS.md) | Engineer, integrator | Kontrak endpoint HTTP yang benar-benar ada di repo, dibaca dari kodenya | `TERVERIFIKASI` |
| [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) | Engineer, pemilik produk | Tinjauan defensif: inventaris PII, kontrol anti-penyalahgunaan, dan status temuan audit F01–F10 | `TERVERIFIKASI` |
| [`audit-2026-10-21.md`](audit-2026-10-21.md) | Engineer, pemilik produk | Audit keamanan + codebase + integrasi Sanity/Vercel + SEO, 21 Okt 2026; 10 temuan, semuanya `needs_validation` | `TERVERIFIKASI` (source-level; tanpa sandbox OS) |

### Implementasi

| Dokumen | Untuk | Isi | Status |
|---|---|---|---|
| [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md) | Editor, engineer | **Panduan integrasi web ↔ CMS: apa yang ditulis di Studio render di halaman mana, satu daftar cerita bersama, dua dataset, webhook, alur Blob + Resend, dan jebakan yang sudah ditemukan** | `TERVERIFIKASI` |
| [`FRONTEND-PLAN.md`](FRONTEND-PLAN.md) | Engineer frontend | Route, komponen, batas server/client, state, gap aksesibilitas | `TERVERIFIKASI` |
| [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) | Engineer, desainer | Token, katalog utility, aturan interaksi yang dikunci, anti-pola | `TERVERIFIKASI` |

### Mutu & rilis

| Dokumen | Untuk | Isi | Status |
|---|---|---|---|
| [`TEST-STRATEGY.md`](TEST-STRATEGY.md) | Engineer, QA | Keadaan pengujian saat ini (tiga berkas unit test Vitest, 20 kasus) + lapisan yang belum ada | `TERVERIFIKASI` (unit test) · `RENCANA` (Playwright, E2E, coverage, CI) |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Engineer, operator | Build nyata, environment Vercel, deploy & rollback, hazard deploy | `TERVERIFIKASI` |

### Keputusan

Delapan catatan keputusan arsitektur, semuanya berstatus `DITERIMA`.

| Dokumen | Keputusan | Status |
|---|---|---|
| [`adr/0001-artikel-route-video-modal.md`](adr/0001-artikel-route-video-modal.md) | Artikel sebagai route crawlable; pemutar video tetap modal | `TERVERIFIKASI` — terimplementasi |
| [`adr/0002-payload-supabase.md`](adr/0002-payload-supabase.md) | ~~Payload CMS 3 di dalam Next.js sebagai CMS~~ — **digantikan ADR-0008** | `TERVERIFIKASI` — arsip |
| [`adr/0003-supabase-postgres-storage.md`](adr/0003-supabase-postgres-storage.md) | ~~Supabase sebagai Postgres dan object storage~~ — tidak lagi dipakai kode | `TERVERIFIKASI` — arsip |
| [`adr/0004-katalog-video-build-time.md`](adr/0004-katalog-video-build-time.md) | Katalog video tetap di-*generate* saat build, tidak masuk CMS | `TERVERIFIKASI` — terimplementasikan |
| [`adr/0005-moderated-demo-queue.md`](adr/0005-moderated-demo-queue.md) | Antrean demo dimoderasi sebelum tampil publik | `TERVERIFIKASI` — sebagian diimplementasikan (moderasi di sisi server sudah; UI kurator belum) |
| [`adr/0006-vitest-playwright-vercel.md`](adr/0006-vitest-playwright-vercel.md) | Vitest + Playwright; deploy ke Vercel | `TERVERIFIKASI` — sebagian: Vitest dan Vercel sudah, Playwright belum |
| [`adr/0007-tipografi-inter-red-hat-display.md`](adr/0007-tipografi-inter-red-hat-display.md) | Tipografi Inter + Red Hat Display, menggantikan Plus Jakarta Sans | `TERVERIFIKASI` — terimplementasi |
| [`adr/0008-sanity-studio-menggantikan-payload.md`](adr/0008-sanity-studio-menggantikan-payload.md) | **Sanity Studio menggantikan Payload CMS 3 + Supabase** | `TERVERIFIKASI` — diimplementasikan dan diuji |

---

## Urutan membaca yang disarankan

**Kontributor baru** — `../README.md` → `ARCHITECTURE.md` → `FRONTEND-PLAN.md` →
`CONTRIBUTING.md`.

**Editor konten** — `SANITY-INTEGRATION.md` §1–§5. Tidak perlu membaca sisanya.

**Engineer backend** — `ARCHITECTURE.md` → `DATA-MODEL.md` → `API-CONTRACTS.md` →
`SECURITY-PRIVACY.md`.

**Desainer** — `DESIGN-SYSTEM.md` → `FRONTEND-PLAN.md` → ADR-0007.

**Menjelang rilis** — `TEST-STRATEGY.md` → `DEPLOYMENT.md` → `SECURITY-PRIVACY.md` →
`PRD-REFERENCE.md` §9 (release blockers).

**Meninjau keamanan** — `audit-2026-10-21.md` → `SECURITY-PRIVACY.md` §4 (temuan
F01–F10) → `SECURITY-PRIVACY.md` §8 (urutan remediasi).

---

## Konvensi penulisan

Istilah kunci yang dipakai konsisten di seluruh dokumen ini.

| Istilah | Arti |
|---|---|
| **Stories** | Pilar jurnalisme musik — artikel; halaman `/stories` |
| **Curated News** | Konten kurasi dari feed Instagram (`/kurasi`) — kumpulan `pillarPost` |
| **Melodi Samsara** | Halaman `/videos` — sesi panggung terpilih + playlist |
| **Bicara Melodi** | Wawancara Season 3 di `/bicara-melodi` |
| **Antrean demo** | Daftar kiriman musisi di dataset privat `submissions` |
| **Moderated queue** | Model moderasi yang dipilih: kiriman privat sampai kurator menyetujui (ADR-0005) |
| **Artefak generated** | Berkas yang dihasilkan skrip dan tidak boleh disunting tangan: `lib/catalogue.json`, `public/brand/*`, `public/photos/*`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` |

### Label status klaim

Setiap klaim faktual membawa salah satu label berikut. Ini bukan hiasan — pembaca perlu
tahu mana yang sudah teruji.

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Dibaca langsung di kode, atau dijalankan dan hasilnya diamati |
| `RENCANA` | Belum ada; target yang akan dibangun |
| `ASUMSI` | Diperkirakan, belum dikonfirmasi |
| `[PERLU VERIFIKASI]` | Secara eksplisit belum diperiksa dan butuh konfirmasi |

### Menyebut rujukan

- ID requirement PRD: `FR-001`, `BR-002`, `ACC-003`, `NFR-001`, `OQ-001`, `MET-02`,
  `ANA-04`, `RISK-001`.
- Risiko arsitektural di `ARCHITECTURE.md` memakai namespace terpisah: `ARCH-RISK-001`.
  Ini disengaja supaya tidak tertukar dengan `RISK-*` milik PRD.
- Keputusan: `ADR-000N`.
- Temuan audit keamanan: `F01`–`F10` (lihat `audit-2026-10-21.md`).
- Temuan tinjauan dokumen `SECURITY-PRIVACY.md`: `SEC-Fxx`.

---

## Batasan yang perlu diketahui

Tiga hal berikut memengaruhi hampir semua dokumen, dan sengaja disebut di depan.

1. **Berkas sumber berada di luar repo.** `scripts/build-catalogue.mjs`,
   `scripts/build-brand.mjs`, dan `scripts/copy-photos.mjs` membaca berkas dari folder
   induk (`../melodi-alam-data.md`, `../logobulet.png`, `../logotext.png`,
   `../FOTO PLACEHOLDER MELODI ALAM/`). **Checkout bersih tidak dapat membangun situs.**
   Rincian dan pilihannya di [`DEPLOYMENT.md`](DEPLOYMENT.md).
2. **PRD belum ada di repo.** `PRD-REFERENCE.md` merangkum isi mengikat setiap ID
   requirement, tetapi teks PRD aslinya sebaiknya disalin menjadi `docs/PRD.md` agar
   ketertelusuran dapat diverifikasi terhadap sumbernya.
3. **Nama merek belum konsisten.** Header memakai wordmark gambar berbunyi
   "MELODI SAMSARA", sementara metadata dan footer memakai "MELODI ALAM". Konsekuensinya
   terhadap SEO dan pembaca layar dibahas di `PRD-REFERENCE.md` §11.

---

## Catatan verifikasi

Dokumen ini dicek terhadap isi folder `docs/` dan isi repo `melodi-alam` pada
**21 Oktober 2026**.

- **Daftar file** — `docs/` berisi 13 berkas di root: `README.md`, `audit-2026-10-21.md`,
  `API-CONTRACTS.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `DATA-MODEL.md`,
  `DEPLOYMENT.md`, `DESIGN-SYSTEM.md`, `FRONTEND-PLAN.md`, `PRD-REFERENCE.md`,
  `SANITY-INTEGRATION.md`, `SECURITY-PRIVACY.md`, `TEST-STRATEGY.md`; plus
  `docs/adr/` berisi 8 berkas (ADR-0001 s.d. ADR-0008). **Semua 21 tercakup** di tabel
  di atas.
- **Deskripsi tiap dokumen** — diambil dari banner dan paragraf pembuka berkas
  masing-masing (bukan dari isi repo lama), sehingga sudah menyesuaikan diri dengan
  perpindahan dari Payload/Supabase ke Sanity.
- **Status ADR** — dibaca dari tabel `Atribut` di setiap berkas ADR
  (`DITERIMA`, sebagian digantikan, sebagian diimplementasikan).
- **Rute dan perintah** — `../README.md` diverifikasi ke `app/` (daftar route handler dan
  halaman), `package.json` (daftar skrip), dan `next.config.ts`.
- **Kondisi build** — `npm run build` → lulus, **33 halaman statis**; `npm test` →
  20/20 lulus (`lib/content-fallback.test.ts`).
- **Tidak diperiksa** — isi dashboard Vercel/Sanity (status Blob store, Resend,
  anggota project, "Trigger on" webhook), dan apakah domain `melodialam.id` sudah
  diarahkan.
