# API-CONTRACTS — Melodi Alam Web Platform

Dokumen ini adalah **kontrak antarmuka** platform web **Melodi Alam**: setiap
endpoint HTTP yang benar-benar ada di repo `melodi-alam/` hari ini, lengkap
dengan method, field, cap, status code, header, dan pesan validasi yang dibaca
langsung dari kodenya.

Tidak ada kontrak target di dokumen ini. Backend yang berjalan adalah
**Sanity Studio** (dataset `production` publik + dataset `submissions` privat),
bukan Payload CMS dan bukan Supabase — lihat
[`adr/0008-sanity-studio-menggantikan-payload.md`](adr/0008-sanity-studio-menggantikan-payload.md).
Semua spec lama bertanda Payload/Supabase (`/api/curator/*`, `/api/graphql`,
`DATABASE_URL`, `demo_submissions`) sudah **dibuang** dan tidak lagi diceritakan
sebagai fitur yang ada.

Label status:

| Label | Arti |
|---|---|
| `TERVERIFIKASI` | Dibaca langsung di kode repo (dengan `file:line`) |
| `RENCANA` | Direncanakan; belum ada di kode |
| `ASUMSI` | Diasumsikan; belum bisa dipastikan |
| `[PERLU VERIFIKASI]` | Tidak dapat diverifikasi dari workspace |

Acuan requirement: **`BR-001`** (batas berkas audio + tipe berkas),
**`RISK-001`** (kontrol penyalahgunaan). Acuan skema data:
[`DATA-MODEL.md`](DATA-MODEL.md), [`SANITY-INTEGRATION.md`](SANITY-INTEGRATION.md).
Acuan audit: [`audit-2026-10-21.md`](audit-2026-10-21.md).

> **Catatan cakupan.** Repo ini punya **empat route handler** (`app/api/**`),
> satu generator metadata (`app/robots.ts`, `app/sitemap.ts`), satu
> route XML (`app/rss.xml/route.ts`), dan **dua route handler pengalihan
> 308** di `app/(site)/journal/`. Semua ada di §3–§4. Tidak ada endpoint lain;
> apa pun yang tidak ada di sini **tidak ada**.

---

## 1. API Context

### 1.1 Konsumen

| Kode | Konsumen | Kebutuhan | Status |
|---|---|---|---|
| `C1` | `components/DemoPortal.tsx` (client component, layar `/submit`) | `POST /api/demo-audio` (token unggah) lalu `POST /api/demos`; membaca `error` banner dan `errors` per-field | `TERVERIFIKASI` |
| `C2` | Sanity webhook (dipasang manual di dashboard Sanity) | `POST /api/revalidate` dengan secret, untuk membuang 6 tag cache | `TERVERIFIKASI` (kode) / `RENCANA` (pasang) |
| `C3` | Kurator/editor (non-teknis, di dalam Sanity Studio) | Membaca submission + kontak artis **di dataset privat `submissions`**, bukan lewat API | `TERVERIFIKASI` |
| `C4` | Perayapan mesin pencari & pembaca feed | `GET /rss.xml`, `GET /sitemap.xml`, `GET /robots.txt` | `TERVERIFIKASI` |
| `C5` | Pengunjung yang menyimpan tautan lama `/journal/...` | Redirect permanen `308` ke `/stories/...` | `TERVERIFIKASI` |

Temuan penting `TERVERIFIKASI`: **tidak ada satu pun klien di repo yang
memanggil `GET /api/demos`.** `DemoPortal` (satu-satunya konsumen API di sisi
browser) hanya mengirim `POST`. `GET /api/demos` tetap dipertahankan sebagai
antrean publik baca-saja, dan bentuk responsnya **sudah** dibatasi ke baris
berstatus disetujui.

### 1.2 Gaya antarmuka

| Aspek | Nilai | Status |
|---|---|---|
| Gaya hari ini | REST/JSON, Next.js App Router route handler | `TERVERIFIKASI` |
| Format body | JSON (`application/json`), kecuali `POST /api/demo-audio` yang menerima body `@vercel/blob` | `TERVERIFIKASI` |
| Format non-JSON | `GET /rss.xml` → `application/rss+xml`; `GET /robots.txt` → `text/plain`; `GET /sitemap.xml` → `application/xml` | `TERVERIFIKASI` |
| Basis URL dev | `http://localhost:3100` (port sengaja bukan 3000) | `TERVERIFIKASI` (`package.json`) |
| Versi kontrak | Belum berversi; tidak ada prefix `/v1` | `TERVERIFIKASI` |

### 1.3 Model autentikasi

| Endpoint | Model | Status |
|---|---|---|
| `GET /api/demos` | **Tidak ada autentikasi.** Terbuka publik | `TERVERIFIKASI` |
| `POST /api/demos` | **Tidak ada autentikasi.** Terbuka publik | `TERVERIFIKASI` |
| `POST /api/demo-audio` | **Tidak ada autentikasi.** Token unggah terbit untuk siapa pun yang meminta | `TERVERIFIKASI` |
| `POST /api/revalidate` | **Shared secret** (`SANITY_REVALIDATE_SECRET`), dibandingkan constant-time | `TERVERIFIKASI` |
| `GET /rss.xml` · `/sitemap.xml` · `/robots.txt` | Tidak ada autentikasi | `TERVERIFIKASI` |
| `GET /journal` · `/journal/[slug]` | Tidak ada autentikasi | `TERVERIFIKASI` |

Tidak ada endpoint moderasi kurator. Kurator bekerja **di dalam Sanity Studio**
(dataset privat `submissions`), sehingga tidak ada surface HTTP yang mengekspos PII
kontak. Endpoint moderasi (`/api/curator/*`) **tidak ada** — jangan ditulis
sebagai rencana di dokumen lain.

### 1.4 Asumsi

- `ASUMSI` — Volume submit rendah (1–3 kurator), sehingga belum ada rate limit
  di `POST /api/demos`. Lihat §6.3 untuk daftar kontrol yang belum ada.
- `ASUMSI` — Demo queue dibaca lewat `GET /api/demos` hanya oleh integrator
  internal; tidak ada UI publik yang memakainya.
- `[PERLU VERIFIKASI]` — Nilai `SANITY_API_READ_TOKEN` di lingkungan produksi
  (scope, masa berlaku, hak akses) tidak dapat diverifikasi dari repo.

---

## 2. Konvensi

### 2.1 Format data (`TERVERIFIKASI`)

| Data | Konvensi | Sumber |
|---|---|---|
| ID submission (fallback in-memory) | `demo-<Date.now base36>-<6 char base36 acak>`; seed memakai `seed-<slug>` | `app/api/demos/route.ts:58-60` |
| ID submission (Sanity) | `_id` dokumen Sanity, apa adanya | `app/api/demos/route.ts:342` |
| Tanggal submit | **Date-only** `YYYY-MM-DD`, dari `new Date().toISOString().slice(0,10)` | `app/api/demos/route.ts:261` |
| Field teks | Di-`trim()` lalu `slice()` ke cap; non-string dipetakan ke `""` | `app/api/demos/route.ts:54-56` |
| Enum `genre`/`program` | Closed set `as const` dari `lib/taxonomy.ts` | `app/api/demos/route.ts:227-232` |
| Casing JSON key | `camelCase` | `app/api/demos/route.ts:40-52` |
| `null` vs absen | Field yang tak dikirim menjadi `""` setelah `str()`; `null` tidak pernah muncul di respons | `app/api/demos/route.ts:76-88` |
| `status` | Enum tertutup 4 nilai (lihat §6.2), bukan free text | `lib/taxonomy.ts` |

### 2.2 Batas payload dan cap field (`TERVERIFIKASI`)

`str(value, max = 500)` — default cap 500, tiap field punya cap eksplisit
(`app/api/demos/route.ts:206-216`):

| Field | Cap karakter | Wajib? | Sumber |
|---|---|---|---|
| `artist` | 120 | Ya | `route.ts:206` |
| `city` | 80 | Ya | `route.ts:207` |
| `title` | 160 | Ya | `route.ts:208` |
| `genre` | 60 | Tidak (validasi kondisional) | `route.ts:209` |
| `program` | 80 | Tidak (validasi kondisional) | `route.ts:210` |
| `link` | 500 | Ya | `route.ts:211` |
| `contact` | 160 | Ya | `route.ts:212` |
| `story` | 2000 | Ya | `route.ts:213` |
| `audioName` | 200 | Tidak | `route.ts:214` |
| `audioUrl` | 500 | Tidak — harus `https://…` + ekstensi audio | `route.ts:216` |
| `audioSize` | angka (bukan string) | Tidak | `route.ts:215` |

Batas bodies:

| Batas | Nilai | Sumber |
|---|---|---|
| Body `POST /api/demos` | **16 KB** (`16 * 1024`) → `413` | `route.ts:38`, `route.ts:195-197` |
| Audio (server, via metadata) | **25 MB** (`25 * 1024 * 1024` = `26214400`) | `lib/taxonomy.ts` `DEMO_AUDIO_MAX_BYTES` |
| Audio (server, via token Blob) | **25 MB** (`maximumSizeInBytes`) | `app/api/demo-audio/route.ts:28` |
| Antrean yang dikembalikan `GET` | **100 baris** (`[0...100]`) | `app/api/demos/route.ts:91` |

Pemotongan **diam-diam** (tanpa error): nilai lebih panjang dipotong, bukan
ditolak. Cap ini dijalankan **sebelum** validasi wajib, sehingga field 700
karakter yang valid tetap lolos.

### 2.3 Status code (`TERVERIFIKASI`)

| Status | Endpoint | Kapan | Body |
|---|---|---|---|
| `200` | `GET /api/demos` | Selalu (tidak ada jalur error) | `{ queue, count }` |
| `201` | `POST /api/demos` | Submission tersimpan | `{ ok, entry, queueLength, note }` |
| `400` | `POST /api/demos` | Body bukan JSON valid | `{ error }` |
| `413` | `POST /api/demos` | Body > 16 KB | `{ error }` |
| `422` | `POST /api/demos` | Validasi field gagal | `{ error, errors }` |
| `503` | `POST /api/demos` | Penyimpanan ke Sanity gagal | `{ error }` |
| `200` | `POST /api/demo-audio` | Token unggah terbit | `{ type, clientToken }` |
| `400` | `POST /api/demo-audio` | Token gagal terbit (mis. `BLOB_READ_WRITE_TOKEN` belum ada) | `{ error }` |
| `200` | `POST /api/revalidate` | Cache dibuang | `{ revalidated, tags }` |
| `401` | `POST /api/revalidate` | Secret tidak cocok | `{ error }` |
| `500` | `POST /api/revalidate` | `SANITY_REVALIDATE_SECRET` belum diset | `{ error }` |
| `200` | `GET /rss.xml` | Selalu | XML RSS 2.0 |
| `200` | `GET /sitemap.xml` | Selalu | XML sitemap |
| `200` | `GET /robots.txt` | Selalu | `text/plain` |
| `308` | `GET /journal` | Selalu | Redirect permanen ke `/stories` |
| `308` | `GET /journal/[slug]` | Selalu | Redirect permanen ke `/stories/<slug>` |

Untuk method lain pada route yang sama (mis. `PUT /api/demos`): `ASUMSI` —
Next.js mengembalikan `405` secara otomatis, tetapi **body dan `Allow`-header
tidak dikendalikan oleh kode ini**; tidak diklaim di sini (`[PERLU VERIFIKASI]`).

### 2.4 Header cache (`TERVERIFIKASI`)

| Rute | Header | Sumber |
|---|---|---|
| `/rss.xml` | `Cache-Control: public, s-maxage=600, stale-while-revalidate=600` | `app/rss.xml/route.ts:70` |
| `/rss.xml` | `Content-Type: application/rss+xml; charset=utf-8` | `app/rss.xml/route.ts:69` |
| `/sitemap.xml` | `Cache-Control: public, max-age=0, must-revalidate` · `Content-Type: application/xml` | _default Next.js_ — diverifikasi lewat `next start` |
| `/robots.txt` | `Cache-Control: public, max-age=0, must-revalidate` · `Content-Type: text/plain` | _default Next.js_ — diverifikasi lewat `next start` |
| `/api/demos` | Tanpa header cache eksplisit; query Sanity memakai `cache: "no-store"` | `app/api/demos/route.ts:115`, `:357` |
| `/api/demo-audio` · `/api/revalidate` | Tanpa header cache eksplisit | `TERVERIFIKASI` |

### 2.5 Environment yang memengaruhi perilaku (`TERVERIFIKASI`)

| Variable | Scope | Efek kalau tidak di-set | Efek kalau di-set |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | client + server | `SITE.url` jatuh ke literal `https://melodialam.id` (`lib/site.ts:18`) | Canonical origin, sitemap, RSS, `robots.txt`, OG memakai nilai itu |
| `SANITY_API_READ_TOKEN` | server saja | `submissionsClient = null` → `/api/demos` memakai antrean in-memory; `draftClient = null` → `/preview/...` selalu 404 | Antrean demo + kontak hidup di dataset privat `submissions`; pratinjau draf aktif |
| `SANITY_REVALIDATE_SECRET` | server saja | `POST /api/revalidate` → `500` | Route bekerja; juga dipakai sebagai **fallback** secret pratinjau |
| `SANITY_PREVIEW_SECRET` | server saja | Pratinjau memakai secret sendiri, tanpa fallback | Pratinjau memakai secret terpisah |
| `BLOB_READ_WRITE_TOKEN` | server saja | `POST /api/demo-audio` → `400` | Token unggah terbit |
| `RESEND_API_KEY` | server saja | Notifikasi email **inert** (tidak ada panggilan HTTP) | Notifikasi email dikirim ke redaksi |
| `DEMO_NOTIFY_TO` | server saja | Default `melodialam.ip@gmail.com,helfan@infia.co` | Override penerima, dipisah koma |
| `DEMO_NOTIFY_FROM` | server saja | Default `Melodi Alam <onboarding@resend.dev>` | Override pengirim |

`DATABASE_URL` **tidak dibaca kode mana pun** di repo ini, dan barisnya **sudah
dihapus** dari `.env` lokal (22 Okt 2026). Sisa era Supabase; lihat
[`DEPLOYMENT.md`](DEPLOYMENT.md) §3.

---

## 3. Inventaris Operasi

Kolom **Fase**: `TERVERIFIKASI` = ada di kode hari ini; `RENCANA` = belum ada.

| ID | Method & Path | Tujuan | Auth | Build | Fase |
|---|---|---|---|---|---|
| `API-01` | `GET /api/demos` | Baca antrean demo **approved-only** (atau antrean seed, kalau Sanity tak terhubung) | Tidak ada | `ƒ` Dynamic | `TERVERIFIKASI` |
| `API-02` | `POST /api/demos` | Kirim satu submission demo | Tidak ada | `ƒ` Dynamic | `TERVERIFIKASI` |
| `API-03` | `POST /api/demo-audio` | Terbitkan token unggah berkas audio ke Vercel Blob | Tidak ada | `ƒ` Dynamic | `TERVERIFIKASI` |
| `API-04` | `POST /api/revalidate` | Webhook Sanity → buang 6 tag cache | Shared secret | `ƒ` Dynamic | `TERVERIFIKASI` |
| `API-05` | `GET /rss.xml` | Feed RSS 2.0 dari 8 cerita terbaru | Tidak ada | `○` Static | `TERVERIFIKASI` |
| `API-06` | `GET /sitemap.xml` | Peta situs: 7 halaman + 8 artikel | Tidak ada | `○` Static | `TERVERIFIKASI` |
| `API-07` | `GET /robots.txt` | Aturan perayapan + alamat sitemap | Tidak ada | `○` Static | `TERVERIFIKASI` |
| `API-08` | `GET /journal` | Redirect permanen ke `/stories` | Tidak ada | `ƒ` Dynamic | `TERVERIFIKASI` |
| `API-09` | `GET /journal/[slug]` | Redirect permanen ke `/stories/<slug>` | Tidak ada | `ƒ` Dynamic | `TERVERIFIKASI` |

Tidak ada endpoint moderasi kurator, endpoint CMS REST/GraphQL, atau endpoint
pengunggahan audio yang menerima `multipart/form-data`.

---

## 4. Spesifikasi Operasi (`TERVERIFIKASI`)

### 4.1 `API-01` — `GET /api/demos`

| Properti | Nilai |
|---|---|
| Tujuan | Membaca antrean demo yang **sudah disetujui** |
| Method & path | `GET /api/demos` |
| Auth | Tidak ada; terbuka publik |
| Parameter | **Tidak ada.** Tidak ada query, header, atau paginasi |
| Efek samping | Tidak ada |
| Cache | Tanpa header cache eksplisit; pembacaan Sanity memakai `cache: "no-store"` |

**Dua jalur, satu kontrak** (`app/api/demos/route.ts:106-123`):

1. **Sanity terhubung** (`SANITY_API_READ_TOKEN` ada): GROQ
   `*[_type == "demoSubmission" && status in $approved] | order(submittedAt desc)[0...100]`
   dengan `$approved = ["SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)"]`.
   `cache: "no-store"`.
2. **Sanity tidak terhubung**: array modul `memoryQueue` yang disemai dari
   `SEED_DEMOS` (3 entri) — **tanpa** filter status.

Kalau pembacaan Sanity melempar error, route **jatuh ke antrean seed** dengan
`200`, bukan `5xx` ("the queue is a convenience, not a page").

**Respons sukses — `200`** (`application/json`):

```json
{
  "queue": [
    {
      "id": "seed-shroomeater",
      "artist": "Shroomeater",
      "city": "Bogor",
      "title": "Echoes in the Pine Forest",
      "genre": "Alternative Rock / Shoegaze",
      "program": "Live at Melodi Samsara",
      "link": "https://www.instagram.com/melodi.alam/",
      "story": "Direkam secara live di studio kecil kawasan Baranangsiang, terinspirasi kabut sore Kota Bogor.",
      "status": "SHORTLISTED (SAMSARA)",
      "submittedAt": "2026-10-12"
    }
  ],
  "count": 1
}
```

- `queue`: array baris yang lolos filter status (jalur Sanity) atau seluruh
  antrean seed (jalur fallback). Maksimal **100** baris.
- `count`: `queue.length` — jumlah elemen, **bukan** jumlah dokumen Sanity
  seluruh.
- Baris di-*narrow* ke `DemoSubmission` oleh `toPublicRow()`
  (`route.ts:76-89`): `genre`/`program` yang `null` menjadi `""`.

**Tidak ada status error.** Route ini tidak dapat mengembalikan `4xx`/`5xx`
dari logikanya sendiri.

**Celah `TERVERIFIKASI`:**

1. **Fallback tidak memfilter status.** Tanpa `SANITY_API_READ_TOKEN`, jalur
   seed mengembalikan `seed-pelabuhan-senja` yang berstatus `IN REVIEW` —
  yakni status belum disetujui ikut terbaca. Jalur Sanity tidak punya masalah ini.
2. **Tanpa paginasi.** Dibatasi 100 baris, tapi tidak ada cara meminta halaman
   berikutnya.
3. **Tanpa autentikasi dan tanpa rate limit.**
4. **Tanpa filter/sortir/pencarian** selain urutan `submittedAt desc` yang
   dipatok server.
5. **Tidak ada konsumen di repo** (§1.1) — mengubah bentuk respons tidak
   Clinics klien yang sudah dikirim.

### 4.2 `API-02` — `POST /api/demos`

| Properti | Nilai |
|---|---|
| Tujuan | Menerima satu submission demo dari form `/submit` |
| Method & path | `POST /api/demos` |
| Auth | Tidak ada; terbuka publik |
| Content-Type | `application/json` (dikirim klien) |
| Efek samping | Menulis 2 dokumen Sanity (`demoSubmission` + `demoContact`), atau meng-`unshift` ke array proses-lokal |
| Idempotensi | **Tidak ada.** Retry menghasilkan entri ganda |

**Request body** — 11 field; 6 wajib setelah validasi:

```json
{
  "artist": "Skyline",
  "city": "Bandung",
  "title": "Senja di Jalan Braga",
  "genre": "Indie Pop / Folk",
  "program": "Review Artikel dan Rekomendasi IG",
  "link": "https://open.spotify.com/example",
  "contact": "manager@example.test",
  "story": "Single kedua dari EP mendatang.",
  "audioName": "demo-skyline.mp3",
  "audioSize": 4213376,
  "audioUrl": "https://abc123.public.blob.vercel-storage.com/demo-audio/1760000000000-demo-skyline-xyz.mp3"
}
```

**Pipeline server** (`route.ts:193-374`, urut persis):

1. `await request.text()`. Panjang > 16 KB → **`413`**.
2. `JSON.parse(raw)`. Gagal parse → **`400`**. Hasil parse yang bukan objek
   (mis. `null` atau array) juga → **`400` "Body harus berupa objek JSON."**.
3. `str()` per field: `trim()` + `slice(0, cap)`. Non-string → `""`.
   `audioSize` dibaca lewat `bytes()`: angka atau string angka; selain itu `0`.
4. Bangun objek `errors` per-field.
5. `errors` tidak kosong → **`422`**.
6. `submittedAt` = `YYYY-MM-DD`.
7. **Tanpa Sanity** (`route.ts:265-291`): buat `entry` berstatus `IN REVIEW`,
   simpan `contact` di peta terpisah `memoryContacts`, `unshift` ke
   `memoryQueue`, balas `201`.
8. **Dengan Sanity** (`route.ts:293-326`): buat dokumen `demoSubmission`, lalu
   dokumen `demoContact` yang mereferensikannya. Gagal → **`503`**.
9. Kirim notifikasi email (inert tanpa `RESEND_API_KEY`); kegagalan email
   **tidak** mengubah jawaban.
10. Hitung `queueLength` = jumlah submission **approved**. Query hit-nya
    boleh gagal → `queueLength` = `0`, jawaban tetap `201`.
11. Balas **`201`**.

**Validasi `TERVERIFIKASI` (pesan persis, huruf demi huruf):**

| Field | Kondisi gagal | Pesan `errors[field]` |
|---|---|---|
| `artist` | kosong setelah trim | `Nama band atau solois wajib diisi.` |
| `city` | kosong setelah trim | `Kota asal wajib diisi.` |
| `title` | kosong setelah trim | `Judul lagu atau EP wajib diisi.` |
| `story` | kosong setelah trim | `Cerita singkat wajib diisi.` |
| `contact` | kosong setelah trim | `Kontak manajer wajib diisi.` |
| `link` | kosong setelah trim | `Link streaming atau EPK wajib diisi.` |
| `link` | tidak cocok `/^https?:\/\/.+/i` (dan tak kosong) | `Link harus diawali http:// atau https://.` |
| `genre` | non-kosong **dan** di luar `DEMO_GENRES` | `Genre tidak dikenal.` |
| `program` | non-kosong **dan** di luar `DEMO_PROGRAMS` | `Program tujuan tidak dikenal.` |
| `audioName` | akhiran nama bukan `.mp3`/`.wav`/`.ogg` | `Format berkas harus .mp3, .wav, .ogg.` |
| `audioName` | `audioSize > 26214400` | `Ukuran berkas melebihi batas 25 MB.` |
| `audioUrl` | bukan `https://`, host tidak berakhiran `.blob.vercel-storage.com`, atau path (tanpa query) tidak berakhiran `.mp3`/`.wav`/`.ogg` | `Tautan audio tidak dikenal.` |

Catatan validasi yang harus dibaca konsumen:

- **Satu kunci, satu pesan.** `audioName` dipakai untuk **dua** aturan; aturan
  ukuran menimpa aturan format bila keduanya gagal.
- **`genre`/`program` kondisional.** Nilai kosong **lolos** server (cek hanya
  `if (genre && …)`). Jadi `{}` (semua kosong) menghasilkan error untuk 6 field
  wajib, **bukan** untuk `genre`/`program`.
- **Regex `link` ketat.** `/^https?:\/\/.+/i` mensyaratkan minimal satu karakter
  setelah `//`; `"https://"` saja **gagal**. Skema selain `http`/`https` gagal.
- **Cap dijalankan lebih dulu.** Field 700 karakter tidak memicu error panjang,
  hanya terpotong.
- **Tidak ada validasi tipe.** Angka/`null`/objek untuk field string menjadi
  `""` lewat `str()`, lalu jatuh ke error "wajib diisi" bila field itu wajib.
- **`audioUrl` hanya Forma, bukan host.** Validasi memeriksa skema `https` dan
  ekstensi, **bukan** host. `audioUrl` dari host mana pun yang berakhiran
  `.mp3` diterima — lihat celah §4.2.1.

**Error `400`** — body bukan JSON valid:

```json
{ "error": "Body harus berupa JSON." }
```

**Error `413`** — body > 16 KB:

```json
{ "error": "Kiriman terlalu besar." }
```

**Error `422`** — `errors` hanya memuat field yang gagal:

```json
{
  "error": "Periksa kembali isian formulir.",
  "errors": {
    "artist": "Nama band atau solois wajib diisi.",
    "link": "Link harus diawali http:// atau https://."
  }
}
```

**Error `503`** — penyimpanan Sanity gagal:

```json
{ "error": "Pengiriman demo sedang tidak bisa disimpan. Coba lagi nanti." }
```

**Sukses `201`:**

```json
{
  "ok": true,
  "entry": {
    "id": "a1b2c3d4e5f6",
    "artist": "Skyline",
    "city": "Bandung",
    "title": "Senja di Jalan Braga",
    "genre": "Indie Pop / Folk",
    "program": "Review Artikel dan Rekomendasi IG",
    "link": "https://open.spotify.com/example",
    "story": "Single kedua dari EP mendatang.",
    "status": "IN REVIEW",
    "submittedAt": "2026-10-21"
  },
  "queueLength": 12,
  "note": "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik."
}
```

Field respons sukses:

| Field | Tipe | Catatan |
|---|---|---|
| `ok` | `boolean` | Selalu `true` |
| `entry` | `DemoSubmission` | `id` = `_id` Sanity, atau `demo-<base36>-<6>` pada jalur in-memory |
| `queueLength` | `number` | Jalur Sanity: jumlah submission **approved**. Jalur in-memory: `memoryQueue.length` |
| `note` | `string` | Teks konstan. **Tidak** memuat nilai `contact` |

`entry.status` **selalu** `"IN REVIEW"` (`DEMO_INITIAL_STATUS`) — submission
publik tidak dapat dibuat dengan status lain. `entry.submittedAt` date-only.
`entry` **tidak pernah** memuat `contact`, `audioName`, atau `audioUrl`, even
though the last two are stored on the Sanity document.

**Celah `TERVERIFIKASI` (dibuktikan dari kode):**

1. **Tidak ada autentikasi, rate limit, atau idempotensi** pada operasi tulis
   publik. Satu permintaan = 2 tulis Sanity + 1 email berbayar.
2. **Fallback in-memory janji yang tidak disimpan.** Tanpa
   `SANITY_API_READ_TOKEN`, submission hanya hidup di memori satu instance
   (reset saat restart/deploy), tapi klien tetap melihat `201` dan banner
   "sudah masuk antrean tinjauan kurator".
3. **Tidak ada endpoint kurator.** Moderasi terjadi manual di Sanity Studio
   (ubah `status`), jadi transisi status tidak ditegakkan oleh kode.

**Celah yang sudah ditutup (21 Okt 2026):**

- **`audioUrl` tidak diikat ke host** → kini ditolak. Validasi memeriksa skema
  `https`, host berakhiran `.blob.vercel-storage.com` (store Blob milik
  operator, varian `public` maupun `private`), dan ekstensi `.mp3`/`.wav`/
  `.ogg`. Audio dari host asing **tidak lagi** diterima atau dikirim lewat email
  notifikasi. Fungsi `isOwnBlobUrl()` di `app/api/demos/route.ts`.
- **`audioSize` tidak pernah terbaca** → kini dibaca. Klien mengirim angka
  (`components/DemoPortal.tsx`), dan server menerima angka maupun string
  angka lewat `bytes()`. Aturan "Ukuran berkas melebihi batas 25 MB" sudah
  menyala — dibuktikan: 30 MB → **`422`**.
- **`JSON.parse(raw)` bisa mengembalikan `null`** → kini ditolak lebih dulu.
  Body `null`, array, atau JSON rusak menjawab **`400` "Body harus berupa objek
  JSON."**, bukan `500` dengan body kosong.

### 4.3 `API-03` — `POST /api/demo-audio`

| Properti | Nilai |
|---|---|
| Tujuan | Terbitkan **client token** untuk unggahan langsung browser → Vercel Blob |
| Method & path | `POST /api/demo-audio` |
| Auth | Tidak ada |
| Content-Type | Body `@vercel/blob` (`HandleUploadBody`), dikirim oleh SDK `@vercel/blob/client` |
| Efek samping | Membuat token; **tidak** menulis objek ke storage (browser yang mengunggah) |
| Butuh env | `BLOB_READ_WRITE_TOKEN` (default SDK), `TERVERIFIKASI` |

**Kenapa token, bukan unggah langsung ke server** (`app/api/demo-audio/route.ts:5-18`):
file 25 MB tidak pernah melewati fungsi serverless (Vercel membatasi ukuran
body request jauh di bawah itu). Browser mengunggah langsung ke Blob.

**Batas yang ditegakkan** (`onBeforeGenerateToken`, `route.ts:26-30`):

| Batasan | Nilai | Sumber |
|---|---|---|
| `allowedContentTypes` | `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/ogg` | `lib/taxonomy.ts` `DEMO_AUDIO_TYPES` |
| `maximumSizeInBytes` | `26214400` (25 MB) | `lib/taxonomy.ts` `DEMO_AUDIO_MAX_BYTES` |
| `addRandomSuffix` | `true` | `route.ts:29` |

**Respons sukses — `200`** (`application/json`), bentuk dari
`handleUpload()` (`node_modules/@vercel/blob/dist/client.d.ts:380-387`):

```json
{
  "type": "blob.generate-client-token",
  "clientToken": "eyJ2ZXIiOiIyIiwidG9rZW4iOiJ..."
}
```

**Error `400`** — token gagal terbit (mis. `BLOB_READ_WRITE_TOKEN` belum ada,
atau `onBeforeGenerateToken` melempar):

```json
{ "error": "Unggah audio belum bisa diproses. Coba lagi nanti." }
```

Kegagalan dicatat di log server sebagai `[api/demo-audio] gagal membuat token
unggah:`. Form di `/submit` menampilkan banner "Audio gagal diunggah. Coba
lagi, atau hapus berkasnya lalu kirim tanpa audio." dan **tidak** mengirim
formulir tanpa audio.

**Celah `TERVERIFIKASI`:**

1. **Token terbit untuk siapa pun.** Tidak ada verifikasi pengguna, rate limit,
   atau kuota → siapa pun bisa menulis objek ke store milik operator.
2. **`access` ditentukan klien.** `DemoPortal` mengunggah dengan
   `access: "public"`, dan token tidak mengikat `access` — server tidak
   menentukan kebijakan akses.
3. **Nama berkas asli ikut ke URL.** `demo-audio/<timestamp>-<nama asli>` —
   nama asli bisa mengandung data personal.
4. **Tidak ada cron pembersih.** Objek yang sudah ada tidak pernah dihapus.

### 4.4 `API-04` — `POST /api/revalidate`

| Properti | Nilai |
|---|---|
| Tujuan | Membuang cache 6 tag saat Sanity Studio mem-publish |
| Method & path | `POST /api/revalidate` |
| Auth | Shared secret `SANITY_REVALIDATE_SECRET` |
| Header secret | `x-webhook-secret` (utama) atau `?secret=` (cadangan). Selama rotasi, nilai **sebelumnya** juga diterima lewat `SANITY_REVALIDATE_SECRET_PREVIOUS` (sudah dikosongkan 22 Okt 2026) |
| Efek samping | `revalidateTag(tag, "max")` untuk 6 tag |

**Tag yang dibuang** (`route.ts:30-37`):

| Tag | Konstanta | Sumber |
|---|---|---|
| `articles` | `ARTICLES_TAG` | `lib/articles.ts:61` |
| `pillar-posts` | `PILLARS_TAG` | `lib/pillars.ts:26` |
| `interviews` | `INTERVIEWS_TAG` | `lib/interviews.ts:15` |
| `siteSettings` | `SETTINGS_TAG` | `lib/site-settings.ts:23` |
| `videos` | `VIDEOS_TAG` | `lib/videos.ts:21` |
| `videosPage` | `VIDEOS_PAGE_TAG` | `lib/videos-page.ts:21` |

**Respons sukses — `200`:**

```json
{
  "revalidated": true,
  "tags": ["articles", "pillar-posts", "interviews", "siteSettings", "videos", "videosPage"]
}
```

**Error `500`** — `SANITY_REVALIDATE_SECRET` belum diset:

```json
{ "error": "SANITY_REVALIDATE_SECRET belum diset di server." }
```

**Error `401`** — secret tidak cocok (perbandingan constant-time,
`route.ts:39-45`):

```json
{ "error": "Secret tidak cocok." }
```

**Catatan `[PERLU VERIFIKASI]`** — tidak ada webhook yang benar-benar terpasang
di dashboard Sanity dari sisi repo ini; pemasangan dilakukan manual. Konfigurasi
yang direncanakan (`RENCANA`): filter 8 tipe `_type`, "Trigger on: **Create + Update**",
projection `{_type, _id}`. Lihat [`DEPLOYMENT.md`](DEPLOYMENT.md) §7.2.

**Celah `TERVERIFIKASI`:** secret diterima juga lewat query string (`?secret=`),
sehingga bisa bocor ke log akses dan riwayat peramban.

### 4.5 `API-05` — `GET /rss.xml`

| Properti | Nilai |
|---|---|
| Tujuan | Feed RSS 2.0 dari 8 cerita terbaru |
| Method & path | `GET /rss.xml` |
| Auth | Tidak ada |
| Sumber data | `latestStories(8)` — **pool yang sama** dengan beranda, `/stories`, sitemap, dan blok "More" |
| Cache | `public, s-maxage=600, stale-while-revalidate=600` |

**Isi feed:**

| Elemen | Nilai | Sumber |
|---|---|---|
| `<title>` | `${SITE.name} — ${SITE.tagline}` | `app/rss.xml/route.ts:12` |
| `<link>` | `SITE.url` | `route.ts:57` |
| `<description>` | `SITE.description` | `route.ts:58` |
| `<language>` | `id-ID` | `route.ts:59` |
| `<lastBuildDate>` | Tanggal cerita pertama, atau hari ini bila kosong | `route.ts:60` |
| `<atom:link>` | `${SITE.url}/rss.xml` (`rel="self"`) | `route.ts:61` |
| `<item><link>` | `${SITE.url}/stories/<slug>` | `route.ts:34` |
| `<item><guid>` | Sama dengan `<link>`, `isPermaLink="true"` | `route.ts:43` |
| `<item><pubDate>` | RFC 822 dari `dateISO`, dihitung pada `+07:00` | `route.ts:23-26` |
| `<item><category>` | `article.category` | `route.ts:45` |
| `<item><description>` | `article.excerpt` | `route.ts:46` |
| `<item><enclosure>` | Cover artikel, absolut, `type="image/jpeg"` | `route.ts:47` |

Nilai XML di-escape lewat `xml()` (`route.ts:14-21`): `&`, `<`, `>`, `"`, `'`.

**Contoh item:**

```xml
<item>
  <title>Senja di Jalan Braga</title>
  <link>https://melodialam.id/stories/senja-di-jalan-braga</link>
  <guid isPermaLink="true">https://melodialam.id/stories/senja-di-jalan-braga</guid>
  <pubDate>Tue, 21 Oct 2026 02:00:00 GMT</pubDate>
  <category>Fakta Musik</category>
  <description>Single kedua dari EP mendatang kami.</description>
  <enclosure url="https://cdn.sanity.io/images/03sgar5q/production/cover-1600x2000.jpg" type="image/jpeg" />
</item>
```

**Catatan `TERVERIFIKASI`:** `pubDate` selalu dihitung pada jam `09:00:00+07:00`
dari tanggal artikel (bukan jam terbit sebenarnya). `enclosure` selalu
`type="image/jpeg"` walaupun berkas aslinya bisa `.webp`.

### 4.6 `API-06` — `GET /sitemap.xml`

| Properti | Nilai |
|---|---|
| Tujuan | Peta situs untuk mesin pencari |
| Method & path | `GET /sitemap.xml` (`app/sitemap.ts`) |
| Auth | Tidak ada |
| Sumber data | `latestStories(8)` + daftar halaman statis hard-coded |

**Halaman yang dicantumkan** (`sitemap.ts:18-26`):

| Path | `priority` | `changeFrequency` |
|---|---|---|
| `/` | 1 | `daily` |
| `/stories` | 0.9 | `daily` |
| `/videos` | 0.8 | `weekly` |
| `/kurasi` | 0.8 | `weekly` |
| `/bicara-melodi` | 0.7 | `weekly` |
| `/tentang` | 0.5 | `monthly` |
| `/submit` | 0.6 | `monthly` |

Ditambah **8 URL artikel** (`/stories/<slug>`) dengan `priority: 0.7`,
`changeFrequency: "monthly"`, dan `lastModified` = `article.dateISO`
(`sitemap.ts:36-41`). `lastModified` untuk 7 halaman statis diambil dari
`dateISO` artikel terakhir (`sitemap.ts:16`, `:32`).

**Yang sengaja tidak ada:** halaman video modal tidak punya URL sendiri, dan
`/journal` tidak masuk peta — hanya redirect `308`.

**Catatan `TERVERIFIKASI`:** `SITE.url` ikut di sini, jadi domain yang salah
langsung memengaruhi peta situs.

### 4.7 `API-07` — `GET /robots.txt`

| Properti | Nilai |
|---|---|
| Tujuan | Aturan perayapan + alamat sitemap |
| Method & path | `GET /robots.txt` (`app/robots.ts`) |
| Auth | Tidak ada |

**Isi** (`app/robots.ts:8-17`):

```txt
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://melodialam.id/sitemap.xml
Host: https://melodialam.id
```

Seluruh situs boleh diindeks; hanya `/api/` yang dilarang. `Host` dan `Sitemap`
mengikuti `SITE.url`.

### 4.8 `API-08` — `GET /journal` (redirect permanen)

| Properti | Nilai |
|---|---|
| Tujuan | Mengalihkan alamat lama section Journal ke alamat baru |
| Method & path | `GET /journal` (`app/(site)/journal/route.ts`) |
| Auth | Tidak ada |
| Hasil | `308 Permanent Redirect` → `/stories` |

**Contoh respons:**

```http
HTTP/1.1 308 Permanent Redirect
Location: https://melodialam.id/stories
```

Tidak ada body; `Response.redirect()` menuliskan header `Location`. Alasan
ditulis di komentar kode: tautan lama dan indeks mesin pencari harus mendarat
di alamat baru, bukan 404.

### 4.9 `API-09` — `GET /journal/[slug]` (redirect permanen)

| Properti | Nilai |
|---|---|
| Tujuan | Mengalihkan alamat lama satu artikel ke alamat baru |
| Method & path | `GET /journal/[slug]` (`app/(site)/journal/[slug]/route.ts`) |
| Path param | `slug` — diteruskan apa adanya ke tujuan |
| Hasil | `308 Permanent Redirect` → `/stories/<slug>` |

**Contoh respons:**

```http
HTTP/1.1 308 Permanent Redirect
Location: https://melodialam.id/stories/senja-di-jalan-braga
```

Route ini adalah **route handler**, bukan halaman: `/journal` tidak lagi punya
halaman, jadi build menandainya `ƒ` (Dynamic).

---

## 5. Skema dan Model Error

### 5.1 Skema bersama

**`DemoSubmission`** — `lib/taxonomy.ts` (diekspor ulang dari `lib/content-fallback.ts`):

| Field | Tipe | Null? | Sumber |
|---|---|---|---|
| `id` | `string` | no | Seed / `id()` / `_id` Sanity |
| `artist` | `string` | no | Input (cap 120) |
| `city` | `string` | no | Input (cap 80) |
| `title` | `string` | no | Input (cap 160) |
| `genre` | `string` | no | Input (cap 60, enum bila non-kosong) |
| `program` | `string` | no | Input (cap 80, enum bila non-kosong) |
| `link` | `string` | no | Input (cap 500, regex) |
| `story` | `string` | no | Input (cap 2000) |
| `status` | `DemoStatus` | no | Enum tertutup (§5.2) |
| `submittedAt` | `string` | no | Date-only `YYYY-MM-DD` |

`DemoSubmission` **tidak punya** field `contact`, `audioName`, maupun
`audioUrl` — ketiganya tidak pernah masuk ke respons publik.

**Dokumen Sanity** (privat, dataset `submissions`) — dipetakan di
`app/api/demos/route.ts:295-317`:

| Tipe | Field yang ditulis |
|---|---|
| `demoSubmission` | `artist`, `city`, `title`, `genre?`, `program?`, `link`, `story`, `status`, `submittedAt`, `audioName?`, `audioUrl?` |
| `demoContact` | `submission` (reference ke `demoSubmission`), `contact` |

`demoContact` adalah dokumen **terpisah** agar kontak tidak pernah ikut
terbawa query yang membaca field submission.

### 5.2 Katalog status demo

| Status | Arti | Visibel di `GET /api/demos`? |
|---|---|---|
| `IN REVIEW` | Menunggu kurator (`DEMO_INITIAL_STATUS`) | Tidak (jalur Sanity) / Ya (jalur seed) |
| `SHORTLISTED (SAMSARA)` | Disetujui untuk tampil | Ya |
| `APPROVED (ARTICLE)` | Disetujui untuk artikel | Ya |
| `ARCHIVED` | Diarsipkan | Tidak |

Sumber: `lib/taxonomy.ts` (`DEMO_STATUSES`, `DEMO_INITIAL_STATUS`,
`DEMO_APPROVED_STATUSES`).

### 5.3 Amplop error

Semua endpoint JSON memakai amplop yang sama:

```json
{ "error": "<pesan bahasa Indonesia>" }
```

`POST /api/demos` menambah `errors` (map field → pesan) pada `422`. Tidak ada
kode mesin (`code`), `details`, atau `requestId` — amplop itu adalah `RENCANA`
di §8 dan belum ada di kode.

### 5.4 Katalog error

| `code` | Status | Arti | Aksi klien | Fase |
|---|---|---|---|---|
| — | `200` | Berhasil | — | `TERVERIFIKASI` |
| — | `201` | Resource dibuat | Tampilkan banner sukses | `TERVERIFIKASI` |
| — | `308` | Redirect permanen | Ikuti `Location` | `TERVERIFIKASI` |
| — | `400` | Body bukan JSON valid / token unggah gagal | Perbaiki body; jangan retry buta | `TERVERIFIKASI` |
| — | `401` | Secret webhook tidak cocok | Perbaiki secret | `TERVERIFIKASI` |
| — | `413` | Body > 16 KB | Perkecil payload | `TERVERIFIKASI` |
| — | `422` | Validasi field gagal | Tampilkan `errors` per field | `TERVERIFIKASI` |
| — | `500` | `SANITY_REVALIDATE_SECRET` belum diset | Set env di Vercel | `TERVERIFIKASI` |
| — | `503` | Penyimpanan Sanity gagal | Tampilkan pesan; coba lagi nanti | `TERVERIFIKASI` |
| `VALIDATION_ERROR` | `422` | Validasi field gagal (kode mesin) | Tampilkan `errors` | `RENCANA` |
| `RATE_LIMITED` | `429` | Melebihi batas (`RISK-001`) | Hormati `Retry-After` | `RENCANA` |
| `PAYLOAD_TOO_LARGE` | `413` | Audio > 25 MB (`BR-001`) | Kecilkan berkas | `RENCANA` |
| `UNSUPPORTED_MEDIA_TYPE` | `415` | Tipe audio di luar allowlist (`BR-001`) | Ganti format | `RENCANA` |
| `INTERNAL_ERROR` | `500` | Kesalahan server | Retry dengan backoff | `RENCANA` |

---

## 6. Validasi

### 6.1 Aturan yang ditegakkan server (`TERVERIFIKASI`)

1. Trim setiap field string; non-string → `""`.
2. Cap per field: `artist 120`, `city 80`, `title 160`, `genre 60`, `program 80`,
   `link 500`, `contact 160`, `story 2000`, `audioName 200`, `audioUrl 500`.
3. Wajib: `artist`, `city`, `title`, `story`, `contact`, `link`.
4. `link` cocok `/^https?:\/\/.+/i` (case-insensitive, minimal 1 char setelah `//`).
5. `genre` ∈ `DEMO_GENRES` **bila non-kosong**.
6. `program` ∈ `DEMO_PROGRAMS` **bila non-kosong**.
7. `audioName` berakhiran `.mp3` / `.wav` / `.ogg` (bila ada).
8. `audioSize` ≤ `26214400` **bila `audioName` ada** — angka maupun string angka
   dibaca (`bytes()`).
9. `audioUrl` diawali `https://`, host berakhiran `.blob.vercel-storage.com`,
   dan path-nya berakhiran `.mp3` / `.wav` / `.ogg` (bila ada).
10. Pesan error Indonesia persis seperti tabel §4.2.

Validasi yang sama dijalankan **dua kali** di sisi klien
(`components/DemoPortal.tsx` `onPickAudio`) dan di server, karena permintaan
yang dibuat-buat tidak wajib sopan pada pemeriksaan browser.

### 6.2 Enum penuh

`lib/taxonomy.ts` (`as const`, diekspor ulang oleh `lib/content-fallback.ts`):

```
DEMO_GENRES = [
  "Indie Pop / Folk", "Alternative Rock / Shoegaze", "Surf Rock / Punk",
  "R&B / Soul / Jazz", "Ska / Reggae / Dub", "Electronic / Experimental",
]

DEMO_PROGRAMS = [
  "Review Artikel dan Rekomendasi IG", "Live at Melodi Samsara",
  "Tamu Podcast Bicara Melodi",
]

DEMO_AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg"]
DEMO_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg"]
DEMO_AUDIO_MAX_BYTES = 25 * 1024 * 1024   // 26214400

DEMO_STATUSES = [
  "IN REVIEW", "SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)", "ARCHIVED",
]
```

### 6.3 Kontrol yang belum ada (`RENCANA`, `RISK-001`)

| Kontrol | Tujuan | Status |
|---|---|---|
| Rate limit per-IP | Membatasi spam ke `POST /api/demos` | `RENCANA` |
| Honeypot field tersembunyi | Menangkap bot naif | `RENCANA` |
| CAPTCHA (mis. Turnstile) bila spam terbukti | Gerbang manusia | `RENCANA`, `[PERLU VERIFIKASI]` pilihan vendor |
| Header `Idempotency-Key` | Mencegah entri ganda saat retry | `RENCANA` |
| Rotasi `audioUrl` ke host Blob milik operator | Mencegah audio dari host asing | `RENCANA` |
| Server menentukan `access` + key objek | Menjaga bucket tetap privat | `RENCANA` |
| Granti satu usage token unggah | Mencegah abuse storage | `RENCANA` |
| Penghapusan `demoContact` + objek audio saat submission dihapus | Mencegah PII & aset yatim | `RENCANA` |

Catatan: output submission dirender React (auto-escape) dan `story` disimpan
sebagai teks, sehingga risiko XSS langsung rendah (`ASUMSI`) — tetapi ledakan
ukuran dan spam tetap relevan (`RISK-001`).

---

## 7. OpenAPI 3.1 — endpoint yang ada hari ini

Fragmen di bawah hanya memuat endpoint `TERVERIFIKASI`. Endpoint `RENCANA`
sengaja **tidak** disertakan agar spec ini tetap mencerminkan dunia nyata.

```yaml
openapi: 3.1.0
info:
  title: Melodi Alam — API
  version: 0.2.0-draft
  description: >
    Fragmen TERVERIFIKASI. Memuat route handler, generator metadata, feed RSS,
    dan redirect permanen yang benar-benar ada di repo melodi-alam.
servers:
  - url: http://localhost:3100
    description: Dev server (port 3100)
tags:
  - name: demos
    description: Antrean submission demo (dataset privat `submissions` Sanity)
  - name: uploads
    description: Token unggah audio demo ke Vercel Blob
  - name: cache
    description: Invalidasi cache dari webhook Sanity
  - name: feeds
    description: Feed dan peta situs
paths:
  /api/demos:
    get:
      operationId: listApprovedDemoQueue
      summary: Baca antrean demo yang disetujui
      description: >
        Tanpa token Sanity, mengembalikan antrean seed in-memory (3 entri)
        tanpa filter status. Dengan token, mengembalikan maksimal 100 baris
        `demoSubmission` berstatus SHORTLISTED (SAMSARA) atau APPROVED (ARTICLE).
      tags: [demos]
      security: []
      responses:
        '200':
          description: Antrean.
          content:
            application/json:
              schema:
                type: object
                required: [queue, count]
                additionalProperties: false
                properties:
                  queue:
                    type: array
                    items:
                      $ref: '#/components/schemas/DemoSubmission'
                  count:
                    type: integer
                    minimum: 0
              example:
                queue:
                  - id: "seed-shroomeater"
                    artist: "Shroomeater"
                    city: "Bogor"
                    title: "Echoes in the Pine Forest"
                    genre: "Alternative Rock / Shoegaze"
                    program: "Live at Melodi Samsara"
                    link: "https://www.instagram.com/melodi.alam/"
                    story: "Direkam secara live di studio kecil kawasan Baranangsiang."
                    status: "SHORTLISTED (SAMSARA)"
                    submittedAt: "2026-10-12"
                count: 1
    post:
      operationId: createDemoSubmission
      summary: Kirim satu submission demo
      description: >
        Memvalidasi body JSON, memotong tiap field ke cap-nya, lalu menyimpan
        submission berstatus IN REVIEW dan kontak manajer pada dokumen terpisah.
      tags: [demos]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DemoSubmissionInput'
            example:
              artist: "Skyline"
              city: "Bandung"
              title: "Senja di Jalan Braga"
              genre: "Indie Pop / Folk"
              program: "Review Artikel dan Rekomendasi IG"
              link: "https://open.spotify.com/example"
              contact: "manager@example.test"
              story: "Single kedua dari EP mendatang."
      responses:
        '201':
          description: Submission tersimpan.
          content:
            application/json:
              schema:
                type: object
                required: [ok, entry, queueLength, note]
                properties:
                  ok:
                    type: boolean
                    const: true
                  entry:
                    $ref: '#/components/schemas/DemoSubmission'
                  queueLength:
                    type: integer
                    minimum: 0
                    description: >
                      Jalur Sanity: jumlah submission approved. Jalur in-memory:
                      panjang antrean modul.
                  note:
                    type: string
              example:
                ok: true
                entry:
                  id: "a1b2c3d4e5f6"
                  artist: "Skyline"
                  city: "Bandung"
                  title: "Senja di Jalan Braga"
                  genre: "Indie Pop / Folk"
                  program: "Review Artikel dan Rekomendasi IG"
                  link: "https://open.spotify.com/example"
                  story: "Single kedua dari EP mendatang."
                  status: "IN REVIEW"
                  submittedAt: "2026-10-21"
                queueLength: 12
                note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik."
        '400':
          description: Body bukan JSON valid.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimpleError'
              example:
                error: "Body harus berupa JSON."
        '413':
          description: Body lebih besar dari 16 KB.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimpleError'
              example:
                error: "Kiriman terlalu besar."
        '422':
          description: Validasi field gagal.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
              example:
                error: "Periksa kembali isian formulir."
                errors:
                  artist: "Nama band atau solois wajib diisi."
                  link: "Link harus diawali http:// atau https://."
        '503':
          description: Penyimpanan ke Sanity gagal.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimpleError'
              example:
                error: "Pengiriman demo sedang tidak bisa disimpan. Coba lagi nanti."
  /api/demo-audio:
    post:
      operationId: createDemoAudioUploadToken
      summary: Terbitkan token unggah berkas audio demo
      description: >
        Memakai `handleUpload` dari `@vercel/blob/client`. Browser mengunggah
        langsung ke Vercel Blob; berkas 25 MB tidak pernah melewati server.
        Membutuhkan BLOB_READ_WRITE_TOKEN.
      tags: [uploads]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: Token terbit.
          content:
            application/json:
              schema:
                type: object
                required: [type, clientToken]
                properties:
                  type:
                    type: string
                    const: "blob.generate-client-token"
                  clientToken:
                    type: string
        '400':
          description: Token gagal terbit.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimpleError'
              example:
                error: "Unggah audio belum bisa diproses. Coba lagi nanti."
  /api/revalidate:
    post:
      operationId: revalidateContentCache
      summary: Buang cache 6 tag konten
      description: >
        Dipanggil webhook Sanity. Membandingkan `x-webhook-secret` (atau
        query `?secret=`) dengan SANITY_REVALIDATE_SECRET secara constant-time.
      tags: [cache]
      security:
        - webhookSecret: []
      parameters:
        - name: secret
          in: query
          required: false
          schema:
            type: string
          description: Cadangan bila header `x-webhook-secret` tidak dipakai.
      responses:
        '200':
          description: Cache dibuang.
          content:
            application/json:
              schema:
                type: object
                required: [revalidated, tags]
                properties:
                  revalidated:
                    type: boolean
                    const: true
                  tags:
                    type: array
                    items:
                      type: string
              example:
                revalidated: true
                tags: ["articles", "pillar-posts", "interviews", "siteSettings", "videos", "videosPage"]
        '401':
          description: Secret tidak cocok.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimpleError'
              example:
                error: "Secret tidak cocok."
        '500':
          description: SANITY_REVALIDATE_SECRET belum diset.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimpleError'
              example:
                error: "SANITY_REVALIDATE_SECRET belum diset di server."
  /rss.xml:
    get:
      operationId: getRssFeed
      summary: Feed RSS 2.0 dari 8 cerita terbaru
      tags: [feeds]
      security: []
      responses:
        '200':
          description: Feed RSS.
          content:
            application/rss+xml:
              schema:
                type: string
  /sitemap.xml:
    get:
      operationId: getSitemap
      summary: Peta situs (7 halaman + 8 artikel)
      tags: [feeds]
      security: []
      responses:
        '200':
          description: Sitemap XML.
          content:
            application/xml:
              schema:
                type: string
  /robots.txt:
    get:
      operationId: getRobots
      summary: Aturan perayapan dan alamat sitemap
      tags: [feeds]
      security: []
      responses:
        '200':
          description: robots.txt.
          content:
            text/plain:
              schema:
                type: string
  /journal:
    get:
      operationId: redirectJournalSection
      summary: Redirect permanen ke /stories
      tags: [feeds]
      security: []
      responses:
        '308':
          description: Redirect permanen.
          headers:
            Location:
              schema:
                type: string
              example: "/stories"
  /journal/{slug}:
    get:
      operationId: redirectJournalArticle
      summary: Redirect permanen ke /stories/{slug}
      tags: [feeds]
      security: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        '308':
          description: Redirect permanen.
          headers:
            Location:
              schema:
                type: string
              example: "/stories/senja-di-jalan-braga"
components:
  securitySchemes:
    webhookSecret:
      type: apiKey
      in: header
      name: x-webhook-secret
  schemas:
    DemoSubmission:
      type: object
      required: [id, artist, city, title, genre, program, link, story, status, submittedAt]
      additionalProperties: false
      properties:
        id:
          type: string
        artist:
          type: string
          maxLength: 120
        city:
          type: string
          maxLength: 80
        title:
          type: string
          maxLength: 160
        genre:
          type: string
          maxLength: 60
        program:
          type: string
          maxLength: 80
        link:
          type: string
          maxLength: 500
          format: uri
        story:
          type: string
          maxLength: 2000
        status:
          type: string
          enum: ["IN REVIEW", "SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)", "ARCHIVED"]
        submittedAt:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
          description: Date-only (UTC).
    DemoSubmissionInput:
      type: object
      required: [artist, city, title, link, contact, story]
      properties:
        artist:
          type: string
          minLength: 1
          maxLength: 120
        city:
          type: string
          minLength: 1
          maxLength: 80
        title:
          type: string
          minLength: 1
          maxLength: 160
        genre:
          type: string
          enum:
            - "Indie Pop / Folk"
            - "Alternative Rock / Shoegaze"
            - "Surf Rock / Punk"
            - "R&B / Soul / Jazz"
            - "Ska / Reggae / Dub"
            - "Electronic / Experimental"
        program:
          type: string
          enum:
            - "Review Artikel dan Rekomendasi IG"
            - "Live at Melodi Samsara"
            - "Tamu Podcast Bicara Melodi"
        link:
          type: string
          maxLength: 500
          pattern: '^https?://.+'
        contact:
          type: string
          minLength: 1
          maxLength: 160
        story:
          type: string
          minLength: 1
          maxLength: 2000
        audioName:
          type: string
          maxLength: 200
        audioSize:
          type: integer
          minimum: 0
          maximum: 26214400
          description: >
            Hanya dibaca bila bertipe angka; klien resmi mengirim string, jadi
            aturan ukuran tidak menyala untuk jalur itu.
        audioUrl:
          type: string
          maxLength: 500
          pattern: '^https://.+\.(mp3|wav|ogg)$'
    SimpleError:
      type: object
      required: [error]
      additionalProperties: false
      properties:
        error:
          type: string
    ValidationError:
      type: object
      required: [error, errors]
      additionalProperties: false
      properties:
        error:
          type: string
        errors:
          type: object
          additionalProperties:
            type: string
```

Catatan keakuratan spec:

- `DemoSubmissionInput.required` mencerminkan field yang **benar-benar** divalidasi
  server (`artist`, `city`, `title`, `link`, `contact`, `story`). `genre`/`program`
  tidak `required` karena validasi kondisional (§4.2).
- Regex `link` memakai `pattern: '^https?://.+'`; kode memakai
  `/^https?:\/\/.+/i` (**case-insensitive**). JSON Schema tidak punya flag
  inline portabel → `[PERLU VERIFIKASI]` dukungan validator; secara fungsional
  `http://`/`HTTP://` sama-sama diterima kode.
- `audioUrl` diverifikasi **per komponen**, bukan satu regex tunggal: kode
  memisahkan cek skema `^https://` dan cek ekstensi pada path tanpa query
  (`route.ts:249-255`).
- Status `405` untuk method lain tidak dimodelkan: itu perilaku framework, bukan
  kontrak yang ditulis kode ini (§2.3).
- `/rss.xml`, `/sitemap.xml`, dan `/robots.txt` dimodelkan sebagai `200` dengan
  body teks; bentuk XML persisnya dijelaskan di §4.5–§4.7.

---

## 8. Versi dan Kebijakan Perubahan

| Aspek | Keputusan | Status |
|---|---|---|
| Penomoran versi | Belum ada; tidak ada prefix `/v1` | `TERVERIFIKASI` |
| Toleransi field tak dikenal | Klien: abaikan field respons tak dikenal | `RENCANA` |
| Amplop error | Aditif — `error`/`errors` dipertahankan; `code`/`details` ditambahkan | `RENCANA` |
| Bentuk `GET /api/demos` | `{ queue, count }` → `{ data, meta }` | `RENCANA` — tidak urgent: tidak ada konsumen di repo (§1.1) |
| `status` → `moderationStatus` | Tidak perlu — `status` sudah enum tertutup | `RENCANA` bila kurator butuh riwayat (`reviewedBy`, `reviewedAt`) |
| Penghapusan rute | Selalu pakai redirect `308` (lihat `API-08`/`API-09`), bukan 404 | `TERVERIFIKASI` |

---

## 9. Validation Checklist

| Cek (api-contract-designer) | Hasil |
|---|---|
| Setiap layar punya operasi yang dibutuhkan | Ya — `/submit` (API-02 + API-03), feed (API-05–API-07), kurasi (API-01) |
| Setiap operasi dipetakan ke requirement/layar | Ya — kolom Auth/Build di §3 |
| Penamaan dan bentuk konsisten | Ya — satu amplop error `{ error }` + `errors` |
| Setiap error yang harus ditangani klien terdefinisi | Ya — §5.4 |
| Paginasi ada untuk tiap daftar tak terbatas | **Gap** — `GET /api/demos` dibatasi 100 baris tanpa paginasi |
| Data sensitif tidak dikembalikan tanpa perlu | Ya — `contact` tidak pernah di respons; `demoContact` dokumen terpisah |
| Contoh valid terhadap skemanya | Ya — contoh §4/§7 mengikuti tipe |
| Tidak mengklaim endpoint yang belum ada | Ya — `RENCANA` berlabel eksplisit |

---

## Verification Notes

Dibaca langsung dari sumber (bukan dari memori). Tidak ada server produksi yang
dihubungi, tidak ada endpoint yang dipanggil, tidak ada paket yang dipasang.

- `app/api/demos/route.ts` (**375 baris, penuh**) — satu-satunya route handler
  yang menyimpan data. Diverifikasi: `memoryQueue` modul-level dari
  `SEED_DEMOS` + `memoryContacts`; `MAX_FIELD = 500`; `MAX_BODY_BYTES = 16*1024`;
  `str()` trim+slice; `id()` format `demo-<base36>-<6 char>`; `APPROVED_QUERY`
  `[0...100]` + `status in $approved`; `toPublicRow()`; `GET` → `200 {queue, count}`
  dengan fallback ke antrean seed saat query melempar; `POST` → `413` (body
  besar), `400` (JSON cacat), `422 {error, errors}`, `503` (gagal simpan),
  `201 {ok, entry, queueLength, note}`; `notifyNewSubmission()` (Resend, error
  ditelan); `DEMO_INITIAL_STATUS = "IN REVIEW"`; `demoContact` ditulis sebagai
  dokumen terpisah.
- `app/api/demo-audio/route.ts` (**45 baris, penuh**) — `handleUpload` dari
  `@vercel/blob/client`; `allowedContentTypes` = `DEMO_AUDIO_TYPES`;
  `maximumSizeInBytes` = `DEMO_AUDIO_MAX_BYTES`; `addRandomSuffix: true`;
  `onUploadCompleted` kosong; `catch` → `400` dengan pesan "Unggah audio belum
  bisa diproses. Coba lagi nanti."
- `app/api/revalidate/route.ts` (**69 baris, penuh**) — `timingSafeEqual`;
  `CONTENT_TAGS` 6 tag; header `x-webhook-secret` dengan fallback query
  `?secret=`; `500` bila `SANITY_REVALIDATE_SECRET` kosong; `401` bila tidak
  cocok; `revalidateTag(tag, "max")`.
- `app/rss.xml/route.ts` (**73 baris, penuh**) — `latestStories(8)`; `xml()`;
  `rfc822()` pada `+07:00`; header `Cache-Control` dan `Content-Type`;
  `<enclosure type="image/jpeg">`.
- `app/sitemap.ts` (**43 baris, penuh**) — 7 halaman statis + artikel
  dari `latestStories(8)`.
- `app/robots.ts` (**18 baris, penuh**) — `allow: "/"`, `disallow: "/api/"`,
  `sitemap`, `host`.
- `app/(site)/journal/route.ts` dan `app/(site)/journal/[slug]/route.ts`
  (**10 baris masing-masing**) — `Response.redirect(..., 308)`.
- `lib/site.ts` — `SITE.url` = `NEXT_PUBLIC_SITE_URL` tanpa trailing slash,
  fallback literal `https://melodialam.id`.
- `lib/taxonomy.ts` — `DEMO_AUDIO_MAX_BYTES` (25 MB), `DEMO_AUDIO_TYPES`,
  `DEMO_AUDIO_EXTENSIONS`, `DEMO_GENRES` (6), `DEMO_PROGRAMS` (3),
  `DEMO_STATUSES` (4), `DEMO_INITIAL_STATUS`, `DEMO_APPROVED_STATUSES`.
- `lib/content-fallback.ts` — `SEED_DEMOS` (3 entri: `seed-shroomeater` status
  `SHORTLISTED (SAMSARA)`, `seed-skyline` status `APPROVED (ARTICLE)`,
  `seed-pelabuhan-senja` status `IN REVIEW`).
- `lib/sanity-server.ts` — `submissionsClient` null bila
  `SANITY_API_READ_TOKEN` kosong.
- `lib/sanity-preview.ts` — `previewSecret()` = `SANITY_PREVIEW_SECRET` saja. Fallback
  ke `SANITY_REVALIDATE_SECRET` dihapus 22 Okt 2026 (F03).
- `components/DemoPortal.tsx` — `upload()` ke `handleUploadUrl: "/api/demo-audio"`
  dengan `access: "public"`; `payload.audioSize = String(audioFile.size)`
  (string); `POST /api/demos` mengirim JSON; `ApiError` hanya membaca
  `{error, errors}`; `onPickAudio` menolak ekstensi/tipe/size di browser.
- `node_modules/@vercel/blob/dist/client.d.ts:380-387` — bentuk balik
  `handleUpload()`: `{ type: "blob.generate-client-token", clientToken: string }`.
- `package.json` — versi paket `0.2.0`; port dev/start `3100`; **tidak ada**
  `payload`, `supabase`, `express`, atau `graphql` terpasang.
- `next.config.ts` — `cacheComponents: true`, `partialPrefetching: true`;
  `images.remotePatterns` = `i.ytimg.com/vi/**` **dan** `cdn.sanity.io/images/**`.
- `npm run build` (dijalankan 21 Okt 2026) — 33 halaman statis; route table
  mengonfirmasi `ƒ` untuk `/api/demos`, `/api/demo-audio`, `/api/revalidate`,
  `/journal`, `/journal/[slug]`, dan `○` untuk `/rss.xml`, `/sitemap.xml`,
  `/robots.txt`.

**Diverifikasi dengan menjalankan server** (`npm run start` di port 3100, lokal,
21 Okt 2026; server dimatikan lagi sesudahnya):

| Panggilan | Hasil |
|---|---|
| `GET /robots.txt` | `200`, `Cache-Control: public, max-age=0, must-revalidate`, `Content-Type: text/plain` |
| `GET /sitemap.xml` | `200`, `Cache-Control: public, max-age=0, must-revalidate`, `Content-Type: application/xml` |
| `GET /rss.xml` | `200`, `Cache-Control: public, s-maxage=600, stale-while-revalidate=600`, `Content-Type: application/rss+xml; charset=utf-8` |
| `GET /journal` | `308`, `Location: /stories` |
| `GET /journal/test-slug` | `308`, `Location: /stories/test-slug` |
| `GET /api/demos` | `200`, `{"queue":[],"count":0}` (dataset `submissions` aktif, belum ada baris approved) |
| `POST /api/demos` body `not json` | `400` `{"error":"Body harus berupa JSON."}` |
| `POST /api/demos` body `null` | **`500` dengan body kosong** — mengonfirmasi celah §4.2.4 |
| `POST /api/demos` body > 16 KB | `413` `{"error":"Kiriman terlalu besar."}` |
| `POST /api/demos` body dengan field kosong + enum salah + audio salah | `422` dengan 10 kunci `errors` persis seperti tabel §4.2, urutan: `artist`, `city`, `title`, `story`, `contact`, `link`, `genre`, `program`, `audioName`, `audioUrl` |
| `POST /api/demo-audio` | `400` `{"error":"Unggah audio belum bisa diproses. Coba lagi nanti."}` (`BLOB_READ_WRITE_TOKEN` belum ada) |
| `POST /api/revalidate` tanpa secret / dengan secret salah | `401` `{"error":"Secret tidak cocok."}` |

Tidak diverifikasi (karena itu tidak diklaim, atau ditandai `RENCANA` /
`[PERLU VERIFIKASI]`): perilaku `405` Next.js untuk method tak terdefinisi;
nilai env di proyek Vercel; keberadaan & konfigurasi webhook Sanity di
dashboard; bentuk upload body `@vercel/blob` yang dikirim browser; keputusan
moderasi kurator (tidak ada endpoint-nya). `POST /api/demos` dengan body
**valid** sengaja **tidak** dijalankan, karena itu akan menulis dokumen
`demoSubmission` + `demoContact` ke dataset produksi.

---

## Open Questions

1. **Filter webhook Sanity 8 tipe.** Tujuh tipe konten disebut di
   `app/api/revalidate/route.ts:21-26`; tipe kedelapan belum terverifikasi —
   `[PERLU VERIFIKASI]`. Apakah itu `demoSubmission` (dataset `submissions`,
   perlu webhook terpisah) atau tipe lain?
2. **Host `audioUrl`.** Validasi sekarang hanya memeriksa skema + ekstensi.
   Kalau store Blob dibuat, host store itu bisa dibandingkan server-side
   (tanpa menambah env baru) dan celah §4.2.1 tertutup.
3. **`audioSize` bertipe string.** Klien mengirim string, server mengharapkan
   angka. Perbaikannya satu baris di `components/DemoPortal.tsx` (kirim angka)
   atau di server (`Number(body.audioSize)`).
4. **Body `"null"` pada `POST /api/demos`.** `JSON.parse("null")` →
   `TypeError` → `500` dengan body kosong (terverifikasi). Perlu `body &&`
   sebelum membaca field.
5. **Antrean fallback tanpa filter status.** Jalur seed mengembalikan entri
   `IN REVIEW`. Kalau `SANITY_API_READ_TOKEN` dipastikan ada di produksi, jalur
   ini praktis mati — tapi filter status di fallback tetap lebih aman.
6. **Rate limit & idempotensi.** Belum ada angkanya. Perlu data spam nyata
   sebelum ditetapkan sebagai kontrak.
7. ~~**Rotasi `SANITY_REVALIDATE_SECRET` + `SANITY_PREVIEW_SECRET` terpisah.**~~
   **Selesai 22 Okt 2026**: secret baru dipasang di Vercel, fallback pratinjau
   dihapus, dan `SANITY_REVALIDATE_SECRET_PREVIOUS` dipakai sebagai masa transisi
   sampai webhook Sanity diarahkan ke secret baru.
   Sekarang satu nilai melindungi dua kapabilitas (lihat
   `audit-2026-10-21.md` F03). Selain itu, penerimaan `?secret=` di
   `/api/revalidate` sebaiknya dihapus — header saja.
8. **`queueLength` yang ambigu.** Jalur Sanity mengembalikan jumlah submission
   *approved*; jalur in-memory mengembalikan panjang antrean modul (termasuk
   entri `IN REVIEW`). Satu nama, dua makna — perlu diseragamkan atau diberi
   nama terpisah.
