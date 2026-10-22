# ADR-0006 — Vitest + Playwright untuk pengujian, Vercel untuk hosting

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` — **sebagian diimplementasikan**: Vitest dan Vercel sudah, Playwright belum |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (Tim Produk Melodi Alam) |
| **Terkait** | `NFR-001`…`NFR-004`, `ACC-001`…`ACC-003`, seluruh `FR-*` dan `BR-*` |
| **Bergantung pada** | ADR-0002 (Payload), ADR-0003 (Supabase) |

## Konteks

Repositori ini tidak punya satu pun uji. Gerbang otomatisnya hanya `npm run lint` dan
`tsc --noEmit` (yang berjalan sebagai bagian dari `next build`). Keduanya memeriksa
bentuk kode, bukan perilaku.

Sementara itu, pengembangan sampai titik ini sudah menghasilkan lima regresi nyata yang
lolos dari kedua gerbang itu, dan sebagian besar diam-diam:

1. Stylesheet gagal dibangun seluruhnya tanpa error (Tailwind menabrak berkas terkunci),
   sehingga tidak ada satu pun kelas yang dihasilkan.
2. Delapan gambar `next/image fill` memiliki induk `static`, sehingga gambar 160 px
   direntangkan ke 1296 px.
3. Pembacaan `scrollWidth` di dalam *frame loop* membuat halaman hanya mendapat **1
   `requestAnimationFrame` per detik**, yang menghentikan callback `IntersectionObserver`
   dan membuat konten tertahan di `opacity: 0`.
4. State tersembunyi ter-*bake* ke HTML server-rendered, sehingga satu callback yang
   terlewat membuat judul permanen tidak terlihat.
5. Kelas Tailwind yang dibangun lewat interpolasi string tidak pernah ter-*generate*,
   sehingga 12 bingkai kartu kolaps ke tinggi nol.

Pelajaran dari kelima hal itu: regresi paling merusak di proyek ini tidak berbentuk
error, melainkan **halaman yang tampak baik-baik saja tetapi diam-diam rusak**. Lint dan
*typecheck* tidak dapat menangkapnya.

## Keputusan

**Vitest** untuk uji logika dan aturan murni, **Playwright** untuk uji alur di browser
nyata. Deployment ke **Vercel**.

Yang mengikat:

1. **Dua lapis, dua tanggung jawab.** Vitest menguji fungsi dan aturan validasi secara
   terisolasi dan cepat. Playwright menguji alur yang tidak dapat diverifikasi tanpa
   browser: navigasi, modal, interaksi *hover* dan fokus, dan privasi antrean.
2. **Prioritas berbasis risiko, bukan berbasis cakupan.** Yang diuji lebih dulu adalah
   jalur dengan kerusakan terbesar dan yang sudah pernah rusak — bukan mengejar angka
   persentase cakupan.
3. **Setiap uji tertelusur ke ID PRD.** `FR-001`…`FR-007`, `BR-001`…`BR-004`,
   `ACC-001`…`ACC-003`, dan empat release blocker di PRD §14.2.
4. **Gerbang CI memblokir merge**, bukan sekadar memperingatkan, untuk lint, typecheck,
   Vitest, dan Playwright. Rincian dan urutannya di `docs/TEST-STRATEGY.md` dan
   `docs/DEPLOYMENT.md`.
5. **Vercel dipilih karena kecocokan, bukan preferensi.** Next.js 16 dengan Cache
   Components dan Partial Prefetching adalah jalur yang paling sedikit gesekannya, dan
   *preview deployment* per *pull request* sangat cocok dengan gerbang uji di atas.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Playwright saja** | Menguji perilaku nyata; paling dekat dengan pengalaman pengguna | Uji alur mahal dan lambat. Aturan murni seperti matriks validasi `POST /api/demos` atau perhitungan waktu baca menjadi jauh lebih lambat dan lebih rapuh untuk diuji lewat browser. |
| **Vitest saja** | Cepat; tanpa browser | Tidak dapat memverifikasi hal yang justru paling sering rusak di proyek ini: tata letak, batas server/client, dan interaksi. |
| **Jest** | Ekosistem paling dewasa | Konfigurasi lebih berat untuk proyek ESM + TypeScript, dan Vitest lebih cepat serta lebih sederhana untuk kasus ini. |
| **Cypress** | *Debugging* interaktif yang bagus | Playwright menangani banyak konteks browser, dan perkakas automasi yang sudah dipakai selama pengembangan ini adalah Playwright. |
| **Cloudflare / VPS** | Kontrol lebih besar; biaya bisa lebih rendah pada skala tertentu | Menambah langkah adaptasi (OpenNext) dan pekerjaan operasional, untuk manfaat yang belum terbukti pada skala ini. Bisa ditinjau ulang kalau biaya Vercel menjadi masalah. |

## Konsekuensi

**Positif**

- Regresi diam-diam yang sudah pernah terjadi punya penangkapnya sendiri.
- Uji logika berjalan dalam hitungan detik, sehingga dapat dijalankan setiap perubahan.
- *Preview deployment* Vercel memberi tempat nyata untuk menjalankan uji Playwright dan
  untuk meninjau perubahan visual sebelum masuk `main`.
- Batas server/client dan batas privasi menjadi eksplisit dan teruji, bukan konvensi
  yang diingat orang.

**Negatif / utang**

- **Menambah dependensi dev yang cukup besar**, terutama Playwright dengan berkas
  browsernya. Ukuran repositori dan waktu pemasangan naik.
- Menambah waktu CI. Playwright di *preview* berarti deploy harus selesai lebih dulu,
  sehingga umpan balik menjadi lebih lambat daripada sekadar lint.
- Uji yang mengandalkan waktu dan animasi cenderung rapuh. Aturan disiplin wajib:
  tunggu kondisi nyata (misalnya `opacity` mencapai 1), bukan `sleep` dengan durasi
  tebakan. Ini sudah menjadi masalah nyata selama pengembangan — beberapa pemeriksaan
  manual sempat salah baca karena menunggu jumlah detik yang keliru.
- Vercel adalah vendor tambahan dengan batas kuota yang perlu dipantau.

## Referensi

- `docs/TEST-STRATEGY.md` — prioritas berbasis risiko, matriks ketertelusuran, kasus uji
- `docs/DEPLOYMENT.md` — pipeline, lingkungan, rollback
- ADR-0002, ADR-0003

## Catatan Verifikasi

- `TERVERIFIKASI`: tidak ada skrip `test` dan tidak ada dependensi pengujian di
  `package.json`; tidak ada direktori `.github/`; `@playwright/test` hanya muncul
  sebagai *optional peer* dari `next` di `package-lock.json` dan tidak terpasang;
  `next build` melaporkan **26 halaman statis**.
- `TERVERIFIKASI`: kelima regresi pada bagian Konteks benar-benar terjadi dan
  terdokumentasi di `docs/ARCHITECTURE.md` (`ARCH-RISK-001`…`ARCH-RISK-003`) serta
  `docs/FRONTEND-PLAN.md`.
- `RENCANA`: seluruh keputusan alat dan CI. **Fase ini hanya dokumen** — tidak ada paket
  dipasang, tidak ada berkas uji dibuat, tidak ada CI ditambahkan.
- `[PERLU VERIFIKASI]`: dukungan Vercel untuk Next.js `16.4.0` beserta Cache Components
  dan Partial Prefetching.
- **Pembaruan 21 Okt 2026** (`TERVERIFIKASI`): **Vitest sudah terpasang** — `npm test`
  menjalankan sembilan kasus di `lib/content-fallback.test.ts` — dan `@vercel/analytics` ikut
  terpasang di layout. Vercel dipakai sebagai hosting: deploy otomatis dari `main` ke
  `melodialam-website.vercel.app`. Dua hal yang **belum**: `@playwright/test` tidak
  terpasang, dan repositori tetap tidak punya direktori `.github/`, jadi belum ada
  pipeline CI.
