# Dokumentasi Melodi Alam

Kumpulan dokumen pendukung pengembangan untuk platform web Melodi Alam.
Mulai dari sini.

**Siapa yang membaca apa.** Tidak semua dokumen ditujukan untuk semua orang; tabel di
bawah menandai audiensnya supaya tidak ada yang membaca 50 KB dokumen yang tidak
diperlukannya.

---

## Status fase

Repositori ini berada di **Fase Alfa** (lihat PRD §15), tetapi backend-nya sudah
melewati tahap rencana. Yang benar hari ini:

- Antarmuka *Neo-Brutalist Editorial* berjalan penuh di sisi klien.
- **Artikel** dibaca dari Sanity Studio, dengan `lib/content.ts` sebagai fallback —
  lihat [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md).
- **Studio Sanity** berada di repo terpisah, `melodialam-sanity`, bukan di sini. Repo ini
  hanya membaca.
- **Antrean demo** tersambung ke dataset Sanity **privat** dan dimoderasi (ADR-0005).
- **Katalog video** tetap artefak build-time di dalam repo (ADR-0004).
- Pengujian otomatis dan deployment masih **`RENCANA`** (ADR-0006).

> **Sebagian dokumen di folder ini sudah usang.** Dokumen-dokumen itu disusun saat
> backend direncanakan memakai Payload CMS 3 + Supabase; CMS-nya sejak itu diganti
> dengan Sanity Studio dan seluruh kode Payload dihapus. Setiap dokumen yang terdampak
> membawa banner di bagian atas yang menunjuk ke
> [`adr/0008`](adr/0008-sanity-studio-menggantikan-payload.md) dan
> [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md).

---

## Daftar dokumen

### Orientasi

| Dokumen | Untuk | Isi |
|---|---|---|
| [`../README.md`](../README.md) | Semua orang | Apa proyek ini, cara menjalankannya, daftar perintah |
| [`PRD-REFERENCE.md`](PRD-REFERENCE.md) | PM, QA, engineer | Ketertelusuran ID requirement PRD → status implementasi, penyimpangan, pertanyaan terbuka |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Kontributor | Alur kerja, konvensi, gerbang mutu |

### Arsitektur & data

| Dokumen | Untuk | Isi |
|---|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Engineer | Batas modul, alur data, arsitektur target, kendala arsitektural |
| [`DATA-MODEL.md`](DATA-MODEL.md) | Engineer backend | Entitas saat ini, skema Postgres target, RLS, migrasi |
| [`API-CONTRACTS.md`](API-CONTRACTS.md) | Engineer, integrator | Kontrak endpoint hari ini dan target, model error, OpenAPI |
| [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) | Engineer, pemilik produk | Temuan keamanan, penanganan PII, kontrol anti-penyalahgunaan |
| [`AUDIT-2026-10-21.md`](AUDIT-2026-10-21.md) | Engineer, pemilik produk | Audit keamanan + codebase + integrasi Sanity/Vercel + SEO, 21 Okt 2026 |

### Implementasi

| Dokumen | Untuk | Isi |
|---|---|---|
| [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md) | Editor, engineer | **Panduan integrasi web ↔ CMS: apa yang ditulis di `/studio` render di halaman mana, alur datanya, dua dataset, cara menambah tipe konten, dan jebakan yang sudah ditemukan** |
| [`FRONTEND-PLAN.md`](FRONTEND-PLAN.md) | Engineer frontend | Route, komponen, batas server/client, state, gap aksesibilitas |
| [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) | Engineer, desainer | Token, katalog utility, aturan interaksi yang dikunci, anti-pola |

### Mutu & rilis

| Dokumen | Untuk | Isi |
|---|---|---|
| [`TEST-STRATEGY.md`](TEST-STRATEGY.md) | Engineer, QA | Prioritas berbasis risiko, kasus uji, matriks ketertelusuran, gerbang CI |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Engineer, operator | Build nyata, lingkungan, pipeline, rollback, hazard deploy |

### Keputusan

| Dokumen | Keputusan |
|---|---|
| [`adr/0001-artikel-route-video-modal.md`](adr/0001-artikel-route-video-modal.md) | Artikel sebagai route crawlable; pemutar video tetap modal |
| [`adr/0002-payload-supabase.md`](adr/0002-payload-supabase.md) | ~~Payload CMS 3 di dalam Next.js sebagai CMS~~ — **digantikan ADR-0008** |
| [`adr/0003-supabase-postgres-storage.md`](adr/0003-supabase-postgres-storage.md) | ~~Supabase sebagai Postgres dan object storage~~ — tidak lagi dipakai kode |
| [`adr/0004-katalog-video-build-time.md`](adr/0004-katalog-video-build-time.md) | Katalog video tetap di-*generate* saat build, tidak masuk CMS |
| [`adr/0005-moderated-demo-queue.md`](adr/0005-moderated-demo-queue.md) | Antrean demo dimoderasi sebelum tampil publik |
| [`adr/0006-vitest-playwright-vercel.md`](adr/0006-vitest-playwright-vercel.md) | Vitest + Playwright; deploy ke Vercel |
| [`adr/0007-tipografi-inter-red-hat-display.md`](adr/0007-tipografi-inter-red-hat-display.md) | Tipografi Inter + Red Hat Display, menggantikan Plus Jakarta Sans |
| [`adr/0008-sanity-studio-menggantikan-payload.md`](adr/0008-sanity-studio-menggantikan-payload.md) | **Sanity Studio menggantikan Payload CMS 3 + Supabase** |

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

---

## Konvensi penulisan

Istilah kunci yang dipakai konsisten di seluruh dokumen ini.

| Istilah | Arti |
|---|---|
| **Stories** | Pilar jurnalisme musik — artikel |
| **Spaces** | Ruang dengar fisik: Samsara, Svarga, Acasa |
| **Instruments** | Perangkat audio, terutama SVVARA V100 |
| **Antrean demo** | Daftar kiriman musisi yang menunggu atau sudah ditinjau |
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
