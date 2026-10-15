# Integrasi Web ↔ Payload CMS

Panduan lengkap: apa yang Anda tulis di `/admin` akan render di halaman mana,
lewat jalur apa, dan apa yang harus dilakukan saat menambah koleksi baru.

**Audiens:** editor yang menulis konten, dan developer yang menambah koleksi.
**Status:** artikel dan demo sudah tersambung. Item ekosistem, sesi video, dan
UI kurator belum.

---

## 1. Model mental

Satu aturan yang menjelaskan semuanya:

> **Payload menang kalau database terjangkau; `lib/content.ts` jadi fallback kalau tidak.**

Konsekuensinya:

- Artikel yang Anda publish di `/admin` muncul di situs **tanpa ubah kode**.
- Checkout bersih tanpa `DATABASE_URL` tetap render 12 artikel dari file.
- Kalau slug-nya bentrok, versi CMS yang menang — jadi migrasi bisa bertahap:
  seed satu artikel ke Payload, ia langsung mengambil alih, dan Anda tidak perlu
  menghapus apa pun dari file statis sampai migrasinya selesai.

Ini yang tercatat sebagai `ARCH-RISK-005` di `docs/ARCHITECTURE.md`: selama
migrasi ada dua sumber kebenaran, dan itu disengaja.

---

## 2. Peta: tulis di sini → render di sana

| Koleksi di `/admin` | Render di halaman | Status |
|---|---|---|
| **Articles** | `/journal`, `/journal/[slug]`, hero + grid beranda | ✅ tersambung |
| **Demo Submissions** | antrean publik di `/submit` (hanya yang di-approve) | ✅ tersambung |
| **Demo Contacts** | **tidak pernah publik** — hanya panel admin | ✅ tersambung |
| **Media** | gambar sampul artikel | ✅ tersambung |
| **Users** | login panel admin | ✅ tersambung |
| **Ecosystem Items** | — | ⛔ belum (seksi Spaces sudah dihapus) |
| Sesi video | — | ⛔ belum (katalog video tetap build-time, ADR-0004) |

---

## 3. Alur satu artikel, dari ketik sampai tampil

```
/admin  →  Articles  →  Create New
   │
   ├─ Title, Slug, Category, Date, Excerpt, Image, Body (rich text)
   ├─ Status: Draft  →  Published        ← tombol di kanan atas
   │
   ▼
Postgres (Supabase)  ── tabel articles + _articles_v (versi)
   │
   ├─ hook afterChange  →  revalidateTag("articles", "max")
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

1. Payload menulis ke Postgres dan menyimpan versinya.
2. Hook `afterChange` memanggil `revalidateTag("articles", "max")`.
3. Kunjungan berikutnya disajikan versi lama sementara versi baru dimuat di
   belakang layar (stale-while-revalidate) — jadi tidak ada yang menunggu.
4. Setelah itu semua pembaca melihat versi baru.

Kalau hook-nya tidak ada, perubahan baru terlihat setelah jendela cache habis
(1 menit) — masih jalan, hanya kurang responsif.

---

## 4. Cara menambah artikel

1. Buka **http://localhost:3100/admin** → **Articles** → **Create New**.
2. Isi:
   - **Title** — judul penuh.
   - **Slug** — **harus sama dengan segmen URL**. `judul-artikel-baru` →
     `/journal/judul-artikel-baru`. Huruf kecil, tanda hubung, tanpa spasi.
   - **Category** — salah satu dari empat rubrik (Fakta Musik, Rekomendasi
     Melodi, Bicara Melodi, Liputan Panggung).
   - **Date** — tanggal terbit.
   - **Excerpt** — ringkasan; dipakai di kartu, meta description, dan JSON-LD.
   - **Image** — unggah lewat koleksi Media (lihat §6).
   - **Body** — rich text; heading, list, kutipan, tautan, dan gambar inline
     semuanya didukung.
   - **Featured** — centang untuk menjadikannya hero di beranda.
3. **Status** → **Published**, lalu simpan.
4. Buka `/journal/<slug>`. Langsung tampil.

> **Slug itu kontrak.** Halaman detail membaca artikel berdasarkan slug, jadi
> mengganti slug setelah publish akan mematikan URL lama. Tidak ada redirect
> otomatis.

---

## 5. Halaman mana membaca apa

| Berkas | Membaca lewat | Catatan |
|---|---|---|
| `app/(site)/journal/page.tsx` | `allArticles()` | diteruskan ke `JournalBrowser` sebagai prop, karena itu client component |
| `app/(site)/journal/[slug]/page.tsx` | `articleBySlug(slug)` + `allArticles()` | yang kedua untuk blok "More …" |
| `app/(site)/page.tsx` | `allArticles()` | hero = artikel `featured` pertama |
| `app/api/demos/route.ts` | `getPayloadClient()` langsung | moderasi: hanya status approved yang publik |

`generateStaticParams` hanya mengembalikan 12 slug statis. Slug yang hanya ada di
CMS dirender saat diminta (`dynamicParams` default `true`) — **tanpa rebuild**.
Itu sebabnya publish langsung tampil di dev maupun produksi.

---

## 6. Media dan unggahan

Gambar artikel disimpan lewat koleksi **Media**. Dua mode:

| | Tanpa kredensial S3 | Dengan kredensial S3 |
|---|---|---|
| Penyimpanan | disk lokal `media/` | Supabase Storage |
| URL di dokumen | `/api/media/file/<nama>` | URL bucket |
| Cocok untuk | dev | produksi |

Untuk mengaktifkan Supabase Storage, isi kelima variabel `S3_*` di `.env` dari
dashboard Supabase → **Storage → S3 access keys**, lalu buat bucket-nya. Kalau
salah satu kosong, plugin tidak aktif dan unggahan jatuh ke disk lokal.

**Jangan** mengandalkan disk lokal di Vercel: filesystem-nya sementara, berkasnya
hilang saat deploy berikutnya.

---

## 7. Menambah koleksi baru

Pola yang dipakai berulang, jadi urutannya penting:

1. **Tulis koleksinya** di `collections/<Nama>.ts` — `slug`, `fields`, `access`.
2. **Daftarkan** di `payload.config.ts` → array `collections`.
3. **Generate tipe** — `npm run generate:types` (menulis `payload-types.ts`).
4. **Buat migrasi** — `npm run db:migrate:create`, lalu **perbaiki import-nya**
   (lihat §9), lalu `npm run db:migrate`.
5. **Tambah lapisan data** di `lib/` kalau halaman publik perlu membacanya —
   ikuti pola `lib/articles.ts`.
6. **Tambah hook revalidasi** kalau bacaannya di-cache:

```ts
import { revalidateTag } from 'next/cache';

const afterChange = ({ doc }) => {
  revalidateTag('nama-koleksi', 'max');
  return doc;
};

export const NamaKoleksi: CollectionConfig = {
  slug: 'nama-koleksi',
  hooks: { afterChange: [afterChange] },
  // …
};
```

7. **Verifikasi**: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

### Aturan akses

Kontrol akses menentukan apa yang bisa dibaca publik — **bukan** kode di
komponen. Untuk data yang tidak boleh publik, jangan andalkan menyembunyikan di
UI; tutup di koleksinya:

```ts
access: {
  // Publik hanya melihat baris yang sudah disetujui.
  read: ({ req }) => req.user ? true : { status: { in: ['APPROVED'] } },
  // Tidak ada jalur tulis publik; hanya lewat route handler yang memvalidasi.
  create: () => false,
  update: ({ req }) => !!req.user,
  delete: ({ req }) => !!req.user,
}
```

Ini pola yang dipakai `demo-contacts`: **tidak ada** jalur baca publik sama
sekali, jadi nomor WhatsApp musisi tidak bisa bocor lewat kecelakaan.

---

## 8. Render rich text

Body CMS adalah state editor Lexical, bukan HTML. Ia dirender lewat renderer
bawaan Payload di `components/ArticleBody.tsx`:

```tsx
import { RichText } from '@payloadcms/richtext-lexical/react';

<RichText data={article.richBody as never} />
```

Keluaran Payload adalah `<div class="payload-richtext">` berisi `<p>`, `<h2>`,
`<ul>`, `<blockquote>`, dst. Karena tag-nya "telanjang" tanpa kelas, tipografinya
diatur di `app/globals.css` di bawah `.article-prose` — termasuk drop cap pada
blok pertama, yang berlaku untuk kedua sumber (statis dan CMS).

`ArticleBody` memilih otomatis: ada `richBody` → renderer Lexical; tidak ada →
paragraf biasa dari `lib/content.ts`. Lebar kolom dan skala hurufnya sama, jadi
kedua sumber tidak bisa dibedakan pembaca.

---

## 9. Jebakan yang sudah ditemukan (baca sebelum mengubah)

Empat hal ini sudah memakan waktu; jangan ulangi.

**1. `payload *` harus jalan dengan `--disable-transpile`.**
Loader `tsx` crash di Node 24 (`ERR_REQUIRE_ASYNC_MODULE` dari
`@payloadcms/richtext-lexical`). Karena itu semua skrip npm-nya memakai flag itu,
dan **karena itu pula** impor relatif di `payload.config.ts` membawa ekstensi
`.ts` eksplisit (`allowImportingTsExtensions` di `tsconfig.json`). Jangan
"rapikan" keduanya tanpa menjalankan `npm run generate:importmap` dulu.

**2. Impor config harus dari `@payload-config`.**
Bukan `@/payload.config`. Alias itu yang dipakai plugin `withPayload` supaya
config bisa di-resolve di bundle klien juga. Alias-nya terdaftar di
`tsconfig.json` → `paths`.

**3. `RootPage` dan `generatePageMetadata` menerima `config` sebagai Promise.**
Itu yang dikembalikan `buildConfig`. Jangan `await` dulu — akan muncul
`Cannot destructure property 'config' of … as it is undefined`.

**4. `app/(payload)/layout.tsx` wajib ada.**
Tanpa itu panel admin tersarang di `app/(site)/layout.tsx`, menghasilkan dua
`<html>` bersarang dan hydration gagal. Itu sebabnya situs ada di route group
`(site)` — masing-masing grup punya root layout sendiri.

Tambahan untuk `cacheComponents: true`:

- Set `PAYLOAD_CACHE_COMPONENTS_ENABLED=true` di `.env`. Payload memakai flag itu
  untuk membungkus root layout-nya dengan `<Suspense>`.
- `dynamic = 'force-dynamic'` **ditolak** saat `cacheComponents` aktif. Untuk
  membuat segmen dinamis, pakai `await connection()` atau `instant = false`.
- Pembacaan data di halaman harus di-cache (`"use cache"` + `cacheTag`) atau
  dibungkus `<Suspense>`, kalau tidak build gagal dengan
  "encountered uncached data during prerendering".
- `revalidateTag` di Next 16 **butuh argumen kedua**; pakai `"max"`.

**5. Impor tipe di file migrasi harus `import type`.**
`migrate:create` menghasilkan
`import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'`,
tapi dua nama pertama itu type-only. Dengan type-stripping Node, impor nilai atas
sebuah tipe crash saat runtime. Pisahkan:

```ts
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';
```

---

## 10. Menjalankan dari nol

```bash
cp .env.example .env      # isi PAYLOAD_SECRET dan DATABASE_URL
npm install
npm run db:migrate        # buat tabel
npm run dev               # http://localhost:3100
```

Buka `/admin` → buat user kurator pertama → mulai menulis.

Tanpa `DATABASE_URL`, situs tetap jalan penuh dari `lib/content.ts`; yang butuh
database hanya `/admin` dan antrean demo.

---

## 11. Yang belum tersambung

Sengaja, bukan lupa:

| | Kenapa |
|---|---|
| **Ecosystem Items** | halaman `/spaces` dan seksinya sudah dihapus atas permintaan; koleksinya masih ada kalau mau dihidupkan lagi |
| **Sesi video** | katalog 292 video tetap artefak build-time (`ADR-0004`). Kalau butuh kurasi (menandai video unggulan), bentuknya koleksi kecil yang merujuk `youtubeId`, bukan memindahkan seluruh katalog |
| **UI kurator demo** | sekarang status diubah dari panel admin. Alur persetujuan khusus (`ADR-0005` butuh ini sebagai prasyarat rilis) belum dibangun |
| **Audio demo ke Storage** | kolom unggahannya ada, tapi alur simpan berkas audio belum; pratinjau masih lokal di peramban |
| **Notifikasi email** | belum ada adapter; Payload menulis email ke console (`No email adapter provided` itu normal) |

---

## 12. Troubleshooting

| Gejala | Sebab | Perbaikan |
|---|---|---|
| `/admin` error `Cannot destructure property 'config'` | `app/(payload)/layout.tsx` hilang, atau config di-`await` dulu | pastikan layout ada; jangan await config |
| Build gagal "encountered uncached data" | pembacaan DB tanpa cache | tambah `"use cache"` + `cacheTag` |
| Build gagal "unstable value `new Date()`" | segmen tidak ditandai dinamis | `await connection()` atau `instant = false` |
| Publish tidak muncul | hook revalidasi tidak jalan | cek `afterChange` di koleksinya |
| `payload` CLI crash `ERR_REQUIRE_ASYNC_MODULE` | flag `--disable-transpile` hilang | pakai skrip npm, jangan `npx payload` langsung |
| Artikel 404 padahal ada di `/api/articles` | status masih Draft | set **Published** |
| Gambar tidak muncul | unggahan ke disk lokal lalu dihapus saat deploy | isi kredensial `S3_*` |

---

## Catatan verifikasi

Diperiksa dengan menjalankan, bukan membaca:

- `/journal/tes` → **200** (sebelumnya 404), judul `tes` render di `<h1>`, meta
  `Fakta Musik · 23 Oktober 2026 · 1 menit baca`, body Lexical render sebagai
  `<div class="payload-richtext"><p>…</p></div>` dengan `font-size: 16px` dan
  `line-height: 28px`, sampul `1294×727`.
- `/journal` menampilkan **13 kartu** (12 statis + 1 CMS).
- Build produksi: **27 halaman**, tabel route menunjukkan `Revalidate 1m · Expire 1h`.
- `npm run lint` dan `npx tsc --noEmit` bersih.
- Media: `POST /api/media 201`, lalu `GET /api/media/file/logopnj.jpg 200`.

Belum diperiksa: revalidasi tag setelah publish di lingkungan produksi (diuji
lokal), dan perilaku saat Storage S3 aktif.
