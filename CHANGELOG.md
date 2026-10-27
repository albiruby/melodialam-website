# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/), dan versi
mengikuti [Semantic Versioning](https://semver.org/lang/id/).

> **Catatan kejujuran riwayat.** Entri `0.1.0` (14 Oktober 2026) menandai keadaan
> saat rilis pertama — saat itu repositori baru berisi satu commit dan seluruh
> pekerjaan ada di working tree. Repositori kini memiliki 61 commit, dan semua
> entri di bawah `0.1.0` bisa diverifikasi ke kode serta ke riwayat Git. Daftar
> status yang masih menunggu tindakan pemilik ada di bagian *Known Issues*.

---

## [Unreleased]

**Remediasi audit keamanan (26 Okt 2026)**

- **JSON-LD `/videos` di-escape.** Ketiga sink JSON-LD kini memakai
  `jsonLdScript()` (`lib/json-ld.ts`): `<` → `\u003c`. Sebelumnya `/videos`
  memakai `JSON.stringify` mentah, sehingga nilai CMS berisi `</script>` bisa
  menutup elemen dan menjalankan HTML/script. Regression test
  `lib/json-ld.test.ts` (3 kasus) menjaga round-trip `JSON.parse` dan
  memastikan tidak ada `<` literal di output.
- **`purge-demos` fail-closed + kontak yatim.** Status `SHORTLISTED (SAMSARA)`
  dan `APPROVED (ARTICLE)` dipertahankan (kecuali `--include-approved`);
  `demoContact` yang submission-nya sudah tidak ada dipindai dan dihapus;
  urutan hapus audio → kontak → submission, dan submission **tidak** dihapus
  bila salah satu langkah gagal, sehingga run bisa diulang tanpa kehilangan
  URL audio.
- **Token Blob diikat ke namespace + store.** Key audio kini
  `demo-audio/<uuid>.<ext>` — nama file asli tidak lagi masuk URL publik;
  `onBeforeGenerateToken` menolak pathname di luar pola itu; `/api/demos`
  memakai `isDemoAudioUrl()` yang mematok host store dari `BLOB_STORE_ID` dan
  pathname UUID. JSON rusak di route token kini `400`, bukan `500`.
  `access: "public"` dan grant sekali-pakai masih terbuka (butuh store privat
  atau shared state).
- **Identitas rate limit tidak lagi dari header sembarang.** `clientIp()` hanya
  membaca `X-Forwarded-For`/`X-Real-IP` di Vercel (`VERCEL=1`) atau bila
  `TRUST_PROXY=1`; selain itu semua pemanggil berbagi satu bucket. Port IPv4
  dibuang, IPv6 diringkas ke /64, IPv4-mapped IPv6 dibuka. Batas tetap
  per-instance — batas global menunggu Vercel Firewall atau Redis.
- **Redirect `/journal` memakai `Location` relatif.** Kedua route tidak lagi
  membangun URL dari `request.url`; host header tidak bisa mengarahkan ke
  domain lain dan build lokal tidak menulis localhost. Slug di-encode, dan
  smoke test memeriksa path relatif persis.
- **404 bermerek untuk URL asing.** Layout dipindah ke `app/layout.tsx` (root)
  dan `app/global-not-found.tsx` (flag `experimental.globalNotFound`) merender
  ticker, header, isi 404, dan footer; status tetap 404.
- **Health check di-cache di edge 30 detik** dan tidak lagi membocorkan `ms`;
  kegagalan tetap `no-store` agar pemulihan langsung terlihat.
- **Kartu sosial artikel dipra-render** (`generateStaticParams`, 12 artikel);
  slug yang tidak ada menjawab 404, bukan kartu generik. Route Twitter
  mewarisi keduanya.
- **Body webhook dibatasi 16 KB** dengan pembacaan streaming; body lebih besar
  dijawab `413` sebelum verifikasi secret.
- **Upload audio demo berfungsi.** CSP `connect-src` mengizinkan
  `https://vercel.com/api/blob/`; store Blob diganti ke `melodi-alam-public`
  (access public) dan `BLOB_STORE_ID` dipasang untuk production + preview.
  Terverifikasi end-to-end: token `200` → PUT `200` → `POST /api/demos` `201`;
  data uji + blob dibersihkan.

---

## [0.2.0] — 2026-10-21

Rilis kedua: situs dipindah dari berkas statis ke Sanity, diberi Curator News
berupa pillar dari feed Instagram, dan seluruh komponen editorial disatukan
pada satu daftar cerita. Rilis ini sudah dideploy ke produksi dari `main`.

### Added

**CMS (Sanity)**

- Studio Sanity pindah ke repo sendiri (`melodialam-sanity`) dan di-deploy ke
  `sanity.studio` — bukan lagi Studio tertanam di aplikasi web.
- Tipe konten: `siteSettings`, `article`, `interview`, `video`, `playlist`,
  `pillarPost`, `videosPage` pada dataset `production` (publik), serta
  `demoSubmission` dan `demoContact` pada dataset `submissions` (privat).
- Isi statis di `lib/content-fallback.ts` bertahan sebagai fallback bila Sanity tak
  terjangkau, sehingga halaman tetap tampil.
- Webhook Sanity memanggil `POST /api/revalidate` dengan enam tag, sehingga
  satu kali Publish membersihkan cache konten yang relevan.

**Kurasi**

- `pillarPost` dengan 55 post aktif: fakta-musik 16, lirik 3, trivia 2,
  kutipan 6, rekomendasi 8, ulas-melodi 3, clipper 17. Pilar `similar-song`
  dan `meme-humor` ada di skema tetapi belum berisi post.
- Halaman `/kurasi` (Curated News): kotak cari, chip per pilar, blok BACA dan
  TONTON, enam post per pilar, dan anchor per pilar.

**Pengiriman demo**

- Audio demo diunggah langsung ke Vercel Blob lewat token unggah, sehingga
  berkas 25 MB tidak pernah melewati fungsi serverless.
- Kontak PIC disimpan terpisah di `demoContact`, bukan dikubur di dalam catatan.
- Notifikasi email lewat Resend — fitur ini diam selama `RESEND_API_KEY` belum
  diset.

**Editor & SEO**

- `/preview/<type>/<slug>?secret=…` untuk pratinjau draf (tanpa indeks).
- Halaman `/tentang`.
- Canonical di seluruh halaman, `sitemap.xml` dan `rss.xml` yang dibangun dari
  CMS, serta `robots.txt`.
- `opengraph-image` dan `twitter-image` per artikel (1200×630).
- JSON-LD `WebSite`, `Organization`, dan `BreadcrumbList`.
- Tombol berbagi pada halaman artikel.

**Alat bantu**

- Vitest terpasang; `npm test` menjalankan dua puluh kasus di tiga berkas
  (`lib/content-fallback.test.ts`, `lib/rate-limit.test.ts`,
  `lib/idempotency.test.ts`).
- `@vercel/analytics` terpasang di layout.
- `lib/README.md` — peta per berkas: pertanyaan → berkas, batas server/klien, dan
  nama tag cache.

**CI**

- `.github/workflows/ci.yml` — lint, typecheck, test, dan build pada setiap push
  ke `main` dan setiap pull request. Tidak butuh secret: dataset `production`
  bisa dibaca tanpa token, dan halaman yang butuh satu jatuh ke konten statis.

**Gaya CTA & kartu (25 Okt 2026)**

- **Panah `↗` dilepas dari seluruh CTA situs** (30 tempat): tombol, tautan
  seksi, footer, modal. Label dari CMS (`videosPage.samsaraLinkLabel`,
  `samsaraNote`, dst.) memang tidak pernah memuat panah — panahnya hiasan kode.
  Panah `←`/`→` pada pager Stories tetap (penunjuk arah, bukan dekorasi).
- Reel kurasi kini **kartu yang sama** dengan pilar foto — `PillarRow`
  dihapus; kaki kartu (`tanggal • Buka di IG`) `mt-auto` supaya sejajar
  bawah walau panjang judul berbeda.
- Modal video tidak lagi memotong layar: panel `max-h-[calc(100dvh-2rem)]`
  dan pemutar mengisi ruang tersisa di antara header dan footer.
- Tombol `M | WATCH` pada baris sesi: badge logo `M` hilang, seluruh
  "Melodi Alam / WATCH" kini jadi tautan **langsung** ke video di YouTube
  (`video.url` — dari dokumen `video` CMS / katalog).
- `dev.cmd` tidak lagi gagal parse: pesan Node 24.22.1 sebelumnya memuat
  tanda kurung di dalam blok `if` batch.
- **Project Supabase `melodi-alam` dihapus (25 Okt 2026)** — sisa era
  Payload/Supabase yang sudah digantikan ADR-0008 (Sanity + Vercel Blob);
  `DATABASE_URL`-nya sudah dibuang dari `.env` pada 22 Okt dan tidak ada kode
  situs yang membacanya. Penghapusan ini menutup item rotasi kredensial
  Supabase pada daftar tindakan pemilik.
- **Webhook revalidate pindah ke tanda tangan HMAC (25 Okt 2026).** Webhook
  Sanity kini memakai kolom **Secret** → header `sanity-webhook-signature`
  (HMAC-SHA256 atas `<timestamp>.<body>`, jendela ±5 menit); header
  `x-webhook-secret` lama dihapus dan secret dirotasi. Dibuktikan end-to-end:
  publish → kartu muncul di `/kurasi` produksi dalam 4,8 detik.
  `SANITY_REVALIDATE_SECRET_PREVIOUS` dihapus dari Vercel.

**Audit responsif & perbaikan (26 Okt 2026)**

- **Modal video kembali punya pemutar.** Stage `flex-1` di panel
  auto-height runtuh ke 0px di semua viewport; kini stage 16:9
  (`aspect-video`) dengan `max-h-[calc(100dvh-10rem)]` — video 199px di
  390×844, 502px di 1280×800, 182px di 360×500, panel tidak meluber.
- **`/tentang` tidak lagi meluber 28px di tablet (768px).** Dua alamat
  email tidak punya titik putus baris; kini flex-wrap sehingga membungkus
  (di 360px sebelumnya juga terpotong oleh `overflow-x: hidden`).
- **Gugus `[ ▶ ] — [ WATCH ]` di `/videos` selalu tampil di bawah `md`** —
  layar sentuh tidak punya hover, jadi tautan YouTube langsung sebelumnya
  tidak terjangkau di ponsel.
- Audit: 9 halaman × 6 viewport (360–1920), 0 error konsol, 0 overflow
  horizontal setelah perbaikan. Temuan terbuka (tap target <44px, font
  10–11px, ticker duplikat) dicatat di
  `docs/audit-responsif-2026-10-26.md`.

**Privasi, pembersihan data, dan pilar (24 Okt 2026)**

- **`/privasi` + `/ketentuan`** — dua halaman yang menjelaskan persis apa yang
  dikumpulkan formulir demo, di mana disimpan, siapa yang bisa melihatnya, dan
  cara meminta penghapusan. Ditautkan dari form submit dan kaki situs, masuk
  sitemap. Ditulis dari kode, bukan template; bukan nasihat hukum.
- **`npm run purge-demos`** — menghapus kiriman demo lama **beserta** kontak
  manajer dan berkas audionya (dry run secara default, `--apply` untuk
  menjalankan). Sebelumnya menghapus kiriman meninggalkan keduanya.
- **`/api/health`** — menjawab 200 bila Sanity terjangkau, 503 bila tidak; titik
  yang bisa dipantau uptime monitor.
- **`npm run smoke`** + langkah CI: memeriksa 15 rute, redirect `/journal`, isi
  halaman 2 Stories, jumlah artikel di sitemap, antrean publik, dan `/api/health`
  terhadap server yang benar-benar berjalan.
- `meme-humor` masuk `PHOTO_PILLARS`: sebelumnya pilar itu ada di skema dan label
  tetapi tidak di daftar mana pun, sehingga post dengannya tidak akan pernah
  tampil.
**Pagination, backup, dan pipeline (24 Okt 2026)**

- `/stories/page/2` — halaman lanjutan berisi 4 artikel yang sebelumnya hanya
  bisa dibuka lewat URL-nya sendiri. Halaman 1 tetap 8 kartu yang sama;
  sitemap kini memuat **semua 12 artikel** + halaman lanjutan.
- `npm run backup` — ekspor kedua dataset Sanity ke `backups/<tanggal>/`
  (gitignored: ekspor `submissions` memuat kontak).
- CI untuk repo Studio (`typecheck` + `sanity build`) dan Dependabot mingguan
  untuk npm + GitHub Actions.
- Vitest 3 → 5 (advisory dev-only tertutup); 20/20 tes tetap lulus.
- Tautan Instagram di header tetap tampil di ponsel (ikon saja).
**CSP ditegakkan, ikon kanal, dan pembersihan data (24 Okt 2026)**

- **CSP penuh kini ditegakkan**, bukan report-only: `default-src 'self'`,
  `img-src` terbatas ke `i.ytimg.com` + `cdn.sanity.io` + `data:`/`blob:`,
  `frame-src` hanya YouTube, `connect-src` hanya origin sendiri + Blob +
  Vercel Insights. `script-src` tetap `'unsafe-inline'` karena nonce akan
  memaksa seluruh halaman dinamis — situs ini hampir seluruhnya prerendered.
- Nav `Melodi Samsara` tidak lagi membawa badge `YT`.
- Logo asli (inline SVG, monochrome) untuk Instagram, YouTube, dan TikTok di
  header, footer, dan daftar kanal `/tentang` — menggantikan teks `IG ↗` dsb.
  Di header, ikon Instagram tetap disertai kata `INSTAGRAM` supaya pembaca yang
  tidak mengenali lambangnya tetap tahu tautan itu ke mana.
- Footer membaca `contactEmail`/`partnerEmail` dari `siteSettings`, sama
  seperti `/tentang`.
- Label beranda dan halaman artikel masih menulis "artikel di journal" — kini
  "artikel di Stories"; komponen halaman `JournalPage` menjadi `StoriesPage`;
  prop `badge` yang tidak lagi dipakai dibuang dari nav.
- 18 field `duration` yatim (nama field yang salah; skema memakai
  `durationSeconds`) dibuang dari dokumen `video` dan `interview`.
**Perlindungan & kelengkapan (24 Okt 2026)**

- GET /api/demos menyaring status disetujui di **kedua** jalur (Sanity dan cadangan memori) — sebelumnya jalur cadangan mengembalikan seluruh antrean termasuk IN REVIEW (F06).
- isionTool dihapus dari workspace submissions; Studio di-deploy ulang (F08).
- Log kegagalan tulis Sanity hanya mencatat nama error + status, bukan pesan mentah (F10).
- /videos kini membawa JSON-LD ItemList berisi 9 VideoObject (durasi ISO 8601) — video bisa tampil kaya di hasil pencarian.
- siteSettings punya contactEmail dan partnerEmail; halaman /tentang membacanya dari CMS, bukan hardcode.
- Dependensi: next 16.4.3, eslint-config-next 16.4.3, @sanity/client 8.11, motion 14.6, react/react-dom 19.3.1, @types/node 24.

**Perlindungan endpoint demo**

- Rate limit per IP: 5 kiriman per jam di `POST /api/demos`, 20 token unggah
  per jam di `POST /api/demo-audio`. Batasannya per instance fungsi (serverless
  tidak berbagi memori), jadi cukup menahan skrip, bukan pengganti quota
  global — begitu paket Vercel memungkinkan, aturan ini pindah ke edge.
- `Idempotency-Key` di `POST /api/demos`: percobaan ulang atau klik ganda
  mendapat jawaban yang sama, bukan baris kedua di antrean.
- Honeypot di formulir demo: field yang tak pernah dilihat orang, dan kiriman
  yang mengisinya dibuang tanpa jawaban yang berbeda.

### Changed

- **Node.js 24.22.1** dipin di `.nvmrc` dan `package.json`
  (`engines.node: ">=24.22.1 <25"`); CI membaca `.nvmrc`, dan project Vercel
  memakai `24.x` — sama dengan project Samsara Group.
- **Next.js 16.4.0 → 16.4.2.** Versi lama masuk tiga advisory, satu
  **critical**: RCE tanpa autentikasi di Image Optimization saat SVG dipakai.
  Dua lainnya: DoS di Server Actions dan RCE di fungsi `use cache` — yang
  terakhir relevan langsung, karena `lib/articles.ts` dan modul pembaca lain
  memakai `use cache`. Build sekarang menolak jalan di versi rentan
  (`SecurityFatalError`), jadi upgrade ini juga yang membuat deploy bisa jalan.
- `/api/revalidate` sekarang memverifikasi **tanda tangan Sanity**
  (`sanity-webhook-signature`, HMAC-SHA256 atas `<timestamp>.<raw body>`)
  selain header `x-webhook-secret`, dan **penerimaan `?secret=` di query**
  dihapus — secret tidak lagi pernah masuk URL dan access log.
- Halaman `/submit` di-*prerender* lagi: `crypto.randomUUID()` tidak boleh
  dipanggil saat render server, jadi kunci idempotensi dibuat saat formulir
  dikirim, bukan saat komponen dibuat.

- **Beranda** membuka diri pada grid 2×2 berisi empat kartu Latest News,
  diikuti strip Curated News berisi empat post kurasi terbaru.
- **`/journal` menjadi `/stories`.** Halaman memang bernama Stories, jadi
  alamatnya ikut. URL lama `/journal` dan `/journal/<slug>` menjawab **308**
  permanen ke alamat baru lewat route handler, sehingga tautan yang sudah
  dibagikan dan halaman yang sudah terindeks mendarat ke artikelnya.
- **`/videos` menjadi Melodi Samsara**: sembilan sesi panggung dan lima
  playlist. Bagian Bicara Melodi dihapus dari sana karena episodenya sudah punya
  halaman sendiri di `/bicara-melodi`.
- Satu daftar cerita bersama, `latestStories(8)` di `lib/articles.ts`, dipakai
  beranda, `/stories`, sitemap, dan feed — angka di semua halaman tidak mungkin
  berbeda.
- Aturan isi: Latest News dan Stories hanya memuat cerita dari **foto feed**
  Instagram. Cerita reel ditandai lewat `article.mediaType` dan ditahan dari
  daftar utama.
- Cover artikel dan pilar tampil pada rasio 4:5 native, memakai `object-cover`.
- Satu komponen `YoutubeThumb` untuk semua thumbnail: `srcset` 320w/480w/1280w
  dan fallback maxres → sd → hq. Sengaja bukan `next/image`, karena cache
  optimizer Vercel menahan gambar remote hampir setahun.
- Kartu artikel, pilar, dan video kini satu `<Link>` tunggal, sehingga seluruh
  area kartu bisa diklik.
- `/kurasi` dipanggil Curated News, dan bagian footer "#FaktaMusik & Esai
  Skena" mengarah ke `/stories`.
- **Nama berkas dirapikan** (22 Okt 2026), tanpa mengubah satu pun URL publik:
  `lib/content.ts` → `lib/content-fallback.ts` (dan tesnya ikut), `Reveal.tsx` →
  `motion/Reveal.tsx`, `app/(site)/sitemap.ts` → `app/sitemap.ts` (ikut
  konvensi Next, seperti `robots.ts`), `AUDIT-2026-10-21.md` →
  `audit-2026-10-21.md`, `scripts/seed-*.js` → `scripts/seed-*.cjs` (CommonJS
  dinyatakan eksplisit), `FrontCard` → `components/FrontCard.tsx`,
  `PillarHead` → `components/PillarHead.tsx`, `SubmitLink` →
  `components/SubmitLink.tsx`.

### Removed

- `/pahlawan-kota` beserta `lib/pahlawan.ts` — isinya pindah ke Sanity sebagai
  arsip dan tidak lagi tampil di situs.
- `/spaces` beserta `SPACE_ITEMS`.
- `VideosBrowser` dan arsip `/videos/arsip`.
- `JournalBrowser` — filter kategori dan pencarian yang pernah ada di Stories.
- `HeroArticle`, `FeatureCard`, `GENRE_ROWS`/`GenreRow`.
- `asOptions` di `lib/taxonomy.ts`, `videosByIds`, `videosByVenue`,
  `demoStoreConfigured`, `draftPreviewConfigured`, `thumbnailFor`, dan
  `interview.image`.
- Field `cardCurtain.featureLabel` dan `cardCurtain.featureCta` (juga di
  Studio), serta field Bicara Melodi di `videosPage`.
- `components/motion/ParallaxImage.tsx` — komponen gerak yang tidak pernah
  dipakai siapa pun.
- Export mati `feedArticles()` di `lib/articles.ts` — embodying aturan lama
  "hanya foto feed" yang sudah digantikan `latestStories(8)` — serta
  `latestVideos()` dan `topVideos()` di `lib/videos.ts`, yang namanya bentrok
  dengan namesake-nya di `lib/catalogue.ts`.

### Fixed

- Berkas audio 25 MB kini ditegakkan, lewat token unggah Blob dan batas
  `DEMO_AUDIO_MAX_BYTES`.
- Kontak PIC tersimpan dan dapat dibaca kurator.
- Selektor `:focus` tersedia di `globals.css`, sehingga seluruh interaksi
  reveal dapat dipakai dengan keyboard.
- Waktu baca artikel dihitung dan ditampilkan di kartu.
- `editorial-paper` akhirnya didefinisikan sebagai utility di `globals.css`.
- Antrean demo tidak lagi hilang saat server restart — sekarang tinggal di
  Sanity.
- Nama merek konsisten: masthead Melodi Alam, dan halaman memakai "Melodi
  Samsara" hanya untuk lini panggung.

### Security

- Audit keamanan 21 Oktober 2026 menghasilkan sepuluh temuan
  (F01–F10). Audit berjalan tanpa sandbox sistem operasi, sehingga **tidak
  satu pun temuan terkonfirmasi**; semuanya berstatus `needs_validation` dan
  belum diperbaiki. Ringkasan ada di `docs/audit-2026-10-21.md`, artefak
  lengkapnya disalin ke folder audit tim.
- **F03 ditutup.** `SANITY_PREVIEW_SECRET` sekarang menjadi secret sendiri
  untuk pratinjau draf, dan fallback ke `SANITY_REVALIDATE_SECRET` dihapus
  dari `lib/sanity-preview.ts`. Secret revalidasi yang pernah terekspos di log
  percakapan **sudah dirotasi**; nilai lama ditahan sebentar lewat
  `SANITY_REVALIDATE_SECRET_PREVIOUS` supaya webhook Sanity tetap jalan
  sampai dasbornya diarahkan ke secret baru.
- Pratinjau draf menjawab **404** untuk secret yang salah. Pemeriksaan secret
  dipindah ke `proxy.ts` (root), yang berjalan sebelum halaman dirender —
  sebelumnya `notFound()` muncul setelah respons mulai mengalir, jadi
  pembacanya mendapat halaman 404 dengan status **200**.
- `DATABASE_URL` — sisa era Supabase yang tidak dibaca kode mana pun —
  dihapus dari `.env` lokal.

### Known Issues

- `melodialam.id` belum resolve, jadi canonical, sitemap, dan kartu OG masih
  menunjuk `https://melodialam-website.vercel.app`.
- Blob store di Vercel belum dibuat, sehingga unggah audio demo membalas 400.
- `RESEND_API_KEY` belum diset; notifikasi email diam.
- Web Analytics terpasang tetapi belum dinyalakan di dasbor Vercel.
- Webhook Sanity: "Trigger on" idealnya **Create + Update**, tetapi pemeriksaan
  terakhir hanya menemukan **Create** tercentang — perubahan di Studio belum
  membersihkan cache situs.
- `SANITY_PREVIEW_SECRET` belum diset, jadi rute pratinjau memakai
  `SANITY_REVALIDATE_SECRET` sebagai gantinya.
- Belum ada CI: repositori tidak punya workflow `.github/`.
- Sepuluh temuan audit belum diperbaiki.
- `text-green-400` masih dipakai di dua tempat, di luar palet merek.

---

## [0.1.0] — 2026-10-14

Rilis pertama yang berjalan: port dari prototipe satu-berkas menjadi aplikasi Next.js
multi-halaman, terhubung ke katalog YouTube yang di-scrape dan ke set aset merek.

### Added

**Struktur aplikasi**

- Aplikasi Next.js 16 App Router dengan React 19 dan TypeScript. Build produksi
  menghasilkan 26 halaman statis.
- Delapan route: `/`, `/journal`, `/journal/[slug]`, `/bicara-melodi`, `/videos`,
  `/pahlawan-kota`, `/spaces`, `/submit`, plus route handler `/api/demos`.
- `app/not-found.tsx` untuk halaman yang tidak ada.

**Konten**

- `lib/content-fallback.ts` memuat 12 artikel lengkap dengan isi multi-paragraf, ditambah baris
  wawancara, baris genre, item ruang, item ticker, dan data seed demo.
- `lib/catalogue.json` — katalog **generated** berisi 292 video, 342 Shorts, 5 playlist,
  dan angka profil kanal. Dihasilkan dari hasil scrape kanal YouTube.
- `lib/catalogue.ts` — aksesor bertipe di atas katalog: filter per venue, pencarian,
  paginasi, `viewCount()`.

**Integrasi YouTube**

- `components/VideoModal.tsx` — pemutar modal bersama yang dibuka lewat *custom event*
  `melodi:watch`, tanpa route per-video.
- `components/WatchLink.tsx` — baris video yang tetap merender `href` nyata sehingga
  dapat di-*crawl* dan berfungsi tanpa JavaScript.
- Filter venue (Melodi Samsara, Melodi Taman, Interview, Arsip & Lainnya), pencarian, dan
  paginasi pada `/videos`.

**Pengiriman demo**

- `app/api/demos/route.ts` — `GET` dan `POST` dengan validasi per-field yang mengembalikan
  `422` beserta pesan per kolom. Batas panjang setiap field ditegakkan di batas route.
- `components/DemoPortal.tsx` — formulir demo dengan pratinjau audio lokal di peramban
  (berkas tidak pernah diunggah).

**Aset merek**

- `components/BrandMark.tsx` — medallion sebagai simbol situs, dan wordmark sub-merek
  Melodi Samsara. Keduanya dengan ambang ukuran render minimum yang terdokumentasi.
- `npm run brand` menghasilkan aset dari berkas sumber, termasuk `app/favicon.ico`
  multi-ukuran yang dibangun sendiri (16/32/48 dengan payload PNG) untuk menggantikan
  favicon bawaan Next.js.

**Fotografi**

- `npm run photos` menyalin set placeholder ke `public/photos`; 23 slot gambar diisi 23
  foto berbeda. Seluruh rujukan Unsplash dihapus, bersama `remotePatterns`-nya.

**Tipografi**

- Empat wajah huruf: **Inter** (teks badan, variable), **Red Hat Display** (judul pajang,
  variable), **Instrument Serif** (takarir miring), **JetBrains Mono** (metadata).

**Gerak**

- `components/motion/`: `MotionRoot` (jaminan `prefers-reduced-motion` secara global),
  `RevealText` (reveal bertopeng per kata), `ParallaxImage`, `CountUp`, dan `MarqueeTape`.
- Ticker atas kini digerakkan Motion dengan kecepatan terkopel ke velocity scroll.
- Delapan rujukan desain dipertahankan: reveal tanda strip, reveal gugus aksi baris,
  tirai gambar, bingkai siku, kartu keras, dan seterusnya.

**Dokumentasi**

- Sepuluh dokumen pengembangan di `docs/`, termasuk ketertelusuran requirement PRD, model
  data target, kontrak API, strategi uji, rencana deployment, dan audit keamanan.
- Tujuh Architecture Decision Record di `docs/adr/`.

### Changed

- Prototipe satu-berkas dipecah menjadi route. Beberapa perilaku sengaja berubah:
  - Artikel dibaca di `/journal/[slug]`, bukan di modal (`ADR-0001`).
  - Katalog video terhubung ke seluruh 292 video, bukan beberapa baris contoh.
- Port dev dan produksi dipindah dari 3000 ke **3100**, dipatok di skrip npm.
- `next/image` bermigrasi dari `priority` ke `preload` mengikuti deprecation di Next 16.
- Angka kanal di footer dibaca dari katalog generated, bukan ditulis tangan, sehingga
  tidak dapat melenceng dari hasil scrape.

### Fixed

- Delapan regresi nyata ditemukan dan diperbaiki selama pengembangan. Sebagian besar
  sempat tampak baik-baik saja, dan justru itu masalahnya.

- **Stylesheet gagal dibangun seluruhnya tanpa error.** Scanner konten Tailwind menyisir
  `.codegraph/` dan menabrak berkas SQLite yang terkunci, membuat Turbopack *panic* dan
  menghasilkan CSS kosong. Diperbaiki dengan direktif `@source not`.
- **Foto tampak buram karena pembungkus di-skala.** `transform: scale(1.22)` membuat
  browser me-*raster* pada ukuran layout lalu meng-*upscale* bitmap; gambar 1328 px
  dirender ke 1581 px. Diganti dengan kotak yang diperbesar.
- **Delapan gambar `fill` memiliki induk `static`.** Gambar 160 px direntangkan ke
  1296 px — upscale 8×. Diperbaiki dengan menambahkan `position: relative`.
- **Halaman hanya mendapat 1 `requestAnimationFrame` per detik.** Pembacaan `scrollWidth`
  di dalam *frame loop* memaksa reflow sinkron setiap frame, yang menghentikan callback
  `IntersectionObserver` dan membuat seluruh konten tertahan di `opacity: 0`. Diperbaiki
  dengan `ResizeObserver` dan penghentian saat di luar viewport.
- **Judul permanen tidak terlihat.** Keadaan tersembunyi ter-*bake* ke HTML
  server-rendered, sehingga satu callback yang terlewat membuatnya tidak pernah muncul.
  Prinsipnya dibalik: SSR merender keadaan akhir, animasi hanya memperkaya.
- **Dua belas bingkai kartu kolaps ke tinggi nol.** Kelas `aspect-[${ratio}]` dibangun
  lewat interpolasi, sehingga scanner Tailwind tidak pernah melihatnya; `aspect-[square]`
  juga bukan nilai valid. Diganti dengan pemetaan kelas literal.
- **Ikon tab masih menampilkan favicon Next.js.** ICO bawaan memuat entri 48/32/16
  sehingga lebih dipilih peramban daripada `icon.png` 512 px. Diganti dengan ICO merek.
- **`.gitnexus/run.cjs` ikut ter-*lint*** dan menghasilkan tiga error. Direktori tool
  ditambahkan ke `ignore` ESLint.

### Known Issues

Dicatat apa adanya, belum diperbaiki. Rincian di `docs/PRD-REFERENCE.md`.
Seluruh butir di bawah ini sudah ditutup pada `0.2.0`, kecuali dua butir terakhir.

- **Antrean demo hilang saat server restart.** Penyimpanannya array proses-lokal.
- **Berkas audio 25 MB tidak ditegakkan** (`BR-001`). Input memakai `accept="audio/*"`
  tanpa pemeriksaan ukuran, di klien maupun server.
- **Kontak PIC tidak pernah disimpan.** Ia hanya dikembalikan di dalam string `note`,
  sehingga kurator tidak punya cara menghubungi pengirim.
- **Tidak ada satu pun selektor `:focus`** di `globals.css`, sehingga seluruh interaksi
  reveal hanya bekerja pada hover dan tidak pada keyboard (`ACC-002`).
- **Waktu baca artikel belum dihitung** (`BR-004`).
- **Tidak ada fallback `onerror` pada gambar** (`NFR-001`).
- **`editorial-paper` dipakai di lima tempat tetapi tidak pernah didefinisikan.**
  Kelas mati.
- **`text-green-400` dipakai delapan kali** — hijau bawaan Tailwind, di luar palet merek.
- **Nama merek belum konsisten.** Header memakai wordmark berbunyi "MELODI SAMSARA";
  metadata dan footer memakai "MELODI ALAM".
- **Checkout bersih tidak dapat meregenerasi aset**, karena tiga skrip membaca berkas di
  luar repositori.
- **Tidak ada uji otomatis, CI, maupun analytics.**
