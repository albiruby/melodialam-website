# Landing Page — News-First Homepage (28 Okt 2026)

**Status:** `TERVERIFIKASI` — `tsc`, lint, 42 test, build 62 halaman,
screenshot 1440/1280/768/390/360, axe 0 pada 390/1280.

## Tujuan

Homepage dibuat **langsung berita**: pembaca bertemu judul berita utama, bukan
manifesto brand. Arah visual mengikuti referensi **BIOTA** (halaman depan koran:
lead besar, sidebar, baris berita), dengan bahasa visual Melodi Alam yang sudah
ada — putih, garis tipis, forest, dan satu band gelap.

## Lima modul

| # | Modul | Isi |
|---|---|---|
| 01 | **Top News — lead + sidebar** | H1 = judul lead; foto 3:2; deck; sidebar `Latest` 3 berita |
| 02 | **More Top News** | 3 kartu berita; grid 3 kolom |
| 03 | **Originals** | Samsara (poster + 2 setlist) + Bicara Melodi (3 baris teks) |
| 04 | **Curated** | 1 feature + 2 pendamping; grid 6:3:3 |
| 05 | **Submit** | blok forest terpusat, satu CTA |

## Keputusan per modul

### 01 — Top News lead + sidebar

- **H1 adalah judul lead article**, bukan “Musik yang didengar lebih dekat.”.
  Tagline brand tidak lagi memenuhi layar pertama; identitas dipikul lockup,
  tipografi, dan aksen forest.
- Label kecil di atas lead: `Top News` + tanggal artikel.
- Lead: kategori/tanggal, H1, deck maksimal dua baris, foto 3:2.
- Seluruh lead adalah satu `<Link>`; tidak ada CTA per kartu.
- Sidebar `Latest` 4 kolom:
  - berita kedua sebagai `SidebarLead` dengan foto **4:5** (format IG);
  - dua berita berikutnya sebagai baris teks tanpa garis pemisah.
- Mobile: lead full-width, sidebar turun menjadi daftar di bawahnya.

### 02 — More Top News

- Section bar kecil: `MORE TOP NEWS` + **Semua berita**.
- Tiga kartu berita; desktop 3 kolom, mobile baris horizontal (foto **4:5**
  kecil + judul).
- Setiap kartu: kategori/tanggal + judul. Tanpa excerpt, tanpa CTA.

### 03 — Originals

- Section bar `ORIGINALS` + **Tonton semua**.
- Samsara: poster 16:9, judul, `Samsara Bogor · durasi`, dua setlist (judul +
  durasi).
- Bicara Melodi: tiga baris teks, artis + judul obrolan. Tanpa thumbnail,
  caption episode, atau nomor.
- Monokrom: putih/abu di atas ink; hijau hanya untuk interaksi Play dan CTA
  Submit. Section ini satu-satunya momen gelap.

### 04 — Curated

- Section bar `CURATED` + **Semua kurasi**.
- **6:3:3** dalam satu baris di desktop:
  - feature 6 kolom, **4:5**;
  - dua pendamping 3 kolom, **4:5**.
- Di 1280 feature sekitar 600×750 dan pendamping 300×375 — lebih kecil
  daripada 8:4 sebelumnya (800×1000), tetapi tetap utuh dalam format IG.
- Feature dan pendamping hanya judul + pillar/tanggal. Tidak ada “Buka di IG” di
  kartu homepage; seluruh kartu adalah tautan.
- Mobile: feature sebagai baris horizontal (foto **4:5** kecil + teks); dua
  pendamping juga baris horizontal **4:5**.

### 05 — Submit

- Blok forest terpusat, label `OPEN SUBMISSION`.
- H2 “Punya karya untuk didengar?”, satu kalimat, satu tombol **Submit Karya**.
- Tidak ada fine print atau tombol partner di homepage; kontak partner tetap di
  footer dan `/tentang`.

## Penamaan

| Lama | Baru |
|---|---|
| `Front Page` (nav `/`) | **Top News** |
| `Latest News` (dokumen lama) | **Top News** |
| Section homepage `Stories` | **Top News** |
| `Semua cerita` | **Semua berita** |
| `Curated News` (nav, h1, metadata) | **Curated** |
| Breadcrumb JSON-LD `Latest News` | **Top News** |

`Stories` tetap menjadi nama arsip editorial di `/stories`; `Top News` adalah
feed berita utama di homepage. `Curated` tetap section terpisah agar tidak ada
dua label “Top News”.

## Shell

- **Ticker dihapus dari shell dan schema.** Field `tickerItems` di Studio dan
  `TICKER_ITEMS` di fallback sudah dihapus; tidak ada data ticker yang dirender.
- **Header satu baris:** lockup kiri, nav desktop kanan, menu di bawah `xl`.
  Tagline, owner, dan Instagram keluar dari masthead; Instagram pindah ke
  drawer/footer.
- **Footer:** struktur tetap; ukuran teks naik (body 13 px, bottom bar 11 px)
  dan garis 2 px diganti 1 px.

## Data dan test

`selectHomeContent` sekarang mengembalikan:

- `lead`: 1 artikel (judul menjadi H1);
- `sidebar`: 3 artikel;
- `more`: 3 artikel;
- `setlist`: 2 sesi;
- `curatedRest`: 2 post;
- `interviews`: 3.

Total 7 artikel dipakai di Top News. `lib/home.test.ts` diperbarui untuk
`sidebar`/`more`; test, build, dan axe dijalankan pada pass ini (lihat QA).

## Audit gambar Curated

- Tiga gambar Curated berasal dari Sanity CDN. Semuanya `naturalWidth > 0`,
  `complete`, dan tidak ada request yang gagal.
- Kotak abu-abu di screenshot sebelumnya adalah **state loading** (lazy image
  belum selesai), bukan aset hilang atau query kosong.
- Perbaikan: tiga gambar Curated sekarang `loading="eager"` dengan
  `fetchPriority="low"`, container memakai `bg-neutral-100`, dan label
  `Memuat` sampai gambar menutupinya.
- `MelodiAlamLockup` diberi `aspect-ratio` eksplisit; issue CLS
  “lazy-loaded images should have explicit dimensions” hilang dari console.

## QA

- `npx tsc --noEmit` — bersih.
- `npm run lint` — bersih.
- `npm test` — 42 test lulus.
- `npm run build` — 62 halaman statis, sukses.
- Screenshot 1440/1280/768/390/360: tidak ada overflow horizontal, tidak ada
  gambar rusak; sidebar, More Top News, Originals, Curated, nav, dan footer
  diperiksa terpisah di 390/768.
- Axe 390 dan 1280 — 0 violation.
- Console: hanya 404 `/_vercel/insights/script.js` di server lokal; analytics
  Vercel memang tidak aktif di localhost.
- `prefers-reduced-motion` global tetap aktif; fokus keyboard memakai outline
  forest, dan white di band gelap.

## Perbandingan dengan versi awal

Versi awal membuka dengan ticker, masthead tengah, grid 2×2 Latest News dengan
ringkasan dan CTA per kartu, lalu empat kartu Curated. Versi sekarang:

- masthead satu baris, tanpa ticker;
- lead story + sidebar `Latest`, lalu tiga kartu More Top News;
- Originals sebagai band gelap;
- tiga kartu Curated 6:3:3 dengan cover 4:5;
- satu CTA Submit;
- footer satu baris copyright.

Perbaikan utamanya: hierarki lead/sidebar/More lebih jelas, cover IG tidak
terpotong, teks per kartu berkurang, CTA tidak berulang, dan ritme gambar lebih
variatif (lead 3:2, kartu 4:5, video 16:9). Route, CMS, form submit, dan identitas
brand tetap sama.

## Sanity Studio

- `siteSettings` sekarang hanya berisi `name`, `curationNote`, `cardCurtain`,
  `contactEmail`, `partnerEmail`. Field ticker, tagline, strapline, owner, est,
  dan description dihapus dari schema; field kontak ditambahkan.
- Curated beranda mengikuti urutan `order` dari **Konten Pillar** (lalu tanggal);
  tidak ada field baru.
- Copy `article` dan `pillarPost` diperbarui ke istilah Top News/Curated.
- Studio dideploy ke `https://melodi-alam.sanity.studio/` (2/2 skema).

## Catatan

- Komponen `HomeHero`, `StoriesSpread`, dan `FrontCard` dihapus; penggantinya
  `components/home/TopNews.tsx`.
- Ticker, `MarqueeTape`, `SectionMarker`, dan `TICKER_ITEMS` dihapus dari kode
  dan schema.
- `Curated News` masih muncul di dokumen historis (CHANGELOG, PRD, FRONTEND-PLAN)
  sebagai nama lama; dokumen current memakai **Curated**.
