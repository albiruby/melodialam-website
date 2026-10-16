# DATA-MODEL — Melodi Alam Web Platform

Dokumen ini mendefinisikan model data platform web **Melodi Alam**: bentuk entitas
yang ada hari ini, skema relasional target di balik Payload CMS 3 + Supabase,
aturan integritas, indeks, Row Level Security, storage, dan jalur migrasi.

Isi dipisahkan eksplisit menjadi dua keadaan, mengikuti konvensi
`docs/ARCHITECTURE.md`:

- **Current State — TERVERIFIKASI.** Bentuk data yang benar-benar ada di repo
  `melodi-alam/`. Setiap field dibaca langsung dari sumber.
- **Proposed State — RENCANA.** Skema target. Belum diimplementasikan; fase ini
  **DOCS ONLY** — tidak ada migrasi yang dijalankan.

Label status: `TERVERIFIKASI` (dibaca di kode atau dijalankan), `RENCANA`
(direncanakan, belum ada), `ASUMSI` (diasumsikan), `[PERLU VERIFIKASI]` (tidak
dapat dikonfirmasi dari sumber).

Acuan keputusan: ADR-0002 (Payload 3 in-app + Supabase), ADR-0003 (Supabase =
Postgres + Storage), ADR-0004 (video catalogue tetap build-time), ADR-0005
(moderated demo queue). Acuan requirement: `FR-001`…`FR-007`, `BR-001`…`BR-004`,
`OQ-001`, `OQ-002`, `NFR-001`…`NFR-004`, `RISK-001`…`RISK-003`.

> **⚠️ Digantikan sebagian — baca ini dulu.**
> Dokumen ini disusun saat backend direncanakan memakai **Payload CMS 3 + Supabase**.
> Sejak itu CMS-nya diganti dengan **Sanity Studio**, dan seluruh kode Payload sudah
> dihapus.
>
> Bagian yang tidak lagi berlaku di dokumen ini: skema Postgres, RLS, migrasi, dan tabel
> koleksi. Lihat
> [`adr/0008-sanity-studio-menggantikan-payload.md`](adr/0008-sanity-studio-menggantikan-payload.md)
> dan [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md) untuk keadaan sekarang. Bagian lain
> di dokumen ini masih relevan sejauh tidak menyangkut backend.

---

## 1. Data Context

| Aspek | Nilai | Status |
|---|---|---|
| Produk | Situs media musik Indonesia: Stories, Watch, Submit Demo, showcase ekosistem | `TERVERIFIKASI` (brief §1) |
| Store saat ini | **Tidak ada database.** Konten = literal TypeScript + JSON generated; satu-satunya store yang bisa berubah = array in-memory di `app/api/demos/route.ts` | `TERVERIFIKASI` |
| Store target | Supabase Postgres (via adapter `@payloadcms/db-postgres`) + Supabase Storage | `RENCANA` (ADR-0002, ADR-0003) |
| ORM / query layer | Payload CMS 3 collections; migrasi digenerate Payload/Drizzle | `RENCANA`; nama persis `[PERLU VERIFIKASI]` |
| Role penulis | Kurator/editor non-teknis lewat `/admin` | `RENCANA` |
| Volume konten editorial | 12 artikel, 3 interview row, 3 genre row, 5 space item, 4 ticker item, 3 seed demo | `TERVERIFIKASI` (dihitung di `lib/content.ts`) |
| Volume katalog video | 292 video panjang, 342 Shorts, 5 playlist | `TERVERIFIKASI` (`lib/catalogue.json`) |
| Rasio baca/tulis | Baca jauh lebih besar; tulis hanya demo submission + edit kurator | `ASUMSI` (ARCHITECTURE §2.3) |
| Multi-tenant | Tidak. Jumlah kurator kecil (1–3) | `ASUMSI` |
| Hosting | Vercel → route handler serverless, state in-memory tidak reliabel | `TERVERIFIKASI` (`package.json`) + `ASUMSI` |

**Tujuan utama skema ini**, secara eksplisit: memisahkan (a) baris yang boleh
dibaca publik dari (b) baris dan kolom yang hanya untuk kurator — terutama data
pribadi `contact` yang hari ini dikumpulkan tetapi **tidak pernah disimpan**
(`TERVERIFIKASI`, §6). Skema ini adalah tempat PII itu akhirnya mendarat, di
tabel terpisah yang tidak punya policy baca publik.

---

## 2. Current State — TERVERIFIKASI

Bagian ini adalah bentuk data nyata per dokumen ini ditulis. Semua field dibaca
dari `lib/content.ts`, `lib/catalogue.ts`, `lib/catalogue.json`, dan
`app/api/demos/route.ts`. Nama tipe di kode dipertahankan apa adanya; nama tabel
target (`articles`, `video_sessions`, dst.) adalah `RENCANA`.

### 2.1 `Article` — `lib/content.ts`

```ts
export type ArticleCategory =
  | "Fakta Musik" | "Rekomendasi Melodi" | "Bicara Melodi" | "Liputan Panggung";

export interface Article {
  slug: string; title: string; category: ArticleCategory;
  date: string;        // label tampil, "10 Oktober 2026"
  dateISO: string;     // "2026-10-10"
  excerpt: string; image: string;
  body: string[];      // paragraf plain text, bukan HTML
  featured?: boolean;
}
```

| Objek | Jumlah | Bukti |
|---|---|---|
| `ARTICLES` | 12 | `lib/content.ts` |
| `ARTICLE_CATEGORIES` | 4 (kunci `CATEGORY_LABELS`) | `lib/content.ts` |
| `INTERVIEW_ROWS` (`InterviewRow`) | 3 | `lib/content.ts` |
| `GENRE_ROWS` (`GenreRow`) | 3 | `lib/content.ts` |
| `SPACE_ITEMS` (`SpaceItem`) | 5 | `lib/content.ts` |
| `TICKER_ITEMS` | 4 | `lib/content.ts` |
| `SEED_DEMOS` | 3 | `lib/content.ts` |

Catatan integritas `TERVERIFIKASI`:

- `body` sengaja `string[]` plain, bukan HTML — komentar di `lib/content.ts`
  menyatakan ini mencegah content layer menyuntik markup.
- `dateISO` selalu ada di 12 artikel; tidak ada konsep draft/publish di kode.
- `CATEGORY_LABELS` memetakan kategori → label tampil ("Fakta Musik & Esai" dst.).
  Itu urusan presentasi, bukan nilai tersimpan (lihat §4.1).
- Direktori `/pahlawan-kota` kini Sanity-first: baris dibaca dari dokumen
  `pahlawanRow` lewat `lib/pahlawan.ts`; `GENRE_ROWS` di `lib/content.ts` hanya
  fallback statis. Field `videoId`/`articleSlug` dihapus bersama grup aksi
  READ/WATCH (permintaan pemilik).

### 2.2 `VideoSession` — as stored in `lib/catalogue.json`

Nama tipe di kode adalah **`CatalogueVideo`** (`lib/catalogue.ts`), bukan
`VideoSession`. `video_sessions` adalah nama tabel target (`RENCANA`, §4.2).

```ts
export interface CatalogueVideo {
  id: string;           // YouTube video id, mis. "irtr9SnyTxM"
  title: string;
  duration: string;     // "13:36"
  seconds: number;      // 816
  views: string;        // display string YouTube, mis. "1.8K"
  uploaded: string;     // relatif, mis. "3d ago"
  ageBucket: string | null;  // mis. "0-30d"
  featuring: string[];  // mis. ["ENDAH N RHESA"]
  venue: string;
  url: string;
}
```

`venue` adalah closed set. 4 nilai, dan hanya itu, muncul di data:

```
"Melodi Samsara" | "Melodi Taman" | "Interview" | "Arsip & Lainnya"
```

`VENUES` di `lib/catalogue.ts` mendeklarasikan urutan filter yang sama, dan
`VENUE_COUNTS` memetakan tiap venue → `COUNTS.byVenue`. `ageBucket` bertipe
`string | null`; 17 nilai teramati di data saat ini:
`0-30d, 1mo, 2mo, 3mo, 4mo, 5mo, 6mo, 7mo, 8mo, 9mo, 10mo, 11mo, 1-3mo, 1y, 2y,
3y, 4y+`. Nilai itu turunan dari tanggal scrape, bukan konstanta produk, jadi
**tidak** dijadikan `CHECK` (`RENCANA`, §4.2).

### 2.3 Struktur top-level `lib/catalogue.json`

File ini generated (`npm run catalogue`) dari `../melodi-alam-data.md` dan
**tidak boleh diedit tangan**. Kunci top-level: `meta`, `profile`, `counts`,
`videos`, `shorts`, `playlists`.

```ts
{
  meta: {
    channelId: "UCv7pHhArYIFvrnGfnELSfQA",
    channelName: "Melodi Alam",
    handle: "melodialam", handleUrl: "https://www.youtube.com/@melodialam",
    subscribers: "20.9K", totalViews: "1.998.173",
    declaredVideos: 635,          // number, beda dari meta lain yang string|null
    joined: "16 Maret 2017", country: "Indonesia",
    instagramFollowers: "221K (220K saat render)",
    instagramPosts: "5.872",
    scrapedAt: "14 Oktober 2026"
  },
  profile: Record<string, { platform: string; metric: string;
                            value: string; href: string | null }>,
  counts: { videos: 292, shorts: 342, playlists: 5,
            byVenue: { "Melodi Samsara": 101, "Arsip & Lainnya": 34,
                       "Interview": 118, "Melodi Taman": 39 } },
  videos: CatalogueVideo[], shorts: CatalogueShort[], playlists: CataloguePlaylist[]
}
```

Kunci `profile` berpola `platform_metric`, mis. `youtube_subscriber`,
`instagram_followers`, `linktree_bergabung_sejak`. `meta` dan `profile` berisi
string display YouTube/Instagram, sebagian bernilai `null`.

**Keputusan `RENCANA` (ADR-0004):** `meta`, `profile`, `counts`, `videos`,
`shorts`, `playlists` **tetap artefak build-time** dan **tidak** dimigrasikan ke
Postgres. Halaman publik membacanya dari `lib/catalogue.json` seperti sekarang.
Yang perlu tabel hanyalah baris sesi yang dikurasi manusia (lihat §4.2 dan Open
Questions).

### 2.4 `DemoSubmission` — `lib/content.ts`

```ts
export interface DemoSubmission {
  id: string; artist: string; city: string; title: string;
  genre: string; program: string; link: string; story: string;
  status: string;         // free text
  submittedAt: string;    // ISO date-only, "2026-10-12"
}
```

Enum yang mengikat `genre`/`program` (keduanya `readonly [ ... ] as const`):

```ts
DEMO_GENRES = [
  "Indie Pop / Folk", "Alternative Rock / Shoegaze", "Surf Rock / Punk",
  "R&B / Soul / Jazz", "Ska / Reggae / Dub", "Electronic / Experimental",
]                                   // 6 nilai

DEMO_PROGRAMS = [
  "Review Artikel dan Rekomendasi IG", "Live at Melodi Samsara",
  "Tamu Podcast Bicara Melodi",
]                                   // 3 nilai
```

`status` hari ini **bukan** enum. Nilai free-text nyata yang ada di kode:

| Nilai `status` | Sumber |
|---|---|
| `SELECTED FOR SAMSARA LIVE` | `SEED_DEMOS[0]` |
| `SHORTLISTED BY EDITOR` | `SEED_DEMOS[1]` |
| `IN CURATION QUEUE` | `SEED_DEMOS[2]` |
| `NEW SUBMISSION • JUST NOW` | di-set `POST /api/demos` |

### 2.5 `SpaceItem` — `lib/content.ts`

```ts
export interface SpaceItem {
  slug: string; label: string; title: string;
  price: string | null;    // "IDR 2.499.000" | null
  href: string | null;     // tautan Instagram | null
  image: string;           // "/photos/..."
  ratio: "tall" | "square";   // closed set
  dark: boolean;
}
```

`ratio` adalah closed set 2 nilai (dipakai `FRAME_SHAPE` di
`components/ArticleCards.tsx`). Urutan render = urutan array `SPACE_ITEMS` —
tidak ada field sort di kode (`RENCANA`: `sort_order`, §4.4).

### 2.6 Satu-satunya store yang bisa berubah

`app/api/demos/route.ts` `TERVERIFIKASI`:

```ts
const queue: DemoSubmission[] = [...SEED_DEMOS];   // module-level array
```

- `GET` → `200 { queue, count }`. Store **process-local**, reset saat restart.
  Ini **bukan** database.
- `POST` → validasi lalu `queue.unshift(entry)`.
- Cap field (trim + `slice`): `artist 120`, `city 80`, `title 160`, `genre 60`,
  `program 80`, `link 500`, `contact 160`, `story 2000`.
- `400` bila body bukan JSON; `422 { error, errors }` bila field wajib kosong,
  `link` tidak diawali `http://`/`https://`, atau `genre`/`program` di luar enum;
  `201 { ok, entry, queueLength, note }` bila sukses.
- Validasi `genre`/`program` bersifat **kondisional** (`if (genre && !…`) — nilai
  kosong lolos di server; hanya `select` di UI yang selalu mengirim default.

**`contact` tidak pernah dipersistensi.** `POST` hanya memantulkannya di string
`note`:

```
`Kontak manajer (${contact}) dicatat terpisah dan tidak tampil di daftar publik.`
```

Jadi hari ini **tidak ada PII at rest** — tetapi juga **tidak ada cara kurator
menghubungi artis**. File audio adalah preview lokal (`URL.createObjectURL`) dan
**tidak diunggah** ke mana pun.

---

## 3. Entity-Relationship Diagram — RENCANA

```mermaid
erDiagram
  articles {
    uuid id PK
    text slug UK
    text title
    text category
    date published_at
    boolean featured
  }
  video_sessions {
    uuid id PK
    text source_video_id UK
    text title
    text venue
    bigint view_count
  }
  demo_submissions {
    uuid id PK
    text public_ref UK
    text artist
    text city
    text genre
    text program
    text moderation_status
    text reviewed_by FK
    date submitted_at
  }
  demo_contacts {
    uuid submission_id PK_FK
    text contact
  }
  ecosystem_items {
    uuid id PK
    text slug UK
    text label
    text ratio
    integer sort_order
  }
  users {
    uuid id PK
    text email
  }

  demo_submissions ||--|| demo_contacts : "menyimpan kontak (1:1, PII)"
  users          |o--o{ demo_submissions : "mereview (reviewed_by)"
  articles       ||--o{ video_sessions : "tidak ada FK — dipetakan editorial"
```

Catatan diagram:

- `demo_submissions — demo_contacts` adalah **1:1 wajib**, dibelah jadi dua tabel
  semata-mata supaya tabel publik tidak punya kolom PII (§6).
- `video_sessions` **tidak** punya FK ke `articles`. Tidak ada relasi artikel↔video
  di kode saat ini; tautan editorial baris direktori (`GENRE_ROWS.articleSlug`/
  `videoId`) sudah dihapus bersama grup aksi READ/WATCH — direktorinya kini
  Sanity-first (`pahlawanRow`, lihat `SANITY-INTEGRATION.md`).
- `users` dikelola Payload (collection auth), bukan domain editorial; nama kolom
  persis `[PERLU VERIFIKASI]`.
- Penyimpanan objek audio (Supabase Storage) **bukan** tabel, jadi tidak muncul
  sebagai entitas; hanya direferensikan lewat kolom `audio_*` (§9).

---

## 4. Target Schema (DDL) — RENCANA

Prinsip: identitas `uuid` (bukan auto-increment) supaya id tidak dapat ditebak
dan aman digenerate lintas lingkungan; `gen_random_uuid()` tersedia bawaan
Postgres 13+ (Supabase) tanpa extension tambahan. Semua `CHECK` di bawah diturunkan
dari nilai yang **sudah ada di kode**, bukan karangan. `[PERLU VERIFIKASI]` — nama
tabel/kolom persis yang digenerate `@payloadcms/db-postgres` dapat berbeda
(Payload menambah konvensi seperti `_status`, `_v` untuk versions, dan tipe
`enum_<table>_<field>`); DDL ini adalah bentuk logis yang kita miliki.

### 4.1 `articles`

```sql
create table articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text    not null,
  title            text    not null,
  category         text    not null
                   check (category in (
                     'Fakta Musik', 'Rekomendasi Melodi',
                     'Bicara Melodi', 'Liputan Panggung')),
  date_label       text    not null,     -- Article.date, "10 Oktober 2026"
  published_at     date    not null,     -- Article.dateISO, "2026-10-10"
  excerpt          text    not null,
  hero_image       text    not null,     -- "/photos/dsc09408.webp"
  body_paragraphs  text[]  not null default '{}',
  featured         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint articles_slug_key unique (slug)
);
```

- `date_label` disimpan sebagai label display yang ditulis editor; `published_at`
  adalah tanggal terurut. Keduanya ada di kode (`date` dan `dateISO`).
- `body_paragraphs text[]` = 1:1 dengan `body: string[]`, sehingga backfill
  (§12) nol-transformasi. Jika editor menuntut rich text Payload (Lexical), kolom
  ini menjadi `jsonb` — keputusan itu **terbuka** (Open Questions).
- Tidak ada kolom draft: 12/12 artikel punya `dateISO`, jadi semua
  `published_at not null` (`TERVERIFIKASI`).
- `CATEGORY_LABELS` **tidak** disimpan; ia label presentasi turunan (§5.3).

### 4.2 `video_sessions`

```sql
create table video_sessions (
  id               uuid primary key default gen_random_uuid(),
  source_video_id  text not null,                    -- CatalogueVideo.id
  title            text not null,
  venue            text not null
                   check (venue in (
                     'Melodi Samsara', 'Melodi Taman',
                     'Interview', 'Arsip & Lainnya')),
  seconds          integer not null check (seconds >= 0),
  view_count       bigint  not null default 0 check (view_count >= 0),
  views_label      text,                             -- "1.8K" (display YouTube)
  uploaded_label   text,                             -- "3d ago" (relatif)
  age_bucket       text,                             -- "0-30d"; tanpa CHECK
  featuring        text[] not null default '{}',
  url              text not null check (url ~* '^https?://'),
  scraped_at       date,                             -- meta.scrapedAt
  created_at       timestamptz not null default now(),
  constraint video_sessions_source_key unique (source_video_id)
);
```

- `duration` **tidak** disimpan: sudah turunan dari `seconds` via `formatDuration()`
  (`lib/catalogue.ts`). Menyimpannya berarti dua sumber kebenaran.
- `view_count` adalah satu-satunya kolom turunan yang **sengaja** dimaterialisasi,
  dengan alasan dan aturan update eksplisit: `views` adalah string rounded
  ("1.8K"), mustahil diurutkan secara numerik di SQL; `viewCount()` di
  `lib/catalogue.ts` sudah jadi parser resminya. **Aturan update:** di-set oleh
  importer katalog setiap kali `npm run catalogue` dijalankan.
- `age_bucket` tidak di-`CHECK` — nilainya bertambah tiap scrape (§2.2).
- **Batas ADR-0004:** tabel ini menyimpan hanya baris sesi yang **dikurasi/
  di-pin** oleh editor. Katalog scrape 292/342/5 tetap build-time di
  `lib/catalogue.json`; angka `views_label`/`age_bucket` di sini hanyalah
  snapshot scrape, bukan sumber kebenaran. Batas ini masih **terbuka** (§16).

### 4.3 `demo_submissions`

```sql
create table demo_submissions (
  id                 uuid primary key default gen_random_uuid(),
  public_ref         text not null,        -- id lama: 'seed-shroomeater', 'demo-...'
  artist             text not null check (char_length(artist) between 1 and 120),
  city               text not null check (char_length(city)  between 1 and 80),
  title              text not null check (char_length(title) between 1 and 160),
  genre              text not null
                     check (genre in (
                       'Indie Pop / Folk', 'Alternative Rock / Shoegaze',
                       'Surf Rock / Punk', 'R&B / Soul / Jazz',
                       'Ska / Reggae / Dub', 'Electronic / Experimental')),
  program            text not null
                     check (program in (
                       'Review Artikel dan Rekomendasi IG',
                       'Live at Melodi Samsara',
                       'Tamu Podcast Bicara Melodi')),
  link               text not null check (link ~* '^https?://.+'),
  story              text not null check (char_length(story) <= 2000),
  submitted_at       date not null default current_date,

  moderation_status  text not null default 'pending'
                     check (moderation_status in ('pending','approved','rejected')),
  reviewed_by        uuid,                 -- FK -> users.id
  reviewed_at        timestamptz,
  review_note        text,                 -- pengganti status free-text

  audio_object_path  text,                 -- Supabase Storage key (nullable)
  audio_bytes        bigint check (audio_bytes is null or audio_bytes <= 26214400),
  audio_mime         text   check (audio_mime is null or audio_mime like 'audio/%'),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint demo_submissions_public_ref_key unique (public_ref),
  constraint demo_approved_needs_reviewer check (
    moderation_status <> 'approved'
    or (reviewed_by is not null and reviewed_at is not null))
);
```

`26214400` = 25 × 1024 × 1024 byte. Panjang `CHECK` mengikuti cap `str()` di
`route.ts` (`TERVERIFIKASI`): `artist 120`, `city 80`, `title 160`, `story 2000`,
`link 500` (link dibiarkan tanpa batas di DB karena CHECK regex sudah membatasi
bentuknya; cap 500 tetap dijaga di aplikasi).

**Perubahan perilaku yang perlu dicatat:** di kode saat ini `genre`/`program`
boleh kosong (validasi kondisional, §2.6), tetapi di skema target keduanya
`not null` karena `select` form selalu mengirim default. Ini **pengetatan
`RENCANA`**, bukan perilaku terverifikasi — lihat Open Questions.

### 4.4 `demo_contacts` (PII, tabel terpisah)

```sql
create table demo_contacts (
  submission_id uuid primary key
                references demo_submissions (id) on delete cascade,
  contact       text not null check (char_length(contact) between 1 and 160),
  created_at    timestamptz not null default now()
);
```

`160` mengikuti cap `contact` di `route.ts`. PK = FK membuat relasi 1:1 wajib.
Tabel ini **tidak** punya policy baca publik (§8) — itulah inti desainnya.

### 4.5 `ecosystem_items`

```sql
create table ecosystem_items (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,
  label        text not null,            -- "Listening Space • Bogor"
  title        text not null,
  price_label  text,                     -- "IDR 2.499.000" | null
  href         text check (href is null or href ~* '^https?://'),
  image        text not null,            -- "/photos/..."
  ratio        text not null check (ratio in ('tall','square')),
  dark         boolean not null default false,
  sort_order   integer not null,         -- urutan array SPACE_ITEMS
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint ecosystem_items_slug_key unique (slug)
);
```

- `price` tetap `text` (`price_label`) karena sumbernya label display
  "IDR 2.499.000"; kolom numerik hanya membuat kita mengarang. Bila kurator butuh
  sortir harga, tambahkan `price_idr integer` **turunan** dengan aturan update
  terpisah (`ASUMSI`, bukan bagian skema ini).
- `sort_order` diturunkan dari urutan literal array `SPACE_ITEMS` — urutan itu
  memang data (UI merender apa adanya), jadi perlu disimpan.
- Tidak ada `is_published`: `SpaceItem` tidak punya konsep draft
  (`TERVERIFIKASI`), jadi tidak ada kolom yang dikarang.

---

## 5. Entity Dictionary

### 5.1 `articles`

| Field | Type | Null | Default | Constraints | Purpose |
|---|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK | Identitas internal |
| `slug` | text | no | — | unique | Route `/journal/[slug]` |
| `title` | text | no | — | — | Judul artikel |
| `category` | text | no | — | CHECK 4 nilai | Rubrik (`ArticleCategory`) |
| `date_label` | text | no | — | — | Tanggal display |
| `published_at` | date | no | — | — | Tanggal sortir + SEO |
| `excerpt` | text | no | — | — | Ringkasan kartu + `<meta>` |
| `hero_image` | text | no | — | — | Path gambar hero |
| `body_paragraphs` | text[] | no | `'{}'` | — | Paragraf artikel |
| `featured` | boolean | no | `false` | partial index §7 | Penanda hero landing |

### 5.2 `video_sessions`

| Field | Type | Null | Default | Constraints | Purpose |
|---|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK | Identitas internal |
| `source_video_id` | text | no | — | unique | YouTube id (`CatalogueVideo.id`) |
| `title` | text | no | — | — | Judul sesi |
| `venue` | text | no | — | CHECK 4 nilai | Format (`VENUES`) |
| `seconds` | integer | no | — | `>= 0` | Durasi; `duration` diturunkan |
| `view_count` | bigint | no | `0` | `>= 0` | Sortir popularitas (turunan) |
| `views_label` | text | yes | — | — | Display YouTube apa adanya |
| `uploaded_label` | text | yes | — | — | "3d ago" relatif saat scrape |
| `age_bucket` | text | yes | — | — | Bucket umur; dibiarkan bebas |
| `featuring` | text[] | no | `'{}'` | — | Artis yang tampil |
| `url` | text | no | — | `^https?://` | Tautan YouTube |
| `scraped_at` | date | yes | — | — | Tanggal scrape (`meta.scrapedAt`) |

### 5.3 `demo_submissions`

| Field | Type | Null | Default | Constraints | Purpose |
|---|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK | Identitas internal |
| `public_ref` | text | no | — | unique | id lama (`seed-*`, `demo-*`) |
| `artist` | text | no | — | len 1–120 | Nama band/solois |
| `city` | text | no | — | len 1–80 | Kota asal (kunci antrean) |
| `title` | text | no | — | len 1–160 | Judul lagu/EP |
| `genre` | text | no | — | CHECK 6 nilai | `DEMO_GENRES` |
| `program` | text | no | — | CHECK 3 nilai | `DEMO_PROGRAMS` |
| `link` | text | no | — | `^https?://` | EPK/streaming |
| `story` | text | no | — | `<= 2000` | Cerita singkat |
| `submitted_at` | date | no | `current_date` | — | Urutan antrean |
| `moderation_status` | text | no | `'pending'` | CHECK 3 nilai | Status moderasi |
| `reviewed_by` | uuid | yes | — | FK `users.id` | Kurator yang memutuskan |
| `reviewed_at` | timestamptz | yes | — | — | Waktu keputusan |
| `review_note` | text | yes | — | — | Catatan kurator (free text) |
| `audio_object_path` | text | yes | — | — | Key di Supabase Storage |
| `audio_bytes` | bigint | yes | — | `<= 26214400` | Ukuran file (cap 25 MB) |
| `audio_mime` | text | yes | — | `audio/%` | Tipe MIME audio |

### 5.4 `demo_contacts`

| Field | Type | Null | Default | Constraints | Purpose |
|---|---|---|---|---|---|
| `submission_id` | uuid | no | — | PK + FK cascade | 1:1 dengan submission |
| `contact` | text | no | — | len 1–160 | Kontak manajer (PII) |
| `created_at` | timestamptz | no | `now()` | — | Audit |

### 5.5 `ecosystem_items`

| Field | Type | Null | Default | Constraints | Purpose |
|---|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK | Identitas internal |
| `slug` | text | no | — | unique | Identitas stabil |
| `label` | text | no | — | — | Kicker kartu |
| `title` | text | no | — | — | Judul kartu |
| `price_label` | text | yes | — | — | Harga display |
| `href` | text | yes | — | `^https?://` bila ada | Tautan luar |
| `image` | text | no | — | — | Path gambar |
| `ratio` | text | no | — | CHECK 2 nilai | `tall` \| `square` |
| `dark` | boolean | no | `false` | — | Tone kartu |
| `sort_order` | integer | no | — | index §7 | Urutan tampil |

---

## 6. Relationships and Delete Behavior

| Relasi | Kardinalitas | Kepemilikan | Delete rule | Status |
|---|---|---|---|---|
| `demo_submissions → demo_contacts` | 1 : 1 wajib | Submission | `ON DELETE CASCADE` | `RENCANA` |
| `users → demo_submissions.reviewed_by` | 1 : 0..n opsional | Kurator | `ON DELETE SET NULL` | `RENCANA` |
| `demo_submissions → Storage (demo-audio)` | 1 : 0..1 | Submission | Hapus objek saat baris dihapus | `RENCANA` |
| `articles` ↔ `video_sessions` | — | — | tidak ada FK | **(tidak ada relasi di kode)** |

Rasional delete behavior:

- **Cascade kontak.** `contact` tidak punya makna tanpa submission-nya, dan
  menyisakan PII yatim justru melanggar tujuan privasi. Cascade = satu penghapusan
  menghapus PII juga (`NFR` privasi).
- **Set null reviewer.** Menghapus akun kurator tidak boleh menghapus riwayat
  submission; yang hilang hanya atribusi. Alternatif `restrict` ditolak karena
  memblokir offboarding kurator.
- **Storage.** Baris DB dan objek Storage tidak bisa ikut ter-transaksi; importer
  harus menghapus objek dalam langkah terpisah (atau via lifecycle rule). Ini
  invariant aplikasi, bukan DB (§8.2).

Tidak ada relasi `articles ↔ video_sessions` di kode, jadi tidak ada FK — menambah
satu berarti mengarang. Dulu `GENRE_ROWS.articleSlug`/`videoId` menautkan baris
direktori ke **salah satu** target (bukan relasi dua arah); tautan itu kini dihapus
dan direktori dikelola Sanity (`pahlawanRow`).

---

## 7. Indexes and Query Patterns

Query di bawah diambil dari kode hari ini; kolom yang diindeks adalah kolom yang
sudah terbukti dibaca. "Query" = jalur akses bernama, bukan tebakan.

| # | Query (sumber) | Index | Kolom | Justifikasi |
|---|---|---|---|---|
| 1 | Ambil artikel by slug (`/journal/[slug]`) | unique | `articles (slug)` | `generateStaticParams` per slug |
| 2 | Filter kategori + urut tanggal (`/journal`) | btree | `articles (category, published_at desc)` | `JournalBrowser` filter `category` |
| 3 | Cari judul/excerpt (`/journal`) | GIN trigram | `((title \|\| ' ' \|\| excerpt)) gin_trgm_ops` | `includes()` substring → `ILIKE` |
| 4 | Artikel unggulan (landing hero) | btree partial | `articles (published_at desc) where featured` | `ARTICLES.filter(featured)` |
| 5 | Ambil video by id | unique | `video_sessions (source_video_id)` | `getVideo()` |
| 6 | Filter venue + urut populer (`/videos`) | btree | `video_sessions (venue, view_count desc)` | `videosByVenue` + `topVideos` |
| 7 | Antrean kurator: status + urut waktu | btree | `demo_submissions (moderation_status, submitted_at desc)` | Moderasi (ADR-0005) |
| 8 | Antrean kurator: filter kota saat pending | btree partial | `demo_submissions (city, submitted_at desc) where moderation_status = 'pending'` | Filter `pending` + `city` |
| 9 | Baca baris publik demo | btree | `demo_submissions (submitted_at desc) where moderation_status = 'approved'` | Read path publik |
| 10 | Item ekosistem urut tampil | btree | `ecosystem_items (sort_order)` | `SPACE_ITEMS` order |
| 11 | `demo_contacts` | PK | `demo_contacts (submission_id)` | Lookup 1:1 by PK |

```sql
create extension if not exists pg_trgm;   -- untuk #3

create unique index articles_slug_key        on articles (slug);
create index        articles_cat_pub_idx     on articles (category, published_at desc);
create index        articles_search_idx      on articles
  using gin ((title || ' ' || excerpt) gin_trgm_ops);
create index        articles_featured_idx    on articles (published_at desc) where featured;

create unique index video_sessions_source_key on video_sessions (source_video_id);
create index        video_sessions_venue_idx  on video_sessions (venue, view_count desc);

create unique index demo_public_ref_key on demo_submissions (public_ref);
create index        demo_moderation_idx on demo_submissions (moderation_status, submitted_at desc);
create index        demo_pending_city_idx on demo_submissions (city, submitted_at desc)
  where moderation_status = 'pending';
create index        demo_public_idx      on demo_submissions (submitted_at desc)
  where moderation_status = 'approved';

create index        ecosystem_order_idx  on ecosystem_items (sort_order);
```

Trade-off & catatan:

- **Trigram vs `tsvector`.** Pencarian hari ini adalah substring case-insensitive
  (`title.toLowerCase().includes(q)`), termasuk partial word. Trigram (`ILIKE
  '%q%'`) mempertahankan semantik itu; `tsvector` akan mengubah perilaku (stemming,
  word boundary) untuk 12 baris. Pada korpus kecil ini trigram cukup; `tsvector`
  adalah opsi bila korpus tumbuh besar.
- **Biaya tulis.** Tiap index menambah biaya pada `insert`/`update`. Empat index di
  `articles` masih murah karena artikel jarang ditulis; tiga index di
  `demo_submissions` adalah harga moderasi (ADR-0005) dan volume submit rendah.
- **Partial index** (#4, #8, #9) sengaja dipakai: hanya sebagian baris dilayani,
  dan predikatnya sama dengan predikat policy/query.
- **Jangan** mengindex `featured`, `dark`, `ratio`, `reviewed_by` — tidak ada
  query bernama yang membutuhkannya.

---

## 8. Moderation, Constraints, and Business-Rule Enforcement

### 8.1 Perubahan moderasi (`RENCANA`, ADR-0005)

Antrean demo **dimoderasi**. Modelnya:

1. Setiap submission lahir dengan `moderation_status = 'pending'`.
2. Baris `pending` **privat** — tidak pernah tampil publik.
3. Kurator menyetujui → `moderation_status = 'approved'`, `reviewed_by` diisi,
   `reviewed_at = now()`.
4. Read path publik **hanya** membaca baris `approved` (§8.4).
5. Penolakan → `'rejected'` + `review_note`.

**Artinya bagi field `status: string` free-text hari ini.** Field itu hilang
sebagai satu kolom serbaguna dan dipecah menjadi tiga:

| Lama (`status: string`) | Baru | Catatan |
|---|---|---|
| `NEW SUBMISSION • JUST NOW`, `IN CURATION QUEUE` | `moderation_status = 'pending'` | State mesin, bukan kalimat |
| `SELECTED FOR SAMSARA LIVE` | `moderation_status = 'approved'` + `review_note` | Keputusan = approved; "Samsara Live" jadi catatan |
| `SHORTLISTED BY EDITOR` | **tidak punya rumah di 3-nilai enum** | Lihat Open Questions |
| — | `reviewed_by`, `reviewed_at` | Baru: siapa & kapan |

Alasan: `status` bebas string tidak bisa difilter secara reliabel (`"NEW
SUBMISSION • JUST NOW"` mengandung timestamp, jadi nilainya berubah tiap
submission), tidak bisa di-`CHECK`, dan tidak bisa dipakai index/RLS. Mengubahnya
menjadi enum + kolom audit membuat moderasi bisa diquery, diaudit, dan diamankan
di level baris.

Migrasi field ini adalah contoh **expand-and-contract** (§12.2): kolom baru
ditambahkan, di-backfill dari pemetaan di atas, lalu `status` lama dihapus.

### 8.2 Ditegakkan database vs di tempat lain

| Invariant | Ditegakkan di | Status |
|---|---|---|
| `category` ∈ 4 nilai | DB `CHECK` | `RENCANA` |
| `genre` ∈ `DEMO_GENRES`, `program` ∈ `DEMO_PROGRAMS` | DB `CHECK` (+ sudah di `route.ts`) | `RENCANA` |
| `venue` ∈ 4 nilai, `ratio` ∈ 2 nilai | DB `CHECK` | `RENCANA` |
| `link`/`url`/`href` berawalan `http(s)://` | DB `CHECK` regex (+ `route.ts`) | `RENCANA` |
| Panjang field submission (120/80/160/2000/160) | DB `CHECK` (+ `str()` di `route.ts`) | `RENCANA` |
| `slug`/`source_video_id`/`public_ref` unik | DB `UNIQUE` | `RENCANA` |
| Submission `approved` wajib punya reviewer | DB `CHECK` | `RENCANA` |
| Kontak wajib ada (1:1) | DB PK+FK + `not null` logic | `RENCANA` |
| Cap audio 25 MB | DB `CHECK` + Storage limit + aplikasi | `RENCANA` (§9) |
| Body bukan HTML (anti-injeksi) | Aplikasi: `body_paragraphs text[]`, dirender per paragraf | `TERVERIFIKASI` |
| `contact` tidak tampil publik | RLS + pemisahan tabel | `RENCANA` (§8, §9) |
| Objek Storage dihapus saat baris dihapus | Aplikasi (tidak transaksional) | `RENCANA` |
| `updated_at` refresh | Trigger DB atau aplikasi | `RENCANA` |

### 8.3 Transaksi yang disyaratkan

- **Buat submission:** satu transaksi `insert` ke `demo_submissions` + `insert`
  ke `demo_contacts`. Kontak tidak boleh ada tanpa submission (FK) dan submission
  wajib punya kontak (invariant aplikasi dalam transaksi yang sama).
- **Setujui submission:** satu transaksi `update` status + reviewer + waktu, lalu
  tulis audit jika ada.
- **Hapus submission:** transaksi DB (cascade ke `demo_contacts`) + **langkah
  terpisah** hapus objek Storage.

### 8.4 Read path publik (approved only)

```sql
-- Daftar baris approved (antrean publik /submit dihapus 16 Okt 2026)
select public_ref, artist, city, title, genre, program, link, story,
       submitted_at, moderation_status
from   demo_submissions
where  moderation_status = 'approved'
order  by submitted_at desc;
```

Kolom `contact` **tidak** ada di tabel ini, jadi query di atas secara struktural
tidak dapat membocorkan PII — bahkan jika `where`-nya salah tulis nanti.

---

## 9. Storage — RENCANA

### 9.1 Bucket

| Bucket | Isi | Akses baca | Cap | Status |
|---|---|---|---|---|
| `demo-audio` | Berkas audio demo dari form `/submit` | Privat; kurator via signed URL | **25 MB** (`26214400` byte) | `RENCANA` |
| `media` | Media unggahan Payload (gambar artikel, item ekosistem) | Publik | Default platform | `RENCANA` |

Konvensi path `demo-audio`: `{submission_id}/{uuid}-{sanitized-filename}`.
`demo_submissions.audio_object_path` menyimpan key itu; nama asli file tidak
dipakai mentah (path traversal + tabrakan nama).

Hari ini **tidak ada unggahan** — `DemoPortal.tsx` hanya `URL.createObjectURL`
lokal, dan komentar di kode menyatakan "file sendiri tidak pernah diunggah"
(`TERVERIFIKASI`).

### 9.2 Kenapa cap 25 MB dijaga di **tiga** tempat

1. **Client (`DemoPortal.tsx`).** Cek `file.size` saat `onPickAudio` — UX: pengguna
   tahu seketika, tidak menunggu unggahan gagal. **Selalu bisa dilewati** (devtools,
   `curl`), jadi tidak boleh jadi satu-satunya penjaga.
2. **Server (`/api/demos`).** Cek `file.size` sebelum menerbitkan signed upload URL
   ke Supabase. Ini otoritatif: menentukan berapa byte yang kita izinkan masuk dan
   menolak `413` sebelum ada traffic besar.
3. **Bucket Storage (`file_size_limit`).** Penjaga terakhir. Bahkan bila API
   dilewati dan token upload bocor, Storage sendiri menolak objek > 25 MB. Ini
   satu-satunya lapisan yang tetap berlaku ketika aplikasi salah.

Tiga tempat = tiga kepercayaan berbeda (UX, otorisasi, infrastruktur). Menaruh cap
hanya di satu lapisan berarti percaya pada satu lapisan; di sini pemilik produk
menetapkan 25 MB sebagai batas keras (`RENCANA`).

`[PERLU VERIFIKASI]` — angka 25 MB adalah keputusan fase ini, bukan angka yang
terbaca di kode. Limit default global Storage Supabase bergantung plan/versi;
`file_size_limit` per-bucket adalah yang mengikat, dan nilainya harus
dikonfirmasi saat bucket dibuat.

---

## 10. Row Level Security — RENCANA

RLS diaktifkan di **semua** tabel domain. Ada dua kelas pembaca:

| Peran | Sumber | Boleh baca |
|---|---|---|
| `anon` | Supabase publishable/anon key | `articles`, `video_sessions`, `ecosystem_items`, demo `approved` (tanpa `contact`) |
| `curator` | `authenticated` + JWT claim `role = 'curator'` | Semua baris `demo_*`, termasuk `pending`/`rejected` dan `demo_contacts` |
| `service_role` / Payload | Koneksi server | Semua (melewati RLS) |

```sql
alter table articles          enable row level security;
alter table video_sessions    enable row level security;
alter table demo_submissions  enable row level security;
alter table demo_contacts     enable row level security;
alter table ecosystem_items   enable row level security;

-- Baca publik: konten editorial & showcase
create policy articles_public_read on articles
  for select to anon, authenticated using (true);

create policy video_sessions_public_read on video_sessions
  for select to anon, authenticated using (true);

create policy ecosystem_public_read on ecosystem_items
  for select to anon, authenticated using (true);

-- Baca publik: hanya demo yang sudah disetujui
create policy demo_public_read on demo_submissions
  for select to anon, authenticated
  using (moderation_status = 'approved');

-- Kurator: baca seluruh antrean
create policy demo_curator_read on demo_submissions
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

create policy demo_curator_write on demo_submissions
  for update to authenticated
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

-- PII: TIDAK ada policy untuk anon/authenticated biasa.
create policy demo_contacts_curator_read on demo_contacts
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');
```

Catatan penting (harus dibaca sebelum menganggap RLS sebagai satu-satunya
pertahanan):

- **Payload melewati RLS.** Adapter Postgres Payload biasanya tersambung dengan
  role pemilik (koneksi server), dan RLS **tidak** berlaku untuk pemilik tabel
  kecuali `FORCE ROW LEVEL SECURITY` dipasang. Artinya RLS di sini melindungi
  akses **langsung** klien (publishable key) ke Supabase, **bukan** jalur Payload.
  Jalur Payload harus dijaga terpisah oleh access control collection Payload.
  `[PERLU VERIFIKASI]` — apakah implementasi memilih role DB terbatas atau
  `FORCE RLS`.
- **Insert publik.** Submission dari pengunjung anonim ditulis **lewat server**
  (route handler), bukan langsung dari browser ke Supabase. Karena itu tidak ada
  policy `insert` untuk `anon`. Bila kelak form menulis langsung, tambahkan policy
  `insert` sempit (kolom `pending` saja) — `RENCANA`, belum diputuskan.
- **`authenticated` ≠ otomatis kurator.** Policy kurator memeriksa klaim
  `app_metadata.role`, bukan sekadar status login.
- `contact` hanya punya policy baca kurator; tidak ada policy update/delete publik.
  Penghapusan terjadi lewat cascade saat submission dihapus.

---

## 11. Lifecycle, Privacy, dan Retention

### 11.1 Siklus hidup

| Entitas | Dibuat | Diubah | Dihapus |
|---|---|---|---|
| `articles` | Kurator lewat `/admin` | Kurator (edit) | Hard delete oleh kurator |
| `video_sessions` | Importer katalog / kurator pin | Importer (snapshot scrape) | Hard delete oleh kurator |
| `demo_submissions` | `POST /api/demos` (server) | Kurator (`update` status) | Hard delete oleh kurator |
| `demo_contacts` | Bersamaan dengan submission | Tidak pernah (immutable) | Cascade dari submission |
| `ecosystem_items` | Kurator | Kurator | Hard delete oleh kurator |

`created_at`/`updated_at` ada di semua tabel domain. Tidak ada soft delete di
skema; bila kelak perlu, tambahkan `deleted_at timestamptz` dan jadikan policy
publik `using (deleted_at is null)` — `RENCANA`.

### 11.2 PII

- Kolom PII **tunggal**: `demo_contacts.contact` (maks 160 char, kontak manajer).
- PII hidup **hanya** di tabel yang tidak punya policy baca publik (§10).
- Tidak ada PII lain yang disimpan. `artist`, `city`, `story` adalah data karya
  yang memang publik setelah disetujui.
- **Retensi:** `RENCANA` — PII dihapus bersama submission (cascade). Kebijakan
  retensi terjadwal (mis. hapus submission `rejected` > N bulan) belum ditetapkan;
  lihat Open Questions. Ini menyangkut `NFR` privasi.
- **Ekspor/penghapusan atas permintaan** (hak subjek data): hapus baris
  `demo_submissions` menghapus `demo_contacts` dan (secara aplikasi) objek audio.
- **Seed & fixture tidak boleh memuat PII nyata.** Gunakan kontak sintetis
  (mis. `manager@example.test`) dan tandai jelas sebagai fiktif (§13).
- Satu detail yang sulit: karena `contact` **tidak pernah** dipersistensi hari ini
  (§2.6), 3 seed demo lama **tidak punya kontak** untuk di-backfill. Ini bukan
  bug migrasi — datanya memang tidak pernah ada. Lihat Open Questions.

---

## 12. Migration Plan — RENCANA

### 12.1 Urutan migrasi

Semua migrasi digenerate/dikelola Payload (`@payloadcms/db-postgres` →
Drizzle) — perintah persisnya `[PERLU VERIFIKASI]`. Urutan di bawah adalah urutan
dependensi; setiap langkah punya rollback.

| # | Migrasi | Isi | Risiko | Rollback |
|---|---|---|---|---|
| M1 | `extensions` | `create extension if not exists pg_trgm` | Rendah | `drop extension` |
| M2 | `articles` | tabel + unique slug | Rendah | `drop table` |
| M3 | `video_sessions` | tabel + unique source id | Rendah | `drop table` |
| M4 | `demo_submissions` | tabel + CHECK + unique public_ref | Sedang | `drop table` (destruktif bila sudah ada data) |
| M5 | `demo_contacts` | tabel PII + FK cascade | Sedang | `drop table` |
| M6 | `ecosystem_items` | tabel + unique slug | Rendah | `drop table` |
| M7 | `indexes` | seluruh index §7 | Rendah | `drop index` |
| M8 | `rls` | `enable rls` + policy §10 | **Tinggi** | `drop policy` + `disable rls` |
| M9 | `storage` | bucket `demo-audio` + `media`, cap 25 MB | Sedang | `delete bucket` (hapus objek) |
| M10 | `backfill_articles` | 12 artikel dari `lib/content.ts` | Rendah | `delete from articles` |
| M11 | `backfill_video_sessions` | baris sesi yang di-pin | Rendah | `delete` by `scraped_at` |
| M12 | `backfill_demos` | 3 seed demo (tanpa kontak) | Rendah | `delete where public_ref like 'seed-%'` |
| M13 | `backfill_ecosystem` | 5 `SPACE_ITEMS` | Rendah | `delete from ecosystem_items` |

Prinsip: M1–M9 membangun skema **kosong** dulu; M10–M13 adalah backfill terpisah
yang idempotent dan bisa diulang. Tidak ada langkah destruktif pada data
produksi karena produksi belum punya tabel ini.

### 12.2 Expand-and-contract untuk moderasi

Perubahan field `status` (§8.1) bukan migrasi sekali jalan:

1. **Expand.** Tambah `moderation_status`, `reviewed_by`, `reviewed_at`,
   `review_note`. `status` lama masih ada.
2. **Backfill.** Petakan `status` → `moderation_status`:
   `IN CURATION QUEUE`/`NEW SUBMISSION • JUST NOW` → `pending`;
   `SELECTED FOR SAMSARA LIVE` → `approved`; `SHORTLISTED BY EDITOR` → `pending`
   (+ `review_note`), lihat Open Questions.
3. **Switch.** Aplikasi menulis/membaca kolom baru saja.
4. **Contract.** `alter table demo_submissions drop column status;`

`SHORTLISTED BY EDITOR` adalah satu-satunya nilai yang **tidak** punya padanan
bersih di enum 3-nilai; pemetaan sementaranya adalah keputusan fase ini, bukan
fakta (Open Questions).

### 12.3 Jalur backfill dari sumber build-time

Sumber backfill = sumber yang benar-benar ada:

| Target | Sumber | Volume | Transformasi |
|---|---|---|---|
| `articles` | `ARTICLES` di `lib/content.ts` | 12 | `date` → `date_label`, `dateISO` → `published_at`, `image` → `hero_image`, `body` → `body_paragraphs` (1:1) |
| `video_sessions` | subset `lib/catalogue.json` `.videos` | subset `RENCANA` | `id` → `source_video_id`, `views` → `views_label` + `view_count` via `viewCount()`, `meta.scrapedAt` → `scraped_at` |
| `demo_submissions` | `SEED_DEMOS` | 3 | status → `moderation_status` (§12.2) |
| `demo_contacts` | — | 0 | **tidak ada sumber** (PII tidak pernah disimpan) |
| `ecosystem_items` | `SPACE_ITEMS` | 5 | urutan array → `sort_order` |

Yang **tidak** di-backfill: `meta`, `profile`, `counts`, `shorts`, `playlists`
(ADR-0004, tetap build-time), `INTERVIEW_ROWS` (3), `GENRE_ROWS` (3),
`TICKER_ITEMS` (4) — belum ada tabel target untuk keempatnya (Open Questions).

Backfill dijalankan sebagai skrip idempotent (upsert pada `slug`/`source_video_id`/
`public_ref`) sehingga aman diulang selama migrasi berjalan berdampingan dengan
arsip frozen.

---

## 13. Seed and Test Data — RENCANA

- **Reference/demo seed:** 3 `SEED_DEMOS` menjadi contoh baris `demo_submissions`
  (`seed-shroomeater`, `seed-skyline`, `seed-pelabuhan-senja`). Karena tidak ada
  kontak tersimpan, backfill ini **tidak** menulis `demo_contacts`.
- **Artikel seed:** 12 artikel nyata adalah konten produksi yang ada, bukan data
  sintetis — tetapi bermigrasi sebagai backfill, bukan sebagai seed test.
- **Fixture test (sintetis):** submission dengan `public_ref` seperti
  `test-xxxx`, `contact = 'manager@example.test'`, audio 1 MB dummy. **Tidak boleh**
  memuat nomor telepon/email nyata (mengikuti aturan brief §10).
- **Data yang dikecualikan:** PII nyata apa pun, dan seluruh artefak build-time
  ADR-0004 (`meta`/`profile`/`counts`/`shorts`/`playlists`).
- **Data audio:** fixture Storage memakai file kecil yang dibangkitkan, bukan
  rekaman nyata.

---

## 14. Validation Checklist

| Cek | Status |
|---|---|
| Setiap entitas punya owner | Ya — kurator (`articles`, `demo_*`, `ecosystem_items`), importer (`video_sessions`) |
| Setiap entitas punya lifecycle | Ya (§11.1) |
| Setiap relasi punya delete behavior | Ya (§6) |
| Setiap index memetakan ke query bernama | Ya (§7) |
| Tidak ada tabel/kolom tanpa requirement | Ya — tiap kolom ditelusuri ke field kode |
| Naming konsisten (snake_case, plural) | Ya |
| Migrasi dapat dijalankan urut di DB kosong | Ya (§12.1, M1→M13) |
| Setiap enum di DB berasal dari kode | Ya (§4, nilai dari `lib/content.ts`) |
| PII terpisah dari jalur baca publik | Ya (§4.4, §9, §10) |

---

## Verification Notes

Dibaca langsung dari sumber (bukan dari memori):

- `lib/content.ts` (527 baris, penuh) — `ArticleCategory`, `Article`,
  `InterviewRow`, `GenreRow`, `SpaceItem`, `DemoSubmission`, `DEMO_GENRES`,
  `DEMO_PROGRAMS`, `SEED_DEMOS`, `CATEGORY_LABELS`, `ARTICLE_CATEGORIES`,
  `ARTICLES` (12), `SPACE_ITEMS` (5), `TICKER_ITEMS` (4).
- `lib/catalogue.ts` (157 baris, penuh) — `CatalogueVideo`, `CatalogueShort`,
  `CataloguePlaylist`, `Catalogue`, `VENUES`, `VENUE_COUNTS`, `viewCount()`,
  `formatDuration()`, `thumbnailFor()`.
- `lib/catalogue.json` — `meta`, `profile`, `counts`, satu `videos[0]`, satu
  `shorts[0]`, satu `playlists[0]`; nilai `byVenue` dan 17 nilai `ageBucket`
  dihitung dengan `node -e`, bukan dibaca mata.
- `app/api/demos/route.ts` (103 baris, penuh) — bentuk queue in-memory, cap
  field, jalur `400`/`422`/`201`, dan fakta `contact` tidak dipersistensi.
- `components/DemoPortal.tsx` — `onPickAudio` (preview `createObjectURL`, tanpa
  unggah), `accept="audio/*"`, alur `POST` ke `/api/demos`.
- `components/JournalBrowser.tsx` — filter `category` + pencarian substring pada
  `title`/`excerpt`/`category`.
- `docs/ARCHITECTURE.md` — untuk konsistensi label, batas modul (`MOD-101`…`MOD-103`),
  dan acuan yang menyebut dokumen ini sebagai pemilik skema/migrasi/RLS.
- `package.json` — dikonfirmasi **tidak ada** `payload`, `supabase`, `drizzle`,
  `vitest`, atau `playwright` yang terpasang.
- `docs/` — hanya berisi `ARCHITECTURE.md`; `docs/adr/` **belum ada**, sehingga
  ADR-0002…ADR-0005 dirujuk sebagai keputusan (brief §7) dan belum ada berkasnya.

Dijalankan: dua perintah `node -e` (read-only) untuk menghitung `byVenue`,
`ageBucket`, dan memeriksa nilai `null` pada `videos`. Tidak ada migrasi, tidak
ada paket yang dipasang, tidak ada berkas lain yang diubah.

Yang **tidak** diverifikasi (dan karena itu tidak diklaim): nama tabel/kolom persis
yang digenerate `@payloadcms/db-postgres`, perintah migrasi Payload, dan perilaku
RLS terhadap koneksi Payload — semuanya ditandai `RENCANA` / `[PERLU VERIFIKASI]`.

---

## Open Questions

1. **Batas ADR-0004 vs tabel `video_sessions`.** ADR-0004 menyatakan katalog video
   tetap build-time, tetapi `video_sessions` tetap masuk daftar tabel target.
   Mana yang jadi source of truth untuk baris sesi: `lib/catalogue.json` atau
   Postgres? Desain di §4.2 mengasumsikan tabel hanya menyimpan baris yang
   di-pin editor, dengan kolom scrape (`views_label`, `age_bucket`) sebagai
   snapshot. Perlu keputusan eksplisit.
2. **Nasib `SHORTLISTED BY EDITOR`.** Nilai `status` ini tidak punya rumah di enum
   `pending/approved/rejected`. Apakah butuh state keempat (`shortlisted`), atau
   cukup jadi `review_note`?
3. **`body_paragraphs text[]` vs rich text Payload.** Kode menyimpan `string[]`;
   Payload rich text menyimpan Lexical (JSON). Memilih Lexical berarti backfill
   harus membungkus tiap paragraf jadi node — bukan transformasi 1:1. Belum
   diputuskan.
4. **Pengetatan `genre`/`program` menjadi `NOT NULL`.** Kode hari ini
   memvalidasinya secara kondisional (kosong lolos). Menjadikannya wajib adalah
   perubahan kontrak; perlu konfirmasi apakah disengaja.
5. **Identitas kurator.** `reviewed_by` mereferensikan `users` Payload. Bentuk
   klaim `curator`, sumbernya (Payload auth vs Supabase Auth), dan nama kolom
   persisnya `[PERLU VERIFIKASI]`.
6. **RLS vs koneksi Payload.** Apakah Payload memakai role DB yang melewati RLS
   (default) atau role terbatas + `FORCE ROW LEVEL SECURITY`? Ini menentukan apakah
   RLS benar-benar menjadi pertahanan berlapis atau hanya melindungi akses klien.
7. **Backfill `demo_contacts` tidak mungkin untuk data lama.** Karena `contact`
   tidak pernah dipersistensi, 3 seed demo masuk tanpa kontak. Apakah submission
   hasil migrasi boleh tanpa kontak (menyalahi 1:1 wajib) atau diisi penanda
   `[PERLU VERIFIKASI]`? Ini juga temuan produk: tanpa perbaikan, kurator tetap
   tidak bisa menghubungi artis lama.
8. **Publik vs privat untuk audio demo.** Apakah audio demo yang `approved` boleh
   diputar publik (butuh bucket publik atau URL bertanda tangan), atau audio
   selalu privat untuk kurator saja? Skema saat ini mengasumsikan privat.
9. **Retensi PII terjadwal.** Kebijakan hapus submission `rejected` setelah N bulan
   belum ditetapkan; menyangkut `NFR` privasi.
10. **Pertumbuhan `DEMO_GENRES`.** Daftar genre/ program milik produk dan akan
    bertambah. `CHECK` literal mudah dibaca tetapi tiap perubahan butuh migrasi;
    lookup table (`demo_genres`, `demo_programs`) lebih fleksibel. Perlu keputusan
    sebelum value pertama ditambahkan.
11. **`INTERVIEW_ROWS`, `GENRE_ROWS`, `TICKER_ITEMS`.** Tiga entitas
    `TERVERIFIKASI` tanpa tabel target. Apakah jadi tabel sendiri, memetakan ke
    `articles`/`video_sessions`, atau tetap build-time? **Sebagian terjawab:**
    pasca ADR-0008 editorialnya hidup di Sanity (`interview`, `pahlawanRow`,
    `siteSettings`) dengan fallback statis; tabel Postgres untuk ketiganya tidak
    lagi relevan.
12. **Angka cap 25 MB.** Keputusan fase ini, bukan angka dari kode. Nilai
    `file_size_limit` harus dikonfirmasi terhadap plan Supabase saat bucket dibuat.
13. **`price_idr` numerik.** Belum ada kolom harga numerik; apakah kurator butuh
    sortir/format harga, atau `price_label` cukup?
