# Panduan Kontribusi — Melodi Alam

Cara bekerja di repositori ini. Ditulis terhadap keadaan kode saat ini; setiap perintah
di bawah sudah diverifikasi.

> **Catatan (21 Okt 2026):** backend situs adalah **Sanity** (repo terpisah
> `melodialam-sanity`), bukan Payload/Supabase — kode Payload sudah dihapus
> lama lalu dan tidak ada lagi skrip `payload *` di repo ini. Situs memakai
> `next/image` untuk gambar Sanity dan lokal, **tidak** untuk thumbnail YouTube,
> dan **sudah ada CI** (`.github/workflows/ci.yml`: lint, typecheck, test, build). Token dan utility ada di
> [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md).

---

## 1. Sebelum mulai

| Prasyarat | Versi | Catatan |
|---|---|---|
| Node.js | `>= 20` | Terukur `v24.15.0` di mesin ini. `package.json` **tidak** punya field `engines`, jadi tidak ada versi yang dipaksakan — pasang versi LTS |
| npm | disertakan bersama Node | Terukur `11.12.1` |
| Git | `>= 2.40` | |

```bash
git clone https://github.com/albiruby/melodialam-website.git
cd melodialam-website
npm install
npm run dev
```

Dev server berjalan di **http://localhost:3100**. Port 3000 sengaja dihindari; seluruh
skrip npm sudah memakainya. Untuk port lain: `npm run dev -- -p 4321`.

### Variabel lingkungan

Situsnya sendiri **tidak butuh** konfigurasi: dataset `production` Sanity
publik, dan `lib/sanity-project.ts` memuat project id + nama dataset sebagai
literal. Yang butuh kredensial hanyalah antrean demo, pratinjau draf, dan
pengiriman email.

Salin templat dan isi seperlunya:

```bash
cp .env.example .env
```

| Variabel | Wajib? | Gunanya |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ya untuk lokal | Origin untuk canonical, sitemap, dan robots. Templat mengisinya `http://localhost:3100` |
| `SANITY_API_READ_TOKEN` | opsional | Membaca dataset privat `submissions` (antrean demo + kontak manajer) dan draf untuk `/preview/<type>/<slug>`. Tanpa ini route demo jatuh ke antrean in-memory dan pratinjau draf tidak punya sumber |
| `SANITY_REVALIDATE_SECRET` | wajib untuk produksi | Dibagikan dengan webhook Sanity yang menunjuk `POST /api/revalidate`. Tanpa ini route menolak semua permintaan |
| `SANITY_PREVIEW_SECRET` | opsional | Secret yang harus dibawa tautan pratinjau. **Terpisah** dari `SANITY_REVALIDATE_SECRET`; tanpa fallback. Kalau kosong, pratinjau selalu 404 |
| `BLOB_READ_WRITE_TOKEN` | opsional | Token unggah audio demo ke Vercel Blob. Tanpa ini route `/api/demo-audio` menjawab 400 dan formulir mengirim tanpa audio |
| `RESEND_API_KEY` | opsional | Notifikasi email "demo baru masuk". Tanpa ini submission tetap tersimpan, email yang dilewati |
| `DEMO_NOTIFY_TO` | opsional | Tujuan notifikasi email redaksi. Default ada di `app/api/demos/route.ts`: `melodialam.ip@gmail.com,helfan@infia.co` |
| `DEMO_NOTIFY_FROM` | opsional | Pengirim notifikasi email. Default: `Melodi Alam <onboarding@resend.dev>` |
| `GDRIVE_CLIENT_JSON` | opsional | Lokasi OAuth client JSON untuk skrip tarik foto Google Drive. Default `../.secrets/gdrive-client.json` |
| `GDRIVE_AUTH_PORT` | opsional | Port callback OAuth untuk skrip yang sama. Default `8420` |

> `.env` **tidak** ikut ter-commit (`.gitignore` mengabaikan `.env*` kecuali
> `.env.example`). Jangan pernah menempelkan nilainya di issue, log, atau
> obrolan.

### Batasan checkout

Tiga skrip memerlukan berkas di **luar** repositori ini:

| Skrip | Membaca |
|---|---|
| `npm run catalogue` | `../melodi-alam-data.md` (atau `melodi-alam-data.md` di dalam repo) |
| `npm run brand` | `../LOGO2/` — `Melodi Alam Logo Only - Color.png` dan `Melodi Alam Text Logo - Black.png` |
| `npm run photos` | `../FOTO PLACEHOLDER MELODI ALAM/` |

Artefaknya sudah ikut ter-commit, jadi clone biasa tetap dapat dibangun dan dijalankan.
Namun **regenerasi artefak tidak akan bekerja tanpa berkas-berkas itu.** Rincian di
[`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 2. Perintah

Hanya ada **sepuluh** skrip npm. Ini daftar lengkapnya.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server di port 3100 (Turbopack) |
| `npm run build` | Build produksi (Next.js 16.4, Turbopack) |
| `npm run start` | Menyajikan build produksi di port 3100 |
| `npm run lint` | ESLint (`eslint-config-next`: core-web-vitals + typescript) |
| `npm test` | Unit test Vitest — `vitest run`, 20 kasus di `lib/content-fallback.test.ts` |
| `npm run catalogue` | Menghasilkan ulang `lib/catalogue.json` dari `melodi-alam-data.md` |
| `npm run brand` | Menghasilkan ulang aset merek ke `public/brand` dan ikon `app/` |
| `npm run photos` | Menyalin set foto placeholder ke `public/photos` |
| `npm run seed:sanity` | Menulis konten statis ke Sanity (butuh token) |
| `npm run seed:videos` | Menulis katalog video ke Sanity |

Belum ada skrip `test:watch`, `test:e2e`, atau `typecheck`. Rencana lengkapnya
ada di [`docs/TEST-STRATEGY.md`](TEST-STRATEGY.md).

> **`npm test` bukan berarti "semua pengujian".** Saat ini itu hanya unit test
> Vitest. Tidak ada E2E, tidak ada uji aksesibilitas otomatis, dan tidak ada
> pipeline CI (§8).

### `dev.cmd` (Windows)

Untuk menyalakan server tanpa mengetik perintah, jalankan `dev.cmd` dari root proyek —
klik dua kali juga bisa. Berkas itu memeriksa Node ada di PATH, memasang `node_modules`
bila belum ada, membebaskan port 3100 bila server lama masih memegangnya, menjalankan
dev server, lalu membuka browser begitu server benar-benar menjawab.

```bat
dev.cmd            :: nyalakan dan buka browser
dev.cmd noopen     :: nyalakan tanpa membuka browser
```

Saat port 3100 sedang dipakai, ia menanyakan lebih dulu dan **hanya** menghentikan
proses yang memegang port itu. Jangan menggantinya dengan `taskkill /IM node.exe`: itu
juga mematikan server MCP lokal dan proses Node lain di mesin ini.

Skripnya sengaja murni ASCII. Berkas `.cmd` yang memuat byte non-ASCII tampil sebagai
mojibake pada code page konsol bawaan; `chcp 65001` di dalamnya hanya agar keluaran dev
server sendiri (Next.js mencetak karakter `▲`) terbaca benar.

---

## 3. Gerbang mutu

Sebelum mengirim perubahan, **empat** hal ini harus bersih:

```bash
npx tsc --noEmit    # tanpa keluaran berarti bersih
npm run lint        # tanpa keluaran berarti bersih
npm test            # 20 kasus di lib/content-fallback.test.ts
npm run build       # 33 halaman statis
```

Urutan itu penting. `npx tsc --noEmit` memberi umpan balik paling cepat, lalu
lint, lalu unit test yang hanya butuh hitungan detik, baru build produksi yang
paling mahal. `npm run build` menjalankan pemeriksaan TypeScript sebagai
bagiannya juga, tetapi `tsc --noEmit` lebih dulu membuat kesalahan ketik
ketahuan dalam hitungan detik, bukan puluhan detik.

> **Catatan:** menjalankan `npm run build` **saat dev server hidup** dapat merusak state
> Turbopack dan membuat halaman tampil kosong. Hentikan dev server lebih dulu.

Untuk memeriksa hasil build seperti produksi:

```bash
npm run build
npm run start        # menyajikan build di port 3100
```

`npm run start` memakai build yang sama dengan yang Ter-deploy, jadi ia
menangkap masalah yang tidak terlihat di dev server — misalnya route handler
yang hanya berjalan saat produksi.

---

## 4. Konvensi kode

### Bahasa

Komentar, nama berkas, dan penanda kode dalam bahasa Inggris. Teks yang dilihat pengguna
dalam bahasa Indonesia.

### Tangani `next/image` dengan benar

Ini penyebab regresi paling sering di proyek ini, jadi diperlakukan sebagai aturan, bukan
saran.

```tsx
// BENAR — induk memiliki position
<div className="relative aspect-[16/10] border border-ink">
  <Image src={src} alt={alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
</div>

// SALAH — induk static, sehingga `fill` menempel ke ancestor yang jauh
<div className="aspect-[16/10] border border-ink">
  <Image src={src} alt={alt} fill sizes="160px" className="object-cover" />
</div>
```

Induk tanpa `position` membuat gambar melebar ke lebar ancestor sementara `sizes` masih
meminta piksel seukuran thumbnail — hasilnya upscale berkali-kali dan foto tampak buram.

Jangan juga membungkus gambar dengan `transform: scale()` untuk memperbesar tampilan,
karena browser me-*raster* pada ukuran layout lalu meng-*upscale* bitmap-nya. Perbesar
kotaknya, bukan skalanya.

**Pengecualian: thumbnail YouTube.** `components/YoutubeThumb.tsx` sengaja memakai
`<img>` biasa, bukan `next/image`. Cache optimizer Vercel menahan gambar remote
hampir setahun, jadi thumbnail yang artis ganti di YouTube akan basi di situs
selama berbulan-bulan. Komponen itu harus tetap menyediakan `srcset`
(320w/480w/1280w), `sizes` per slot, dan fallback `maxres → sd → hq`.

### Satu elemen link per kartu

Kartu adalah satu elemen link yang membungkus seluruh isinya — gambar, judul,
ringkasan, dan kaki kartu. Jangan menaruh tautan hanya pada judul lalu
membentangkan `::after` di atas kartu: klik pada area teks di bawah gambar
tidak melakukan apa-apa, dan itu pernah dilaporkan pembaca.

```tsx
// BENAR — seluruh kartu adalah target
<Link href={`/stories/${article.slug}`} aria-label={article.title} className="group flex flex-col">
  <div className="relative aspect-[4/5]">
    <Image src={article.image} alt={article.title} fill sizes="25vw" className="object-cover" />
  </div>
  <h3>{article.title}</h3>
</Link>

// SALAH — teks di bawah gambar tidak bisa diklik
<Link href={href}>Judul</Link>
<article className="relative after:absolute after:inset-0">…</article>
```

Kalau satu kartu memang butuh dua tujuan (mis. ke artikel dan ke Instagram),
jadikan itu **dua** kartu, bukan satu kartu dengan dua tautan yang saling
menimpa.

### Tulis kelas Tailwind sebagai literal

```tsx
// BENAR — Tailwind dapat melihat kedua string ini
const shape = ratio === "feed" ? "aspect-[4/5]" : "aspect-square";
<div className={shape} />

// SALAH — scanner tidak pernah melihat `aspect-[4/5]`
<div className={`aspect-[${ratio}]`} />
```

Kelas yang dibangun lewat interpolasi menghasilkan nol aturan CSS, tanpa error.

Rasio **4:5** adalah rasio feed Instagram, dan semua sampul artikel adalah kartu
feed asli — memakai rasio itu membuat kartunya tampil utuh, tanpa teks yang
terpotong.

### Jangan sembunyikan konten di HTML server-rendered

SSR merender keadaan akhir. Animasi hanya memperkaya.

```tsx
// BENAR — `initial={false}`; keadaan tersembunyi hanya dipasang di klien
<motion.span initial={false} animate={{ y: masked ? "115%" : "0%" }} />

// SALAH — keadaan tersembunyi ikut ter-render ke markup; satu callback terlewat
//         membuat judul permanen tidak terlihat
<motion.span initial={{ y: "115%" }} whileInView={{ y: "0%" }} />
```

### Jangan baca geometri di dalam loop animasi

`scrollWidth`, `offsetWidth`, `getBoundingClientRect()` di dalam `useAnimationFrame`
memaksa reflow sinkron setiap frame. Pernah membuat halaman hanya mendapat **1 rAF per
detik**, yang menghentikan `IntersectionObserver` dan membuat konten tertahan di
`opacity: 0`. Ukur lewat `ResizeObserver` atau `IntersectionObserver`.

### Direktori tool di root proyek

Scanner konten Tailwind menyisir seluruh proyek. Direktori yang memuat berkas terkunci
(mis. basis data) dapat membuat Turbopack *panic* dan **menghasilkan CSS kosong tanpa
error**. Setiap direktori tool baru di root wajib ditambahkan ke `app/globals.css`:

```css
@source not "../nama-direktori";
```

### Artefak generated tidak boleh disunting tangan

| Berkas | Dihasilkan oleh |
|---|---|
| `lib/catalogue.json` | `npm run catalogue` |
| `public/brand/*`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | `npm run brand` |
| `public/photos/*` | `npm run photos` |

Menyuntingnya langsung akan hilang pada regenerasi berikutnya. Tambahkan bidang ke
katalog berarti mengubah `scripts/build-catalogue.mjs` **dan** `lib/catalogue.ts`
serempak.

---

## 5. Aturan aksesibilitas

Wajib, bukan opsional.

- `prefers-reduced-motion` harus dihormati di setiap animasi baru. Blok global menangani
  CSS; komponen Motion juga dijamin oleh `MotionConfig reducedMotion="user"`. Nilai
  *scroll-linked* harus memeriksa `useReducedMotion` sendiri.
- Interaksi yang muncul saat hover **juga** harus muncul saat keyboard menerima fokus.
  Gap-nya sudah ditutup: `app/globals.css` memuat `:focus-visible` global dan
  pasangan `.group:focus-within` untuk setiap reveal. Jangan menambah pelanggaran
  baru — kalau menyentuh bagian itu, jangan menghapus pasangan yang sudah ada.
- Setiap gambar diberi `alt`. Untuk aset dekoratif dipakai `alt=""` secara eksplisit.
- Radius `0` dan bayangan keras adalah aturan merek. Jangan diganti dengan `rounded-*`
  atau `shadow-*` yang kabur.

---

## 6. Alur kerja

1. Buat cabang dari `main`.
2. Kerjakan satu perubahan yang berhubungan.
3. Jalankan keempat gerbang mutu di §3.
4. Periksa perubahan visual **pada tiga ukuran**: mobile 390px, tablet 768px, desktop
   1440px. Padding dan grid yang benar di desktop sering rusak di mobile.
5. Buka pull request ke `main`.

### Nama cabang

Pola yang dipakai repo: `main` untuk cabang utama, dan `feat/<deskripsi>` untuk
pekerjaan fitur. Contoh nyata yang ada di riwayat: `feat/payload-supabase`.

| Prefix | Dipakai untuk |
|---|---|
| `feat/<deskripsi>` | Fitur baru |
| `fix/<deskripsi>` | Perbaikan bug |
| `chore/<deskripsi>` | Perawatan (dependensi, konfigurasi, tooling) |

### Pesan commit

Bentuk yang dipakai repo: **satu baris ringkas dalam bentuk imperatif, dalam
bahasa Inggris**, lalu paragraf alasan bila baris pertama tidak cukup jelas.
Contoh dari riwayat/git yang benar:

```
Move the Stories page to /stories

The page is called Stories, so the address should say so. The old URLs
stay as permanent redirects - /journal and /journal/<slug> both answer 308
to the new address - so shared links and indexed pages land on the story
instead of a 404.
```

```
Give every YouTube thumbnail the best frame YouTube has

The browser is offered all three sizes and picks by `sizes`, and if the
variant it picked does not exist, the error handler steps down to the next
one. A plain <img> is deliberate: next/image would resize through Vercel's
optimiser, whose CDN keeps remote images for a year.
```

Jadi: **baris pertama = perubahan apa**, paragraf kedua = **kenapa perlu**.
Komentari dalam kode juga ditulis dalam bahasa Inggris; teks yang dilihat
pembaca dalam bahasa Indonesia.

### Setelah merge

`main` adalah cabang yang ter-deploy. Integrasi Git Vercel membuatkan
*preview deployment* untuk setiap pull request, dan **merge ke `main` memicu
deploy produksi otomatis**. Tidak ada langkah `vercel --prod` yang manual.

> Preview Vercel adalah hasil build, **bukan** gate test. Tidak ada test, lint,
> atau type-check yang memblokir deployment. Karena itu keempat gerbang mutu di
> §3 wajib dijalankan lokal sebelum PR dibuka.

---

## 7. Cache `.next` setelah memindahkan rute

Kalau sebuah rute dipindah dengan `git mv` (misalnya `app/(site)/journal/`
menjadi `app/(site)/stories/`), folder `.next` yang sudah ada masih memuat artefak
rute lama. Akibatnya dev server bisa tetap menyajikan halaman di alamat lama,
dan `npm run build` bisa menghitung halaman statis yang tidak lagi ada.

Gejalanya:

- dev server masih menjawab di URL lama yang sudah dihapus;
- `npm run build` melaporkan jumlah halaman statis yang berbeda dari biasanya;
- perubahan pada rute baru tidak terlihat,alaupun berkasnya sudah berubah.

Yang harus dilakukan:

```bash
# hentikan dev server lebih dulu, baru
rm -rf .next        # macOS / Linux / Git Bash
# PowerShell:
Remove-Item -Recurse -Force .next
npm run dev
```

`.next` masuk `.gitignore`, jadi menghapusnya tidak pernah menyentuh riwayat
git. Tidak ada berkas yang hilang darinya.

---

## 8. CI — belum ada (`RENCANA`)

Repo ini **tidak punya** direktori `.github/`, jadi tidak ada satu pun workflow
yang berjalan otomatis. Yang ada hanyalah preview Vercel (§6).

Rencana gerbang per lapisan:

| Lapisan | Perintah | Status hari ini |
|---|---|---|
| Type-check | `npx tsc --noEmit` | Belum ada workflow |
| Lint | `npm run lint` | Belum ada workflow |
| Unit test | `npm test` | Belum ada workflow |
| Build | `npm run build` | Dijalankan Vercel saat deploy, tanpa gerbang |
| E2E | `playwright test` | Tooling belum dipasang |

Sebelum workflow pertama ditulis, `docs/TEST-STRATEGY.md` §9 harus memutuskan
layer mana yang memblokir merge dan mana yang hanya peringatan — terutama
bagian E2E, yang belum punya satu pun test.

---

## 9. Sebelum mengubah sesuatu

| Kalau menyentuh… | Baca dulu |
|---|---|
| Token, utility, warna, tipografi | [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) |
| Route, komponen, batas server/client | [`docs/FRONTEND-PLAN.md`](FRONTEND-PLAN.md) |
| Batas modul, alur data | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) |
| `app/api/**` | [`docs/API-CONTRACTS.md`](API-CONTRACTS.md) |
| Formulir, data pengguna, unggahan | [`docs/SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) |
| Skrip build, skrip npm, deploy | [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) |
| Status requirement | [`docs/PRD-REFERENCE.md`](PRD-REFERENCE.md) |

Dokumentasi di `docs/` adalah bagian dari pekerjaan, bukan lampiran sesudahnya. Kalau
perubahan mengubah perilaku yang didokumentasikan di sana, perbarui dokumennya di
pull request yang sama.

---

## 10. Melaporkan masalah

Sertakan: perintah yang dijalankan, perilaku yang diharapkan, perilaku yang terjadi, dan
ukuran viewport bila masalahnya visual.

**Keamanan:** jangan membuka issue publik untuk kerentanan. Hubungi pemilik repositori
secara langsung. Temuan yang sudah tercatat ada di
[`docs/SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md).

---

## Catatan Verifikasi

Seluruh perintah dan versi di dokumen ini diverifikasi terhadap `package.json`
dan **dijalankan** pada repositori ini.

- `package.json` — 10 skrip (`dev`, `build`, `start`, `lint`, `test`, `catalogue`,
  `brand`, `photos`, `seed:sanity`, `seed:videos`). Daftar skrip di §2 adalah
  daftar lengkap yang ada; tidak ada `test:watch`, `test:e2e`, atau `typecheck`.
- `npm run lint` — dijalankan, bersih.
- `npx tsc --noEmit` — dijalankan, bersih.
- `npm test` — dijalankan, 20 kasus di `lib/content-fallback.test.ts` lulus.
- `npm run build` — dijalankan: Next.js 16.4.0 (Turbopack), TypeScript bersih,
  "Generating static pages using 11 workers (33/33)" → **33 halaman statis**.
  Ini menggantikan angka "26 halaman statis" di versi lama dokumen ini.
- `npm run start` — memakai build yang sama dengan `npm run build`, di port 3100.
- `node -v` → `v24.15.0`; `npm -v` → `11.12.1`. `package.json` **tidak** punya
  field `engines`, jadi angka `>= 20` adalah syarat minimum yang ditetapkan
  repo, bukan hasil `engines`.
- `.env.example` — 10 variabel (§1). `.env` lokal ada dan mengabaikan
  `.gitignore`; isinya tidak dibaca atau ditampilkan di dokumen ini.
- `.gitignore` — mengabaikan `.env*` kecuali `.env.example`, plus `/.next/`.
- `.github/workflows/ci.yml` — ada: lint, `tsc --noEmit`, `npm test`, `npm run build` pada setiap push ke `main` dan setiap pull request.
- `git log` — konvensi commit: satu baris imperatif dalam bahasa Inggris,
  disusul paragraf alasan. Contoh: `Move the Stories page to /stories`,
  `Give every YouTube thumbnail the best frame YouTube has`.
- `git branch -a` — `main` dan `feat/payload-supabase`; pola `feat/<deskripsi>`
  dipakai repo.
- Vercel MCP (`list_projects`, `list_deployments`) — proyek `melodialam-website`
  (repo `albiruby/melodialam-website`), deployment `target: production` dengan
  `githubCommitRef: "main"`; deploy produksi berjalan otomatis dari `main`,
  dan commit `a974b50` ("Move the Stories page to /stories") ter-deploy dengan
  state `READY`.
- `app/globals.css` — `:focus-visible` global + 8 pasangan `:focus-within`;
  klaim "nol selektor `:focus`" di versi lama dokumen ini sudah kedaluwarsa.
- `components/`, `app/(site)/` — pola kartu satu link, sampul 4:5
  `object-cover`, dan `YoutubeThumb` dengan `srcset` + fallback.

Belum diverifikasi dari workspace: perilaku `dev.cmd` (berkas Windows, tidak
dijalankan pada fase ini), dan isi dataset Sanity.
