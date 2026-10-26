# Audit responsif — 26 Oktober 2026

**Metode.** Chromium (Playwright 1.63) terhadap produksi
`https://melodialam-website.vercel.app`. 9 halaman × 6 viewport:
360×740, 390×844, 768×1024, 1024×768, 1280×800, 1920×1080. Tiap kombinasi
diukur untuk: `scrollWidth` vs viewport, tap target < 44px, teks terpotong,
font < 12px, elemen fixed/sticky, dan error konsol. Screenshot penuh pada
390 dan 1280. Status: `TERVERIFIKASI` (diukur, bukan ditaksir).

**Hasil ringkas.** 54 kombinasi, **0 error konsol**, **0 overflow horizontal
setelah perbaikan** (sebelumnya 1: `/tentang` @768 +28px). Navigasi memakai
tombol **MENU** berlabel (bukan hamburger telanjang); tidak ada header
fixed/sticky yang memakan layar.

## Temuan yang diperbaiki (26 Okt 2026)

| # | Temuan | Bukti | Perbaikan |
|---|---|---|---|
| 1 | Modal video: iframe **0px** di semua viewport — panel hanya header + footer | 390×844: panel 156px, iframe 0; 1280×800: panel 96px, iframe 0 | Stage `aspect-video` + `max-h-[calc(100dvh-10rem)]`; iframe 199/502/182px |
| 2 | `/tentang` meluber **28px** @768; di 360 teks email terpotong `overflow-x: hidden` | `p` email: scrollWidth 309 vs clientWidth 228 (768) / 286 (360) | `flex flex-wrap` pada baris email; scrollWidth = clientWidth di kedua lebar |
| 3 | `[ ▶ ] — [ WATCH ]` tak terjangkau di sentuh (max-width 0, opacity 0) | `/videos` @390: `.video-action-reveal` lebar 0 | Media query `<md`: gugus selalu tampil (lebar 165px, pointer-events auto) |

## Temuan terbuka — keputusan desain, belum diubah

| # | Temuan | Angka | Catatan |
|---|---|---|---|
| A | Tap target di bawah 44px | Menu 72×26; chip filter 29px; pager 17px; ikon Instagram 16×16 | Lolos minimum WCAG 2.5.8 (24px) kecuali ikon 16px; 44px adalah kenyamanan thumb. Memperbesar berarti mengubah tinggi visual — perlu keputusan pemilik |
| B | Font < 12px | 22–121 elemen/halaman; terbanyak `/kurasi` (121) | Label mono 9–11px (tanggal, "Buka di IG", metadata). Estetika editorial; pertimbangkan 11px minimum untuk teks yang harus dibaca di ponsel |
| C | Ticker menduplikasi tautan | 8 tautan duplikat per halaman (2 putaran) | Fokus keyboard melewati duplikat. Kandidat: `aria-hidden` pada putaran kedua |
| D | Konten, bukan layout | Playlist menampilkan "-"; beberapa kartu pilar tanpa gambar | Isi CMS: deskripsi playlist dan cover pilar |

## Matriks viewport (setelah perbaikan)

| Halaman | 360 | 390 | 768 | 1024 | 1280 | 1920 |
|---|---|---|---|---|---|---|
| Beranda | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stories | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Kurasi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Videos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bicara Melodi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tentang | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Privasi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ketentuan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

✓ = tanpa overflow horizontal, tanpa error konsol. Kedalaman teks (tabel,
form) diperiksa lewat screenshot penuh, bukan hanya angka.
