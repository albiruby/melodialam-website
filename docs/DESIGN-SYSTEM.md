# Design System — Melodi Alam

Spesifikasi *design system* yang berlaku di repositori ini, ditulis terhadap kode yang
benar-benar ada. Setiap token dan utility di bawah dapat dibaca di `app/globals.css`
kecuali yang ditandai lain.

**Audiens:** engineer yang menambah komponen, dan desainer yang perlu tahu token mana
yang tersedia sebelum meminta yang baru.

**Rujukan PRD:** Seksi 9 (UX, Visual, Interaction), `DEC-001`, `DEC-002`, `DEC-003`,
`ACC-001`…`ACC-003`, `NFR-002`, `NFR-003`.

> **Status:** gaya visual dan aturan interaksi sudah **dikunci** pemilik produk. Dokumen
> ini mendokumentasikannya, bukan mengusulkan yang baru.

---

## 1. Prinsip

Empat prinsip yang menjelaskan hampir semua keputusan di bawah.

1. **Struktur diungkap oleh garis, bukan oleh bayangan.** Garis rambut `1px` adalah
   perangkat pembentuk utama. Kartu tidak mengambang; kartu dipisahkan.
2. **Sudut tajam, tanpa pengecualian.** `border-radius: 0`. Satu-satunya elemen bulat
   adalah tombol Play melingkar pada baris video (`border-radius: 9999px`).
3. **Bayangan keras, bukan kabur.** Offset tanpa blur, mis. `6px 6px 0 #0d0d0d`.
   Tidak ada `box-shadow` dengan `blur > 0` di mana pun.
4. **Kontras tipografi, bukan dekorasi.** Hierarki dibangun dari pertentangan serif
   miring melawan *sans* tebal huruf besar, bukan dari warna atau bingkai berlebih.

---

## 2. Arsitektur Token

Tiga lapis, tetapi lapisnya sengaja tipis. Ini design system kecil, dan menambah lapis
tanpa kebutuhan nyata justru memperburuknya.

| Lapis | Isi | Di mana |
|---|---|---|
| **Primitif** | Nilai mentah: `#0d0d0d`, `#f6f5f2`, `#1b3b2b`, `cubic-bezier(0.16, 1, 0.3, 1)` | `@theme` di `app/globals.css` |
| **Semantik** | Peran yang dipakai komponen: `ink`, `paper`, `forest`, `--font-sans`, `--font-display`, `--font-serif`, `--font-mono`, `--ease-editorial` | `@theme` |
| **Komponen** | Tidak ada token komponen terpisah. Pola perilaku hidup sebagai `@utility` bernama, bukan sebagai variabel | `@utility` di `app/globals.css` |

**Keputusan sadar:** lapis komponen tidak dibuat sebagai variabel CSS. Pada proyek
seukuran ini, satu utility bernama per perilaku lebih mudah dibaca danlebih sedikit
bergerak daripada menyebar nilai ke variabel per-komponen.

### 2.1 Sumber kebenaran dan propagasinya

`app/globals.css` adalah **satu-satunya** tempat token dan utility didefinisikan. Tidak
ada berkas tema terpisah dan tidak ada token JSON. Mengubah satu nilai di blok `@theme`
mengubah seluruh situs, karena setiap komponen memakai utility Tailwind yang diturunkan
dari token tersebut.

```css
@theme {
  --color-ink: #0d0d0d;
  --color-paper: #f6f5f2;
  --color-forest: #1b3b2b;

  --font-sans: var(--font-inter), "Helvetica Neue", Arial, sans-serif;
  --font-display: var(--font-red-hat), "Helvetica Neue", Arial, sans-serif;
  --font-serif: var(--font-instrument), Georgia, "Times New Roman", serif;
  --font-mono: var(--font-jetbrains), ui-monospace, "SFMono-Regular", monospace;

  --ease-editorial: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Tailwind v4 menghasilkan utility dari token ini, sehingga `bg-ink`, `text-forest`,
`border-ink`, `font-display`, `font-mono`, dan seterusnya tersedia tanpa konfigurasi
tambahan.

---

## 3. Warna

Hanya tiga warna merek. Tidak ada skala abu-abu khusus; `neutral-*` bawaan Tailwind
dipakai untuk teks sekunder.

| Token | Nilai | Peran | Di mana dipakai |
|---|---|---|---|
| `ink` | `#0d0d0d` | Tinta utama, garis struktur, permukaan gelap | Teks badan, semua `border-ink`, latar kartu gelap, ticker |
| `paper` | `#f6f5f2` | Permukaan kertas majalah | Latar kartu, hover state, background body alternatif |
| `forest` | `#1b3b2b` | Aksen identitas | Tautan aktif, tombol `SUBMIT DEMO`, progress bar, aksen tirai |

### 3.1 Kontras (`ACC-001`)

| Pasangan | Rasio | Status |
|---|---|---|
| `#0d0d0d` di atas `#ffffff` | ≈ 19.4:1 | Lolos WCAG AAA, memenuhi target PRD ≥ 15:1 |
| `#0d0d0d` di atas `#f6f5f2` | ≈ 18.1:1 | Lolos WCAG AAA |
| `#ffffff` di atas `#1b3b2b` | ≈ 12.4:1 | Lolos WCAG AA; **di bawah target 15:1 PRD** |
| `#ffffff` di atas `#0d0d0d` | ≈ 19.4:1 | Lolos WCAG AAA |

> **Catatan jujur:** target ≥ 15:1 di `ACC-001` dirumuskan untuk pasangan tinta-di-atas-kertas.
> Teks putih di atas `forest` (tombol `SUBMIT DEMO`, latar aktif) mencapai ≈ 12.4:1 —
> kuat dan lolos AA, tetapi tidak mencapai 15:1. Angka di tabel ini dihitung dari nilai
> warna, **belum diukur dengan alat**.

### 3.2 Warna di luar palet — utang yang tercatat

| Nilai | Di mana | Catatan |
|---|---|---|
| `text-green-400` (hijau bawaan Tailwind) | **8 kemunculan** di `app/spaces/page.tsx`, `app/page.tsx`, `components/ArticleCards.tsx`, `components/Ticker.tsx` | Bukan bagian palet. Dipakai untuk aksen di atas latar `ink`. Kandidat pengganti: hijau medallion merek `#376b30`, tetapi itu keputusan merek yang belum diambil |
| `#a3a3a3` | `@utility text-outline-muted` | Setara `neutral-400` |
| `red-600` | Titik rekam di `VideoModal` | Bawaan Tailwind, dipakai sebagai *status indicator* |

### 3.3 Hex yang menduplikasi token

`#0d0d0d`, `#1b3b2b`, dan `#f6f5f2` masih muncul sebagai literal di beberapa tempat,
terutama di dalam nilai arbitrary Tailwind seperti `shadow-[4px_4px_0px_#0D0D0D]`.
Ini duplikasi token, bukan token baru. Rujukan `var(--color-ink)` bekerja di dalam
nilai arbitrary Tailwind dan sebaiknya dipakai.

---

## 4. Tipografi

Empat wajah huruf, masing-masing dengan peran yang tidak tumpang tindih. Latar
keputusannya ada di [ADR-0007](adr/0007-tipografi-inter-red-hat-display.md).

| Slot | Wajah | Peran | Pemuatan |
|---|---|---|---|
| `font-sans` | **Inter** | Teks badan, label, tombol, navigasi — default seluruh halaman | *Variable*, sumbu bobot penuh |
| `font-display` | **Red Hat Display** | Judul pajang terbesar: masthead `VIDEOS` dan nama artis di indeks Bicara Melodi | *Variable*, sumbu bobot penuh |
| `font-serif` | **Instrument Serif** | Takarir miring, catatan editorial, drop cap artikel | `400` saja, normal + italic |
| `font-mono` | **JetBrains Mono** | Metadata, angka, label teknis, filter | `400`, `700` |

### 4.1 Aturan pemilihan

| Kebutuhan | Pakai |
|---|---|
| Judul bagian seperti `Latest News`, `Spaces & Instruments` | `font-sans` dengan `tracking-tight` (bukan `font-display`) |
| Judul pajang terbesar di halaman (`VIDEOS`) | `font-display font-black uppercase` |
| Nama artis di indeks wawancara | `font-display` |
| Takarir, catatan, kutipan miring | `font-serif italic` |
| Angka, tanggal, label kategori, kode | `font-mono` |

> **Jangan** menaruh teks badan di `font-display`. Judul pajang memakai `font-display`;
> begitu ia turun ke ukuran teks badan, perannya hilang dan hierarkinya kabur.

### 4.2 Urutan pelepasan bobot

Inter dan Red Hat Display memuat seluruh sumbu bobot, sehingga elemen memilih bobotnya
sendiri. Konvensi yang dipakai kode saat ini: `300` untuk teks ringan, `400` teks badan,
`600`/`700` penekanan, `800` sub-judul, `900`/`black` judul pajang dan label kecil yang
harus berdiri sendiri.

---

## 5. Katalog Utility

Ini lapis "komponen" yang sebenarnya di sistem ini. Semuanya `@utility` di
`app/globals.css`.

### 5.1 Tipografi outline

| Utility | Perilaku |
|---|---|
| `text-outline-ink` | Teks transparan dengan `-webkit-text-stroke: 1.5px`; saat hover menjadi tinta penuh dan bergeser `-6px` |
| `text-outline-muted` | Sama, tetapi `1px #a3a3a3`; saat induk `.group` di-hover menjadi `forest` |

Dipakai untuk angka urut besar dan judul alternatif.

### 5.2 Tampil saat masuk viewport

| Utility | Perilaku |
|---|---|
| `reveal-section` + `is-visible` | `opacity: 0` → `1` dan `translateY(32px)` → `0`, 0.85s dengan `--ease-editorial` |
| `stagger-item` | Animasi `cardEntrance` (`opacity`, `translateY`, `scale`) dengan `animation-delay` dari inline style |

`reveal-section` dipasang lewat `components/Reveal.tsx`, yang memakai
`IntersectionObserver` dan langsung menampilkan konten saat `prefers-reduced-motion`.

> **Aturan yang wajib dipatuhi:** keadaan tersembunyi **tidak boleh** ter-*bake* ke HTML
> server-rendered. SSR harus merender keadaan akhir, dan animasi hanya memperkaya.
> Pelanggaran aturan ini pernah membuat judul permanen tidak terlihat
> (`ARCH-RISK-002`).

### 5.3 Tautan dan kartu

| Utility | Perilaku |
|---|---|
| `nav-link-anim` | Garis bawah `1.5px` tumbuh dari kiri saat hover (garis bawah `scaleX`) |
| `brutalist-card` | Hover: `translate(-4px, -4px)` dan `box-shadow: 6px 6px 0 #0d0d0d` |
| `editorial-img` | Hover (lewat induk `.group`): `scale(1.06)` |

### 5.4 Tirai dan bingkai

| Utility | Perilaku |
|---|---|
| `hover-reveal-box` | Wadah `position: relative; overflow: hidden` |
| `hover-reveal-curtain` | Tirai gradien `#0d0d0d` → `#1b3b2b`, `translateY(101%)` → `0` saat hover |
| `hover-reveal-tag` | Isi tirai: naik `14px` dan `opacity` 0 → 1, dengan jeda `0.08s` |
| `corner-frame` | Dua siku `::before`/`::after` di sudut, `opacity` 0 → 1 saat hover |
| `video-action-reveal` | Gugus aksi baris video: `max-width` 0 → 440px, `opacity` 0 → 1, `translateX(20px)` → 0 |

### 5.5 Reveal tanda strip

| Utility | Perilaku |
|---|---|
| `dash-reveal-item` | Wadah `inline-flex` untuk baris bertanda strip |
| `dash-reveal-prefix` | `max-width` 0 → 1.5em dan `opacity` 0 → 1 saat hover |

Ini implementasi `DEC-002`: state awal teks murni, tanda `—` muncul menggeser teks.

### 5.6 Modal

| Utility | Perilaku |
|---|---|
| `modal-backdrop` + `is-open` | `opacity` 0 → 1, `pointer-events` none → auto |
| `modal-panel` | `translateY(28px) scale(0.96)` → `translateY(0) scale(1)` saat `.is-open` |

### 5.7 Equalizer

| Utility | Perilaku |
|---|---|
| `eq-bar` | Tiga batang dengan animasi `eqBounce` bertingkat jeda |

---

## 6. Aturan Interaksi yang Dikunci

Ini diminta secara eksplisit dan **tidak boleh** diganti dengan perilaku generik.

| Aturan | Perilaku | Status |
|---|---|---|
| `DEC-002` | Tajuk hierarki dan strip kategori: state awal teks murni tanpa `—`; `—` muncul menggeser teks saat hover | Terimplementasi (`dash-reveal-*`) |
| `DEC-003` | Baris video dan direktori: state awal `Gambar — Headline — Deskripsi`; hover memunculkan `[ ▶ ] — [ M \| WATCH/EXPLORE ↗ ]` | Terimplementasi (`video-action-reveal`) |
| Seksi 9.3C | Hover thumbnail artikel: tirai gelap naik dari bawah + bingkai siku di sudut | Terimplementasi (`hover-reveal-curtain` + `corner-frame`) |

### 6.1 Gap aksesibilitas yang harus ditutup (`ACC-002`)

Ketiga aturan di atas **hanya bekerja pada hover.** Hasil pemeriksaan: **nol selektor
`:focus*` di `app/globals.css`.**

Konsekuensinya nyata: pengguna keyboard tidak dapat mengetahui bahwa baris video punya
aksi, karena gugus `[ ▶ ] — [ WATCH ↗ ]` tidak pernah muncul saat baris menerima fokus.
PRD meminta secara eksplisit agar `:focus-within` berperilaku sama dengan `:hover`.

Perbaikan yang disasar: setiap selektor `.group:hover X` perlu pasangannya
`.group:focus-within X`, dan setiap pemicu hover harus dapat menerima fokus. Ini
tercatat sebagai temuan di `docs/SECURITY-PRIVACY.md` dan `docs/FRONTEND-PLAN.md`, dan
sebagai uji di `docs/TEST-STRATEGY.md`.

---

## 7. Gerak

| Aspek | Nilai |
|---|---|
| Kurva utama | `--ease-editorial` = `cubic-bezier(0.16, 1, 0.3, 1)` — *ease-out* kuat, terasa seperti berhenti, bukan memantul |
| Durasi | `0.3s`–`0.45s` untuk state hover; `0.5s`–`0.85s` untuk reveal dan tirai |
| Properti | Hanya `transform` dan `opacity` (`NFR-002`). `max-width` dipakai pada reveal gugus aksi dan itu disengaja agar gugusnya benar-benar mengambil ruang |
| Pustaka | `motion` (v14) untuk yang tidak dapat dilakukan CSS: scroll-linked, velocity, pointer-tracking |

### 7.1 Reduced motion (`ACC-003`)

Dua lapis, keduanya wajib:

1. Blok global di `app/globals.css` memaksa durasi animasi dan transisi menjadi `0.01ms`
   dan menampilkan `.reveal-section` serta `.stagger-item`.
2. `<MotionConfig reducedMotion="user">` di `components/motion/MotionRoot.tsx` membuat
   Motion melepas animasi transform dan layout, sambil mempertahankan *opacity fade*.

**Pengecualian yang disengaja:** nilai scroll-linked seperti parallax adalah `style`
motion value, bukan animasi, sehingga `MotionConfig` tidak menyentuhnya. Komponen yang
menurunkannya wajib memeriksa `useReducedMotion` sendiri — lihat `ParallaxImage`.

### 7.2 Jebakan performa yang sudah terukur

| Jebakan | Akibat terukur | Aturan |
|---|---|---|
| Membaca geometri (`scrollWidth`) di dalam *frame loop* | Halaman hanya mendapat **1 rAF per detik**; `IntersectionObserver` berhenti; konten tertahan di `opacity: 0` | Ukur lewat `ResizeObserver`, jangan pernah per frame |
| `transform: scale()` pada wadah gambar | Bitmap di-*raster* pada ukuran layout lalu di-*upscale* → foto tampak buram | Untuk parallax, perbesar kotaknya, jangan skala |
| Kelas Tailwind dari interpolasi string | Utility tidak pernah ter-*generate*; 12 bingkai kartu kolaps ke tinggi nol | Selalu tulis kelas sebagai literal utuh |

---

## 8. Layout

| Aspek | Nilai |
|---|---|
| Lebar maksimum konten | `1360px` (`max-w-[1360px]`) dengan `mx-auto` |
| Padding halaman | `px-4`, menjadi `sm:px-8` |
| Jarak antar-seksi | `space-y-20` di `<main>` |
| Breakpoint yang dipakai | `sm` 640, `md` 768, `lg` 1024 (Tailwind bawaan) |
| Grid artikel | 1 kolom di mobile, bertambah lewat breakpoint Tailwind |
| Radius | `0` di mana-mana kecuali tombol Play (`rounded-full`) |
| Garis | `border` = `1px`, `border-2` untuk pemisah struktural antar-seksi |
| Bayangan | Hanya offset keras: `3px 3px`, `4px 4px`, `6px 6px 0`, dan `10px 10px 0` di panel modal |

Presisi centering sudah diverifikasi: `main` berada tepat di tengah pada 360/390/768/1280/1440/1920 px.

---

## 9. Pemetaan Design-to-Code

| Konsep desain | Di kode |
|---|---|
| Token primitif & semantik | blok `@theme` di `app/globals.css` |
| Pola perilaku (komponen maya) | `@utility` di `app/globals.css` |
| Komponen nyata | `components/*.tsx` |
| Aset merek | `components/BrandMark.tsx` (`BrandMark`, `MelodiAlamWordmark`, `SamsaraWordmark`) |
| Primitif gerak | `components/motion/*.tsx` |

Menambah token atau utility baru wajib punya alasan nyata. Memperpanjang daftar tanpa
kebutuhan jelas justru menambah permukaan yang harus dijaga.

---

## 10. Panduan Pemakaian dan Anti-Pola

**Lakukan**

- Pakai token (`bg-ink`, `text-forest`, `border-ink`) alih-alih nilai heksadesimal.
- Tulis kelas Tailwind sebagai literal utuh agar scanner dapat melihatnya.
- Pertahankan `border-radius: 0` dan bayangan keras.
- Uji komponen baru pada `prefers-reduced-motion: reduce`.
- Cek juga dengan keyboard, bukan hanya tetikus.

**Jangan**

- Menambah `rounded-*` pada kartu, bingkai, atau kolom formulir.
- Menambah `shadow-*` yang kabur.
- Menaruh teks badan pada `font-display`.
- Menyembunyikan konten di HTML server-rendered lalu berharap animasi akan
  memunculkannya.
- Membangun nama kelas lewat interpolasi string.
- Membaca geometri di dalam loop animasi.
- Memperkenalkan keluarga huruf baru tanpa ADR.

---

## 11. Temuan Terbuka

| # | Temuan | Dampak |
|---|---|---|
| 1 | **`editorial-paper` dipakai 5 kali tetapi tidak pernah didefinisikan.** Muncul di `app/page.tsx:69`, `app/bicara-melodi/page.tsx:21`, `components/JournalBrowser.tsx:103`, dan `components/DemoPortal.tsx:151,215` | Kelas mati. Maksud desain aslinya (kemungkinan latar kertas atau tekstur) hilang tanpa error. Perlu diputuskan: didefinisikan atau dihapus dari kelima tempat |
| 2 | **Nol selektor `:focus*`** di `globals.css` | `ACC-002` merah. Seluruh reveal hanya hover |
| 3 | `text-green-400` dipakai 8 kali | Warna di luar palet. Butuh keputusan merek |
| 4 | `#0d0d0d` / `#1b3b2b` masih berupa literal di beberapa nilai arbitrary | Duplikasi token → risiko drift saat token berubah |
| 5 | Target kontras `ACC-001` ≥ 15:1 tidak terpenuhi untuk teks putih di atas `forest` (≈ 12.4:1) | Lolos WCAG AA; PRD perlu disesuaikan atau warna aksen ditinjau |
| 6 | Belum ada pengukuran kontras otomatis maupun uji regresi visual | Klaim kontras di dokumen ini berasal dari nilai warna, bukan pengukuran |

---

## Catatan Verifikasi

**Diperiksa dengan membaca kode:** `app/globals.css` secara utuh (313 baris — 19
`@utility`, 2 `@keyframes`, 1 blok `@media`), seluruh `components/*.tsx`, kedelapan
`app/*/page.tsx`, `app/layout.tsx`, `next.config.ts`.

**Dihitung:** rasio kontras dari nilai heksadesimal token. **Tidak diukur dengan alat**
seperti axe atau pemeriksa kontras.

**Terverifikasi dari kode:** nol selektor `:focus`; `editorial-paper` nol definisi
dengan lima pemakaian; `text-green-400` delapan kemunculan; `font-serif` 26 pemakaian dan
`font-mono` 55 pemakaian; nol rujukan `Plus_Jakarta_Sans` yang tersisa.

**Diverifikasi di peramban:** presisi centering dan ketiadaan overflow horizontal pada
360/390/768/1280/1440/1920 px di enam route; `prefers-reduced-motion` tidak diuji dengan
pengaturan OS nyata, hanya blok CSS-nya dibaca.

---

## Open Questions

1. **`editorial-paper`** — didefinisikan atau dihapus? Tanpa keputusan ini, lima tempat
   memakai kelas yang tidak melakukan apa pun.
2. **Warna aksen hijau** — apakah `text-green-400` digantikan hijau medallion merek
   (`#376b30`), atau tetap sebagai hijau fungsional di luar palet?
3. **Target kontras `ACC-001`** — apakah ≥ 15:1 berlaku untuk semua pasangan, atau
   hanya tinta-di-atas-kertas? Saat ini tombol `forest` berada di ≈ 12.4:1.
4. **Aset merek** — `LOGO2/Melodi Alam Logo Only - Color.png` memuat medallion
   (1042×1057) plus dua pita terpisah: garis hijau 226×14 dan wordmark 637×51. Build
   hanya mengambil pita medallion. Apakah dua pita itu bagian dari sistem lockup
   (versi stacked) yang perlu direproduksi?
5. ~~**Wordmark** — aslinya emas `#c2ac7a`; header memakai varian `ink` karena emas terlalu
   pudar di atas putih. Apakah recolor ini disetujui sebagai warna merek?~~ **Selesai.**
   Masthead tidak lagi memakai wordmark Samsara. Wordmark Melodi Alam sekarang
   mereproduksi warna kit apa adanya — hijau `#376a2e` di-sample dari
   `LOGO2/Melodi Alam Logo Only - Color.png` saat build, bukan dipetakan ke palet
   situs. Recolor `ink`/`forest` dihapus.
