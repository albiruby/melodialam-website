# Panduan Kontribusi — Melodi Alam

Cara bekerja di repositori ini. Ditulis terhadap keadaan kode saat ini; setiap perintah
di bawah sudah diverifikasi.

---

## 1. Sebelum mulai

| Prasyarat | Versi |
|---|---|
| Node.js | `>= 20` |
| npm | disertakan bersama Node |
| Git | `>= 2.40` |

Tidak ada variabel lingkungan yang diperlukan. Tidak ada berkas `.env`.

```bash
git clone https://github.com/albiruby/melodialam-website.git
cd melodialam-website
npm install
npm run dev
```

Dev server berjalan di **http://localhost:3100**. Port 3000 sengaja dihindari; seluruh
skrip npm sudah memakainya. Untuk port lain: `npm run dev -- -p 4321`.

### Batasan checkout

Tiga skrip memerlukan berkas di **luar** repositori ini:

| Skrip | Membaca |
|---|---|
| `npm run catalogue` | `../melodi-alam-data.md` |
| `npm run brand` | `../logobulet.png`, `../logotext.png` |
| `npm run photos` | `../FOTO PLACEHOLDER MELODI ALAM/` |

Artefaknya sudah ikut ter-commit, jadi clone biasa tetap dapat dibangun dan dijalankan.
Namun **regenerasi artefak tidak akan bekerja tanpa berkas-berkas itu.** Rincian di
[`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 2. Perintah

Hanya ada tujuh skrip npm. Ini daftar lengkapnya.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server di port 3100 (Turbopack) |
| `npm run build` | Build produksi |
| `npm run start` | Menyajikan build produksi di port 3100 |
| `npm run lint` | ESLint |
| `npm run catalogue` | Menghasilkan ulang `lib/catalogue.json` dari `../melodi-alam-data.md` |
| `npm run brand` | Menghasilkan ulang aset merek ke `public/brand` dan ikon `app/` |
| `npm run photos` | Menyalin set foto placeholder ke `public/photos` |

Belum ada skrip `test`. Rencananya ada di [`docs/TEST-STRATEGY.md`](TEST-STRATEGY.md).

---

## 3. Gerbang mutu

Sebelum mengirim perubahan, tiga hal ini harus bersih:

```bash
npx tsc --noEmit    # tanpa keluaran berarti bersih
npm run lint        # tanpa keluaran berarti bersih
npm run build       # 26 halaman statis
```

`npm run build` menjalankan pemeriksaan TypeScript sebagai bagiannya, tetapi menjalankan
`tsc --noEmit` lebih dulu memberi umpan balik yang jauh lebih cepat.

> **Catatan:** menjalankan `npm run build` **saat dev server hidup** dapat merusak state
> Turbopack dan membuat halaman tampil kosong. Hentikan dev server lebih dulu.

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

### Tulis kelas Tailwind sebagai literal

```tsx
// BENAR — Tailwind dapat melihat kedua string ini
const shape = ratio === "square" ? "aspect-square" : "aspect-[4/3]";
<div className={shape} />

// SALAH — scanner tidak pernah melihat `aspect-[4/3]`
<div className={`aspect-[${ratio}]`} />
```

Kelas yang dibangun lewat interpolasi menghasilkan nol aturan CSS, tanpa error.

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
  Saat ini ada gap: nol selektor `:focus*` di `app/globals.css`. Jangan menambah
  pelanggaran baru; kalau menyentuh bagian itu, sekaligus tutup gap-nya.
- Setiap gambar diberi `alt`. Untuk aset dekoratif dipakai `alt=""` secara eksplisit.
- Radius `0` dan bayangan keras adalah aturan merek. Jangan diganti dengan `rounded-*`
  atau `shadow-*` yang kabur.

---

## 6. Alur kerja

1. Buat cabang dari `main`.
2. Kerjakan satu perubahan yang berhubungan.
3. Jalankan ketiga gerbang mutu di §3.
4. Periksa perubahan visual **pada tiga ukuran**: mobile 390px, tablet 768px, desktop
   1440px. Padding dan grid yang benar di desktop sering rusak di mobile.
5. Buka pull request ke `main`.

### Pesan commit

Bentuk yang dipakai: satu baris ringkas dalam bentuk imperatif, lalu alasan bila tidak
jelas dari baris pertama.

```
Perbaiki induk `fill` yang static pada kartu Spaces

Gambar 160px direntangkan ke 1296px karena induknya tidak
berposisi relative, sehingga foto tampak buram.
```

---

## 7. Sebelum mengubah sesuatu

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

## 8. Melaporkan masalah

Sertakan: perintah yang dijalankan, perilaku yang diharapkan, perilaku yang terjadi, dan
ukuran viewport bila masalahnya visual.

**Keamanan:** jangan membuka issue publik untuk kerentanan. Hubungi pemilik repositori
secara langsung. Temuan yang sudah tercatat ada di
[`docs/SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md).

---

## Catatan Verifikasi

Seluruh perintah dan versi di dokumen ini diverifikasi terhadap `package.json` dan
dijalankan pada repositori ini. Daftar skrip npm adalah daftar lengkap yang ada. Klaim
"26 halaman statis" berasal dari keluaran `npm run build` yang sesungguhnya. Klaim "nol
selektor `:focus`" berasal dari penghitungan langsung di `app/globals.css`.
