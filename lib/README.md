# `lib/` — peta modul

Satu lapis data, 17 berkas. Semuanya mengikuti satu aturan: **Sanity yang
menang, katalog untuk video, statis hanya sebagai cadangan.** Kalau sudah tahu
di mana mencarinya, tabel di bawah sudah cukup.

## Pertanyaan → berkas

| "Di mana ...?" | Berkas |
|---|---|
| daftar artikel | `articles.ts` → `latestStories(8)` |
| satu artikel | `articles.ts` → `articleBySlug()` |
| post kurasi | `pillars.ts` (server) · `pillars-shared.ts` (konstanta untuk klien) |
| episode Bicara Melodi | `interviews.ts` |
| sesi & playlist Melodi Samsara | `videos.ts` |
| judul & catatan halaman `/videos` | `videos-page.ts` |
| tirai kartu, kontak | `site-settings.ts` |
| nama situs, navigasi, footer | `site.ts` |
| 292 video hasil scrape | `catalogue.json` (artefak build) → `catalogue.ts` (aksesor) |
| artikel cadangan saat Sanity tak terjangkau | `content-fallback.ts` |
| enum kategori, status demo, genre, batas audio | `taxonomy.ts` |

---

## 1. Klien Sanity

| Berkas | Peran | Boleh diimpor komponen klien? |
|---|---|---|
| `sanity-project.ts` | project id + nama kedua dataset, sebagai literal | ya |
| `sanity.ts` | klien **tanpa token**, perspektif `published` — dataset `production` yang publik | ya |
| `sanity-server.ts` | klien **ber-token** ke dataset privat `submissions`: antrean demo + kontak manajer | **tidak** |
| `sanity-preview.ts` | klien **ber-token** perspektif `drafts` + pembanding secret pratinjau | **tidak** |

Project id sengaja literal, bukan variabel lingkungan: `sanity.config.ts` dibangun
dua bundler berbeda (Next dan Sanity) yang mengekspos env var dengan cara
berbeda, dan hanya literal yang disepakati keduanya.

## 2. Pembaca isi

| Berkas | Isi | Tag cache |
|---|---|---|
| `articles.ts` | 12 artikel; `latestStories(8)` adalah satu-satunya daftar yang dipakai beranda, `/stories`, sitemap, dan RSS | `articles` |
| `pillars.ts` | 55 post kurasi | `pillar-posts` |
| `interviews.ts` | 9 episode wawancara | `interviews` |
| `videos.ts` | sesi & playlist — CMS dulu, katalog untuk sisanya | `videos` |
| `videos-page.ts` | salinan teks halaman `/videos` (judul, catatan) | `videosPage` |
| `site-settings.ts` | satu dokumen `siteSettings`: nama footer, catatan kurasi, tirai kartu, kontak | `siteSettings` |

`pillars-shared.ts` sengaja dipisah dari `pillars.ts`: yang pertama hanya
konstanta murni (`PHOTO_PILLARS`, `REEL_PILLARS`, `PILLAR_LABELS`) supaya bundel
klien tidak pernah menarik `next/cache` atau klien Sanity.

## 3. Katalog & cadangan

| Berkas | Isi |
|---|---|
| `catalogue.json` | hasil scrape kanal YouTube — 292 video, 342 Shorts, 5 playlist. **Artefak generated**, jangan disunting tangan; dibuat ulang dengan `npm run catalogue` |
| `catalogue.ts` | aksesor bertipe di atas JSON itu: `VIDEOS`, `SHORTS`, `PLAYLISTS`, `VENUES`, `getVideo()`, `viewCount()`, `formatDuration()` |
| `content-fallback.ts` | **fallback statis**, bukan sumber kebenaran: 12 artikel, baris wawancara. Dipakai hanya saat Sanity tidak dapat dijangkau |
| `content-fallback.test.ts` | sembilan kasus Vitest untuk `content-fallback.ts` (`npm test`) |

## 4. Konstanta bersama

| Berkas | Isi |
|---|---|
| `site.ts` | `SITE` (nama, url, tagline, locale), navigasi, rubrik footer, tautan luar |
| `taxonomy.ts` | enum & label yang juga dipakai skema Studio: kategori artikel, status demo, genre, program, batas & tipe audio |

`taxonomy.ts` dan `sanity-project.ts` **diduplikasi** di repo Studio
(`melodialam-sanity`) dengan sengaja, dan kedua berkas menyatakan itu di bagian
atasnya. Perubahan enum harus dibuat di dua tempat.

---

## Aturan yang menjaga folder ini tetap rapi

1. **CMS menang, statis cadangan.** Setiap pembacaan Sanity punya jalur cadangan
   agar situs tetap tampil tanpa `.env`. Suntingan yang benar-benar dipakai
   pembaca dilakukan di Studio — menyunting `content-fallback.ts` tidak mengubah apa
   pun di situs yang berjalan.
2. **Batas server/clien eksplisit.** Hanya `sanity.ts` dan `sanity-project.ts`
   yang aman diimpor dari komponen klien. Berkas lain yang memegang token tidak
   boleh masuk bundel browser.
3. **Satu tag cache per jenis isi**, dan tag itu dikunci lewat `cacheTag()` di
   modul pembacaannya. Webhook `POST /api/revalidate` memanggil enam tag itu dengan nama
   yang sama persis.
4. **Satu daftar cerita untuk semua halaman.** `latestStories(8)` dipakai
   beranda, `/stories`, sitemap, dan RSS, sehingga angka di antar halaman tidak
   mungkin berbeda.
5. **Tidak ada modul lain yang membaca `process.env`.** Hanya `site.ts`,
   `sanity-server.ts`, `sanity-preview.ts`, `app/api/demos/route.ts`, dan dua
   skrip Google Drive yang melakukannya.
