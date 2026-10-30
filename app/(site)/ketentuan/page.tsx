import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { pageMetadata } from "@/lib/page-metadata";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * What a visitor agrees to by using the form.
 *
 * Deliberately short: it states the relationship the site actually has with the
 * work it is sent — moderated, not guaranteed, credited where it is used. Long
 * terms nobody reads protect nobody.
 */
export const metadata = pageMetadata({
  title: "Ketentuan",
  description:
    "Ketentuan pengiriman karya ke Melodi Alam: karya tetap milik pengirim, redaksi memilih dan menyunting, dan tidak ada jaminan tayang.",
  path: "/ketentuan",
});

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <Reveal>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Ketentuan</h1>
        <span className="font-sans text-[11px] uppercase tracking-wider text-neutral-600">
          diperbarui 24 Oktober 2026
        </span>
      </div>

      <div className="max-w-3xl space-y-6 py-8 text-sm leading-relaxed text-neutral-700">
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">1. Karya tetap milikmu</h2>
          <p>
            Mengirim demo tidak memindahkan hak cipta. Lagu, rekaman, dan tulisan tetap
            milik kamu atau band kamu. Kami tidak mengklaim kepemilikannya.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            2. Yang kamu izinkan saat mengirim
          </h2>
          <p>Dengan menekan tombol kirim, kamu memberi redaksi Melodi Alam izin untuk:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>mendengarkan dan meninjau karya yang dikirim;</li>
            <li>
              menulis tentang karya itu — esai, catatan rilis, atau wawancara — dan
              menampilkannya di situs ini serta kanal resmi Melodi Alam;
            </li>
            <li>
              memuat kutipan singkat karya (misalnya beberapa detik audio) sebagai
              pelengkap tulisan, dengan kredit kepada kamu;
            </li>
            <li>menyunting tulisan yang kamu kirim untuk panjang dan kejelasan.</li>
          </ul>
          <p>
            Izin ini tidak eksklusif: kamu tetap bebas mengirim karya yang sama ke media
            lain.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">3. Tidak ada jaminan tayang</h2>
          <p>
            Setiap kiriman ditinjau manusia, dan tidak semuanya dipilih. Kami tidak
            menjanjikan waktu tinjauan tertentu, dan tidak mengirim balasan ke setiap
            kiriman. Kalau karyamu dipilih, redaksi akan menghubungi lewat kontak yang
            kamu cantumkan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">4. Yang tidak boleh dikirim</h2>
          <p>
            Kirim hanya karya yang kamu berhak kirimkan. Jangan mengirim materi milik
            orang lain tanpa izin, rekaman yang belum dirilis tanpa persetujuan label,
            atau apa pun yang melanggar hukum. Kiriman seperti itu kami hapus.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">5. Data yang kamu berikan</h2>
          <p>
            Data yang dikumpulkan formulir dijelaskan di{" "}
            <Link href="/privasi" className="underline hover:text-forest">
              Kebijakan Privasi
            </Link>
            , termasuk cara meminta penghapusan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-ink">6. Pertanyaan</h2>
          <p>
            Hubungi{" "}
            <a href={`mailto:${settings.contactEmail}`} className="underline hover:text-forest">
              {settings.contactEmail}
            </a>{" "}
            atau, untuk kerja sama,{" "}
            <a href={`mailto:${settings.partnerEmail}`} className="underline hover:text-forest">
              {settings.partnerEmail}
            </a>
            .
          </p>
        </section>

        <p className="border-t border-ink pt-6 text-xs text-neutral-600">
          Halaman ini bukan nasihat hukum. Sebelum dipakai untuk keperluan formal,
          mintakan peninjauan ke penasihat hukum.
        </p>
      </div>
    </Reveal>
  );
}
