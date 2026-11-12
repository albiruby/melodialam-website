# Kebijakan Keamanan

## Versi yang didukung

Situs produksi berjalan dari branch `main`. Hanya commit terbaru di `main` yang
menerima perbaikan keamanan; tidak ada branch rilis terpisah.

## Melaporkan kerentanan

**Jangan membuka issue publik untuk masalah keamanan.**

Gunakan [GitHub Private Vulnerability Reporting](https://github.com/albiruby/melodialam-website/security/advisories/new)
(tab **Security → Report a vulnerability**). Laporan bersifat privat dan hanya
terlihat oleh maintainer.

Sertakan:

- deskripsi masalah dan dampaknya;
- langkah reproduksi (URL, request, atau payload);
- commit yang terpengaruh;
- saran perbaikan bila ada.

Jangan menyertakan kredensial, token, data kontak musisi, atau data pribadi di
dalam laporan. Jika sebuah secret ikut terekspos, sebutkan **nama variabelnya**
saja — jangan nilainya.

## Cakupan

Termasuk: situs publik, `/preview`, `/api/demos`, `/api/demo-audio`,
`/api/revalidate`, dan konfigurasi deployment di repo ini.

Tidak termasuk: Sanity Studio (repo terpisah
[`albiruby/melodialam-sanity`](https://github.com/albiruby/melodialam-sanity)),
layanan pihak ketiga (Vercel, Sanity, Resend), dan serangan berbasis
infrastruktur di luar kendali repo.

## Respons

Laporan ditinjau sebaik mungkin dalam beberapa hari kerja. Kami akan
mengonfirmasi penerimaan, meminta detail bila perlu, dan memberi tahu saat
perbaikan tersedia. Mohon beri waktu sebelum mempublikasikan detail.

## Referensi

- [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md) — model ancaman, PII,
  dan kontrol yang sudah dipasang.
- [`docs/audit-2026-10-21.md`](docs/audit-2026-10-21.md) — audit terakhir.
