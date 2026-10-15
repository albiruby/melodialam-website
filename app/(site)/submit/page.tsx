import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { DemoPortal } from "@/components/DemoPortal";

export const metadata: Metadata = {
  title: "Submit Your Demo",
  description:
    "Kirim demo lagu band atau solois kamu ke redaksi Melodi Alam untuk review artikel, rekomendasi Instagram, atau tampil di panggung Melodi Samsara.",
};

export default function SubmitPage() {
  return (
    <Reveal className="pt-4">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
        <h2 className="text-4xl tracking-tight sm:text-5xl">Submit Your Demo</h2>
        <span className="font-serif text-base italic text-neutral-600">
          (kurasi a&amp;r — artikel review, rekomendasi ig &amp; panggung melodi samsara)
        </span>
      </div>

      <DemoPortal />
    </Reveal>
  );
}