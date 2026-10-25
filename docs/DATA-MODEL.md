# DATA-MODEL — Melodi Alam Web Platform

> **Catatan (21 Okt 2026).** Dokumen ini **ditulis ulang dari nol**. Versi
> sebelumnya mendeskripsikan skema target Postgres + Payload CMS 3 dengan tabel
> SQL, indeks, RLS, migrasi, dan bucket Supabase. Rencana itu tidak pernah
> dijalankan: CMS-nya diganti **Sanity Studio** (ADR-0008), seluruh kode Payload
> dihapus, dan Supabase tidak lagi dipanggil kode mana pun.
>
> Yang ada sekarang: **dua dataset Sanity** — `production` (publik) dan
> `submissions` (privat) — plus satu katalog JSON hasil *build* sebagai arsip
> cadangan. Tidak ada tabel, tidak ada RLS, tidak ada migrasi.
>
> Dokumen lain di `docs/` sudah diberi catatan perpindahan ke Sanity (lihat
> ADR-0008 dan `docs/SANITY-INTEGRATION.md`). Dokumen ini sengaja tidak lagi
> mengulang istilah Postgres, RLS, atau Supabase Storage, karena tidak
> berlaku lagi — dan tidak mengarang skema pengganti untuk hal yang belum
> ada.

**Label status** (dipakai di seluruh dokumen):

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Ada di kode atau di data, dan sudah dibaca/diambil langsung dari sumbernya |
| `RENCANA` | Direncanakan, belum ada di sistem yang berjalan |
| `ASUMSI` | Diasumsikan; belum bisa dipastikan |
| `[PERLU VERIFIKASI]` | Tidak dapat dikonfirmasi dari sumber yang tersedia di repo |

**Sumber kebenaran skema:** `melodialam-sanity/sanity/schemaTypes/*.ts`.
**Sumber kebenaran baca sisi web:** `melodi-alam/lib/*.ts`.

---

## 1. Data Context

| Aspek | Nilai | Status |
|---|---|---|
| Produk | Situs media musik Indonesia: Stories, Watch (Melodi Samsara), Curated News, Bicara Melodi, Submit Demo, Tentang | `TERVERIFIKASI` |
| Store utama | Sanity CMS, **dua dataset**: `production` (publik) + `submissions` (privat) | `TERVERIFIKASI` (`lib/sanity-project.ts:31,34`) |
| Store kedua | `lib/catalogue.json` — katalog YouTube hasil *scrape*, dibangkitkan `npm run catalogue`, **tidak boleh diedit tangan** | `TERVERIFIKASI` (`lib/catalogue.ts:3`) |
| Store fallback | `lib/content-fallback.ts` — 12 artikel, 9 baris wawancara, 4 item ticker, 3 seed demo. Dipakai kalau Sanity tidak terjangkau | `TERVERIFIKASI` |
| Basis data relasional | **Tidak ada.** Tidak ada Postgres, tidak ada ORM, tidak ada migrasi | `TERVERIFIKASI` (ADR-0008; `package.json` tidak punya `payload`/`pg`/`drizzle`) |
| Role penulis | Kurator/editor lewat Sanity Studio (dua workspace: **Konten** dan **Submit Karya**) | `TERVERIFIKASI` (`melodialam-sanity/sanity.config.ts`) |
| Volume konten editorial | 12 artikel (6 foto + 6 reel), 9 baris wawancara, 9 video, 5 playlist, 55 post kurasi, 1 `siteSettings`, 1 `videosPage` | `TERVERIFIKASI` — dihitung ulang dari dataset `production` pada 21 Okt 2026 (lihat §6) |
| Volume katalog arsip | 292 video panjang, 342 Shorts, 5 playlist; `scrapedAt` = 14 Oktober 2026 | `TERVERIFIKASI` (`lib/catalogue.json`) |
| Rasio baca/tulis | Baca jauh lebih besar; tulis = 1 jenis saja (kiriman demo) + edit kurator | `ASUMSI` |
| Multi-tenant | Tidak. Jumlah kurator kecil (1–3) | `ASUMSI` |
| Hosting | Vercel → route handler serverless | `TERVERIFIKASI` (`package.json`) |

**Tujuan model data ini**, secara eksplisit:

1. Menjaga agar artikel, video, dan kurasi **tetap bisa dibaca tanpa token**
   (dataset `production` publik, CDN-friendly).
2. Menjaga agar **PII musisi** — nomor WhatsApp / email manajer — tidak pernah
   berada di dataset yang bisa dibaca publik. Karena itu `demoContact` hidup di
   dataset privat `submissions`, terpisah dari baris kiriman yang dibaca antrean
   publik.

---

## 2. Dua dataset

| Dataset | ACL | Tipe dokumen | Token | Dibaca oleh |
|---|---|---|---|---|
| `production` | **publik** | `siteSettings`, `article`, `interview`, `video`, `playlist`, `pillarPost`, `videosPage` (+ `pahlawanRow` gumasan, lihat §4.8) | tidak perlu | `lib/sanity.ts` → `contentClient` (`perspective: "published"`, `useCdn: false`) |
| `submissions` | **privat** | `demoSubmission`, `demoContact` | **wajib** (`SANITY_API_READ_TOKEN`) | `lib/sanity-server.ts` → `submissionsClient` |

Pemisahannya sengaja, dan mengikat:

- `lib/sanity.ts` **tidak memuat token** dan boleh diimpor dari mana saja,
  termasuk komponen klien.
- `lib/sanity-server.ts` (dataset `submissions`) dan `lib/sanity-preview.ts`
  (perspektif `drafts` di `production`) **memuat token** dan hanya boleh diimpor
  dari kode server.
- Project id (`03sgar5q`) dan nama dataset adalah **literal** di
  `lib/sanity-project.ts`, bukan variabel lingkungan, supaya checkout bersih
  tanpa `.env` tetap bisa membaca konten.

> `[PERLU VERIFIKASI]` Status privat dataset `submissions` (flag `private` di
> Sanity Manage) tidak bisa dikonfirmasi tanpa token: kueri anonim ke
> `submissions` untuk `count(*[_type == "demoSubmission"])` mengembalikan `0`
> (`200 OK`), dan dataset memang kosong saat ini — jadi yang terbukti adalah
> "tidak ada dokumen yang bocor", bukan "dataset dikunci". Bukti privatnya ada
> di ADR-0008 §Konsekuensi (kueri tanpa token mengembalikan `null` untuk
> dokumen yang kueri sama kembalikan dengan token).

---

## 3. Bentuk data di sisi web (read model)

Situs tidak membaca dokumen Sanity mentah. Setiap lapisan `lib/*.ts`
memetakan dokumen ke bentuk yang dipakai UI, dan **selalu punya fallback**.
Aturan fallback ini adalah bagian dari model data, jadi dicatat di sini.

| Lapisan | Fungsi | Sumber utama | Fallback kalau Sanity gagal |
|---|---|---|---|
| `lib/articles.ts` → `allArticles()`, `latestStories(n)`, `articleBySlug(slug)` | daftar & detail artikel | `article` | `ARTICLES` statis (12), diurutkan `dateISO` desc |
| `lib/articles.ts` → `feedArticles()` | **sudah dihapus** (21 Okt 2026) — pemanggilnya tidak pernah ada | `article` | idem |
| `lib/interviews.ts` → `allInterviews()` | baris Bicara Melodi | `interview` | `INTERVIEW_ROWS` statis (9) — dipakai hanya bila hasil CMS **0 baris** |
| `lib/videos.ts` → `allVideos()` | katalog video | `video` (terlebih dulu) lalu `lib/catalogue.json` | katalog arsip 292 video |
| `lib/videos.ts` → `allPlaylists()` | playlist | `playlist` | `PLAYLISTS` dari `catalogue.json` (5) |
| `lib/pillars.ts` → `allPillarPosts()` | pool kurasi | `pillarPost` | **tidak ada** → `[]`; bagian "Dari Feed" lalu tidak dirender |
| `lib/site-settings.ts` → `getSiteSettings()` | identitas situs, ticker, catatan kurasi, label panel hijau | `siteSettings` | per-field ke `lib/site.ts` + `lib/content-fallback.ts` |
| `lib/videos-page.ts` → `getVideosPageCopy()` | judul/catatan bagian `/videos` | `videosPage` | per-field ke konstanta `STATIC` di berkas itu |
| `app/api/demos/route.ts` | antrean demo | `demoSubmission` (dataset privat) | array in-memory `memoryQueue` berisi 3 `SEED_DEMOS`; kontak disimpan di `memoryContacts` |

Bentuk yang dipakai UI (`TERVERIFIKASI`, dibaca dari `lib/*.ts`):

```ts
// lib/articles.ts
export interface SiteArticle extends Article {   // Article = lib/content-fallback.ts
  richBody?: unknown[];        // Portable Text; undefined bila artikel statis
  source: "static" | "cms";
  mediaType: "foto" | "reel";
}

// lib/content-fallback.ts
export interface Article {
  slug: string; title: string; category: ArticleCategory;
  date: string;        // label tampil, mis. "10 Oktober 2026"
  dateISO: string;     // "2026-10-10"
  excerpt: string; note?: string;
  image: string; mediaType?: "foto" | "reel";
  body: string[];      // paragraf plain text — hasil proyeksi Portable Text
}

// lib/pillars-shared.ts
export interface PillarPost {
  id: string; pillar: string; title: string;
  mediaType: "foto" | "reel";
  date: string | null; igUrl: string;
  image: string | null; imageWidth: number | null; imageHeight: number | null;
}

// lib/videos.ts
export interface SiteVideo {
  id: string; title: string; duration: string; seconds: number;
  views: string; uploaded: string; featuring: string[]; venue: string; url: string;
  source: "cms" | "catalogue";
}
export interface SitePlaylist { id: string; title: string; count: string; url: string; }

// lib/interviews.ts
export interface SiteInterview {
  slug: string; artist: string; headline: string;
  videoId: string; caption: string; source: "cms" | "static";
}

// lib/taxonomy.ts
export interface DemoSubmission {
  id: string; artist: string; city: string; title: string;
  genre: string; program: string; link: string; story: string;
  status: DemoStatus; submittedAt: string;
}
```

### 3.1 Satu daftar cerita bersama

`latestStories(count = 8)` di `lib/articles.ts:216` adalah **satu-satunya**
daftar cerita yang dipakai lintas halaman: **cerita ber-`mediaType: "foto"`
terbaru lebih dulu, lalu cerita `reel` terbaru**, dipotong `count`.

Pemakai dan potongannya (`TERVERIFIKASI`):

| Pemakai | Potongan |
|---|---|
| Beranda `app/(site)/page.tsx:28-29` | `latestStories(8)` → 4 pertama (grid 2×2) |
| `/stories` `app/(site)/stories/page.tsx:18` | `latestStories(8)` → 8 kartu |
| Detail artikel `app/(site)/stories/[slug]/page.tsx:66` | `latestStories(8)` → blok "More {rubrik}" 3 kartu |
| Sitemap `app/sitemap.ts:15` | `latestStories(8)` |
| RSS `app/rss.xml/route.ts:29` | `latestStories(8)` |

Konsekuensinya: **angka daftar cerita tidak bisa berbeda antar halaman**, dan
cerita reel baru masuk daftar kalau seluruh cerita foto sudah habis.

---

## 4. Skema dataset `production`

Semua field di bawah dibaca dari `melodialam-sanity/sanity/schemaTypes/*.ts`.
Kolom "Wajib" mengikuti `validation: (rule) => rule.required()`.

### 4.1 `siteSettings` — singleton, id tetap `siteSettings`

Satu dokumen; di-pin di struktur Studio agar editor tidak bisa membuat yang
kedua (`melodialam-sanity/sanity/structure.ts:12`).

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `name` | string | ya | 60 | Nama situs, mis. "MELODI ALAM" |
| `tagline` | string | ya | 80 | Header + judul metadata, mis. "Stories & Watch" |
| `strapline` | string | tidak | 120 | Kalimat pendek di bawah logo |
| `owner` | string | tidak | 120 | Nama pemilik, mis. "By Infia Pariwara Nusantara" |
| `est` | string | tidak | 40 | Ditulis apa adanya, mis. "EST. 2017" |
| `description` | text | tidak | 300 | Meta description bawaan halaman yang tidak punya sendiri |
| `curationNote` | string | tidak | 60 | Teks kecil di samping judul bagian, mis. "kurasi redaksi" |
| `cardCurtain` | object | tidak | — | Copy panel hijau saat kartu di-hover (lihat di bawah) |
| `cardCurtain.articleLabel` | string | tidak | 24 | Label kanan atas kartu Stories. Kosong ⇒ "READ STORY" |
| `cardCurtain.articleCta` | string | tidak | 40 | Tombol bawah panel. Kosong ⇒ "Buka Catatan Redaksi" |
| `tickerItems` | array of object | tidak | maks 8 | Item ticker beranda |
| `tickerItems[].label` | string | ya | 200 | Teks ticker |
| `tickerItems[].href` | string | tidak | — | Path internal (`/submit`) atau URL penuh |

**`cardCurtain` sekarang hanya punya dua field: `articleLabel` + `articleCta`.**
Field `featureLabel` dan `featureCta` **dihapus dari skema** (commit Studio
`4cbde1e`) karena beranda berubah dari satu kartu hero penuh menjadi grid 2×2.
Kueri sisi web (`lib/site-settings.ts:77`) juga hanya memproyeksi dua field itu,
jadi field lama tidak pernah terpakai.

> `[PERLU VERIFIKASI]` Dokumen `siteSettings` yang live di dataset masih
> **memuat** kunci `cardCurtain.featureLabel` ("READ") dan
> `cardCurtain.featureCta` ("Baca Artikel Penuh") sebagai sisa data lama.
> Skema dan kueri sudah tidak mengenal keduanya, jadi tidak ada efek ke
> tampilan — tapi dokumennya belum dibersihkan.

`url` dan `locale` **sengaja tidak ada** di sini: asal harus datang dari
lingkungan (`NEXT_PUBLIC_SITE_URL`) supaya deployment pratinjau menghasilkan
canonical yang benar, dan locale adalah konstanta teknis.

### 4.2 `article` — 12 dokumen (6 foto + 6 reel)

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `title` | string | ya | 200 | Judul lengkap |
| `slug` | slug | ya | 96 | **Menjadi alamat URL** `/stories/<slug>`. `source: "title"`. Mengganti slug mematikan URL lama |
| `category` | string (radio) | ya | 4 nilai | Rubrik; nilai tersimpan di §4.2.1, label tampilan di `CATEGORY_LABELS` |
| `date` | date | ya | — | Tanggal terbit; dasar pengurutan dan `datePublished` JSON-LD |
| `mediaType` | string (radio) | ya | `foto` \| `reel` | **Sumber cerita.** Bawaan `foto`. Lihat §4.2.2 |
| `excerpt` | text | tidak | 300 | Dipakai di kartu, meta description, JSON-LD |
| `note` | text | tidak | 300 | Teks panel hijau saat hover. Kosong ⇒ pakai `excerpt` |
| `image` | image (hotspot) | tidak | — | Sampul terunggah |
| `imagePath` | string | tidak | — | Path lokal sementara, mis. `/photos/dsc09408.webp`. Dipakai **hanya** kalau `image` kosong. disembunyikan di Studio kalau `image` terisi |
| `body` | array (`block` + `image`) | tidak | — | Isi Portable Text |

#### 4.2.1 `category` — 4 nilai, 4 label

Nilai tersimpan (`ARTICLE_CATEGORY_VALUES` di `lib/taxonomy.ts`, diduplikasi di
`melodialam-sanity/lib/taxonomy.ts`) dan label yang ditampilkan:

| Nilai tersimpan | Label tampil |
|---|---|
| `Fakta Musik` | Fakta Musik & Esai |
| `Rekomendasi Melodi` | Fakta Musik |
| `Bicara Melodi` | Bicara Melodi Notes |
| `Liputan Panggung` | Liputan & Gig Report |

Rubrik yang tidak dikenal di data akan jatuh ke `Fakta Musik`, bukan tampil
`undefined` (`lib/articles.ts:154`).

#### 4.2.2 `mediaType` — `foto` (bawaan) atau `reel`

Ini satu-satunya field yang membedakan dua kelompok cerita, dan aturannya
berdiri sendiri:

- **`foto`** (6 dokumen) — cerita dari post feed foto Instagram.
- **`reel`** (6 dokumen) — cerita dari reel.

Aturan main: **"Latest News" dan "Stories" adalah daftar ber-gambar**, dan
bingkai video tidak bisa jadi kartu headline. Karena itu `latestStories()`
menaruh seluruh cerita foto lebih dulu, lalu cerita reel. Delapan cerita yang
tampil di `/stories` = **6 foto + 2 reel** (2 reel terbaru: *Spill Pilihan Lagu
Arctic Monkeys* dan *Dua Dekade Endah N Rhesa*), keduanya berbadge **"Reel"** di
kartu (`components/ArticleCards.tsx:73-77`).

Empat reel lain — `wsatcc-kisah-dari-selatan-jakarta`,
`hanin-dhiya-cinta-ini-membunuhku`, `sheila-on-7-single-baru`,
`a7x-dear-god-jakarta` — **tidak tertaut dari halaman mana pun**: tidak ada di
beranda, `/stories`, sitemap, RSS, maupun blok "More". Halaman
`/stories/<slug>`-nya sendiri tetap hidup.

> **Catatan desain yang sudah usang.** `SANITY-INTEGRATION.md` §3 pernah
> menyatakan bahwa `feedArticles()` yang dipakai beranda dan `/stories`, dan
> pernah menyebut "grid 6 kartu". Keduanya sudah tidak benar: halaman-halaman
> sekarang memakai `latestStories(8)`, `/stories` menampilkan 8 kartu, dan
> `feedArticles()` sendiri sudah dihapus (21 Okt 2026) karena tidak pernah ada
> pemanggilnya.

### 4.3 `interview` — 9 dokumen (index Bicara Melodi)

Ini **bukan** cerminan katalog video; ini short list pilihan editor. Statistik
dan thumbnail diambil dari dokumen `video` dengan `youtubeId` yang sama, jadi
tidak ada yang harus disinkronkan manual.

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `artist` | string | ya | 80 | Nama musisi |
| `headline` | string | ya | 140 | Judul episode, kapital semua |
| `youtubeId` | string | ya | 11 karakter | Pengikat ke video. Validasi custom `/^[\w-]{11}$/` |
| `caption` | string | tidak | — | Teks dalam kurung, mis. "bicara melodi ep.30" |
| `order` | number | tidak | — | Urutan tampil, kecil ke besar. Kosong ⇒ urut `artist` asc |

**Tidak ada field gambar.** Kartu memakai thumbnail YouTube yang diturunkan dari
`youtubeId` (`components/YoutubeThumb.tsx`), jadi mustahil meleset dari videonya.

### 4.4 `video` — 9 dokumen

Katalog video yang di-*input manual* oleh editor. Tidak ada API key, tidak ada
scraping.

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `youtubeId` | string | ya | 11 karakter | Pengikat ke entri katalog arsip |
| `title` | string | ya | 200 | Judul sesi |
| `publishedAt` | datetime | ya | — | Tanggal terbit **sungguhan**, bukan string "3d ago". Umur video dihitung saat render sehingga label tidak pernah basi |
| `durationSeconds` | number | tidak | ≥ 1 | Detik saja, mis. 816 untuk 13:36. Situs memformatnya |
| `views` | number | tidak | ≥ 0 | Angka mentah, mis. 1800. Diperbarui manual |
| `venue` | string (radio) | ya | 4 nilai | Program. Bawaan `Melodi Samsara` |
| `featuring` | array of string | tidak | — | Nama artis, satu per tag |

`venue` adalah *closed set* 4 nilai: `Melodi Samsara`, `Melodi Taman`,
`Interview`, `Arsip & Lainnya` — nilai yang sama dengan `VENUES` di
`lib/catalogue.ts`.

**Data saat ini:** 9 dokumen, **semuanya** `venue: "Melodi Samsara"`. Itulah
sebabnya `/videos` menampilkan tepat 9 sesi (halaman memfilter
`v.venue === "Melodi Samsara"` lalu mengambil 9 pertama).

**Aturan penimpaan:** Sanity menang atas katalog arsip untuk `youtubeId` yang
sama (`lib/videos.ts:227-230`). Jadi mengoreksi atau promoting video lama cukup
satu dokumen, tanpa impor ulang.

### 4.5 `playlist` — 5 dokumen

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `title` | string | ya | 120 | Judul playlist |
| `playlistId` | string | ya | — | ID playlist YouTube, mis. `PL3hstHxZXaodN-0xzofBkLXr9Plb0hC_r` |
| `count` | number | tidak | ≥ 0 | Jumlah video, dikelola manual. Situs memformatnya |
| `order` | number | tidak | — | Urutan tampil. Kosong ⇒ urut `count` desc |

Terpisah dari `video` karena playlist di YouTube bisa memuat video yang tidak
pernah dicatat di situs.

### 4.6 `pillarPost` — 55 dokumen (pool kurasi)

Post Instagram terkurasi, dikelompokkan per *pillar* konten. Pool-nya hidup di
Studio; situs merendernya di beranda (4 post foto terbaru) dan di `/kurasi`.

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `pillar` | string | ya | 9 nilai | Pillar konten (lihat tabel di bawah) |
| `title` | string | ya | 140 | Satu baris pembuka caption; muncul di kartu |
| `mediaType` | string | tidak | `foto` \| `reel` | Jenis post. Bawaan `foto` |
| `date` | date | tidak | — | Tanggal post |
| `likes` | number | tidak | — | Perkiraan dari tampilan Instagram. **Tidak diproyeksi kueri situs** — dekoratif untuk editor |
| `igUrl` | url | ya | — | Tautan post Instagram. Wajib — tanpa ini dokumen tidak dihitung |
| `image` | image (hotspot) | tidak | — | Gambar post |
| `order` | number | tidak | — | Urutan kurasi. Kosong ⇒ urut tanggal terbaru |

Kueri `lib/pillars.ts:28` hanya menghitung dokumen yang punya `igUrl` **dan**
`title`; sisanya diabaikan diam-diam.

Urutan baca: `order(coalesce(order, 9999) asc, date desc)`.

#### 4.6.1 Sembilan pillar

| Nilai `pillar` | Label | Set | Post saat ini |
|---|---|---|---|
| `fakta-musik` | Fakta Musik | Baca (foto) | **16** |
| `lirik` | Lirik | Baca (foto) | **3** |
| `trivia` | Trivia | Baca (foto) | **2** |
| `kutipan` | Kutipan Melodi Alam | Baca (foto) | **6** |
| `rekomendasi` | Rekomendasi Melodi | Tonton (reel) | **8** |
| `ulas-melodi` | Ulas Melodi | Tonton (reel) | **3** |
| `clipper` | Clipper | Tonton (reel) | **17** |
| `similar-song` | Similar Song | Tonton (reel) | **0** |
| `meme-humor` | Meme Humor | **tidak masuk set mana pun** | **0** |
| | | **Total** | **55** |

Dua hal yang berbeda statusesnya dan keduanya perlu diketahui editor:

- **`similar-song`** ada di skema dan ada di `REEL_PILLARS`, jadi kalau diisi
  postnya akan muncul di blok "Tonton". Saat ini **0 post**, jadi bagiannya
  tidak dirender dan chip-nya disembunyikan (chip dengan count 0 di-filter di
  `components/KurasiBrowser.tsx:61`).
- **`meme-humor`** ada di skema dan di `PILLAR_LABELS`, tapi **tidak ada di
  `PHOTO_PILLARS` maupun `REEL_PILLARS`**. Kalau diisi pun, postnya **tidak
  akan pernah muncul** di `/kurasi` dan tidak akan punya chip. Ini kekosongan
  skema, bukan sekadar pillar yang belum diisi.

Pembagian set ada di `lib/pillars-shared.ts:22-23`:
`PHOTO_PILLARS = ["fakta-musik","lirik","trivia","kutipan"]`,
`REEL_PILLARS = ["rekomendasi","ulas-melodi","clipper","similar-song"]`.

#### 4.6.2 Cara `/kurasi` menampilkannya

`components/KurasiBrowser.tsx` (komponen klien):

- Tanpa filter: **6 post per pillar** (`PILLAR_LIMIT = 6`).
- Dengan pencarian atau chip pillar: cap dilepas sampai `SEARCH_LIMIT = 48` per
  pilar, lalu bagian yang kosong dibuang.
- Pencarian mencocokkan `title` (lowercase, `includes`) **dan** label pillar.
- Chip: "Semua" + satu chip per pillar yang punya post — 8 chip tampil
  (Semua + 7 pillar).
- Dua blok: **"Baca — dari feed @melodi.alam"** (pillar foto) dan
  **"Tonton — dari feed @melodi.alam"** (pillar reel). Masing-masing bagian punya
  `id` = nilai pillar, jadi bisa di-anchor: `/kurasi#fakta-musik`.
- *Empty state*: "Belum ada post yang cocok. Coba kata kunci lain atau pilih
  'Semua'."

Jumlah post foto vs reel di pool: **25 foto + 30 reel** (55 total).

### 4.7 `videosPage` — singleton, id tetap `videosPage`

Copy untuk kepala bagian halaman Melodi Samsara. Di-pin di struktur Studio
(`structure.ts:12`).

| Field | Tipe | Wajib | Batas | Arti | Bawaan |
|---|---|---|---|---|---|
| `samsaraTitle` | string | tidak | 60 | Judul bagian sesi — jadi `h1` halaman | "Melodi Samsara" |
| `samsaraNote` | string | tidak | 60 | Catatan kecil di samping judul. **Kosong ⇒ dihitung otomatis** ("N sesi panggung") | — |
| `samsaraLinkLabel` | string | tidak | 60 | Label tautan ke kanal YouTube (tanpa `↗`; panah dilepas 25 Okt 2026) | "YouTube Channel" |
| `playlistsTitle` | string | tidak | 60 | Judul bagian playlist | "Playlists" |
| `playlistsNote` | string | tidak | 60 | Catatan kecil. Kosong ⇒ dihitung otomatis ("5 playlist publik • melodialam") | — |

**`videosPage` tidak lagi punya field apa pun untuk bagian "Bicara Melodi".**
Field-field itu dihapus dari skema (commit Studio `75b53c1`, "Drop the interview
copy from the Melodi Samsara page") dan bagiannya dihapus dari `/videos`
(commit situs `0b88aec`). Episode wawancara sekarang punya halaman sendiri,
`/bicara-melodi`, dengan judul dan label sendiri — tidak ada lagi dua set
heading yang harus dijaga sinkron.

Perilaku `samsaraNote` punya **tiga** keadaan, bukan dua (`lib/videos-page.ts:60-67`):

| Keadaan di Studio | Arti | Hasil di halaman |
|---|---|---|
| Field tidak pernah diisi | "hitung sendiri" | `"{N} sesi panggung"` dihitung live |
| Dikosongkan editor (string kosong) | "tidak mau ada catatan" | Catatan tidak dirender sama sekali |
| Teks lain | Ditampilkan apa adanya | Teks itu apa adanya |

Nilai live saat ini: `samsaraTitle: "Melodi Samsara"`,
`samsaraLinkLabel: "YouTube Channel"`, `playlistsTitle: "Playlists"`,
`samsaraNote: ""` (kosong → catatan disembunyikan), `playlistsNote` belum diisi
(→ dihitung otomatis).

### 4.8 Gumasan: `pahlawanRow` (3 dokumen)

Tipe `pahlawanRow` **masih terdaftar** di `contentSchemaTypes` dan masih ada
3 dokumennya di dataset `production`, tetapi:

- Rute `/pahlawan-kota` sudah dihapus dari situs.
- `lib/pahlawan.ts` sudah dihapus.
- Tidak ada kode sisi web yang membacanya.

Dokumen-dokumennya **arsip**. Diperlakukan sebagai gumasan, bukan bagian model
data yang berjalan. Fieldnya (`title`, `slug`, `artists`, `description`,
`image`, `imagePath`, `tags`, `order`) sengaja tidak punya `videoId` /
`articleSlug` — grup aksi READ/WATCH dihapus atas permintaan.

### 4.9 `lib/catalogue.json` — arsip build-time (bukan Sanity)

Tetap artefak *build-time* sesuai ADR-0004. Dibangkitkan `npm run catalogue` dari
`../melodi-alam-data.md`; **dilarang diedit tangan**.

Struktur atas (`lib/catalogue.ts:45-71`):

```ts
{
  meta: {
    channelId, channelName, handle, handleUrl, subscribers, totalViews,
    declaredVideos, joined, country, instagramFollowers, instagramPosts,
    scrapedAt                       // "14 Oktober 2026"
  },
  profile: Record<string, { platform: string; metric: string;
                            value: string; href: string | null }>,
  counts: { videos: 292, shorts: 342, playlists: 5,
            byVenue: { "Melodi Samsara": 101, "Interview": 143,
                       "Arsip & Lainnya": 9, "Melodi Taman": 39 } },
  videos: CatalogueVideo[], shorts: CatalogueShort[], playlists: CataloguePlaylist[]
}
```

Bentuk `CatalogueVideo`:

```ts
export interface CatalogueVideo {
  id: string;        // YouTube video id, mis. "irtr9SnyTxM"
  title: string;
  duration: string;  // "13:36"
  seconds: number;   // 816
  views: string;     // string display YouTube, mis. "1.8K"
  uploaded: string;  // relatif saat scrape, mis. "3d ago"
  ageBucket: string | null;
  featuring: string[];
  venue: string;
  url: string;
}
```

Catatan integritas (`TERVERIFIKASI`):

- `ageBucket` bertipe `string | null`; **17 nilai** teramati saat ini:
  `0-30d, 1-3mo, 1mo, 1y, 10mo, 11mo, 2mo, 2y, 3mo, 3y, 4mo, 4y+, 5mo, 6mo, 7mo,
  8mo, 9mo`. Nilainya turunan dari tanggal scrape, **bukan** konstanta produk.
- `uploaded` juga relatif hasil scrape dan bisa basi. `lib/videos.ts` mengikat
  offsetnya ke tanggal scrape (`CATALOGUE_ANCHOR`) agar labelnya bergerak ke
  arah yang benar, bukan membeku.
- `duration` **tidak** disimpan terpisah di Sanity: `durationSeconds` di
  `video` adalah sumbernya dan situs memformatnya (`formatDuration()`), supaya
  tidak ada dua sumber kebenaran.
- `views` adalah string rounded ("1.8K") sehingga tidak bisa diurutkan
  numerik. Untuk video Sanity, `views` adalah angka mentah dan situs
  memformatnya sendiri (`formatViews()` di `lib/videos.ts`).

---

## 5. Skema dataset `submissions` (privat)

### 5.1 `demoSubmission`

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `artist` | string | ya | 120 | Band / solois |
| `city` | string | ya | 80 | Kota asal |
| `title` | string | ya | 160 | Judul lagu / EP |
| `genre` | string | tidak | 6 nilai | `DEMO_GENRES`. **Tidak wajib** di skema |
| `program` | string | tidak | 3 nilai | `DEMO_PROGRAMS`. **Tidak wajib** di skema |
| `link` | url | ya | — | Link streaming / EPK |
| `story` | text | ya | 2000 | Cerita singkat |
| `status` | string (radio) | ya | 4 nilai | Status moderasi. Bawaan `IN REVIEW` |
| `submittedAt` | date | ya | — | Tanggal kirim (`YYYY-MM-DD`) |
| `audioName` | string | tidak | — | Nama berkas audio. **readOnly** |
| `audioUrl` | url | tidak | — | **URL berkas di Vercel Blob.** `readOnly` |

`DEMO_GENRES` (6): `Indie Pop / Folk`, `Alternative Rock / Shoegaze`,
`Surf Rock / Punk`, `R&B / Soul / Jazz`, `Ska / Reggae / Dub`,
`Electronic / Experimental`.

`DEMO_PROGRAMS` (3): `Review Artikel dan Rekomendasi IG`,
`Live at Melodi Samsara`, `Tamu Podcast Bicara Melodi`.

`DEMO_STATUSES` (4): `IN REVIEW`, `SHORTLISTED (SAMSARA)`,
`APPROVED (ARTICLE)`, `ARCHIVED`.

Enum di atas ada di **dua repo** (`lib/taxonomy.ts` di masing-masing repo) dan
sengaja diduplikasi: Studio tidak bisa mengimpor dari repo web saat build, dan
repo web tidak boleh bergantung pada repo Studio. Mengubah satu berarti
mengubah yang lain.

**`audioUrl` adalah URL Vercel Blob** — bukan path Supabase Storage, bukan
field base64, dan tidak ada `audio_bytes` / `audio_mime` terpisah. Yang ada
hanya `audioName` + `audioUrl`, keduanya `readOnly` di Studio supaya editor
tidak bisa menunjuk berkas yang bukan milik kiriman itu.

> **Catatan jujur tentang "read-only di Studio".** Deskripsi field di skema
> menulis "hanya terbaca oleh pengguna Studio". Itu benar selama objeknya
> berada di store privat — tetapi saat ini unggahan memakai
> `access: "public"` (`components/DemoPortal.tsx:113`), jadi URL-nya secara
> teknis bisa dibuka siapa pun yang punya tautannya. Lihat §9.

### 5.2 `demoContact` — PII, dokumen terpisah

| Field | Tipe | Wajib | Batas | Arti |
|---|---|---|---|---|
| `submission` | reference → `demoSubmission` | ya | — | Kiriman yang memiliki kontak ini |
| `contact` | string | ya | 160 | Nomor WhatsApp atau email manajer. **Tidak pernah tampil di situs** |

Kenapa dokumen terpisah, bukan field di `demoSubmission`? Karena baris
kiriman dibaca query publik (`app/api/demos/route.ts:91`) dan nilai PII tidak
pernah ikut terbawa. `demoContact` tidak ada di proyeksi mana pun yang dipakai
situs.

**Kirim dari publik selalu membuat dua dokumen:** `demoSubmission` lalu
`demoContact` yang mereferensikannya (`app/api/demos/route.ts:295-318`).

---

## 6. Isi data saat ini

Dihitung ulang dengan kueri GROQ langsung ke dataset `production` pada
**21 Oktober 2026** (tanpa token, perspektif `published`).

| Tipe | Jumlah | Rincian |
|---|---|---|
| `article` | **12** | 6 `foto` + 6 `reel` |
| `pillarPost` | **55** | 25 `foto` + 30 `reel`; lihat rincian per pillar di §4.6.1 |
| `interview` | **9** | Season 3 |
| `video` | **9** | seluruhnya `venue: "Melodi Samsara"` |
| `playlist` | **5** | `count` belum diisi di dokumen Sanity (`null`) — situs memakai `-` |
| `siteSettings` | **1** | singleton |
| `videosPage` | **1** | singleton |
| `pahlawanRow` | **3** | arsip, tidak dirender |
| `demoSubmission` | **0** | dataset privat; queue publik kosong |
| `demoContact` | **0** | dataset privat |

Jumlah artikel per rubrik: Fakta Musik 5 · Rekomendasi Melodi 3 · Bicara
Melodi 2 · Liputan Panggung 2.

---

## 7. Relasi antar dokumen & perilaku hapus

Tidak ada satu pun relasi yang ditegakkan Sanity sebagai foreign key. Semua
"relasi" di bawah adalah referensi yang dibaca kueri.

| Relasi | Kardinalitas | Owned oleh | Hapus | Status |
|---|---|---|---|---|
| `demoContact.submission` → `demoSubmission` | 1 : 1 (praktis) | `demoContact` | **Manual** — menghapus kiriman di Studio **tidak** menghapus kontak (PII) | `TERVERIFIKASI` |
| `pillarPost` → `article` | tidak ada | — | — | Tidak ada FK; relasi editorial lewat `igUrl`/konten |
| `article` → `video` | tidak ada | — | — | Tidak ada FK. Blok "More {rubrik}" memakai daftar bersama, bukan referensi |
| `interview.youtubeId` → `video.youtubeId` | 1 : 0..1 | `interview` | Tidak otomatis | Diturunkan dari string, bukan reference. Kalau video dihapus, baris wawancara tetap render (tanpa statistik) (tanpa statistik) |
| `siteSettings` → seluruh situs | — | — | — | Singleton; tidak boleh ada yang kedua (di-pin di struktur Studio) |
| `videosPage` → `/videos` | — | — | — | Singleton; sama |

**Perilaku hapus yang perlu diketahui kurator (semua `RENCANA` untuk
diperbaiki):**

- Menghapus dokumen `demoSubmission` di Studio **meninggalkan `demoContact`
  (PII) dan objek audio (publik) hidup selamanya**. Tidak ada trigger, webhook,
  atau job pembersih. Lihat `docs/audit-2026-10-21.md` temuan F07.
- Menghapus dokumen `article` **tidak** menghapus gambar di CDN Sanity; aset
  gambar berdiri sendiri dari dokumennya.
- Mengubah `slug` artikel mematikan URL lama. Tidak ada redirect otomatis
  (bukan seperti `/journal` → `/stories` yang memang punya redirect 308).

---

## 8. Moderasi antrean demo

Modelnya, sesuai ADR-0005 dan PRD §BR-002:

1. Setiap kiriman baru **selalu** lahir dengan `status: "IN REVIEW"`.
   Nilainya bukan variabel dari request — `DEMO_INITIAL_STATUS` dipakai
   langsung di `app/api/demos/route.ts:306`.
2. Baris `IN REVIEW` **tidak pernah** tampil di antrean publik.
   `GET /api/demos` hanya mengambil `status in $approved`, dengan
   `DEMO_APPROVED_STATUSES = ["SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)"]`.
3. Kurator memindahkan status di Studio (workspace **Submit Karya**). Subtitle
   pratinjau dokumen di Studio memberi tanda ✅ untuk dua status disetujui, 📦 untuk
   `ARCHIVED`, dan 🕓 untuk `IN REVIEW`.
4. Hanya dua status itu yang boleh tampil publik. `ARCHIVED` adalah keadaan
   terminal untuk kiriman yang sudah ditinjau lalu diparkir.

Hal-hal yang tidak ada, dan memang tidak diklaim ada:

- **Tidak ada endpoint kurator.** Perubahan status hanya lewat antarmuka Studio.
- **Tidak ada audit siapa/kapan memutuskan.** Field `reviewed_by` /
  `reviewed_at` **tidak ada** di skema Sanity — tidak ada pencatat riwayat
  keputusan selain timestamp Sanity sendiri (`_updatedAt`).
- **Tidak ada state machine transisi.** Empat nilai status adalah daftar
  bebas yang bisa disetel editor dalam urutan apa pun.
- **Tidak ada penghapusan otomatis** untuk `IN REVIEW` yang tidak pernah
  ditinjau → tidak ada retensi PII yang terjadwal (§12).

---

## 9. Penyimpanan objek: Vercel Blob

Tidak ada Supabase Storage. Penyimpanan objek untuk audio demo memakai
**Vercel Blob**.

| Aspek | Nilai | Status |
|---|---|---|
| Layanan | Vercel Blob, paket `@vercel/blob` 2.8 | `TERVERIFIKASI` (`package.json`) |
| Kredensial | `BLOB_READ_WRITE_TOKEN` | `RENCANA` — **belum di-set**, jadi `POST /api/demo-audio` menjawab **400** dan unggahan gagal |
| Jalur | Browser → langsung ke Blob (signed upload), lalu `/api/demos` menerima **URL**-nya | `TERVERIFIKASI` (`components/DemoPortal.tsx:112-118`) |
| Kunci objek | `demo-audio/{timestamp}-{nama file asli}` | `TERVERIFIKASI` |
| Akses | `access: "public"` — dipilih di sisi peramban | `TERVERIFIKASI` |
| Batas ukuran | 25 MB = `25 * 1024 * 1024` byte | `TERVERIFIKASI` (`lib/taxonomy.ts:76`) |
| Tipe diterima | `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/ogg` | `TERVERIFIKASI` |
| Ekstensi diterima | `.mp3`, `.wav`, `.ogg` | `TERVERIFIKASI` |

**Tiga lapis penjaga batas 25 MB** — ketiganya `TERVERIFIKASI`:

1. **Peramban** (`components/DemoPortal.tsx:54-93`): cek ekstensi, cek tipe MIME
   (tipe kosong dianggap sah karena beberapa peramban melapor MIME kosong untuk
   WAV), cek `file.size` sebelum file diterima.
2. **Server** (`app/api/demos/route.ts:236-255`): cek ekstensi `audioName` dan
   `audioSize` dari metadata yang dilaporkan request, serta memastikan `audioUrl`
   berawalan `https://` dan berakhiran salah satu ekstensi yang diizinkan.
3. **Token unggah** (`app/api/demo-audio/route.ts:26-30`): `handleUpload` dengan
   `allowedContentTypes` + `maximumSizeInBytes`, jadi batasnya ditegakkan Blob
   sendiri.

> **Catatan jujur.** Lapis 3 baru berlaku begitu `BLOB_READ_WRITE_TOKEN` ada.
> Selama token belum di-set, unggahan tidak pernah terjadi sama sekali —
> formulir menampilkan "Audio gagal diunggah" dan pengunjung dapat mengirim
> tanpa berkas. Lapis 1 dan 2 sudah aktif.

Yang **belum** ada (`RENCANA`, lihat `docs/audit-2026-10-21.md` F01, F04, F05):

- Server belum menentukan kunci objek maupun `access`; keduanya masih
  diserahkan ke peramban.
- Kunci objek memakai **nama file asli** — belum disanitasi.
- Belum ada job pembersih objek, jadi token unggah yang bocor bisa menulis
  objek milik operator yang tak pernah dihapus.
- Audio demo **publik** selama `access: "public"`. Belum ada bucket privat +
  signed URL.

---

## 10. Akses data & privasi

Pengganti langsung dari seksi RLS lama. Yang mengatur akses sekarang:

| Dataset | Dibaca siapa | Token | Yang terlindungi |
|---|---|---|---|
| `production` | siapa pun yang tahu project id `03sgar5q` | tidak | Tidak ada data sensitif di sini |
| `submissions` | hanya kode server | `SANITY_API_READ_TOKEN` | `demoContact.contact` (PII) |
| Blog Blob | siapa pun yang punya URL-nya | — | Objek audio demo (sementara `access: "public"`) |

Prinsip yang masih berlaku:

- **PII tidak pernah ikut di query publik.** `APPROVED_QUERY`
  (`app/api/demos/route.ts:91`) memproyeksi 10 field dan `contact` bukan salah
  satunya. Pesan balasan ke pengirim juga tidak memuat kontak
  (`note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik."`).
- **Token tidak pernah menyentuh bundel klien.** Dijaga oleh pemisahan berkas
  (`lib/sanity.ts` tanpa token vs `lib/sanity-server.ts` / `lib/sanity-preview.ts`).
- **Tidak ada RLS, tidak ada policy, tidak ada role kurator.** Dataset privat Sanity *menggantikan* mekanisme policy: seluruh baris dataset privat hanya
  bisa dibaca dengan token, sedangkan dataset publik tidak punya baris sensitif
  sama sekali. Ini lebih sederhana dan, untuk satu kurator, cukup.

> `[PERLU VERIFIKASI]` `lib/sanity-server.ts` dan `lib/sanity-preview.ts` tidak
> memakai `import "server-only"`. Penjaga sekarang adalah konvensi
> (tidak ada `"use client"` yang menyentuh keduanya), bukan jaminan build.
> Lihat `docs/audit-2026-10-21.md` §3.

---

## 11. Lifecycle, cache, dan revalidasi

### 11.1 Siklus hidup dokumen

| Tipe | Dibuat | Diubah | Dihapus |
|---|---|---|---|
| `article` | Kurator, di Studio | Kurator | Hard delete di Studio. Gambar di CDN tetap ada |
| `pillarPost` | Kurator | Kurator | Hard delete |
| `interview` | Kurator | Kurator | Hard delete. `youtubeId` tidak terikat ke `video` |
| `video` | Kurator | Kurator | Hard delete. Katalog arsip tidak ikut terhapus |
| `playlist` | Kurator | Kurator | Hard delete |
| `siteSettings` / `videosPage` | Sekali, di-pin | Kurator | — |
| `demoSubmission` | **`POST /api/demos`** (server) | Kurator (status di Studio) | Hard delete di Studio — **kontak & audio tertinggal** |
| `demoContact` | Bersamaan dengan kiriman | Tidak pernah (immutable) | **Manual** — tidak ada cascade |

Tidak ada soft delete di mana pun. Sanity menyimpan riwayat versi sendiri
(versioning), tetapi itu bukan soft delete yang bisa difilter.

### 11.2 Cache

Semua lapisan baca memakai Cache Components Next.js: `"use cache"` +
`cacheLife("minutes")` + `cacheTag(...)`.

| Tag | Dipasang di | Membaca |
|---|---|---|
| `articles` | `lib/articles.ts:61` | `allArticles()`, `articleBySlug()` |
| `pillar-posts` | `lib/pillars.ts:26` | `allPillarPosts()` |
| `interviews` | `lib/interviews.ts:15` | `allInterviews()` |
| `siteSettings` | `lib/site-settings.ts:23` | `getSiteSettings()` |
| `videos` | `lib/videos.ts:21` | `allVideos()`, `allPlaylists()` |
| `videosPage` | `lib/videos-page.ts:21` | `getVideosPageCopy()` |

Enam tag. `POST /api/revalidate` membuang keenam-enam-nya sekaligus
(`app/api/revalidate/route.ts:30-36`) dengan `revalidateTag(tag, "max")`.

Rute revalidasi menolak apa pun yang tidak bisa membuktikan secret-nya:
secret dibaca dari header `x-webhook-secret` atau query `?secret=`, dibandingkan
dengan `timingSafeEqual`, dan `SANITY_REVALIDATE_SECRET` yang kosong membuat
rute menjawab **500** (bukan diam-diam membiarkan cache kosong).

> `RENCANA` / perlu diperbaiki: webhook Sanity idealnya memicu **Create +
> Update**. Hanya "Create" yang tercentang per pemeriksaan terakhir, sehingga
> menyunting draf yang sudah terbit belum tentu memicu pembuangan cache.

### 11.3 Pratinjau draf

`/preview/<type>/<slug>?secret=…` membaca perspektif **`drafts`** dari dataset
`production` memakai token. Dua jenis yang didukung: `journal` (draf artikel)
dan `kurasi` (post kurasi).

- Tanpa secret yang cocok → **404** (bukan 403), supaya draf tidak bisa dibaca
  tanpa secret.
- `robots: { index: false, follow: false }`.
- Secret: `SANITY_PREVIEW_SECRET` saja (`lib/sanity-preview.ts:38-40`). Tidak ada
  fallback ke `SANITY_REVALIDATE_SECRET` sejak 22 Okt 2026.

> `TERVERIFIKASI` 22 Okt 2026: `SANITY_PREVIEW_SECRET` sudah di-set, jadi saat ini satu secret
> melayani dua kapabilitas (baca draf + invalidasi cache), dan secret diterima
> lewat query string. Lihat `docs/audit-2026-10-21.md` F03.

---

## 12. Yang masih RENCANA / belum tersambung

Hal-hal berikut **tidak ada di sistem yang berjalan** dan tidak boleh
dibaca seolah-olah ada:

| Hal | Status | Catatan |
|---|---|---|
| Basis data relasional, tabel, indeks SQL, RLS, migrasi | **Tidak pernah ada** | Digantikan Sanity (ADR-0008). Skema Postgres di versi lama dokumen ini dibuang |
| Panel kurator khusus | `RENCANA` | Yang ada adalah Sanity Studio itu sendiri (workspace "Submit Karya") |
| Audit keputusan moderasi (`reviewed_by`, `reviewed_at`) | `RENCANA` | Tidak ada fieldnya di skema |
| Retensi PII terjadwal | `RENCANA` | Tidak ada job penghapus untuk kiriman `IN REVIEW`/`ARCHIVED` |
| Penghapusan kontak + audio saat kiriman dihapus | `RENCANA` | F07 |
| Rate limit pada `POST /api/demos` & `/api/demo-audio` | **`TERVERIFIKASI`** 22 Okt 2026 (5/jam & 20/jam per IP) | F02; tiap kiriman = 2 tulis Sanity + 1 email |
| Idempotensi kirim (`Idempotency-Key`) | **`TERVERIFIKASI`** 22 Okt 2026 | F02 |
| Blob store + `BLOB_READ_WRITE_TOKEN` | `RENCANA` | Belum ada → unggah audio 400 |
| Notifikasi email (`RESEND_API_KEY`) | `RENCANA` | Kodenya ada (`app/api/demos/route.ts:134-191`) tapi **inert** tanpa key |
| `SANITY_PREVIEW_SECRET` terpisah | `TERVERIFIKASI` | Sudah dipasang; fallback sudah dihapus (22 Okt 2026) |
| Webhook Sanity "Trigger on: Update" | `RENCANA` | Yang tercentang hanya "Create" |
| Pillar `similar-song` berisi post | `RENCANA` | Skema dan set sudah siap; 0 post |
| Pillar `meme-humor` dirender | **Perlu perbaikan skema** | Ada di skema & label, tapi tidak ada di `PHOTO_PILLARS`/`REEL_PILLARS` → tidak akan pernah tampil |
| `visionTool()` dimatikan di workspace privat | `RENCANA` | F08: GROQ bebas atas dataset privat bagi siapa pun yang punya akses workspace |

### 12.1 Keadaan lingkungan (per 21 Oktober 2026)

> **Sumber tabel ini: `docs/audit-2026-10-21.md` §5, bukan pemeriksaan ulang.**
> Status environment Vercel hanya bisa dibaca dengan akses dashboard, jadi
> nilainya ikut apa adanya dari audit tersebut.

| Variabel | Status | Dampak kalau kosong |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Ada | Canonical, sitemap, dan OG memakai origin `vercel.app` selama `melodialam.id` belum resolve |
| `SANITY_API_READ_TOKEN` | Ada | Tanpa ini `submissionsClient` = `null` → antrean demo jatuh ke array in-memory (3 seed) dan **kiriman tidak tersimpan** |
| `SANITY_REVALIDATE_SECRET` | Ada | Tanpa ini `POST /api/revalidate` menjawab 500 dan pratinjau ikut mati |
| `SANITY_PREVIEW_SECRET` | Sudah | Terpisah dari secret revalidasi |
| `BLOB_READ_WRITE_TOKEN` | Belum | Unggah audio 400 |
| `RESEND_API_KEY` | Belum | Notifikasi email tidak terkirim |

---

## 13. Checklist konsistensi

| Cek | Status |
|---|---|
| Setiap tipe punya field yang ditelusuri ke kode yang membacanya | Ya — kolom "Arti" di §4/§5 |
| Setiap field punya tempat validasi yang jelas | Ya — kolom "Bajib"/"Batas" |
| Tipe privat tidak masuk dataset publik | Ya — `melodialam-sanity/sanity/schemaTypes/index.ts:26-37` |
| Tidak ada field yang di-proyeksi tapi tidak dipakai | Ya, kecuali `pillarPost.likes` (dekoratif untuk editor) |
| PII tidak pernah diproyeksi ke query publik | Ya — `APPROVED_QUERY` tidak memuat `contact` |
| Setiap lapisan baca punya fallback yang jelas | Ya — tabel §3 |
| Tiap cache tag punya rute yang membuangnya | Ya — 6 tag, 6 di `CONTENT_TAGS` |
| Dua dataset punya sumber skema yang sama | Ya — `melodialam-sanity/lib/taxonomy.ts` & `melodi-alam/lib/taxonomy.ts` (duplikasi disengaja) |
| Angka daftar cerita konsisten antar halaman | Ya — semua membaca `latestStories(8)` |
| Tidak ada klaim tentang Postgres/RLS sebagai sistem berjalan | Ya — dibuang di versi ini |

---

## Catatan Verifikasi

**Dibaca langsung dari sumber:**

- `melodialam-sanity/sanity/schemaTypes/*.ts` — `article.ts`, `pillarPost.ts`,
  `siteSettings.ts`, `interview.ts`, `video.ts`, `playlist.ts`, `videosPage.ts`,
  `demoSubmission.ts`, `demoContact.ts`, `pahlawanRow.ts`, `index.ts` (penuh).
- `melodialam-sanity/sanity/structure.ts`, `melodialam-sanity/sanity.config.ts`,
  `melodialam-sanity/lib/taxonomy.ts` (penuh).
- `melodi-alam/lib/`: `articles.ts`, `pillars.ts`, `pillars-shared.ts`,
  `catalogue.ts`, `interviews.ts`, `content.ts`, `taxonomy.ts`, `site.ts`,
  `site-settings.ts`, `videos.ts`, `videos-page.ts`, `sanity.ts`,
  `sanity-server.ts`, `sanity-preview.ts`, `sanity-project.ts`,
  `content.test.ts` (penuh).
- `melodi-alam/app/`: `(site)/page.tsx`, `(site)/stories/page.tsx`,
  `(site)/stories/[slug]/page.tsx`, `(site)/kurasi/page.tsx`,
  `(site)/videos/page.tsx`, `(site)/bicara-melodi/page.tsx`,
  `(site)/submit/page.tsx`, `(site)/tentang/page.tsx` (sebagian),
  `app/sitemap.ts`, `(site)/journal/route.ts`,
  `(site)/journal/[slug]/route.ts`, `(site)/preview/[type]/[slug]/page.tsx`,
  `api/demos/route.ts`, `api/demo-audio/route.ts`, `api/revalidate/route.ts`,
  `rss.xml/route.ts`, `robots.ts` (penuh).
- `melodi-alam/components/`: `ArticleCards.tsx`, `KurasiBrowser.tsx`,
  `DemoPortal.tsx`, `YoutubeThumb.tsx`, `VideoRow.tsx` (penuh),
  `VideoModal.tsx` (grep), `motion/MotionRoot.tsx`.
- `melodi-alam/app/globals.css` — blok utility (`hover-reveal-curtain`,
  `corner-frame`, `dash-reveal-*`, `video-action-reveal`) dan blok
  `prefers-reduced-motion`.
- `melodi-alam/package.json` — dependensi & skrip.
- `melodi-alam/docs/adr/0008-sanity-studio-menggantikan-payload.md`,
  `docs/SANITY-INTEGRATION.md`, `docs/audit-2026-10-21.md`.
- `melodi-alam/docs/ARCHITECTURE.md`, `docs/SECURITY-PRIVACY.md`,
  `docs/TEST-STRATEGY.md`, `docs/API-CONTRACTS.md`, `docs/DEPLOYMENT.md` —
  **di-*grep*** untuk istilah usang (RLS, Postgres, `feedArticles`, "6 kartu"),
  bukan dibaca penuh.

**Dijalankan / dihitung:**

- Kueri GROQ anonim ke dataset `production` (perspektif `published`, API
  `2026-05-19`) pada 21 Oktober 2026:
  - `count` per tipe: article 12, pillarPost 55, interview 9, video 9,
    playlist 5, siteSettings 1, videosPage 1, pahlawanRow 3,
    demoSubmission 0, demoContact 0.
  - Rincian `pillarPost` per pillar: fakta-musik 16, lirik 3, trivia 2,
    kutipan 6, rekomendasi 8, ulas-melodi 3, clipper 17, similar-song 0,
    meme-humor 0 — total 55. Media: 25 `foto` + 30 `reel`.
  - Rincian `article` per `mediaType`: 6 `foto` + 6 `reel`; daftar slug, tanggal,
    rubrik, dan jumlah blok Portable Text.
  - `video`: 9 dokumen, seluruhnya `venue: "Melodi Samsara"`.
  - `interview`: 9 dokumen, `order` 1–9 berurutan.
  - `playlist`: 5 dokumen, seluruhnya `count: null`.
  - `siteSettings` live: `cardCurtain` memuat 4 kunci (2 di antaranya sudah
    dilepas dari skema) dan 4 `tickerItems`.
  - `videosPage` live: `samsaraNote: ""`, `playlistsNote: null`.
- `node -e` pada `lib/catalogue.json`: `counts` (292/342/5), `byVenue`
  (Samsara 101, Interview 143, Arsip & Lainnya 9, Melodi Taman 39), 17 nilai
  `ageBucket` berbeda, 0 `ageBucket` null, 19 kunci `profile`.
- `npm test` → **20/20 lulus** (`lib/content-fallback.test.ts`, Vitest 3.2.7) — termasuk
  aturan `BR-004` (waktu baca) dan `pillarDate()`.
- Pencarian seluruh repo (`app/**`, `components/*.tsx`, `lib/*.ts`) untuk
  `latestStories`, `allPillarPosts`, `allInterviews`,
  `allVideos`, `allPlaylists`, `getSiteSettings`, `getVideosPageCopy` — dipakai
  untuk memetakan read model.

**Tidak diperiksa / tidak diklaim:**

- Status privat dataset `submissions` di Sanity Manage (butuh akun) — lihat
  §2 dan §10.
- Keadaan sebenarnya environment Vercel (daftar env, Blob store, Resend,
  Web Analytics) — diambil dari `docs/audit-2026-10-21.md`, bukan diukur ulang
  di dokumen ini.
- Jumlah halaman statis hasil build — **tidak dihitung ulang** di sini. Angka
  yang tercatat di ADR-0008 untuk build 21 Oktober 2026 adalah **33 halaman
  statis**; angka lain (26 / 28 / 32) berasal dari build lebih lama, jadi
  tidak diklaim sebagai fakta dokumen ini.
- Perilaku lintas peramban, penilaian SEO nyata, dan indeksasi mesin
  pencari.
- Efektivitas cache tag di produksi (diasumsikan bekerja sesuai
  `docs/audit-2026-10-21.md` §4).

**Selisih yang ditemukan antara acuan dan sumber nyata** — dicatat agar tidak
menjadi "kebenaran" diam-diam (pemeriksaan ulang per 21 Okt 2026, sore; beberapa
dokumen lain sedang direvisi bersamaan, jadi daftar ini berumur pendek):

1. ~~`docs/SANITY-INTEGRATION.md` §3/§6 masih menyebut `feedArticles()` dan
   "grid 6 kartu".~~ **Tertutup 21 Okt 2026**: sekarang semua halaman memakai
   `latestStories(8)`, `/stories` menampilkan 8 kartu, dan `feedArticles()`
   dihapus dari `lib/articles.ts`.
2. ~~`docs/ARCHITECTURE.md` mendaftarkan dan menjelaskan `feedArticles()`
   sebagai bagian API.~~ **Tertutup 21 Okt 2026**: entri tersebut dihapus dari
   tabel modul dan dari daftar API.
3. Dokumen `siteSettings` live masih menyimpan `cardCurtain.featureLabel` dan
   `featureCta` yang sudah tidak ada di skema.
4. `videosPage` live punya `samsaraNote: ""` (kosong → catatan disembunyikan),
   sedangkan komentar di skema menyebut "Kosong = dihitung otomatis" — dua
   keadaan yang berbeda, dan kode membedakannya (§4.7).
5. `pillarPost.likes` ada di skema tapi tidak diproyeksi kueri situs.
6. `meme-humor` ada di skema dan label, tapi tidak masuk set pillar mana pun.
7. ~~`lib/articles.ts` masih mengekspor `feedArticles()`.~~ **Tertutup 21 Okt
   2026**: fungsi itu dihapus, bersama `latestVideos()`/`topVideos()` di
   `lib/videos.ts` yang namanya bentrok dengan namesake-nya di `lib/catalogue.ts`.
8. Angka `byVenue` katalog arsip berbeda dari versi dokumen lama
   (`Interview` 143, bukan 118; `Arsip & Lainnya` 9, bukan 34) karena katalog
   dibangkitkan ulang.

---

## Open Questions

1. **Pillar `meme-humor`.** Mau dimasukkan ke `PHOTO_PILLARS` atau
   `REEL_PILLARS` di `lib/pillars-shared.ts`, atau dihapus dari skema Studio
   dan dari `PILLAR_LABELS`? Selama tidak diputuskan, pillar itu tidak bisa
   diisi.
2. **Pillar `similar-song`.** Ada di `REEL_PILLARS` tapi 0 post. Biarkan
   kosong, atau isi sekalian? Kalau rencana editorialnya berubah, set-nya di dua repo
   harus ikut berubah.
3. **Empat reel yang tidak tertaut.** `wsatcc`, `hanin`, `sheila`, `a7x` tidak
   muncul di halaman mana pun. Apakah tiap reel menunggu padanan post foto
   (seperti yang tertulis di deskripsi `mediaType`), atau daftar ini perlu
   ditambah supaya semuanya punya tempat?
4. **Audio demo publik.** `access: "public"` sekarang. Apakah objeknya
   sebaiknya privat dengan signed URL, atau tetap publik? Lihat temuan F04 di audit.
5. **Retensi PII.** Berapa lama `demoContact` dan objek audio disimpan setelah
   kiriman ditutup? Tidak ada job yang membersihkan keduanya.
6. **Audit moderasi.** Perlu field `reviewedBy` / `reviewedAt` di
   `demoSubmission`, atau riwayat versi Sanity cukup?
7. **Sisa field `cardCurtain` di dokumen live.** Apakahnya dibersihkan
   (hapus kunci `featureLabel`/`featureCta` dari dokumen), atau dibiarkan
   sebagai data mati yang tidak dibaca?
8. **`video.count` di `playlist`.** Kelima dokumen Sanity punya `count: null`,
   jadi situs menampilkan `-`. Diisi manual, atau diambil dari kanal YouTube?
9. **Label `Rekomendasi Melodi` yang tampil sebagai "Fakta Musik".** Nilai
   tersimpan sudah tidak sesuai label tampilnya sejak lama. Apakah perlu
   dipisah supaya rubrik terlihat apa adanya di UI?
10. **`audioName` dan `audioUrl` read-only.** Editor tidak bisa mengoreksi
    tautan yang salah. Cukupkan dengan validasi, atau biarkan?
