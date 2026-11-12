## Ringkasan

<!-- Apa yang berubah dan kenapa. Satu paragraf. -->

## Jenis perubahan

- [ ] Perbaikan bug
- [ ] Fitur baru
- [ ] Refactor / perbaikan internal
- [ ] Dokumentasi
- [ ] Konfigurasi / CI

## Checklist

- [ ] `npm run lint` bersih
- [ ] `npm run test` lulus
- [ ] `npx tsc --noEmit` bersih
- [ ] `npm run build` lulus (wajib untuk perubahan route/komponen)
- [ ] `npm run test:e2e` lulus (wajib untuk perubahan UI/alur)
- [ ] `CHANGELOG.md` diperbarui bila perilaku pengguna berubah
- [ ] Dokumentasi terkait diperbarui (`docs/`)
- [ ] Tidak ada secret, token, atau data pribadi di diff

## Bukti

<!-- Screenshot desktop/tablet/mobile untuk perubahan UI, atau output tes. -->

## Catatan keamanan

<!-- Dampak ke auth, PII, rate limit, atau endpoint publik. Tulis "tidak ada" bila aman. -->
