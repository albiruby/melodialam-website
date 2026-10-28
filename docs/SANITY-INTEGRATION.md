# Integrasi Web ↔ Sanity

Panduan lengkap: apa yang Anda tulis di Studio akan render di halaman mana, lewat
jalur apa, dan apa yang harus dilakukan saat mengubah model konten.

**Audiens:** editor yang menulis konten, dan developer yang mengubah skema.
**Status (21 Okt 2026):** artikel, pillar, video, wawancara, pratinjau draf, dan
antrean demo tersambung. Direktori Pahlawan Kota sudah dihapus dari situs;
dokumen `pahlawanRow` tetap di Sanity sebagai arsip.

> Menggantikan `PAYLOAD-INTEGRATION.md`, yang dihapus bersama seluruh kode Payload.
> Latar belakang keputusan ada di [`adr/0008`](adr/0008-sanity-studio-menggantikan-payload.md).

---

## 1. Dua repo

Sejak Studio dipindah keluar, ada dua repositori yang harus dipahami bersama:

| Repo | Isi | Perubahan di sini kalau… |
|---|---|---|
| **`melodi-alam`** (repo ini) | situs Next.js + lapisan baca Sanity | …Anda mengubah halaman, kueri, atau tampilan |
| **`melodialam-sanity`** | Studio: `sanity.config.ts`, skema, kosakata | …Anda mengubah model konten atau field |

**Editor tidak perlu menyentuh repo ini.** Studio-nya berdiri sendiri di
**https://melodi-alam.sanity.studio** (atau `npm run dev` di repo Sanity untuk
versi lokal di port 3333).

Dua berkas **sengaja diduplikasi** di kedua repo, dan mengubah salah satunya berarti
mengubah yang lain:

| Berkas | Isi | Status duplikasi |
|---|---|---|
| `lib/sanity-project.ts` | project id + nama dua dataset | **Konten identik** di kedua repo |
| `lib/taxonomy.ts` | rubrik artikel + enum antrean demo | **Sudah berbeda** — lihat catatan di bawah |

Catatan `lib/taxonomy.ts`: salinan di repo ini sudah **tidak** mengekspor
`asOptions()` lagi, sedangkan salinan di repo Studio masih mengekspornya
(`melodialam-sanity/lib/taxonomy.ts:84`) dan memakainya di skema
`demoSubmission`. Sebaliknya, konstanta batas audio (`DEMO_AUDIO_MAX_BYTES`,
`DEMO_AUDIO_TYPES`, `DEMO_AUDIO_EXTENSIONS`) hanya ada di repo ini
(`lib/taxonomy.ts:76-78`) dan dipakai `components/DemoPortal.tsx` +
`app/api/demo-audio/route.ts`. **Jangan** menyalin salah satu berkas secara
mentah ke repo lain.

Duplikasi ini disadari: Studio tidak bisa mengimpor dari repo ini saat build, dan
repo ini tidak boleh bergantung pada repo Studio.

---

## 2. Model mental

> **1. Sanity menang; `lib/content-fallback.ts` adalah jaring pengaman.**
>
> - Artikel yang Anda publish di Studio muncul di situs **tanpa ubah kode**.
> - Kalau Sanity tidak dapat dijangkau, situs merender **12 artikel statis** dari
>   `lib/content-fallback.ts` (`ARTICLES`, `lib/content-fallback.ts:93`) alih-alih gagal.
> - Kalau slug-nya bentrok, versi Sanity yang menang — jadi migrasi bisa bertahap:
>   seed satu artikel ke Sanity, ia langsung mengambil alih.

Pembacaan artikel **tidak butuh kredensial sama sekali**: dataset `production`
publik dan project id-nya literal di kode (`lib/sanity-project.ts`). Sanity adalah
sumber default, bukan sesuatu yang Anda aktifkan lewat `.env`.

> **2. Ada dua dataset, dan pemisahannya disengaja.**

| Dataset | ACL | Isi | Token |
|---|---|---|---|
| `production` | publik | artikel,pillar, video, playlist, wawancara, pengaturan situs | tidak perlu |
| `submissions` | **privat** | kiriman demo + kontak manajer | **wajib** |

Antrean demo menyimpan nomor WhatsApp manajer di dokumen `demoContact` — terpisah
dari baris kiriman, supaya tidak pernah ikut terbaca bersama baris publik. Dataset
Sanity yang publik dapat dibaca siapa pun yang tahu project id, jadi PII tidak
boleh berada di sana.

---

## 3. Peta: tulis di sini → render di sana

| Tipe konten | Workspace Studio | Render di halaman | Status |
|---|---|---|---|
| **siteSettings** | Konten | identitas situs (header/footer), data ticker (tidak dirender di shell), catatan kurasi, label panel hijau kartu | ✅ tersambung |
| **videosPage** | Konten | judul "MELODI SAMSARA" + label tautan bagian Melodi Samsara / Playlists di `/videos` | ✅ tersambung |
| **pillarPost** | Konten | halaman `/kurasi` — section per pillar (Baca: Fakta Musik, Lirik, Trivia, Kutipan; Tonton: Rekomendasi, Ulas, Clipper) | ✅ tersambung (55 post ter-seed) |
| **article** | Konten | `/stories`, `/stories/<slug>`, Top News (lead + sidebar + More) | ✅ tersambung |
| **pahlawanRow** | Konten | — (halaman `/pahlawan-kota` dihapus; dokumen disimpan sebagai arsip) | ⚪ tidak dirender |
| **demoSubmission** | Submit Karya | antrean publik di `/submit` (hanya status disetujui) | ✅ tersambung |
| **demoContact** | Submit Karya | **tidak pernah publik** — hanya panel Studio | ✅ tersambung |
| **audio demo** (`demoSubmission.audioUrl`) | Submit Karya | tautan berkas di Vercel Blob; bisa diputar dari panel Studio | ✅ tersambung — butuh `BLOB_READ_WRITE_TOKEN` |
| **video** · **playlist** | Konten | `/videos` (9 sesi Samsara + 5 playlist) | ✅ tersambung (katalog build-time tetap back catalogue, ADR-0004) |
| **interview** | Konten | `/bicara-melodi` (9 episode Season 3) | ✅ tersambung |
| Gambar artikel | Konten | sampul + gambar inline di dalam isi | ✅ tersambung |

### Aturan: satu daftar cerita bersama

Dua bagian terbesar situs — "Top News" (beranda) dan "Stories" (`/stories`) —
mengambil cerita dari **satu daftar yang sama**, bukan dua kueri terpisah.

Daftarnya adalah `latestStories(count = 8)` di `lib/articles.ts:216-221`:

1. Cerita **foto** dulu, terbaru ke terlama.
2. Lalu cerita **reel**, terbaru ke terlama.

Mekanismenya satu field di dokumen `article`:

| Field | Nilai | Arti |
|---|---|---|
| `mediaType` | `foto` (bawaan / `initialValue`) | berita dari post feed foto |
| `mediaType` | `reel` | berita dari reel — **tampil setelah** semua cerita foto dalam daftar yang sama, dan diberi badge **"Reel"** di kartu |

Kartu `ArticleCard` memberi badge "Reel" bila `mediaType === "reel"`
(`components/ArticleCards.tsx:73-75`).

Satu daftar ini dipakai di lima tempat, jadi angkanya **tidak bisa berbeda**
antar halaman:

| Pemakaian | Jumlah | Sumber |
|---|---|---|
| Beranda `/` — Top News | 7 pertama (1 lead + 3 sidebar + 3 More Top News) | `app/(site)/page.tsx:36-44` |
| Halaman `/stories` — grid 4 kolom | 8 | `app/(site)/stories/page.tsx:18` |
| Blok "More {rubrik}" di detail artikel | 3 dari 8 | `app/(site)/stories/[slug]/page.tsx:66-69` |
| Sitemap | 8 | `app/sitemap.ts:15` |
| RSS `/rss.xml` | 8 | `app/rss.xml/route.ts:29` |

> Catatan: `feedArticles()` pernah ada di `lib/articles.ts` (hanya
> menyaring cerita foto) tapi **tidak dipanggil siapa pun** saat ini. Jangan
> menambahkan pemanggilan baru ke sana — pakailah `latestStories()`.

Sitemap dan RSS memakai daftar yang sama, jadi artikel baru ikut terindeks
otomatis begitu terbit.

---

## 4. Alur satu artikel, dari ketik sampai tampil

```
melodi-alam.sanity.studio  →  Konten  →  Stories  →  Create new
   │
   ├─ Judul, Slug, Rubrik, Tanggal, Sumber, Ringkasan, Catatan hover, Sampul, Isi (rich text)
   ├─ Publish                            ← tombol kanan bawah
   │
   ▼
Sanity (dataset `production`, publik)
   │
   ├─ webhook  →  POST /api/revalidate  →  revalidateTag("articles", "max") + lima tag konten lain
   │
   ▼
lib/articles.ts  ── allArticles() / latestStories() / articleBySlug()
   │   "use cache" + cacheTag("articles") + cacheLife("minutes")
   │
   ▼
app/(site)/stories/page.tsx         →  grid 4 kolom, 8 kartu <ArticleCard>
app/(site)/stories/[slug]/page.tsx  →  <ArticleBody rich={…} />
app/(site)/page.tsx                 →  <TopNews> lead h1 + sidebar 3 + More Top News 3
```

### Yang terjadi saat Anda klik Publish

1. Sanity menyimpan dokumen dan menaikkan `syncTags` dataset.
2. Webhook memanggil `POST /api/revalidate` dengan secret.
3. Route itu membuang cache `articles` (dan lima tag konten lain, lihat §11) lewat `revalidateTag(..., "max")`.
4. Kunjungan berikutnya disajikan versi lama sementara versi baru dimuat di belakang
   layar (stale-while-revalidate) — jadi tidak ada yang menunggu.
5. Setelah itu semua pembaca melihat versi baru.

Kalau webhook-nya belum dipasang, perubahan tetap muncul, hanya setelah jendela
cache habis (1 menit). Jadi ini peningkatan kecepatan, bukan syarat agar berfungsi.

---

## 5. Cara menambah artikel

1. Buka **https://melodi-alam.sanity.studio** (atau `npm run dev` di repo
   `melodialam-sanity`, lalu **http://localhost:3333**) dan masuk dengan akun Sanity.
2. Pilih workspace **Konten** → **Stories** → **Create new**.
3. Isi:
   - **Judul** — judul penuh.
   - **Slug** — **menjadi alamat URL**. `judul-artikel-baru` → `/stories/judul-artikel-baru`.
     Tombol *Generate* mengisinya dari judul. Huruf kecil, tanda hubung, tanpa spasi.
   - **Rubrik** — salah satu dari empat nilai
     (`lib/taxonomy.ts:18-23`): **Fakta Musik**, **Rekomendasi Melodi**,
     **Bicara Melodi**, **Liputan Panggung**. Label yang tampil di situs:
     *Fakta Musik & Esai*, *Fakta Musik*, *Bicara Melodi Notes*,
     *Liputan & Gig Report* (`CATEGORY_LABELS`, `lib/taxonomy.ts:28-33`).
   - **Tanggal terbit** — dipakai untuk pengurutan dan JSON-LD.
   - **Sumber** (`mediaType`) — **Foto — post** (bawaan) atau **Reel — video**.
     Pilih *Reel* bila ceritanya berasal dari reels Instagram: cerita reel
     menunggu di urutan akhir daftar sampai ada padanan post fotonya.
   - **Ringkasan** — dipakai di kartu, meta description, dan JSON-LD.
   - **Catatan panel hover** — teks di panel hijau saat kartu di-hover; kosong berarti
     memakai **Ringkasan**.
   - **Sampul** — unggah langsung; ada *hotspot* supaya pemotongan tidak memenggal wajah.
   - **Path gambar sementara** — hanya untuk artikel yang belum punya sampul terunggah
     (path lokal seperti `/photos/dsc09408.webp`); sembunyi otomatis kalau Sampul sudah ada.
   - **Isi** — rich text; heading, list, kutipan, tautan, dan gambar inline didukung.
   - **Beranda** — blok `Top News` menampilkan **satu lead + tiga sidebar + tiga More Top News** dari daftar
     yang sama; tidak ada pilihan headline manual. Beranda juga memuat
      **Originals** dan **Curated** (tiga post).
4. **Publish**.
5. Buka `/stories/<slug>`. Langsung tampil.

> **Panel hijau pada kartu.** Saat kartu artikel di-hover, muncul panel hijau berisi
> label rubrik, label kecil kanan atas, teaser, dan tombol "buka catatan". Teaser-nya
> otomatis memakai **Ringkasan**; isi **Catatan panel hover** pada artikel kalau ingin
> teks yang berbeda. Dua label panelnya (`articleLabel`, `articleCta`) diatur sekali
> untuk seluruh situs di **Pengaturan Situs → Panel hijau kartu (hover)**.

> **Slug itu kontrak.** Halaman detail membaca artikel berdasarkan slug, jadi
> mengganti slug setelah publish akan mematikan URL lama. Tidak ada redirect otomatis.

---

## 6. Halaman mana membaca apa

| Berkas | Membaca lewat | Catatan |
|---|---|---|
| `app/(site)/stories/page.tsx` | `latestStories(8)` | grid 4 kolom, 8 kartu; kolom ganjil gambar dulu / genap judul dulu; tautan kecil "Curated" |
| `app/(site)/kurasi/page.tsx` | `allPillarPosts()` | **Curated**: section per pillar (6 post/pillar), kotak cari + chip pillar (total 55 post) |
| `app/(site)/stories/[slug]/page.tsx` | `articleBySlug(slug)` + `latestStories(8)` | yang kedua untuk blok "More …"; kartu sosial 1200×630 dari `opengraph-image.tsx` |
| `app/(site)/page.tsx` | `latestStories(8)` + `allPillarPosts()` + `allVideos()` + `allInterviews()` | Top News (1 lead + 3 sidebar + 3 More), Originals, Curated (3 post), Submit |
| `app/(site)/bicara-melodi/page.tsx` | `allInterviews()` + `allVideos()` | 9 episode Season 3 |
| `app/(site)/videos/page.tsx` | `allVideos()` + `allPlaylists()` + `getVideosPageCopy()` | halaman **Melodi Samsara**: 9 sesi Samsara + 5 playlist; judul bagian dari singleton `videosPage` |
| `app/layout.tsx` + halaman | `getSiteSettings()` | identitas situs, catatan kurasi, label panel hijau kartu |
| `app/api/demos/route.ts` | `submissionsClient` langsung | moderasi: hanya status `SHORTLISTED (SAMSARA)` / `APPROVED (ARTICLE)` yang publik |
| `app/(site)/preview/[type]/[slug]/page.tsx` | `draftClient` (`perspective: "drafts"`) | pratinjau draf; butuh `?secret=` |
| `app/(site)/tentang/page.tsx` | — | profil, ekosistem, kanal, kontak & partnership (statis) |
| `app/sitemap.ts` · `app/rss.xml/route.ts` | `latestStories(8)` | sitemap & RSS ikut artikel yang diterbitkan dari Studio |
| `app/api/revalidate/route.ts` | — | menerima webhook, membuang 6 tag cache |
| `app/api/demo-audio/route.ts` | `@vercel/blob/client` `handleUpload` | token unggah audio demo (maks 25 MB, hanya audio) |

`generateStaticParams` hanya mengembalikan slug artikel yang ada sebagai file
statis. Slug yang hanya ada di Sanity dirender saat diminta (`dynamicParams`
default `true`) — **tanpa rebuild**. Itu sebabnya publish langsung tampil.

Alamat lama tetap hidup sebagai **redirect 308 permanen** (bukan halaman):
`/journal` → `/stories`, `/journal/<slug>` → `/stories/<slug>`
(`app/(site)/journal/route.ts`, `app/(site)/journal/[slug]/route.ts`).

---

## 7. Mengubah model konten

Skemanya hidup di repo lain: `melodialam-sanity/sanity/schemaTypes/`.

1. **Ubah skemanya** di sana dengan `defineType`.
2. **Daftarkan** di `sanity/schemaTypes/index.ts` — pilih `contentSchemaTypes`
   (dataset publik) atau `submissionSchemaTypes` (dataset privat). Salah taruh
   berarti konten sensitif jadi publik.
3. **Kalau menyentuh `lib/taxonomy.ts`**, perbarui salinannya di repo ini juga.
4. **Deploy** dari repo Sanity: `npm run deploy` (skema ikut terunggah).
5. **Kalau halaman publik perlu membacanya**, tambah lapisan data di `lib/` di repo
   ini — ikuti pola `lib/articles.ts` (kueri GROQ, pemetaan ke bentuk yang dipakai
   UI, fallback, cache).

### Cache dan revalidasi

Pembacaan yang di-cache harus diberi tag, dan tag itu dibuang dari webhook:

```ts
export async function getX() {
  "use cache";
  cacheLife("minutes");
  cacheTag("x");           // lalu revalidateTag("x", "max") dari webhook
  // …kueri…
}
```

Enam tag yang bisa dibuang webhook: `articles`, `pillar-posts`, `interviews`,
`siteSettings`, `videos`, `videosPage`
(`app/api/revalidate/route.ts:30-37`).

---

## 8. Render rich text

Isi artikel adalah **Portable Text**, bukan HTML. Ia dirender di
`components/ArticleBody.tsx`:

```tsx
import { PortableText } from "@portabletext/react";

<PortableText value={article.richBody} components={components} />
```

Keluaran Portable Text adalah tag "telanjang" — `<p>`, `<h2>`, `<ul>`, `<blockquote>`
— tanpa kelas. Karena itu tipografinya diatur di `app/globals.css` di bawah
`.article-prose`, termasuk drop cap pada blok pertama, yang berlaku untuk kedua
sumber (statis dan Sanity).

`ArticleBody` memilih otomatis: ada `richBody` → Portable Text; tidak ada → paragraf
biasa dari `lib/content-fallback.ts`.

Gambar di dalam isi dirender dengan `<img>` biasa, bukan `next/image`: CDN Sanity
sudah meresize dan mengonversi formatnya (`auto=format` di `lib/sanity.ts`), dan blok
inline tidak menyimpan dimensi untuk `next/image` pakai menghitung tata letak.

---

## 9. Token: di mana boleh, di mana tidak

Ini bagian yang paling mudah salah.

| Berkas | Memuat token? | Boleh diimpor dari |
|---|---|---|
| `lib/sanity.ts` | **tidak** | mana saja, termasuk komponen |
| `lib/sanity-project.ts` | **tidak** | mana saja |
| `lib/sanity-server.ts` | **ya** (`SANITY_API_READ_TOKEN`) | kode server saja |
| `lib/sanity-preview.ts` | **ya** (`SANITY_API_READ_TOKEN`) | kode server saja |

`lib/sanity-server.ts` memegang `SANITY_API_READ_TOKEN`, yang memberi akses baca ke
dataset privat **dan** hak tulis ke antrean demo. Kalau berkas itu sampai diimpor
komponen klien, token ikut ke bundel peramban — dan bersamanya seluruh nomor kontak
musisi.

`lib/sanity-preview.ts` memegang token yang sama untuk satu keperluan lain: membaca
**draf yang belum terbit** (perspective `drafts`) di dataset publik untuk halaman
pratinjau. Perlakukan sama seperti `lib/sanity-server.ts`: server saja.

> **Catatan hardening (`RENCANA`).** Kedua berkas server itu belum memakai
> `import "server-only"`. Graf impor sudah dijaga (tidak ada `"use client"` yang
> menyentuh keduanya), tapi penanda tersebut akan menjadikannya jaminan
> build-time, bukan sekadar konvensi.

Kalau ragu: cek apakah berkas pemanggilnya punya `"use client"` di baris pertama.
Kalau ya, jangan impor `lib/sanity-server.ts`.

---

## 10. Jebakan yang sudah ditemukan (baca sebelum mengubah)

**1. `sanity.config.ts` pernah dibangun dua bundler berbeda.**
Ini bug yang benar-benar terkirim: Studio hosted menolak boot dengan
*"Sanity env vars missing"*. Sebabnya, Next meng-*inline* `NEXT_PUBLIC_*` sementara
Vite milik Sanity hanya mengekspos `SANITY_STUDIO_*` lewat `import.meta.env`. Kini
identitasnya **literal** di `lib/sanity-project.ts` — satu-satunya bentuk yang
disepakati keduanya. Jangan kembalikan ke env var.

**2. `cacheComponents` melarang `dynamic = 'force-dynamic'`.**
Untuk segmen dinamis pakai `await connection()` atau `instant = false`. Pembacaan
data di halaman harus di-cache (`"use cache"` + `cacheTag`) atau dibungkus
`<Suspense>`, kalau tidak build gagal dengan "encountered uncached data during
prerendering".

**3. `revalidateTag` di Next 16 butuh argumen kedua.**
Pakai `"max"` — stale-while-revalidate, yang tepat untuk konten seperti ini.

**4. `useCdn` sengaja `false`.**
Artikel di-cache di Next di bawah satu tag. Kalau CDN dipasang di depannya, CDN akan
mengembalikan salinan lama yang baru saja kita coba buang.

**5. Dataset privat mengembalikan `200` dengan `result: null`, bukan `401`.**
Ini menjebak saat menguji: kueri `count(...)` pada dataset kosong mengembalikan `0`
baik dengan maupun tanpa token, jadi terlihat seperti ACL-nya tidak bekerja. Ujilah
dengan **dokumen nyata** — itu yang membedakan.

**6. Jangan impor `sanity` di repo ini.**
Situs hanya butuh `@sanity/client`, `@portabletext/react`, dan `@sanity/image-url`.
Dependensi Studio (`sanity`, `styled-components`, `@sanity/vision`) ratusan paket dan
sudah tidak ada di sini — jangan tambahkan kembali.

**7. `.valid()` tidak ada di `StringRule` Sanity v6.**
Validasi keanggotaan enum pakai `rule.custom(...)`, bukan `rule.valid(...)`.

**8. `feedArticles()` sudah tidak terpakai — dan sudah dihapus (21 Okt 2026).**
Ia masih diekspor dari `lib/articles.ts`, tapi tidak dipanggil halaman mana pun.
Pemakaian yang benar adalah `latestStories()` (§3).

**9. `asOptions()` hanya ada di repo Studio.**
Salinan `lib/taxonomy.ts` di repo ini sudah tidak mengekspornya. Kalau Anda
menyalin berkas dari Studio ke sini, Anda akan mengimpor fungsi yang tidak dipakai situs
— dan justru konstanta batas audio hanya ada di repo ini (§1).

---

## 11. Menjalankan dari nol

```bash
cp .env.example .env
# isi SANITY_API_READ_TOKEN dan SANITY_REVALIDATE_SECRET
# opsional: SANITY_PREVIEW_SECRET, BLOB_READ_WRITE_TOKEN, RESEND_API_KEY
npm install
npm run dev               # http://localhost:3100
```

`.env.example` sudah memuat seluruh variabel yang dibaca kode, lengkap dengan
keterangan singkat tiap baris. Ringkasnya:

| Variabel | Dibaca di | Jika kosong |
|---|---|---|
| `SANITY_API_READ_TOKEN` | `lib/sanity-server.ts:22`, `lib/sanity-preview.ts:17` | antrean demo jatuh ke array proses-lokal; pratinjau draf 404 |
| `SANITY_REVALIDATE_SECRET` | `app/api/revalidate/route.ts:48`, `lib/sanity-preview.ts:39` | route revalidasi menjawab 500 |
| `SANITY_PREVIEW_SECRET` | `lib/sanity-preview.ts:39`, `proxy.ts` | pratinjau draf; **terpisah** dari secret revalidasi — tidak ada fallback |
| `BLOB_READ_WRITE_TOKEN` | `@vercel/blob` (dipasang Vercel saat Blob store dibuat) | `POST /api/demo-audio` menjawab 400 |
| `RESEND_API_KEY` | `app/api/demos/route.ts:177` | notifikasi email **inert** (kode jalan, panggilan dilewati) |
| `DEMO_NOTIFY_TO` · `DEMO_NOTIFY_FROM` | `app/api/demos/route.ts:180,184` | dipakai default (dua alamat partnership, pengirim `onboarding@resend.dev`) |
| `NEXT_PUBLIC_SITE_URL` | `lib/site.ts:18` | default `https://melodialam.id` |
| `GDRIVE_CLIENT_JSON` · `GDRIVE_AUTH_PORT` | `scripts/gdrive-auth.mjs`, `scripts/gdrive-fetch.mjs` | hanya untuk skrip pembantu lokal (tarik foto redaksi dari Google Drive); tidak dipakai produksi |

Tanpa `.env` pun situs jalan: artikel dibaca dari Sanity (tanpa kredensial), dan
hanya antrean demo yang jatuh ke memori.

### Memasang webhook revalidasi

Di sanity.io/manage → project → **API → Webhooks**:

- **URL**: `https://<domain-anda>/api/revalidate`
- **Method**: `POST`
- **Secret**: nilai `SANITY_REVALIDATE_SECRET` yang sama
- **Filter**: `_type in ["siteSettings", "article", "interview", "video", "playlist", "pillarPost", "videosPage"]`
- **Trigger on**: **Create + Update** — publish hasil edit adalah update; tanpa centang Update, menyunting artikel tidak memicu webhook
- **Projection**: `{_type, _id}`

Isi kolom **Secret** webhook; Sanity lalu mengirim tanda tangan
`sanity-webhook-signature` (HMAC-SHA256 atas `<timestamp>.<body>`, jendela ±5
menit). Route juga menerima header `x-webhook-secret` sebagai cadangan untuk
pemanggil manual — header itu dihapus dari webhook Sanity 25 Okt 2026. Tanpa
bukti identitas, webhook ditolak 401 — endpoint revalidasi terbuka adalah cara
mudah menjadikan cache sebagai sasaran serangan.

**Soal jumlah tipe di filter.** Dataset `production` punya **8** tipe dokumen
(`melodialam-sanity/sanity/schemaTypes/index.ts:26-35`): tujuh di atas, ditambah
`pahlawanRow` — arsip tanpa halaman dan tanpa tag cache, jadi **tidak** perlu ikut
filter. Tipe privat `demoSubmission` dan `demoContact` juga **tidak** ikut: keduanya
berada di dataset `submissions`, dan kueri antrean memakai `cache: "no-store"`
(`app/api/demos/route.ts:146`), jadi ia tidak bergantung pada tag cache sama sekali.

> **Tindakan pemilik (`RENCANA`).** Per pemeriksaan terakhir, **"Trigger on" hanya
> Create yang tercentang**. Centang juga **Update**, lalu samakan filternya dengan
> tujuh tipe di atas. Tanpa itu, menyunting artikel yang sudah terbit tidak
> menghasilkan apa pun.

Route membuang **enam** tag cache sekaligus: `articles`,
`pillar-posts`, `interviews`, `siteSettings`, `videos`, `videosPage`. Kalau Anda menambah
jenis dokumen baru yang punya tag sendiri, tambahkan tag itu ke `CONTENT_TAGS` di
`app/api/revalidate/route.ts` — kalau tidak, publish terasa lambatnya satu jendela cache.

### Pratinjau draf

`/preview/<type>/<slug>?secret=…` menampilkan versi **belum terbit** dari satu dokumen
di tata letak situs:

- `/preview/journal/<slug-artikel>?secret=…`
- `/preview/kurasi/<kode-post-ig>?secret=…` (mis. `DeY9hGEib-w`)

`secret` diambil dari `SANITY_PREVIEW_SECRET` saja — **tidak ada fallback** ke
`SANITY_REVALIDATE_SECRET` sejak 22 Okt 2026. Tanpa secret yang cocok,
route menjawab 404 — halaman ini `noindex`, dan draf bukan untuk dibaca publik.

> **TERVERIFIKASI 22 Okt 2026.** `SANITY_PREVIEW_SECRET` sudah dipasang, dan **berbeda** dari
> `SANITY_REVALIDATE_SECRET`, lalu rotasi nilai `SANITY_REVALIDATE_SECRET` yang lama
> (nilainya pernah terekspos di log percakapan — lihat
> [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) §4.1). Selama env itu kosong, satu
> secret berlaku untuk dua kapabilitas: membatalkan cache dan membuka draf.

Halaman ini membaca lewat `lib/sanity-preview.ts` (perspective `drafts`, dengan token),
jadi ia butuh `SANITY_API_READ_TOKEN` di server.

### Alur audio demo (Blob)

1. Peramban memanggil `upload()` dari `@vercel/blob/client` dengan
   `handleUploadUrl: "/api/demo-audio"` (`components/DemoPortal.tsx:115-121`).
2. `POST /api/demo-audio` menerbitkan token lewat `handleUpload`, mengunci tipe MIME
   audio dan ukuran 25 MB (`app/api/demo-audio/route.ts:23-35`).
3. Peramban mengunggah berkas **langsung ke Vercel Blob** — berkas tidak pernah
   melewati fungsi serverless.
4. Kiriman dikirim ke `POST /api/demos` dengan `audioUrl` + `audioName` +
   `audioSize`; `audioUrl` dan `audioName` disimpan di dokumen `demoSubmission`.
   `audioSize` dikirim sebagai **angka** dan dibaca server lewat `bytes()`
   (`app/api/demos/route.ts:65-69`), yang menerima angka maupun string angka —
   supaya batas 25 MB tidak bisa dilewati dengan mengirim `"0"`.
5. Server memvalidasi `audioUrl`: ekstensinya harus salah satu dari `.mp3`,
   `.wav`, `.ogg` **dan** hostnya harus host Blob milik operator
   (`isOwnBlobUrl()`, `app/api/demos/route.ts:78-87`). Host lain ditolak `422`.

Butuh `BLOB_READ_WRITE_TOKEN` — Vercel memasok token itu otomatis saat sebuah Blob
store dihubungkan ke project. **Belum ada Blob store**, jadi unggahan audio kini
menjawab 400 dan form memberi tahu pengunjung bahwa audio tidak bisa dilampirkan.

### Notifikasi email (Resend)

`app/api/demos/route.ts:165-222` mengirim email ke redaksi setelah kiriman tersimpan.
Kodenya berjalan, tetapi **inert** selama `RESEND_API_KEY` kosong: fungsinya langsung
`return` bila key tidak ada (`:177-178`). Kegagalan pengiriman tidak pernah mengubah
jawaban ke pengunjung.

> Perhatikan isi email: badan teks memuat **kontak manajer** dan **`audioUrl`**
> (`:193-194`). Nyalakan Resend hanya setelah memutuskan hal ini — data pribadi akan
> keluar dari sistem ke penyedia email. Lihat
> [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) §4.1 (F01).

### Deploy Studio

Dari repo **`melodialam-sanity`**, bukan repo ini:

```bash
npm run deploy        # build + unggah ke https://melodi-alam.sanity.studio
```

`npm run deploy` juga mengunggah skema, jadi editor langsung mendapat struktur
terbaru. Untuk melihat apa yang akan diunggah tanpa mengubah apa pun, pakai
`npx sanity deploy --dry-run -y`.

---

## 12. Yang belum tersambung

Sengaja, bukan lupa:

| | Kenapa |
|---|---|
| **Tombol "Buka pratinjau" di dalam Studio** | Halaman `/preview/...` sudah ada (lihat §11), tetapi belum ada tombol di dalam Studio — editor harus menyalin tautan manual. `next-sanity` (`defineLive`) plus route draft-mode belum dipasang. |
| **Sesi video** | Katalog tetap artefak build-time (`ADR-0004`) dan **tidak** ditampilkan sebagai daftar: situs hanya menampilkan seleksi yang hidup sebagai dokumen `video` (9 sesi Samsara lewat `npm run seed:videos`). Tidak ada halaman arsip 292 video. |
| **UI kurator demo** | Status diubah dari Studio (workspace **Submit Karya**). Alur persetujuan khusus (`ADR-0005` butuh ini sebagai prasyarat rilis) belum dibangun. |
| **Blob store di Vercel** | `BLOB_READ_WRITE_TOKEN` belum ada karena belum ada store yang dihubungkan → `POST /api/demo-audio` menjawab 400. Satu-satunya bagian alur audio yang belum hidup. |
| **Notifikasi email** | Kode ada (`app/api/demos/route.ts:165-222`) tapi **inert** sampai `RESEND_API_KEY` diset; alamat tujuan default adalah dua alamat partnership (`DEMO_NOTIFY_TO`). |
| **Webhook: "Trigger on" Update** | **TERVERIFIKASI 22 Okt 2026** — publish → halaman segar dalam 2,1 detik → Update memang memicu |idak memicu revalidasi. Tindakan pemilik (`RENCANA`). |
| **Domain produksi** | `melodialam.id` belum resolve, jadi `NEXT_PUBLIC_SITE_URL` menunjuk ke `https://melodialam-website.vercel.app` dan semua canonical/sitemap/OG ikut ke sana. |
| **Web Analytics** | `@vercel/analytics` terpasang dan `<Analytics />` dirender (`app/layout.tsx:181`), tetapi belum dinyalakan di dashboard Vercel. |
| **Uji otomatis end-to-end** | Unit test Vitest ada (3 berkas, 20 kasus) dan CI GitHub Actions sudah jalan (lint + typecheck + test + build pada setiap push). Uji end-to-end belum. |

---

## 13. Troubleshooting

| Gejala | Sebab | Perbaikan |
|---|---|---|
| Studio bilang "isn't connected to your project" | origin belum terdaftar | tambahkan di sanity.io/manage → API → CORS |
| Studio hosted error "env vars missing" | identitas dibaca dari env var | harus literal dari `lib/sanity-project.ts` (jebakan #1) |
| Build gagal "encountered uncached data" | pembacaan tanpa cache | tambah `"use cache"` + `cacheTag` |
| Build gagal "Cannot find name 'PageProps'" | `.next` dibersihkan | jalankan `npm run build` untuk regenerate |
| Publish tidak muncul | webhook belum dipasang, atau "Trigger on" belum centang **Update** | tunggu jendela cache (1 menit), atau pasang/centang webhook |
| Artikel 404 padahal ada di Studio | belum di-**Publish** | draf tidak terlihat publik |
| Artikel muncul di `/stories` tapi urutannya di akhir | `mediaType` = `reel` | ganti ke **Foto — post** bila sudah ada padanan foto |
| Pratinjau draf 404 | secret salah, atau `SANITY_API_READ_TOKEN` tidak ada | cek `SANITY_PREVIEW_SECRET`; sementara ini jatuh ke `SANITY_REVALIDATE_SECRET` |
| Kiriman demo tidak muncul di antrean | status masih `IN REVIEW` | ubah status di workspace Submit Karya |
| Audio demo gagal diunggah | Blob store belum dibuat | hubungkan Blob store di Vercel → `BLOB_READ_WRITE_TOKEN` otomatis terpasang |
| Tidak ada email notifikasi | `RESEND_API_KEY` belum diset | set di Vercel (perlu juga `DEMO_NOTIFY_TO` bila default tidak dipakai) |
| Gambar artikel tidak tampil | `cdn.sanity.io` tidak terdaftar | cek `images.remotePatterns` di `next.config.ts` |
| Kontak musisi terlihat publik | dokumen salah dataset | pindahkan ke `submissions`; itu satu-satunya dataset privat |
| Perubahan skema tidak muncul di Studio | belum di-deploy | `npm run deploy` dari repo `melodialam-sanity` |

---

## Catatan verifikasi

Diperiksa dengan membaca sumber dan menjalankan perintah lokal:

- **`latestStories(8)`** (`lib/articles.ts:216-221`) — daftar foto dulu lalu reel;
  dipakai beranda (`app/(site)/page.tsx:28`), `/stories`
  (`app/(site)/stories/page.tsx:18`), blok "More" (`app/(site)/stories/[slug]/page.tsx:66`),
  sitemap (`app/sitemap.ts:15`), dan RSS (`app/rss.xml/route.ts:29`).
  `feedArticles()` **tidak pernah** punya pemanggil, dan sudah dihapus dari
`lib/articles.ts` pada 21 Okt 2026.
- **`mediaType`** — `melodialam-sanity/sanity/schemaTypes/article.ts:45-60`: nilai
  `foto` / `reel`, `initialValue: "foto"`. Badge "Reel" di
  `components/ArticleCards.tsx:73-75`.
- **Skema antrean** — `demoSubmission.ts` (12 field, `audioName`/`audioUrl`
  `readOnly`) dan `demoContact.ts` (`submission` reference + `contact`), keduanya di
  `submissionSchemaTypes` (`schemaTypes/index.ts:37`). `contentSchemaTypes`
  (`index.ts:26-35`) berisi **8** tipe: `article`, `interview`, `video`,
  `playlist`, `pillarPost`, `pahlawanRow`, `siteSettings`, `videosPage`.
- **`siteSettings.cardCurtain`** — hanya `articleLabel` + `articleCta`
  (`siteSettings.ts:84-108`).
- **Token** — `SANITY_API_READ_TOKEN` dipakai `lib/sanity-server.ts:22` (dataset
  privat `submissions`, `perspective: "published"`) dan `lib/sanity-preview.ts:17`
  (dataset publik `production`, `perspective: "drafts"`). `lib/sanity.ts` tidak
  memegang token sama sekali.
- **Secret pratinjau** — `lib/sanity-preview.ts:38-40` (`SANITY_PREVIEW_SECRET`
  saja, tanpa fallback sejak 22 Okt 2026); dibandingkan constant-time
  (`:43-50`); dipakai di `proxy.ts` dan
  `app/(site)/preview/[type]/[slug]/page.tsx:106` dengan
  `robots: { index: false, follow: false }` (`:22`).
- **Revalidasi** — `app/api/revalidate/route.ts`: 6 tag, tanda tangan
  `sanity-webhook-signature` (HMAC-SHA256, jendela ±5 menit) atau header
  `x-webhook-secret` cadangan, perbandingan constant-time, `401` kalau tidak cocok.
- **Audio** — `app/api/demo-audio/route.ts:23-35` (`allowedContentTypes`,
  `maximumSizeInBytes`, `addRandomSuffix`); unggah peramban dengan
  `access: "public"` dan nama file asli di key (`components/DemoPortal.tsx:115-121`);
  `audioUrl` divalidasi **ekstensi + host**: hanya `https:` dengan host
  `*.blob.vercel-storage.com` yang diterima (`app/api/demos/route.ts:287-292`,
  `isOwnBlobUrl()` di `:78-87`).
- **Notifikasi email** — `app/api/demos/route.ts:165-222`; early-return bila
  `RESEND_API_KEY` kosong (`:177-178`); badan email memuat `contact` dan `audioUrl`
  (`:193-194`).
- **Studio** — `sanity.config.ts:37,46`: `visionTool()` aktif di workspace `submissions`
  juga (temuan audit F08).
- **Komando lokal** — `npm test` → 20/20 lulus (`lib/content-fallback.test.ts`, Vitest 3.2.7);
  `npm run build` → lulus, **33 halaman statis** (Next.js 16.4.2, Turbopack), 3
  route handler dinamis + 2 route gambar dinamis.

Belum diperiksa: perilaku saat Sanity tidak dapat dijangkau (fallback statis diuji
secara logika), keadaan sebenarnya Blob store & Resend di akun Vercel, status
"Trigger on" webhook (**Create + Update** — sudah terverifikasi 22 Okt 2026: publish → halaman segar dalam 2,1 detik),
dan apakah `melodialam.id` sudah diarahkan.
