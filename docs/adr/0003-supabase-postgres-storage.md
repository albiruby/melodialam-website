# ADR-0003 — Supabase sebagai Postgres dan penyimpanan berkas

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` — belum diimplementasikan |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (Tim Produk Melodi Alam) |
| **Terkait** | `OQ-002`, `FR-006`, `BR-001`, `RISK-002`, `NFR-002` |
| **Melengkapi** | ADR-0002 (Payload CMS 3 di dalam aplikasi Next.js) |

## Konteks

Antrean demo hari ini adalah array proses-lokal di dalam `app/api/demos/route.ts`. Array
itu bertahan antar-request dalam satu instance dan hilang setiap kali server
di-*restart*; pada Vercel, setiap *cold start* dan setiap instance adalah memori yang
berbeda, sehingga tidak ada satu pun pengiriman demo yang benar-benar tersimpan.

Ada dua hal yang perlu bertahan, dan keduanya berbeda sifat:

1. **Data demo terstruktur** — nama band, kota, genre, tautan EPK, cerita lagu, tujuan
   kurasi, dan status moderasi. Ini data relasional: perlu difilter (per kota, per
   genre, per status), diurutkan, dan didefinisikan hak bacanya.
2. **Berkas audio opsional** sampai 25 MB (`BR-001`). Ini *blob*, bukan baris tabel.

Menaruh keduanya di satu tempat memaksa salah satunya dikorbankan.

## Keputusan

Memakai **Supabase untuk keduanya**: Postgres sebagai basis data relasional di belakang
koleksi Payload, dan Supabase Storage sebagai *object storage* untuk berkas audio demo.

Yang mengikat dari keputusan ini:

1. **Postgres adalah sumber kebenaran untuk data demo.** Array proses-lokal digantikan
   sepenuhnya; tidak ada mode "sementara" yang dipertahankan di produksi.
2. **Hak baca ditegakkan di lapisan basis data, bukan hanya di aplikasi.** Kebijakan
   *Row Level Security* (RLS) memisahkan baris yang boleh dibaca publik dari yang
   hanya boleh dibaca kurator. Ini bagian dari ADR-0005 (antrean moderat) dan dirinci
   di `docs/DATA-MODEL.md`.
3. **Data pribadi dipisahkan dari kolom yang dapat dibaca publik.** Nomor kontak PIC
   hidup di tabel terpisah, bukan di baris `demo_submissions` yang dibaca halaman
   publik. Ini menutup celah yang saat ini hanya "aman karena tidak disimpan sama
   sekali".
4. **`service role key` Supabase tidak pernah mencapai klien.** Hanya boleh dipakai di
   sisi server; dirinci di `docs/SECURITY-PRIVACY.md`.
5. **Berkas audio bersifat opsional.** Kolom tautan EPK tetap jalur utama, sesuai
   `RISK-002` — supaya biaya penyimpanan tidak ditanggung oleh unggahan WAV besar.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Postgres lain** (Neon, RDS) + S3/R2 terpisah | Pemisahan yang lebih bersih; R2 lebih murah untuk *egress* | Dua vendor, dua set kredensial, dua panel untuk hal yang volumenya masih kecil. Bisa ditinjau kembali kalau biaya *egress* menjadi masalah nyata. |
| **Supabase saja, tanpa Payload** | Lebih sedikit bagian bergerak | Tidak memberi antarmuka editorial; kembali ke masalah `USR-003` yang justru jadi alasan ADR-0002. |
| **SQLite / berkas di disk** | Nol infrastruktur | Tidak bertahan pada *serverless* seperti Vercel. |
| **Menyimpan audio sebagai kolom `bytea`** | Semua di satu sistem | Membebani basis data dengan *blob*; *backup* dan pemulihan menjadi lambat dan mahal. |

## Konsekuensi

**Positif**

- Demo akhirnya benar-benar tersimpan dan tahan *restart*.
- RLS memberi jaminan di lapisan data, bukan sekadar kepercayaan pada kode aplikasi.
- Data pribadi dapat dilindungi tanpa harus menolak menyimpannya.
- *Backup*, *point-in-time recovery*, dan pemeriksaan tersedia tanpa kerja tambahan.

**Negatif / utang**

- Vendor eksternal baru: kredensial, kuota, dan satu titik gagal tambahan.
- Migrasi skema menjadi urusan nyata. Perubahan harus *expand-and-contract*, dan
  *rollback* basis data harus direncanakan — lihat `docs/DEPLOYMENT.md`.
- Pengembangan lokal memerlukan Supabase lokal atau proyek pengembangan; tidak ada
  padanannya hari ini.
- RLS yang salah dapat membocorkan data secara diam-diam. Kebijakan harus diuji, bukan
  diasumsikan; masuk `docs/TEST-STRATEGY.md`.

## Referensi

- `docs/DATA-MODEL.md` — DDL, indeks, dan kebijakan RLS
- `docs/SECURITY-PRIVACY.md` — pemisahan PII dan penanganan kunci
- `docs/DEPLOYMENT.md` — peran basis data dalam *rollback*
- ADR-0002, ADR-0005

## Catatan Verifikasi

- `TERVERIFIKASI`: `app/api/demos/route.ts` memakai array proses-lokal; `contact`
  tidak pernah disimpan; tidak ada klien basis data maupun Supabase di
  `package.json`.
- `RENCANA`: seluruh keputusan di atas. **Fase ini hanya dokumen** — tidak ada proyek
  Supabase dibuat dan tidak ada migrasi dijalankan.
- `[PERLU VERIFIKASI]`: tingkat layanan dan kuota Supabase yang sesuai untuk
  perkiraan volume demo; belum ada data historis.
