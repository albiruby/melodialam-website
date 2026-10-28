import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { DemoPortal } from "@/components/DemoPortal";

export const metadata: Metadata = {
  title: "Submit Karya",
  description:
    "Kirim demo lagu band atau solois kamu ke redaksi Melodi Alam untuk review artikel, rekomendasi Instagram, atau tampil di panggung Melodi Samsara.",
  alternates: { canonical: "/submit" },
};

export default function SubmitPage() {
  return (
    <Reveal className="pt-4">
      <div className="mb-4 border-b-2 border-ink pb-3">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Submit Karya</h1>
      </div>

      <DemoPortal />
    </Reveal>
  );
}