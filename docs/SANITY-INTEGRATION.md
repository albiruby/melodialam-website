# Integrasi Web ↔ Sanity

Panduan lengkap: apa yang Anda tulis di Studio akan render di halaman mana, lewat
jalur apa, dan apa yang harus dilakukan saat mengubah model konten.

**Audiens:** editor yang menulis konten, dan developer yang mengubah skema.
**Status:** artikel, antrean demo, dan direktori Pahlawan Kota tersambung. Pratinjau draf belum.

> Menggantikan `PAYLOAD-INTEGRATION.md`, yang dihapus bersama seluruh kode Payload.
> Latar belakang keputusan ada di [`adr/0008`](adr/0008-sanity-studio-menggantikan-payload.md).

---

## 1. Dua repo

Sejak Studio dipindah keluar, ada dua repositori yang harus dipahami bersama:

| Repo | Isi | Perubahan di sini kalau… |
|---|---|---|
| **`melodialam-website`** (repo ini) | situs Next.js + lapisan baca Sanity | …Anda mengubah halaman, kueri, atau tampilan |
| **`melodialam-sanity`** | Studio: `sanity.config.ts`, skema, kosakata | …Anda mengubah model konten atau field |

**Editor tidak perlu menyentuh repo ini.** Studio-nya berdiri sendiri di
**https://melodi-alam.sanity.studio** (atau `npm run dev` di repo Sanity untuk
versi lokal di port 3333).

Dua berkas **sengaja diduplikasi** di kedua repo, dan mengubah salah satunya berarti
mengubah yang lain:

| Berkas | Isi |
|---|---|
| `lib/sanity-project.ts` | project id + nama dua dataset |
| `lib/taxonomy.ts` | rubrik artikel + seluruh enum antrean demo |

Duplikasi ini disadari: Studio tidak bisa mengimpor dari repo ini saat build, dan
repo ini tidak boleh bergantung pada repo Studio.

---

## 2. Model mental

> **1. Sanity menang; `lib/content.ts` adalah jaring pengaman.**

- Artikel yang Anda publish di Studio muncul di situs **tanpa ubah kode**.
- Kalau Sanity tidak dapat dijangkau, situs render 12 artikel dari `lib/content.ts`
  alih-alih gagal.
- Kalau slug-nya bentrok, versi Sanity yang menang — jadi migrasi bisa bertahap:
  seed satu artikel ke Sanity, ia langsung mengambil alih.

Pembacaan artikel **tidak butuh kredensial sama sekali**: dataset `production`
publik dan project id-nya literal di kode. Sanity adalah sumber default, bukan
sesuatu yang Anda aktifkan lewat `.env`.

> **2. Ada dua dataset, dan pemisahannya disengaja.**

| Dataset | ACL | Isi | Token |
|---|---|---|---|
| `production` | publik | artikel + gambar | tidak perlu |
| `submissions` | **privat** | kiriman demo + kontak manajer | **wajib** |

Antrean demo menyimpan nomor WhatsApp manajer. Dataset Sanity yang publik dapat
dibaca siapa pun yang tahu project id, jadi PII tidak boleh berada di sana.

---

## 3. Peta: tulis di sini → render di sana

| Tipe konten | Workspace Studio | Render di halaman | Status |
|---|---|---|---|
| **siteSettings** | Konten | identitas situs (header/footer), ticker beranda, catatan kurasi, label panel hijau kartu | ✅ tersambung |
| **article** | Konten | `/journal`, `/journal/[slug]`, hero + kartu beranda | ✅ tersambung |
| **pahlawanRow** | Konten | `/pahlawan-kota` (direktori kota & skena) | ✅ tersambung |
| **demoSubmission** | Submit Karya | antrean publik di `/submit` (hanya yang disetujui) | ✅ tersambung |
| **demoContact** | Submit Karya | **tidak pernah publik** — hanya panel Studio | ✅ tersambung |
| Gambar artikel | Konten | sampul + gambar inline di dalam isi | ✅ tersambung |
| **video** · **playlist** · **interview** | Konten | `/videos`, `/bicara-melodi`, teaser beranda | ✅ tersambung (katalog build-time tetap back catalogue, ADR-0004) |

---

## 4. Alur satu artikel, dari ketik sampai tampil

```
melodi-alam.sanity.studio  →  Konten  →  Stories  →  Create new
   │
   ├─ Judul, Slug, Rubrik, Tanggal, Ringkasan, Catatan hover, Sampul, Isi (rich text)
   ├─ Publish                            ← tombol kanan bawah
   │
   ▼
Sanity (dataset `production`, publik)
   │
   ├─ webhook  →  POST /api/revalidate  →  revalidateTag("articles", "max") + revalidateTag("pahlawan-rows", "max")
   │
   ▼
lib/articles.ts  ── allArticles() / articleBySlug()
   │   "use cache" + cacheTag("articles") + cacheLife("minutes")
   │
   ▼
app/(site)/journal/page.tsx         →  grid 12 kartu <ArticleCard> (server)
app/(site)/journal/[slug]/page.tsx  →  <ArticleBody rich={…} />
app/(site)/page.tsx                 →  hero + 3 kartu (4 artikel terbaru)
```

### Yang terjadi saat Anda klik Publish

1. Sanity menyimpan dokumen dan menaikkan `syncTags` dataset.
2. Webhook memanggil `POST /api/revalidate` dengan secret bersama.
3. Route itu membuang cache `articles` dan `pahlawan-rows` (`revalidateTag(..., "max")`).
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
   - **Slug** — **menjadi alamat URL**. `judul-artikel-baru` → `/journal/judul-artikel-baru`.
     Tombol *Generate* mengisinya dari judul. Huruf kecil, tanda hubung, tanpa spasi.
   - **Rubrik** — salah satu dari empat (Fakta Musik, Rekomendasi Melodi, Bicara
     Melodi, Liputan Panggung).
   - **Tanggal terbit** — dipakai untuk pengurutan dan JSON-LD.
   - **Ringkasan** — dipakai di kartu, meta description, dan JSON-LD.
   - **Catatan panel hover** — teks di panel hijau saat kartu di-hover; kosong berarti
     memakai **Ringkasan**.
   - **Sampul** — unggah langsung; ada *hotspot* supaya pemotongan tidak memenggal wajah.
   - **Isi** — rich text; heading, list, kutipan, tautan, dan gambar inline didukung.
   - **Beranda** — blok `Latest News` selalu memuat **4 artikel terbaru** (urutan
     tanggal); tidak ada lagi pilihan headline.
4. **Publish**.
5. Buka `/journal/<slug>`. Langsung tampil.

> **Panel hijau pada kartu.** Saat kartu artikel di-hover, muncul panel hijau berisi
> label rubrik, label kecil kanan atas, teaser, dan tombol "buka catatan". Teaser-nya
> otomatis memakai **Ringkasan**; isi **Catatan panel hover** pada artikel kalau ingin
> teks yang berbeda. Empat label panelnya diatur sekali untuk seluruh situs di
> **Pengaturan Situs → Panel hijau kartu (hover)**.

> **Slug itu kontrak.** Halaman detail membaca artikel berdasarkan slug, jadi
> mengganti slug setelah publish akan mematikan URL lama. Tidak ada redirect otomatis.

---

## 6. Halaman mana membaca apa

| Berkas | Membaca lewat | Catatan |
|---|---|---|
| `app/(site)/journal/page.tsx` | `allArticles()` | dirender langsung sebagai grid 12 kartu; server component, tanpa filter |
| `app/(site)/journal/[slug]/page.tsx` | `articleBySlug(slug)` + `allArticles()` | yang kedua untuk blok "More …" |
| `app/(site)/page.tsx` | `allArticles()` | hero + 3 kartu = **4 artikel terbaru** |
| `app/(site)/layout.tsx` + halaman | `getSiteSettings()` | identitas situs, ticker, catatan kurasi, label panel hijau kartu |
| `app/api/demos/route.ts` | `submissionsClient` langsung | moderasi: hanya status disetujui yang publik |
| `app/(site)/pahlawan-kota/page.tsx` | `allPahlawanRows()` | baris Sanity menggantikan `GENRE_ROWS` statis saat ada |
| `app/api/revalidate/route.ts` | — | menerima webhook, membuang cache |

`generateStaticParams` hanya mengembalikan 12 slug statis. Slug yang hanya ada di
Sanity dirender saat diminta (`dynamicParams` default `true`) — **tanpa rebuild**.
Itu sebabnya publish langsung tampil.

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
biasa dari `lib/content.ts`.

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
| `lib/sanity-server.ts` | **ya** | kode server saja |

`lib/sanity-server.ts` memegang `SANITY_API_READ_TOKEN`, yang memberi akses baca ke
dataset privat **dan** hak tulis ke antrean demo. Kalau berkas itu sampai diimpor
komponen klien, token ikut ke bundel peramban — dan bersamanya seluruh nomor kontak
musisi.

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

---

## 11. Menjalankan dari nol

```bash
cp .env.example .env      # isi SANITY_API_READ_TOKEN (dan SANITY_REVALIDATE_SECRET)
npm install
npm run dev               # http://localhost:3100
```

Tanpa `.env` pun situs jalan: artikel dibaca dari Sanity (tanpa kredensial), dan
hanya antrean demo yang jatuh ke memori.

### Memasang webhook revalidasi

Di sanity.io/manage → project → **API → Webhooks**:

- **URL**: `https://<domain-anda>/api/revalidate`
- **Method**: `POST`
- **Secret**: nilai `SANITY_REVALIDATE_SECRET` yang sama
- **Filter**: `_type == "article" || _type == "pahlawanRow"`
- **Projection**: `{_type, _id}`

Webhook tanpa secret akan ditolak 401 — endpoint revalidasi terbuka adalah cara mudah
menjadikan cache sebagai sasaran serangan.

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
| **Pratinjau draf** | Publikasi langsung terlihat, tetapi menyunting draf belum bisa dipratinjau di situs. Butuh `next-sanity` (`defineLive`) plus route draft-mode — sengaja tidak dipasang selama Studio belum butuh. |
| **Sesi video** | Katalog 292 video tetap artefak build-time (`ADR-0004`); hanya seleksi tampil yang hidup sebagai dokumen `video` — 9 sesi Samsara ter-seed lewat `npm run seed:videos`. |
| **UI kurator demo** | Status diubah dari Studio (workspace **Submit Karya**). Alur persetujuan khusus (`ADR-0005` butuh ini sebagai prasyarat rilis) belum dibangun. |
| **Audio demo ke Sanity** | Kolom `audioName` hanya menyimpan metadata (BR-001); berkasnya belum disimpan. |
| **Notifikasi email** | Belum ada. Kiriman demo tidak mengirim email ke siapa pun. |

---

## 13. Troubleshooting

| Gejala | Sebab | Perbaikan |
|---|---|---|
| Studio bilang "isn't connected to your project" | origin belum terdaftar | tambahkan di sanity.io/manage → API → CORS |
| Studio hosted error "env vars missing" | identitas dibaca dari env var | harus literal dari `lib/sanity-project.ts` (jebakan #1) |
| Build gagal "encountered uncached data" | pembacaan tanpa cache | tambah `"use cache"` + `cacheTag` |
| Build gagal "Cannot find name 'PageProps'" | `.next` dibersihkan | jalankan `npm run build` untuk regenerate |
| Publish tidak muncul | webhook belum dipasang | tunggu jendela cache (1 menit), atau pasang webhook |
| Artikel 404 padahal ada di Studio | belum di-**Publish** | draf tidak terlihat publik |
| Kiriman demo tidak muncul di antrean | status masih `IN REVIEW` | ubah status di workspace Submit Karya |
| Gambar artikel tidak tampil | `cdn.sanity.io` tidak terdaftar | cek `images.remotePatterns` di `next.config.ts` |
| Kontak musisi terlihat publik | dokumen salah dataset | pindahkan ke `submissions`; itu satu-satunya dataset privat |
| Perubahan skema tidak muncul di Studio | belum di-deploy | `npm run deploy` dari repo `melodialam-sanity` |

---

## Catatan verifikasi

Diperiksa dengan menjalankan, bukan membaca:

- `/journal/uji-coba-sanity` → **200**. Urutan blok `.article-prose`:
  `p, h2, p, ul, blockquote, p`. `<h2>` = "Subjudul dari rich text", dua `<li>` terisi,
  `<blockquote>` terisi, drop cap `60px` `rgb(27, 59, 43)`, penanda "dari CMS" muncul,
  meta "Fakta Musik · 15 Oktober 2026 · 1 menit baca".
- **Isolasi PII**: dokumen berisi `+62-000-RAHASIA-UJI` ditulis ke `submissions`; kueri
  tanpa token → `result: null`; dengan token → nilainya.
- `POST /api/demos` → **201** `IN REVIEW`; kontak **tidak ada** di badan respons;
  `GET /api/demos` → `count 0`.
- `POST /api/revalidate`: tanpa secret / salah / sepanjang benar-tapi-salah → **401**;
  secret tepat → **200** `{revalidated: true}`.
- Build: lint dan `tsc` bersih, **28 halaman statis**, `/journal` `Revalidate 1m · Expire 1h`.
- Direktori `pahlawanRow`: 3 dokumen ter-seed; `/pahlawan-kota` (`○ Static · Revalidate 1m`)
  merender baris dari Sanity — dokumen uji tampil setelah Publish dan hilang setelah
  dihapus; `POST /api/revalidate` membalas
  `{revalidated: true, tags: ["articles", "pahlawan-rows"]}`.
- Dokumen `video`: 9 sesi Melodi Samsara ter-seed (`npm run seed:videos`, `createOrReplace`
  dengan `_id` deterministik). `/videos` merender 9 baris preview dengan label
  "YouTube Channel". Mengubah `title` satu dokumen di Sanity menggantikan baris katalognya
  di HTML setelah jendela cache lewat (request pertama masih stale, request berikutnya
  bersih) — judul katalog lama lenyap dari halaman, jadi Sanity benar-benar menggantikan
  entri katalog. Penghitung "292 video" dan "101 sesi panggung" tidak berubah.

Belum diperiksa: perilaku saat Sanity tidak dapat dijangkau (fallback statis diuji
secara logika), dan pratinjau draf (belum dibangun).
