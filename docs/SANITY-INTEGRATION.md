# Integrasi Web ↔ Sanity Studio

Panduan lengkap: apa yang Anda tulis di `/studio` akan render di halaman mana, lewat
jalur apa, dan apa yang harus dilakukan saat menambah tipe konten baru.

**Audiens:** editor yang menulis konten, dan developer yang menambah tipe konten.
**Status:** artikel dan antrean demo sudah tersambung. Pratinjau draf belum.

> Menggantikan `PAYLOAD-INTEGRATION.md`, yang sudah dihapus bersama seluruh kode Payload.
> Latar belakang keputusan ada di [`adr/0008`](adr/0008-sanity-studio-menggantikan-payload.md).

---

## 1. Model mental

Dua aturan yang menjelaskan hampir semuanya.

> **1. Sanity menang kalau terkonfigurasi; `lib/content.ts` jadi fallback kalau tidak.**

- Artikel yang Anda publish di Studio muncul di situs **tanpa ubah kode**.
- Checkout bersih tanpa `.env` tetap render 12 artikel dari berkas.
- Kalau slug-nya bentrok, versi Sanity yang menang — jadi migrasi bisa bertahap: seed
  satu artikel ke Sanity, ia langsung mengambil alih, dan Anda tidak perlu menghapus apa
  pun dari berkas statis sampai migrasinya selesai.

> **2. Ada dua dataset, dan pemisahannya disengaja.**

| Dataset | ACL | Isi | Token |
|---|---|---|---|
| `production` | publik | artikel + gambar | tidak perlu |
| `submissions` | **privat** | kiriman demo + kontak manajer | **wajib** |

Antrean demo menyimpan nomor WhatsApp manajer. Dataset Sanity yang publik dapat dibaca
siapa pun yang tahu project id, jadi PII tidak boleh berada di sana. Dua dataset adalah
cara menjaga artikel tetap terbaca tanpa token (dan bisa lewat CDN) sementara PII tetap
tertutup.

---

## 2. Peta: tulis di sini → render di sana

| Tipe konten | Workspace Studio | Render di halaman | Status |
|---|---|---|---|
| **article** | Konten | `/journal`, `/journal/[slug]`, hero + kartu beranda | ✅ tersambung |
| **demoSubmission** | Antrean Demo | antrean publik di `/submit` (hanya yang disetujui) | ✅ tersambung |
| **demoContact** | Antrean Demo | **tidak pernah publik** — hanya panel Studio | ✅ tersambung |
| Gambar artikel | Konten | sampul + gambar inline di dalam isi | ✅ tersambung |
| Sesi video | — | — | ⛔ belum (katalog video tetap build-time, ADR-0004) |

---

## 3. Alur satu artikel, dari ketik sampai tampil

```
/studio/content  →  Artikel  →  Create new
   │
   ├─ Judul, Slug, Rubrik, Tanggal, Ringkasan, Sampul, Isi (rich text), Headline
   ├─ Publish                            ← tombol kanan bawah
   │
   ▼
Sanity (dataset `production`, publik)
   │
   ├─ webhook  →  POST /api/revalidate  →  revalidateTag("articles", "max")
   │
   ▼
lib/articles.ts  ── allArticles() / articleBySlug()
   │   "use cache" + cacheTag("articles") + cacheLife("minutes")
   │
   ▼
app/(site)/journal/page.tsx         →  <JournalBrowser articles={…} />
app/(site)/journal/[slug]/page.tsx  →  <ArticleBody rich={…} />
app/(site)/page.tsx                 →  hero + 3 kartu
```

### Yang terjadi saat Anda klik Publish

1. Sanity menyimpan dokumen dan menaikkan `syncTags` dataset.
2. Webhook memanggil `POST /api/revalidate` dengan secret bersama.
3. Route itu memanggil `revalidateTag("articles", "max")`.
4. Kunjungan berikutnya disajikan versi lama sementara versi baru dimuat di belakang
   layar (stale-while-revalidate) — jadi tidak ada yang menunggu.
5. Setelah itu semua pembaca melihat versi baru.

Kalau webhook-nya belum dipasang, perubahan tetap muncul, hanya setelah jendela cache
habis (1 menit). Jadi ini peningkatan kecepatan, bukan syarat agar berfungsi.

---

## 4. Cara menambah artikel

1. Buka **http://localhost:3100/studio** → masuk dengan akun Sanity Anda.
2. Pilih workspace **Konten** → **Artikel** → **Create new**.
3. Isi:
   - **Judul** — judul penuh.
   - **Slug** — **menjadi alamat URL**. `judul-artikel-baru` → `/journal/judul-artikel-baru`.
     Tombol *Generate* mengisinya dari judul. Huruf kecil, tanda hubung, tanpa spasi.
   - **Rubrik** — salah satu dari empat (Fakta Musik, Rekomendasi Melodi, Bicara Melodi,
     Liputan Panggung).
   - **Tanggal terbit** — dipakai untuk pengurutan dan JSON-LD.
   - **Ringkasan** — dipakai di kartu, meta description, dan JSON-LD.
   - **Sampul** — unggah langsung; ada *hotspot* supaya pemotongan tidak memenggal wajah.
   - **Isi** — rich text; heading, list, kutipan, tautan, dan gambar inline semuanya
     didukung.
   - **Jadikan headline beranda** — centang untuk menjadikannya hero di beranda.
4. **Publish**.
5. Buka `/journal/<slug>`. Langsung tampil.

> **Slug itu kontrak.** Halaman detail membaca artikel berdasarkan slug, jadi mengganti
> slug setelah publish akan mematikan URL lama. Tidak ada redirect otomatis.

---

## 5. Halaman mana membaca apa

| Berkas | Membaca lewat | Catatan |
|---|---|---|
| `app/(site)/journal/page.tsx` | `allArticles()` | diteruskan ke `JournalBrowser` sebagai prop, karena itu client component |
| `app/(site)/journal/[slug]/page.tsx` | `articleBySlug(slug)` + `allArticles()` | yang kedua untuk blok "More …" |
| `app/(site)/page.tsx` | `allArticles()` | hero = artikel `featured` pertama |
| `app/api/demos/route.ts` | `submissionsClient` langsung | moderasi: hanya status disetujui yang publik |
| `app/api/revalidate/route.ts` | — | menerima webhook, membuang cache |

`generateStaticParams` hanya mengembalikan 12 slug statis. Slug yang hanya ada di Sanity
dirender saat diminta (`dynamicParams` default `true`) — **tanpa rebuild**. Itu sebabnya
publish langsung tampil.

---

## 6. Menambah tipe konten baru

1. **Tulis skemanya** di `sanity/schemaTypes/<nama>.ts` dengan `defineType`.
2. **Daftarkan** di `sanity/schemaTypes/index.ts` — pilih `contentSchemaTypes` (dataset
   publik) atau `submissionSchemaTypes` (dataset privat). Salah taruh berarti konten
   sensitif jadi publik.
3. **Tambah lapisan data** di `lib/` kalau halaman publik perlu membacanya; ikuti pola
   `lib/articles.ts` (kueri GROQ, pemetaan ke bentuk yang dipakai UI, fallback).
4. **Cache dan revalidasi** kalau bacaannya di-cache:

```ts
export async function getX() {
  "use cache";
  cacheLife("minutes");
  cacheTag("x");           // lalu revalidateTag("x", "max") dari webhook
  // …kueri…
}
```

5. **Verifikasi**: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

### Kosakata bersama

Nilai yang dipakai skema **dan** kode situs hidup di `lib/taxonomy.ts` — rubrik artikel
dan seluruh enum antrean demo. `lib/content.ts` me-*re-export*-nya, jadi impor lama tetap
jalan.

Alasannya bukan kerapian: skema berjalan di bundel Studio, dan mengimpor `lib/content.ts`
ke sana akan menyeret dua belas artikel ikut masuk. `lib/taxonomy.ts` sengaja tidak
mengimpor apa pun.

---

## 7. Render rich text

Isi artikel adalah **Portable Text**, bukan HTML. Ia dirender di
`components/ArticleBody.tsx`:

```tsx
import { PortableText } from "@portabletext/react";

<PortableText value={article.richBody} components={components} />
```

Keluaran Portable Text adalah tag "telanjang" — `<p>`, `<h2>`, `<ul>`, `<blockquote>` —
tanpa kelas. Karena itu tipografinya diatur di `app/globals.css` di bawah
`.article-prose`, termasuk drop cap pada blok pertama, yang berlaku untuk kedua sumber
(statis dan Sanity).

`ArticleBody` memilih otomatis: ada `richBody` → Portable Text; tidak ada → paragraf
biasa dari `lib/content.ts`. Lebar kolom dan skala hurufnya sama, jadi kedua sumber tidak
bisa dibedakan pembaca.

Gambar di dalam isi dirender dengan `<img>` biasa, bukan `next/image`: CDN Sanity sudah
meresize dan mengonversi formatnya (`auto=format` di `lib/sanity.ts`), dan blok inline
tidak menyimpan dimensi untuk `next/image` pakai menghitung tata letak.

---

## 8. Token: di mana boleh, di mana tidak

Ini bagian yang paling mudah salah.

| Berkas | Memuat token? | Boleh diimpor dari |
|---|---|---|
| `lib/sanity.ts` | **tidak** | mana saja, termasuk komponen |
| `lib/sanity-server.ts` | **ya** | kode server saja |

`lib/sanity-server.ts` memegang `SANITY_API_READ_TOKEN`, yang memberi akses baca ke
dataset privat **dan** hak tulis ke antrean demo. Kalau berkas itu sampai diimpor
komponen klien, token ikut ke bundel peramban — dan bersamanya seluruh nomor kontak
musisi.

Kalau ragu: cek apakah berkas pemanggilnya punya `"use client"` di baris pertama. Kalau
ya, jangan impor `lib/sanity-server.ts`.

---

## 9. Media

Gambar artikel diunggah langsung ke Sanity dan disajikan dari `cdn.sanity.com` (resize dan
konversi format dilakukan di sana). Tidak ada bucket S3, tidak ada berkas lokal, tidak ada
yang hilang saat redeploy.

Host-nya harus terdaftar di dua tempat, dan keduanya sudah diisi:

- `next.config.ts` → `images.remotePatterns` (`cdn.sanity.io`, path `/images/**`)
- `next.config.ts` → CSP report-only (`img-src` dan `connect-src`)

---

## 10. Jebakan yang sudah ditemukan (baca sebelum mengubah)

Delapan hal ini sudah memakan waktu. Jangan ulangi.

**1. Rute `/studio` butuh root layout sendiri.**
Layout situs hidup di route group `app/(site)/`, dan route group bukan penyedia layout
untuk rute di luarnya. Tanpa `app/studio/layout.tsx`, Next.js menolak render. Berkas itu
sengaja telanjang: Studio membawa gayanya sendiri.

**2. `cacheComponents` melarang `dynamic = 'force-dynamic'`.**
Untuk segmen dinamis pakai `await connection()` atau `instant = false`. Dan pembacaan
data di halaman harus di-cache (`"use cache"` + `cacheTag`) atau dibungkus `<Suspense>`,
kalau tidak build gagal dengan "encountered uncached data during prerendering".

**3. `revalidateTag` di Next 16 butuh argumen kedua.**
Pakai `"max"` — stale-while-revalidate, yang tepat untuk konten seperti ini.

**4. `useCdn` sengaja `false`.**
Artikel di-cache di Next di bawah satu tag. Kalau CDN dipasang di depannya, CDN akan
mengembalikan salinan lama yang baru saja kita coba buang. Trade-off-nya: setiap
pembacaan menyentuh API Sanity, bukan CDN — tetapi dengan `"use cache"` itu terjadi
sekali per jendela cache, bukan per permintaan.

**5. Dataset privat mengembalikan `200` dengan `result: null`, bukan `401`.**
Ini menjebak saat menguji: kueri `count(...)` pada dataset kosong mengembalikan `0` baik
dengan maupun tanpa token, jadi terlihat seperti ACL-nya tidak bekerja. Ujilah dengan
**dokumen nyata** — itu yang membedakan.

**6. Management API memakai `displayName`, bukan `projectName`.**
Dan secret token ada di field **`key`**, bukan `token`. Secret hanya ditampilkan sekali
saat dibuat; kalau tidak tertangkap, token harus dihapus dan dibuat ulang.

**7. Origin harus didaftarkan, atau Studio bilang "isn't connected to your project".**
Tambahkan `http://localhost:3100` lewat Management API (`POST /projects/{id}/cors`) atau
di sanity.io/manage. Untuk produksi, tambahkan juga domain deploy-nya.

**8. `.valid()` tidak ada di `StringRule` Sanity v6.**
Validasi keanggotaan enum pakai `rule.custom(...)`, bukan `rule.valid(...)`.

Dan satu sisa dari era Payload: setelah menghapus rute, **bersihkan `.next`**. Tipe rute
yang di-*generate* akan terus menunjuk ke berkas yang sudah tidak ada, dan `PageProps`
(global dari Next) baru muncul lagi setelah build berikutnya.

---

## 11. Menjalankan dari nol

```bash
cp .env.example .env      # isi NEXT_PUBLIC_SANITY_PROJECT_ID dan SANITY_API_READ_TOKEN
npm install
npm run dev               # http://localhost:3100
```

Buka `/studio` → masuk → mulai menulis.

Tanpa `.env`, situs tetap jalan penuh dari `lib/content.ts` dan antrean demo memakai
array proses-lokal; yang mati hanya Studio dan persistensi antrean.

### Memasang webhook revalidasi

Di sanity.io/manage → project → **API → Webhooks**:

- **URL**: `https://<domain-anda>/api/revalidate`
- **Method**: `POST`
- **Secret**: nilai `SANITY_REVALIDATE_SECRET` yang sama
- **Filter**: `_type == "article"`
- **Projection**: `{_type, _id}`

Webhook tanpa secret akan ditolak 401 — endpoint revalidasi terbuka adalah cara mudah
menjadikan cache sebagai sasaran serangan.

### Deploy Studio ke hosting Sanity

Studio bisa di-host Sanity sendiri, terpisah dari situsnya:

```bash
npm run sanity:deploy        # bangun + unggah; host dari sanity.cli.ts
```

Hasilnya: **https://melodi-alam.sanity.studio**

Dua hal yang perlu diketahui:

1. **Hosting Sanity mengabaikan `basePath`.** Studio yang di-host memakai nama
   workspace sebagai path kanonik — `/content` dan `/submissions` — sementara Studio
   embedded memakai `/studio/content` dan `/studio/submissions`. Keduanya bekerja;
   `basePath` di `sanity.config.ts` hanya berlaku untuk yang embedded. Jadi jangan
   bingung kalau URL-nya berbeda dari yang tertulis di konfigurasi.
2. **Akses lewat dashboard Sanity.** Membuka host itu mengalihkan (302) ke
   `www.sanity.io/@<org>/studio/<id>`, yang meminta login. Ini benar: Studio adalah alat
   editor, bukan halaman publik. Alamat yang layak dibagikan ke editor adalah
   `https://melodi-alam.sanity.studio` — pengalihannya otomatis.

`sanity deploy` juga mengunggah skema, jadi editor mendapat struktur terbaru tanpa
langkah tambahan. Menjalankan `npm run sanity -- deploy --dry-run -y` lebih dulu
menunjukkan apa yang akan diunggah tanpa mengubah apa pun.

> `dist/` adalah keluaran build Studio dan sudah masuk `.gitignore`.

---

## 12. Yang belum tersambung

Sengaja, bukan lupa:

| | Kenapa |
|---|---|
| **Pratinjau draf** | Publikasi langsung terlihat, tetapi menyunting draf belum bisa dipratinjau di situs. Butuh `defineLive` dari `next-sanity` plus route draft-mode. |
| **Sesi video** | Katalog 292 video tetap artefak build-time (`ADR-0004`). Kalau butuh kurasi, bentuknya tipe konten kecil yang merujuk `youtubeId`, bukan memindahkan seluruh katalog. |
| **UI kurator demo** | Status diubah dari Studio (workspace **Antrean Demo**). Alur persetujuan khusus (`ADR-0005` butuh ini sebagai prasyarat rilis) belum dibangun. |
| **Audio demo ke Sanity** | Kolom `audioName` hanya menyimpan metadata (BR-001); berkasnya belum disimpan. Sanity Asset Pipeline menerima audio, tetapi belum dipasang. |
| **Notifikasi email** | Belum ada. Kiriman demo tidak mengirim email ke siapa pun. |
| **Halaman `/admin` lama** | Sudah hilang bersama Payload. Alamatnya kini `/studio`. |

---

## 13. Troubleshooting

| Gejala | Sebab | Perbaikan |
|---|---|---|
| Studio bilang "isn't connected to your project" | origin belum didaftarkan | tambahkan origin-nya (jebakan #7) |
| Studio kosong / error saat boot | env var Sanity tidak lengkap | `sanity.config.ts` melempar kalau salah satu kosong |
| Build gagal "encountered uncached data" | pembacaan tanpa cache | tambah `"use cache"` + `cacheTag` |
| Build gagal "Cannot find name 'PageProps'" | `.next` dibersihkan | jalankan `npm run build` untuk regenerate |
| Publish tidak muncul | webhook belum dipasang | tunggu jendela cache (1 menit), atau pasang webhook |
| Artikel 404 padahal ada di Studio | belum di-**Publish** | draf tidak terlihat publik |
| Kiriman demo tidak muncul di antrean | status masih `IN REVIEW` | ubah status di workspace Antrean Demo |
| Gambar artikel tidak tampil | `cdn.sanity.io` tidak terdaftar | cek `images.remotePatterns` |
| Kontak musisi terlihat publik | dokumen salah dataset | pindahkan ke `submissions`; itu satu-satunya dataset privat |

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
- `/studio` dan `/studio/content` → **200**; Studio terhubung ke project `03sgar5q`.
- Build: lint dan `tsc` bersih, **28 halaman statis**, `/journal` `Revalidate 1m · Expire 1h`.
- **Deploy Studio.** `npm run sanity:deploy` → `https://melodi-alam.sanity.studio`, dengan
  2 skema ikut terunggah. Host-nya mengalihkan **302** ke dashboard Sanity dan meminta
  login — benar, karena Studio bukan halaman publik. Studio embedded tidak terpengaruh:
  `/studio` → `/studio/content/structure` (workspace Konten, berisi "Artikel"),
  `/studio/submissions` → `/studio/submissions/structure` (workspace Antrean Demo, berisi
  "Kiriman Demo" dan "Kontak Demo").

Belum diperiksa: perilaku saat Sanity tidak dapat dijangkau (fallback statis diuji secara
logika), dan pratinjau draf (belum dibangun).
