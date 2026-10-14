# ADR-0007 — Tipografi: Inter + Red Hat Display, menggantikan Plus Jakarta Sans

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` — terimplementasi |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (arahan langsung saat pengembangan) |
| **Terkait** | Seksi 9 PRD (UX/Visual), `DEC-001`, `FR-004`, `MET-01` |
| **Menggantikan** | Sebagian `DEC-001` di PRD, yang menyebut `Instrument Serif + Plus Jakarta Sans` |

## Konteks

`DEC-001` mengunci *design system* sebagai *Neo-Brutalist Editorial & Swiss Grid* dan
menyebut dua wajah huruf: `Instrument Serif` dan `Plus Jakarta Sans`.

Saat pengembangan, pemilik produk meminta tipografi memakai **variasi dari Inter dan
Red Hat Display**. Permintaan itu masuk akal untuk gaya yang sudah dikunci: keduanya
adalah *variable font* dengan sumbu bobot penuh, sehingga satu berkas melayani seluruh
rentang bobot yang dibutuhkan tata letak ini — dari teks badan sampai judul `font-black`
berukuran `7xl`.

Satu kendala tipografis muncul saat menerjemahkan permintaan itu. **Red Hat Display
adalah *sans-serif*, bukan *serif*.** Pada desain ini, slot `font-serif` dipakai untuk
nama artis berukuran besar dan takarir miring — dan kontras serif-lawan-sans itulah yang
membuat komposisinya bekerja. Menempatkan Red Hat Display di slot itu akan
menghilangkan kontras tersebut dan membuat judul serta teks badan menjadi satu suara.

## Keputusan

Empat wajah huruf, masing-masing dengan peran yang tidak tumpang tindih:

| Slot | Wajah | Peran | Pemuatan |
|---|---|---|---|
| `--font-sans` | **Inter** | Teks badan, label, tombol, navigasi | *Variable*, sumbu bobot penuh |
| `--font-display` | **Red Hat Display** | Judul pajang terbesar saja — masthead `VIDEOS` dan nama artis di indeks Bicara Melodi | *Variable*, sumbu bobot penuh |
| `--font-serif` | **Instrument Serif** | Takarir miring, catatan editorial, drop cap artikel | Tetap `400` — tidak punya sumbu variabel |
| `--font-mono` | **JetBrains Mono** | Metadata, angka, label teknis | `400`, `700` |

Yang mengikat:

1. **`Plus Jakarta Sans` dihapus dari seluruh proyek**, termasuk dari token dan
   `app/layout.tsx`. Tidak ada sisa rujukan.
2. **Sumbu bobot dimuat penuh** untuk Inter dan Red Hat Display; setiap elemen memilih
   bobotnya sendiri, bukan memakai daftar bobot tetap.
3. **Slot `font-display` ditambahkan sebagai utility baru**, bukan dengan menimpa slot
   `font-serif`. Ini yang menjaga Instrument Serif tetap memegang perannya.
4. **Drop cap artikel tetap Instrument Serif.** Drop cap adalah perangkat *serif*
   editorial; pada Red Hat Display ia akan terbaca sebagai huruf tebal biasa.
5. **Peran `font-serif` tidak berubah** untuk 26 elemen yang memakainya. Hanya judul
   berukuran `4xl`–`6xl` yang dipindahkan ke `font-display`.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Hanya Inter + Red Hat Display**, hapus Instrument Serif | Paling setia pada permintaan literal; lebih sedikit wajah huruf | Menghilangkan kontras serif-lawan-sans yang menjadi dasar komposisi editorial ini. Desain menjadi satu suara dan kehilangan karakter majalahnya. |
| **Inter + Red Hat Display, buang JetBrains Mono** | Hanya dua keluarga huruf; mono digantikan angka tabular Inter | `font-mono` dipakai **55 kali** untuk metadata, label, dan angka. Mono bukan hiasan di sini, melainkan perangkat struktur tata letak bergaya Swiss. |
| **Red Hat Display di slot `font-serif`** | Paling sedikit perubahan kode — tidak perlu utility baru | Red Hat Display adalah *sans-serif*; menaruhnya di sana menghapus kontras yang justru diminta dipertahankan. |
| **Pertahankan Plus Jakarta Sans untuk teks badan** | Menghormati `DEC-001` sepenuhnya | Bertentangan langsung dengan permintaan pemilik. Inter juga lebih kuat pada ukuran teks kecil dan punya bobot lebih lengkap. |

## Konsekuensi

**Positif**

- Inter dan Red Hat Display memuat seluruh sumbu bobot dalam satu berkas per *subset*,
  sehingga teks badan `300` sampai judul `900` tidak menambah permintaan berkas.
- Kontras yang menjadi dasar komposisi tetap terjaga: Red Hat Display untuk pajangan,
  Instrument Serif untuk suara miringnya, Inter untuk membaca.
- Judul pajang kini punya warna tersendiri, terpisah dari teks badan maupun takarir.

**Negatif / utang**

- **Menyimpang dari `DEC-001` yang berstatus `CONFIRMED`.** ADR ini adalah catatan
  penyimpangan itu; PRD perlu diperbarui agar tidak lagi saling bertentangan
  (lihat Open Questions di `docs/PRD-REFERENCE.md`).
- Menambah satu slot token (`--font-display`) dan satu utility. Setiap judul baru perlu
  diputuskan: `font-display` untuk pajangan, Inter untuk judul bagian.
- Instrument Serif tetap terkunci di `400`. Tidak ada bobot tebal untuk takarir; bila
  nanti dibutuhkan penekanan, harus lewat ukuran atau warna, bukan bobot.
- Subset `latin` saja. Karakter di luar Latin akan jatuh ke *fallback* sistem; belum ada
  kebutuhan nyata akan itu hari ini.

## Referensi

- `app/layout.tsx` — keempat pemanggilan `next/font/google`
- `app/globals.css` — token `--font-sans` / `--font-display` / `--font-serif` / `--font-mono`
- `components/BrandMark.tsx`, `components/SiteHeader.tsx` — pemakaian `font-display`
- `docs/DESIGN-SYSTEM.md` — spesifikasi tipografi lengkap
- `docs/PRD-REFERENCE.md` — status `DEC-001` setelah penyimpangan ini

## Catatan Verifikasi

- `TERVERIFIKASI`: `app/layout.tsx` memuat `Inter`, `Red_Hat_Display`,
  `Instrument_Serif` (`400`, normal + italic), dan `JetBrains_Mono` (`400`, `700`).
- `TERVERIFIKASI`: nol rujukan `jakarta` / `Plus_Jakarta_Sans` tersisa di `app/` dan
  `components/`.
- `TERVERIFIKASI`: `font-serif` dipakai 26 kali dan `font-mono` 55 kali di
  `app/` + `components/`; hanya judul pajang yang dipindahkan ke `font-display`.
- `TERVERIFIKASI`: build produksi bersih dan `npm run lint` bersih setelah perubahan.
