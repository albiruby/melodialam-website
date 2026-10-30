import { Reveal } from "@/components/motion/Reveal";
import { DemoPortal } from "@/components/DemoPortal";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Submit Karya",
  description:
    "Kirim demo lagu band atau solois kamu ke redaksi Melodi Alam untuk review artikel, rekomendasi Instagram, atau tampil di panggung Melodi Samsara.",
  path: "/submit",
  image: "/og-submit.png",
});

export default function SubmitPage() {
  return (
    <Reveal className="pt-4">
      <div className="mb-4 border-b border-rule pb-4">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Submit Karya</h1>
      </div>

      <DemoPortal />
    </Reveal>
  );
}