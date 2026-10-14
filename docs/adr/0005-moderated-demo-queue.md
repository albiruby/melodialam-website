# ADR-0005 — Antrean demo dimoderasi sebelum tampil publik

| Atribut | Nilai |
|---|---|
| **Status** | `DITERIMA` — belum diimplementasikan |
| **Tanggal** | 14 Oktober 2026 |
| **Pengambil keputusan** | Product Owner (menjawab `OQ-001`) |
| **Terkait** | `OQ-001`, `FR-006`, `BR-002`, `USR-002`, `USR-003`, `RISK-001` |
| **Bergantung pada** | ADR-0003 (Supabase sebagai Postgres + storage) |

## Konteks

Formulir *Submit Demo* menerima kiriman dari musisi mana pun tanpa autentikasi
(`ASM-02`). Hari ini setiap kiriman langsung masuk ke array proses-lokal, dan bagian
**Incoming Demo Queue** di `/submit` menampilkannya. Artinya apa pun yang diketik
seseorang akan tampil di halaman publik sebuah brand, tanpa seorang pun meninjaunya.

Tiga hal bertabrakan di sini:

1. **`USR-002` menginginkan kepastian.** Musisi perlu melihat bahwa karyanya benar-benar
   masuk antrean, bukan hilang di ruang hampa. Itu argumen untuk tampil langsung.
2. **Nama baik brand dipertaruhkan.** Halaman publik Melodi Alam menampilkan nama band
   yang dikirim siapa pun, beserta genre dan tujuan kurasi. Satu kiriman bernama tidak
   pantas cukup untuk merusak halaman itu.
3. **Data pribadi.** `contact` adalah nomor WhatsApp atau email. Menampilkannya publik
   tidak dapat diterima dalam keadaan apa pun.

## Keputusan

**Antrean dimoderasi.** Sebuah kiriman bersifat **privat sampai seorang kurator
menyetujuinya**. Halaman publik *Incoming Demo Queue* hanya menampilkan entri yang sudah
disetujui.

Yang mengikat:

1. **Status adalah enum dengan transisi yang jelas**, bukan string bebas. Field
   `status: string` yang sekarang berisi `"NEW SUBMISSION • JUST NOW"` digantikan enum
   yang punya arti operasional dan satu jalur transisi.
2. **Hak baca publik ditegakkan di lapisan data.** RLS hanya mengizinkan baris berstatus
   disetujui terbaca anonim. Menyembunyikannya di kode aplikasi saja tidak cukup.
3. **`contact` tidak pernah berada di baris yang dapat dibaca publik.** Ia hidup di tabel
   terpisah yang hanya dapat dibaca kurator (ADR-0003).
4. **Yang tampil publik hanya meta yang aman**: nama band, kota, genre, tujuan kurasi,
   dan status. Tanpa tautan EPK, tanpa cerita lagu, tanpa kontak.
5. **Pengirim tetap mendapat umpan balik instan** — konfirmasi bahwa kiriman diterima —
   tanpa harus menjadi publik. Ini yang memenuhi kebutuhan `USR-002` tanpa melanggar
   kebutuhan moderasi.

## Alternatif yang dipertimbangkan

| Alternatif | Pertimbangan | Kenapa tidak dipilih |
|---|---|---|
| **Instant public queue + sanitasi** (Opsi B) | Umpan balik paling instan; musisi melihat namanya muncul | Menaruh nama dan karya yang belum ditinjau di halaman publik brand. Sanitasi menghalangi injeksi HTML, tetapi tidak menghalangi nama tidak pantas. Butuh CAPTCHA dan *rate limit* sejak hari pertama hanya untuk menahan kerusakan. |
| **Instant, tetapi tanpa tautan EPK** (Opsi C) | Jalan tengah: tidak ada materi promosi yang bocor sebelum ditinjau | Masih menampilkan nama band yang dikirim siapa pun ke publik, sehingga masalah utama tidak terselesaikan. Kompleksitas penyamaran justru lebih tinggi daripada menahan satu kolom status. |
| **Tanpa antrean publik sama sekali** | Paling aman | Menghapus sinyal sosial yang memberi tahu musisi lain bahwa jalur ini hidup, dan menghilangkan alasan berkunjung ke `/submit`. Berlebihan. |

## Konsekuensi

**Positif**

- Tidak ada kiriman yang belum ditinjau tampil atas nama Melodi Alam.
- Tidak ada satu pun jalur di mana nomor WhatsApp atau email musisi dapat bocor ke
  pembaca anonim.
- Moderasi memberi alasan sah bagi kurator untuk menyentuh setiap kiriman, yang juga
  berarti setiap kiriman benar-benar dibaca — bukan tenggelam di antrean.
- Jumlah kiriman yang diungkap publik menjadi keputusan redaksi, bukan efek samping.

**Negatif / utang**

- **Antrean terasa kosong sampai kurator bekerja.** Halaman `/submit` perlu *empty
  state* yang jelas, dan hari-hari awal akan terlihat sepi.
- **Menambah pekerjaan manusia.** Harus ada yang meninjau; tanpa penjadwalan, antrean
  akan menumpuk dan justru memukul mundur `FR-006`.
- **Panel kurator menjadi blocker, bukan peningkatan.** Tanpa jalur tinjau, tidak ada
  demo yang pernah bisa disetujui. Karena itu panel kurator naik dari `P2` (rencana
  Fase 2 di PRD §5.4) menjadi prasyarat rilis — bertentangan dengan prioritas awal PRD,
  dan itu disengaja.
- Uji otomatis wajib membuktikan `contact` tidak muncul di `GET` publik. Ini salah satu
  release blocker di `docs/TEST-STRATEGY.md`.

## Referensi

- `docs/DATA-MODEL.md` — enum status, tabel kontak terpisah, kebijakan RLS
- `docs/API-CONTRACTS.md` — `GET /api/demos` publik hanya-baca-yang-disetujui
- `docs/SECURITY-PRIVACY.md` — urutan kontrol yang harus ada sebelum kiriman nyata pertama
- ADR-0003

## Catatan Verifikasi

- `TERVERIFIKASI`: `app/api/demos/route.ts` menambahkan setiap kiriman ke array dan
  `GET` mengembalikan seluruh array tanpa penyaringan; `status` bertipe `string` dengan
  nilai `"NEW SUBMISSION • JUST NOW"`; `contact` tidak pernah disimpan; `BR-002` di PRD
  memang menyebut status awal `IN REVIEW`.
- `RENCANA`: seluruh keputusan di atas. **Fase ini hanya dokumen.**
- `[PERLU VERIFIKASI]`: siapa yang meninjau antrean dan seberapa sering. Belum ada
  komitmen operasional dari tim redaksi.
