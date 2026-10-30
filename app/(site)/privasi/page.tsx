import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { pageMetadata } from "@/lib/page-metadata";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * What happens to the data a visitor hands over.
 *
 * Written from the code, not from a template: every sentence here describes
 * something this site actually does. If the pipelines change, this page has to
 * change with them — a privacy page that drifts from the code is worse than
 * none, because it is a promise that is no longer true.
 *
 * Not legal advice. It is the honest description an editor can publish today,
 * and the place a lawyer would start.
 */
export const metadata = pageMetadata({
  title: "Kebijakan Privasi",
  description:
    "Data apa yang dikumpulkan Melodi Alam saat kamu mengirim demo, di mana disimpan, siapa yang bisa melihatnya, dan bagaimana meminta penghapusan.",
  path: "/privasi",
});

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <Reveal>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Kebijakan Privasi</h1>
        <span className="font-serif text-sm italic text-neutral-600">
          diperbarui 24 Oktober 2026
        </span>
      </div>

      <div className="max-w-3xl space-y-6 py-8 text-sm leading-relaxed text-neutral-700">
        <p>
          Halaman ini menjelaskan data apa yang dikumpulkan situs Melodi Alam, untuk apa,
          di mana disimpan, dan siapa yang bisa melihatnya. Isinya mengikuti apa yang
          benar-benar dilakukan situs — bukan contoh template.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            1. Yang kami terima saat kamu mengirim demo
          </h2>
          <p>Formulir <Link href="/submit" className="underline hover:text-forest">Submit Karya</Link> meminta:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>nama band atau solois, kota asal, judul lagu atau EP</li>
            <li>genre, program tujuan, tautan streaming atau EPK</li>
            <li>cerita singkat di balik lagu</li>
            <li>
              <strong>kontak manajer</strong> — nomor WhatsApp atau alamat email
            </li>
            <li>
              <strong>berkas audio</strong> (opsional, maksimal 25 MB: mp3, wav, atau ogg)
            </li>
          </ul>
          <p>
            Kontak dan audio tidak ditampilkan di halaman publik. Nama band, kota,
            genre, dan tautan EPK dapat tampil di halaman publik <em>hanya</em> jika
            redaksi menyetujui karya itu untuk ditampilkan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            2. Di mana data itu disimpan
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Sanity</strong> — kiriman demo dan kontak manajer masuk ke dataset
              privat yang hanya bisa dibaca dengan kunci server. Kontak disimpan sebagai
              dokumen terpisah, sehingga tidak pernah ikut terbaca di daftar antrean.
            </li>
            <li>
              <strong>Vercel Blob</strong> — berkas audio yang kamu unggah disimpan di
              penyimpanan berkas Vercel, dan hanya tautannya yang dicatat di kiriman.
            </li>
            <li>
              <strong>Vercel</strong> — situs ini dijalankan di Vercel, yang mencatat log
              teknis permintaan (alamat IP, waktu, status) untuk keperluan operasional.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            3. Siapa yang bisa melihatnya
          </h2>
          <p>
            Hanya tim redaksi Melodi Alam yang punya akses ke Studio. Kiriman tidak
            pernah tampil di antrean publik selama statusnya belum disetujui, dan kontak
            manajer tidak pernah ditampilkan di halaman mana pun.
          </p>
          <p>
            Bila notifikasi email aktif, ringkasan kiriman dikirim ke alamat redaksi
            melalui Resend. Layanan itu memproses isi email sesuai kebijakannya sendiri.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            4. Berapa lama disimpan
          </h2>
          <p>
            Kiriman disimpan selama masih ditinjau atau selama karyanya masih dipakai
            untuk liputan. Kiriman yang tidak dipilih tetap tersimpan sampai kamu meminta
            penghapusan — kami belum menerapkan masa simpan otomatis, dan itu kami
            tulis apa adanya daripada menjanjikan yang belum berjalan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            5. Hak kamu
          </h2>
          <p>
            Kamu bisa meminta salinan, koreksi, atau penghapusan data yang kamu kirim —
            termasuk berkas audio. Kirim permintaan dari alamat email yang kamu pakai saat
            mengirim, ke{" "}
            <a href={`mailto:${settings.contactEmail}`} className="underline hover:text-forest">
              {settings.contactEmail}
            </a>
            . Kami akan menghapus kiriman, kontak, dan berkas audionya.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            6. Cookie dan analitik
          </h2>
          <p>
            Situs ini tidak memasang cookie iklan dan tidak membuat profil pembaca. Bila
            analitik Vercel dinyalakan, ia menghitung kunjungan tanpa cookie dan tanpa
            melacakmu antar situs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            7. Pertanyaan
          </h2>
          <p>
            Untuk pertanyaan tentang halaman ini atau data yang kamu kirim, hubungi{" "}
            <a href={`mailto:${settings.contactEmail}`} className="underline hover:text-forest">
              {settings.contactEmail}
            </a>
            . Untuk kerja sama, alamatnya{" "}
            <a href={`mailto:${settings.partnerEmail}`} className="underline hover:text-forest">
              {settings.partnerEmail}
            </a>
            .
          </p>
        </section>

        <p className="border-t border-ink pt-6 text-xs text-neutral-600">
          Halaman ini bukan nasihat hukum. Ia menjelaskan praktik situs ini; sebelum
          dipakai untuk keperluan formal, mintakan peninjauan ke penasihat hukum.
        </p>
      </div>
    </Reveal>
  );
}
