# Design System — Melodi Alam

> **Catatan (21 Okt 2026):** dokumen ini ditulis ulang terhadap komponen yang
> benar-benar ada sekarang. Yang sudah tidak ada: `/pahlawan-kota` +
> `lib/pahlawan.ts`, `/spaces` + `SPACE_ITEMS`, `JournalBrowser`, `VideosBrowser`
> + `/videos/arsip`, `HeroArticle`, `FeatureCard`, `GENRE_ROWS`/`GenreRow`.
> Halaman `/videos` kini **Melodi Samsara**, `/journal` menjadi `/stories`, dan
> `/kurasi` menjadi **Curated News**. Token dan utility yang masih ada di
> `globals.css` tetapi sudah tidak dipakai siapa pun ditandai eksplisit di §5.

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
2. **Sudut tajam, tanpa pengecualian.** `border-radius: 0`. Elemen bulat hanya
   tiga: tombol Play melingkar pada baris video, titik denyut pada entri ticker,
   dan titik rekam di panel modal.
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
| `text-green-400` (hijau bawaan Tailwind) | **2 kemunculan**: `components/ArticleCards.tsx:110` (label kiri-atas di tirai kartu) dan `components/Ticker.tsx:29` (hover label ticker) | Bukan bagian palet. Dipakai untuk aksen di atas latar `ink`. Kandidat pengganti: hijau medallion merek `#376b30`, tetapi itu keputusan merek yang belum diambil |
| `bg-green-400` | `components/Ticker.tsx:44` — titik berdenyut pada entri ticker yang tidak punya tautan | Sama: di luar palet |
| `bg-green-50` | `components/DemoPortal.tsx:351` — latar pesan validasi | Bawaan Tailwind, dipakai sebagai *status indicator* |
| `#a3a3a3` | `@utility text-outline-muted` | Setara `neutral-400` |
| `red-600` | `components/VideoModal.tsx:121` — titik rekam di panel modal | Bawaan Tailwind, dipakai sebagai *status indicator* |

### 3.3 Hex yang menduplikasi token

`#0d0d0d`, `#1b3b2b`, dan `#f6f5f2` masih muncul sebagai literal di beberapa tempat,
terutama di dalam nilai arbitrary Tailwind seperti `shadow-[4px_4px_0px_#0D0D0D]`.
Ini duplikasi token, bukan token baru. Rujukan `var(--color-ink)` bekerja di dalam
nilai arbitrary Tailwind dan sebaiknya dipakai.

---

## 4. Tipografi

Empat wajah huruf, masing-masing dengan peran yang tidak tumpang tindih. Latar
keputusannya ada di [ADR-0007](adr/0007-tipografi-inter-red-hat-display.md).

| Slot | Wajah | Peran | Pemuatan | CSS variable |
|---|---|---|---|---|
| `font-sans` | **Inter** | Teks badan, label, tombol, navigasi — default seluruh halaman | *Variable*, sumbu bobot penuh | `--font-inter` |
| `font-display` | **Red Hat Display** | Judul pajang terbesar: masthead **MELODI SAMSARA**, nama artis di indeks Bicara Melodi, kepala seksi pilar | *Variable*, sumbu bobot penuh | `--font-red-hat` |
| `font-serif` | **Instrument Serif** | Takarir miring, catatan editorial, drop cap artikel | `400` saja, normal + italic | `--font-instrument` |
| `font-mono` | **JetBrains Mono** | Metadata, angka, label teknis, chip filter | `400`, `700` | `--font-jetbrains` |

Keempatnya dimuat di `app/layout.tsx` lewat `next/font/google` dengan
`display: "swap"`, lalu dipasang sebagai kelas pada elemen `<html>`.
`app/globals.css` hanya meneruskannya: blok `@theme` memetakan tiap variable ke
satu slot Tailwind dengan fallback `"Helvetica Neue", Arial, sans-serif`
(Georgia / `ui-monospace` untuk serif dan mono).

### 4.1 Aturan pemilihan

| Kebutuhan | Pakai |
|---|---|
| Judul bagian seperti `Latest News`, `Stories`, `Curated News` | `font-sans` dengan `tracking-tight` (bukan `font-display`) |
| Judul pajang terbesar di halaman (`MELODI SAMSARA`) | `font-display font-black uppercase` |
| Nama artis di indeks wawancara | `font-display` |
| Kepala seksi pilar (`PillarHead`) | `font-display font-black uppercase` |
| Takarir, catatan, kutipan miring | `font-serif italic` |
| Angka, tanggal, label kategori, chip, kode | `font-mono` |

> **Jangan** menaruh teks badan di `font-display`. Judul pajang memakai `font-display`;
> begitu ia turun ke ukuran teks badan, perannya hilang dan hierarkinya kabur.

Pemakaian nyata di `app/` dan `components/`: `font-mono` 57×, `font-serif` 15×,
`font-display` 3×. `font-display` memang dipakai hemat — hanya tiga tempat,
semuanya judul besar.

### 4.2 Urutan pelepasan bobot

Inter dan Red Hat Display memuat seluruh sumbu bobot, sehingga elemen memilih bobotnya
sendiri. Konvensi yang dipakai kode saat ini: `300` untuk teks ringan, `400` teks badan,
`600`/`700` penekanan, `800` sub-judul, `900`/`black` judul pajang dan label kecil yang
harus berdiri sendiri.

---

## 5. Katalog Utility

Ini lapis "komponen" yang sebenarnya di sistem ini. Semuanya `@utility` di
`app/globals.css`. Kolom "Pemakaian" dihitung dari `app/` + `components/`
(33 berkas `.tsx`).

### 5.1 Tipografi outline

| Utility | Perilaku | Pemakaian |
|---|---|---|
| `text-outline-ink` | Teks transparan dengan `-webkit-text-stroke: 1.5px`; saat hover menjadi tinta penuh dan bergeser `-6px` | **0** — belum dipakai |
| `text-outline-muted` | Sama, tetapi `1px #a3a3a3`; saat induk `.group` di-hover/fokus menjadi `forest` | 2× (`components/VideoRow.tsx`, `components/PillarCards.tsx`) |

Dipakai untuk angka urut besar pada baris video dan pada baris pilar.

### 5.2 Tampil saat masuk viewport

| Utility | Perilaku |
|---|---|
| `reveal-section` + `is-visible` | `opacity: 0` → `1` dan `translateY(32px)` → `0`, 0.85s dengan `--ease-editorial` |
| `stagger-item` | Animasi `cardEntrance` (`opacity`, `translateY`, `scale`) dengan `animation-delay` dari inline style |

`reveal-section` dipasang lewat `components/motion/Reveal.tsx`, yang memakai
`IntersectionObserver` dan langsung menampilkan konten saat `prefers-reduced-motion`.

> **Aturan yang wajib dipatuhi:** keadaan tersembunyi **tidak boleh** ter-*bake* ke HTML
> server-rendered. SSR harus merender keadaan akhir, dan animasi hanya memperkaya.
> Pelanggaran aturan ini pernah membuat judul permanen tidak terlihat
> (`ARCH-RISK-002`).
>
> `components/motion/RevealText.tsx` sudah mengikuti aturan ini: mask-nya
> di-*arm* di klien dengan `initial={false}`, sehingga HTML hasil server
> memuat judul yang sudah terbaca. `components/motion/Reveal.tsx` **belum** —
> `reveal-section` mulai di `opacity: 0` dan baru menjadi `is-visible` setelah
> `IntersectionObserver` menyala di klien. Akibatnya isi `/stories` dan `/kurasi`
> tidak terlihat tanpa JavaScript. Lihat temuan terbuka #8 di §11.

### 5.3 Tautan dan kartu

| Utility | Perilaku | Pemakaian |
|---|---|---|
| `nav-link-anim` | Garis bawah `1.5px` tumbuh dari kiri saat hover (garis bawah `scaleX`) | 13× |
| `brutalist-card` | Hover: `translate(-4px, -4px)` dan `box-shadow: 6px 6px 0 #0d0d0d` | 1× (kartu playlist di `/videos`) |
| `editorial-img` | Hover/fokus lewat induk `.group`: `scale(1.06)` | 5× |

### 5.4 Tirai dan bingkai

| Utility | Perilaku | Pemakaian |
|---|---|---|
| `hover-reveal-box` | Wadah `position: relative; overflow: hidden` | 2× |
| `hover-reveal-curtain` | Tirai gradien `#0d0d0d` → `#1b3b2b`, `translateY(101%)` → `0` saat hover/fokus | 1× (kartu artikel di `/stories`) |
| `hover-reveal-tag` | Isi tirai: naik `14px` dan `opacity` 0 → 1, dengan jeda `0.08s` | 2× |
| `corner-frame` | Dua siku `::before`/`::after` di sudut, `opacity` 0 → 1 saat hover/fokus | 2× |
| `video-action-reveal` | Gugus aksi baris video: `max-width` 0 → 440px, `opacity` 0 → 1, `translateX(20px)` → 0. Di bawah `md` gugus **selalu tampil** (layar sentuh tidak punya hover) | 1× (`components/VideoRow.tsx`) |

### 5.5 Reveal tanda strip

| Utility | Perilaku | Pemakaian |
|---|---|---|
| `dash-reveal-item` | Wadah `inline-flex` untuk baris bertanda strip | **0** |
| `dash-reveal-prefix` | `max-width` 0 → 1.5em dan `opacity` 0 → 1 saat hover/fokus | **0** |

Ini implementasi `DEC-002`: state awal teks murni, tanda `—` muncul menggeser
teks. **Utility-nya masih ada di `globals.css`, tetapi tidak ada satu pun
komponen yang memakainya** — `DEC-002` belum terpasang di UI hari ini.

### 5.6 Modal

| Utility | Perilaku | Pemakaian |
|---|---|---|
| `modal-backdrop` + `is-open` | `opacity` 0 → 1, `pointer-events` none → auto | 1× (`components/VideoModal.tsx`) |
| `modal-panel` | `translateY(28px) scale(0.96)` → `translateY(0) scale(1)` saat `.is-open` | 1× |

Panel dibatasi `max-h-[calc(100dvh-2rem)]`; stage pemutar 16:9
(`aspect-video`) dengan `max-h-[calc(100dvh-10rem)]`. Video selalu punya
tinggi — tidak runtuh 0 seperti saat stage memakai `flex-1` di panel
auto-height — dan panel tidak pernah meluber dari layar. Diuji 390×844
(iframe 199px), 1280×800 (502px), 360×500 (182px).

### 5.7 Equalizer

| Utility | Perilaku | Pemakaian |
|---|---|---|
| `eq-bar` | Tiga batang dengan animasi `eqBounce` bertingkat jeda | **0** — belum dipakai |

### 5.8 Pola kartu — satu elemen link

Kartu adalah **satu** elemen link yang membungkus seluruh isinya: gambar,
rubrik, judul, ringkasan, dan baris kaki. Pola lama — tautan hanya pada judul
plus `::after` yang membentang — pernah membuat klik pada area teks di bawah
gambar tidak melakukan apa-apa, dan itu dilaporkan pembaca.

| Komponen | Elemen link | Isi | Dipakai di |
|---|---|---|---|
| `FrontCard` (`components/FrontCard.tsx`) | satu `<Link href={/stories/<slug>}>` | Sampul 4:5 di kiri (`w-28` / `sm:w-36`), rubrik + tanggal, judul, ringkasan dua baris, "BACA SELENGKAPNYA" | Beranda — grid 2×2, 4 kartu |
| `ArticleCard` (`components/ArticleCards.tsx`) | satu `<Link href={/stories/<slug>}>` | Sampul 4:5, judul, ringkasan; kaki: rubrik + badge **Reel** bila `mediaType === "reel"`, menit baca, tanggal. `titleFirst` menukar urutan gambar/judul pada kolom ganjil | `/stories` — 8 kartu; blok "More" pada detail artikel — 3 kartu |
| `PillarCard` (`components/PillarCards.tsx`) | satu `<a href={post.igUrl} target="_blank" rel="noreferrer">` | Gambar 4:5 (`object-cover`), label pillar bila `showPillar`, judul; kaki `mt-auto` — tanggal dan "Buka di IG" satu baris, sejajar bawah walau judul panjang/pendek | Beranda — strip 4 kurasi; `/kurasi` — SEMUA pilar, foto dan reel, sebagai kartu |
| `VideoRow` (`components/VideoRow.tsx`) | **bukan** satu link | Nomor, thumbnail (`WatchButton`), judul (`WatchLink`), durasi, Featuring, gugus aksi `[ ▶ ] — [ WATCH ]` (WATCH = `<a>` tautan langsung ke video YouTube, tanpa badge logo). Di bawah `md` gugus selalu tampil dan membungkus ke baris sendiri | `/videos` — 9 baris sesi |

Aturan yang menyertainya:

- **Sampul artikel dan pilar selalu 4:5** — rasio feed Instagram. `ArticleCards.tsx`
  memakai konstanta `COVER_FRAME = "aspect-[4/5]"`, dan `PillarCard` memakai
  `aspect-[4/5]` langsung. Gambar diisi dengan `object-cover` supaya slide asli
  post terisi penuh tanpa celah.
- **Kaki kartu pilar sejajar bawah** — `PillarCard` memakai `h-full` + `mt-auto` pada baris tanggal/IG, sehingga kartu dengan judul dua baris dan judul enam baris tetap sebaris kakinya. Reel kurasi ikut kartu ini; frame 4:5 memotong sampul vertikal di tengah — cover slide feed (4:5) tampil utuh.

- **Baris video bukan satu link** karena ia membuka modal video. `WatchLink`
  tetap menyimpan `href` YouTube asli supaya baris bisa dipakai tanpa
  JavaScript, dan `WatchButton` memakai `aria-label="Putar <judul>"`.
- **Satu `<Link>` per kartu** berarti `aria-label` pada elemen link itu adalah
  judul artikel (`aria-label={article.title}`).

### 5.9 Thumbnail YouTube — `<img>` biasa, bukan `next/image`

`components/YoutubeThumb.tsx` adalah satu-satunya cara thumbnail video masuk ke
situs, dan pilihan itu disengaja:

| Aspek | Nilai |
|---|---|
| Elemen | `<img>` biasa, **bukan** `next/image` |
| Alasan | Cache optimizer Vercel menahan gambar remote hampir setahun; thumbnail yang artis ganti di YouTube akan basi di situs selama berbulan-bulan |
| `srcset` | `mqdefault.jpg 320w`, `hqdefault.jpg 480w`, `maxresdefault.jpg 1280w` |
| `sizes` | Per slot: `(min-width: 640px) 224px, 176px` di baris video, `160px` di indeks wawancara, `100vw` sebagai default komponen |
| Fallback | `maxresdefault` → `sddefault` → `hqdefault`; `maxres` hilang untuk unggahan di bawah 1080p dan jawabannya 404, bukan fallback otomatis |
| Placeholder | Setelah semua varian gagal: kotak `bg-neutral-800` dengan teks mono "poster tidak tersedia" — bukan ikon gambar rusak |
| Aksesibilitas | `alt=""` (dekoratif); tombolnya yang membawa nama, lewat `aria-label="Putar <judul>"` |

`sizes` adalah bagian dari kontrak: kalau `sizes` salah, peramban memilih varian
terlalu kecil dan gambar pecar. Setiap pemanggil wajib mengisinya.

---

## 6. Aturan Interaksi yang Dikunci

Ini diminta secara eksplisit dan **tidak boleh** diganti dengan perilaku generik.

| Aturan | Perilaku | Status |
|---|---|---|
| `DEC-002` | Tajuk hierarki dan strip kategori: state awal teks murni tanpa `—`; `—` muncul menggeser teks saat hover | **Belum terpasang di UI** — `dash-reveal-item`/`dash-reveal-prefix` ada di `globals.css` tetapi dipakai 0× |
| `DEC-003` | Baris video: state awal `Gambar — Headline — Deskripsi`; hover memunculkan gugus `[ ▶ ] — [ WATCH ]` | Terimplementasi pada baris video (`video-action-reveal`); di bawah `md` gugus selalu tampil (26 Okt 2026) |
| Seksi 9.3C | Hover thumbnail artikel: tirai gelap naik dari bawah + bingkai siku di sudut | Terimplementasi (`hover-reveal-curtain` + `corner-frame`) |
| Kartu satu link | Seluruh area kartu bisa diklik, termasuk teks | Terimplementasi (`FrontCard`, `ArticleCard`, `PillarCard`) |

### 6.1 Aksesibilitas fokus (`ACC-002`) — sudah tertutup

Gap `:focus` yang pernah tercatat **sudah ditutup**. `app/globals.css` kini
memuat:

- `:focus-visible` global (`outline: 2px solid var(--color-forest)`), jadi
  setiap elemen interaktif punya satu indikator fokus yang sama;
- pasangan `.group:focus-within` untuk `text-outline-muted`, `editorial-img`,
  `hover-reveal-curtain`, `hover-reveal-tag`, `corner-frame`,
  `dash-reveal-prefix`, dan `video-action-reveal` — tujuh reveal yang dulu
  hanya muncul saat tetikus melayang.

Tugas yang tersisa bukan "menutup gap", melainkan **menjaganya**: utility itu
tidak boleh dihapus, dan komponen baru yang memakai reveal wajib punya
pasangan `:focus-within`.

### 6.2 Pola tombol dan CTA

Tombol di situs ini tidak memakai `border-radius` kecuali tombol Play, dan
tidak memakai `box-shadow` kabur. Pola yang benar-benar dipakai:

| Pola | Lokasi | Kelas inti |
|---|---|---|
| CTA utama hijau | `SubmitLink` di `components/Ticker.tsx`, dipakai di nav desktop | `bg-forest px-3.5 py-1.5 font-bold text-white`, hover `bg-ink` + `hover:shadow-[3px_3px_0px_#0D0D0D]` |
| CTA utama hitam | Nav mobile (`components/SiteHeader.tsx`) dan tombol kirim demo (`components/DemoPortal.tsx`) | `bg-ink … text-white`, hover `bg-forest` |
| Tombol sekunder | Judul artikel, "Semua artikel ", "Semua kurasi ", "Curated News " | `nav-link-anim font-bold uppercase tracking-wider text-ink` + `hover:text-forest` |
| Chip filter | `components/KurasiBrowser.tsx` | `border border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider`; aktif `bg-ink text-white`, tidak aktif `hover:bg-paper` |
| Tombol Play | `components/VideoRow.tsx` | `rounded-full border border-ink bg-ink text-white`, hover `bg-forest` — satu-satunya elemen bulat di situs |
| Kartu playlist | `app/(site)/videos/page.tsx` | `brutalist-card … border border-ink bg-paper p-4` |
| Tombol hamburger | `components/SiteHeader.tsx` | `border border-ink px-2.5 py-1 text-xs font-bold uppercase`, hover `bg-ink hover:text-white` |

Aturan turunan: CTA memakai huruf kapital (`uppercase`) + `tracking-wider` +
`font-bold`; warna `forest` untuk aksi utama, `ink` untuk aksi sekunder; dan
semua CTA punya bentuk yang sama — kotak tajam dengan garis `border-ink` tebal.

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
menurunkannya wajib memeriksa `useReducedMotion` sendiri — lihat
— `ParallaxImage` **sudah dihapus (22 Okt 2026)**, tidak ada importer.
repo tetapi **tidak dipakai** satu pun halaman saat ini; ia bertahan sebagai
pola yang bisa dipasang kembali.

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
| Grid beranda | `grid-cols-1` → `sm:grid-cols-2`: 4 kartu `FrontCard` dua per baris |
| Strip kurasi beranda | `grid-cols-2` → `lg:grid-cols-4`: 4 kartu `PillarCard` |
| Grid `/stories` | `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-4`: 8 kartu `ArticleCard` |
| Grid pilar foto `/kurasi` | `grid-cols-2` → `sm:grid-cols-3` → `lg:grid-cols-6` |
| Blok "More" pada detail artikel | `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3`: 3 kartu |
| Grid playlist `/videos` | `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-5` |
| Sampul artikel | `aspect-[4/5]`, pada detail dibatasi `w-full max-w-md` dan dipusatkan |
| Radius | `0` di mana-mana kecuali tombol Play (`rounded-full`) dan titik denyut ticker |
| Garis | `border` = `1px`, `border-2` untuk pemisah struktural antar-seksi |
| Bayangan | Hanya offset keras: `3px 3px`, `4px 4px`, `5px 5px`, `6px 6px 0`, dan `10px 10px 0` di panel modal |

Presisi centering sudah diverifikasi: `main` berada tepat di tengah pada 360/390/768/1280/1440/1920 px.

---

## 9. Pemetaan Design-to-Code

| Konsep desain | Di kode |
|---|---|
| Token primitif & semantik | blok `@theme` di `app/globals.css` |
| Pola perilaku (komponen maya) | `@utility` di `app/globals.css` |
| Wajah huruf | `next/font/google` di `app/layout.tsx` → variable CSS → `@theme` |
| Komponen nyata | `components/*.tsx` — kartu di `components/ArticleCards.tsx` dan `components/PillarCards.tsx`, baris video di `components/VideoRow.tsx`, ticker di `components/Ticker.tsx`, modal di `components/VideoModal.tsx`, thumbnail di `components/YoutubeThumb.tsx` |
| Kurasi (cari + chip) | `components/KurasiBrowser.tsx` (komponen klien) |
| Aset merek | `components/MelodiAlamLockup.tsx` (`MelodiAlamLockup`) → `public/brand/melodi-alam-lockup-black.png` |
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
- Cek juga dengan keyboard, bukan hanya tetikus — dan jangan menghapus pasangan
  `:focus-within` yang sudah ada.
- Bungkus seluruh kartu dengan **satu** elemen link, bukan tautan pada judul
  saja. Kalau sebuah kartu memang butuh dua tujuan (mis. ke artikel dan ke
  Instagram), jadikan itu **dua** kartu, bukan satu kartu dengan dua tautan
  yang saling menimpa.
- Pakai `next/image` untuk gambar Sanity dan gambar lokal; **jangan** untuk
  thumbnail YouTube (§5.9).
- Isi frame 4:5 dengan `object-cover` untuk SEMUA kartu pilar — tidak ada lagi baris khusus reel.
- Menambah `rounded-*` pada kartu, bingkai, atau kolom formulir.
- Menambah `shadow-*` yang kabur.
- Menaruh teks badan pada `font-display`.
- Menyembunyikan konten di HTML server-rendered lalu berharap animasi akan
  memunculkannya.
- Membangun nama kelas lewat interpolasi string.
- Membaca geometri di dalam loop animasi.
- Memperkenalkan keluarga huruf baru tanpa ADR.
- Memakai `next/image` untuk thumbnail YouTube.

---

## 11. Temuan Terbuka

| # | Temuan | Dampak | Status |
|---|---|---|---|
| 1 | ~~`editorial-paper` dipakai tetapi tidak pernah didefinisikan~~ | — | **Tertutup.** `@utility editorial-paper` sekarang ada di `app/globals.css:138` (latar = token `paper`). Dipakai 2× (`app/(site)/bicara-melodi/page.tsx`, `components/DemoPortal.tsx`) |
| 2 | ~~Nol selektor `:focus*`~~ | — | **Tertutup.** `:focus-visible` global + 8 pasangan `:focus-within` |
| 3 | `text-green-400` dipakai 2×, `bg-green-400` 1×, `bg-green-50` 1× | Warna di luar palet. Butuh keputusan merek | **Terbuka** |
| 4 | `#0d0d0d` / `#1b3b2b` masih berupa literal di beberapa nilai arbitrary (`shadow-[4px_4px_0px_#0D0D0D]`, `shadow-[10px_10px_0px_#1B3B2B]`) | Duplikasi token → risiko drift saat token berubah | **Terbuka** |
| 5 | Target kontras `ACC-001` ≥ 15:1 tidak terpenuhi untuk teks putih di atas `forest` (≈ 12.4:1) | Lolos WCAG AA; PRD perlu disesuaikan atau warna aksen ditinjau | **Terbuka** |
| 6 | Belum ada pengukuran kontras otomatis maupun uji regresi visual | Klaim kontras di dokumen ini berasal dari nilai warna, bukan pengukuran | **Terbuka** |
| 7 | `dash-reveal-item`, `dash-reveal-prefix`, `text-outline-ink`, dan `eq-bar` ada di `globals.css` tetapi dipakai **0×** | `DEC-002` belum terpasang di UI; utility tersebut saat ini hanya kebarisan | **Terbuka** — putuskan: pasang atau hapus |
| 8 | `reveal-section` mulai di `opacity: 0`, jadi isi section (`/stories`, `/kurasi`) tidak terlihat tanpa JavaScript | Beralih ke SSR-bersih butuh keputusan tersendiri | **Terbuka** — lihat `docs/TEST-STRATEGY.md` `R4` |

---

## Catatan Verifikasi

**Diperiksa dengan membaca kode (21 Okt 2026):** `app/globals.css` secara utuh
(**481 baris — 20 `@utility`, 2 `@keyframes`, 1 blok `@media`**), seluruh
`components/*.tsx` dan `app/(site)/**/*.tsx` (**33 berkas `.tsx`**),
`next.config.ts`, dan `lib/site.ts`.

**Dihitung:** rasio kontras dari nilai heksadesimal token. **Tidak diukur dengan alat**
seperti axe atau pemeriksa kontras.

**Terverifikasi dari kode:**

- `editorial-paper` **sudah didefinisikan** (`app/globals.css:138`) dan dipakai 2×.
- `:focus-visible` global ada (1) dan pasangan `.group:focus-within` ada (8).
- `text-green-400` 2×, `bg-green-400` 1×, `bg-green-50` 1×, `red-600` 1×.
- `font-mono` 57 pemakaian, `font-serif` 15, `font-display` 3.
- Pemakaian utility: `nav-link-anim` 13×, `editorial-img` 5×, `reveal-section` 2×,
  `stagger-item` 3×, `corner-frame` 2×, `hover-reveal-box` 2×, `hover-reveal-tag` 2×,
  `hover-reveal-curtain` 1×, `video-action-reveal` 1×, `modal-panel` 1×,
  `brutalist-card` 1×, `text-outline-muted` 2×.
- **Dipakai 0×:** `text-outline-ink`, `dash-reveal-item`, `dash-reveal-prefix`,
  `eq-bar`.
- `rounded-*` hanya 3×: tombol Play (`components/VideoRow.tsx`), titik denyut
  ticker, titik rekam modal. `shadow-*` semuanya offset keras tanpa blur.
- Nol rujukan `Plus_Jakarta_Sans` yang tersisa.

**Pola kartu diverifikasi dari kode:** `FrontCard` dan `ArticleCard` memakai satu
`<Link>`; `PillarCard` memakai satu `<a>`; `VideoRow` bukan satu
link dan memakai `WatchButton` + `WatchLink`. Sampul artikel dan pilar memakai
`aspect-[4/5]` + `object-cover`.

**Thumbnail YouTube diverifikasi dari kode:** `components/YoutubeThumb.tsx`
memakai `<img>` biasa dengan `srcset` 320w/480w/1280w, `sizes` per slot, dan
fallback `maxresdefault → sddefault → hqdefault` sebelum menampilkan placeholder.

**Diverifikasi di peramban:** presisi centering dan ketiadaan overflow horizontal pada
360/390/768/1280/1440/1920 px di enam route (hasil pengukuran sebelumnya, belum
diulang pada fase ini); `prefers-reduced-motion` tidak diuji dengan
pengaturan OS nyata, hanya blok CSS-nya dibaca.

**Tidak diverifikasi pada fase ini:** rasio kontras diukur dengan alat; rendering
sebenarnya dari `next/font`; perilaku `hover-reveal-*` di peramban nyata.

---

## Open Questions

1. ~~**`editorial-paper`** — didefinisikan atau dihapus?~~ **Selesai.** Sudah
   didefinisikan sebagai `@utility` dengan latar token `paper`.
2. **Warna aksen hijau** — apakah `text-green-400` (2×) dan `bg-green-400` (1×)
   digantikan hijau medallion merek (`#376b30`), atau tetap sebagai hijau
   fungsional di luar palet?
3. **Target kontras `ACC-001`** — apakah ≥ 15:1 berlaku untuk semua pasangan, atau
   hanya tinta-di-atas-kertas? Saat ini tombol `forest` berada di ≈ 12.4:1.
4. **Aset merek** — `LOGO2/Melodi Alam Logo Only - Color.png` memuat medallion
   (1042×1057) plus dua pita terpisah: garis hijau 226×14 dan wordmark 637×51. Build
   hanya mengambil pita medallion, dan hanya untuk ikon app. Apakah dua pita itu
   bagian dari sistem lockup (versi stacked) yang perlu direproduksi?
5. ~~**Wordmark** — aslinya emas `#c2ac7a`; header memakai varian `ink` karena emas terlalu
   pudar di atas putih. Apakah recolor ini disetujui sebagai warna merek?~~ **Selesai.**
   Logo Melodi Alam direproduksi apa adanya dari
   `LOGO2/Melodi Alam Text Logo - Black.png`, dan halaman merender lockup penuh
   (medallion + wordmark) di masthead dan kedua blok footer — bukan potongan teks.
   `public/brand/` hanya berisi satu berkas, `melodi-alam-lockup-black.png`; seluruh
   varian recolor dan crop terpisah dihapus.
6. **Utility tanpa pemakai** — `dash-reveal-item`/`dash-reveal-prefix`
   (`DEC-002`), `text-outline-ink`, dan `eq-bar` sekarang nol pemakaian. Pasang
   atau hapus?
7. **`reveal-section` tanpa JavaScript** — konten `/stories` dan `/kurasi` mulai
   di `opacity: 0`. Apakah itu diterima, atau utility-nya diubah agar degrade ke
   keadaan terlihat?
