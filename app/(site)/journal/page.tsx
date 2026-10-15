import type { Metadata } from "next";
import { JournalBrowser } from "@/components/JournalBrowser";
import { Reveal } from "@/components/Reveal";
import { allArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Journal & Stories",
  description:
    "Catatan redaksi Melodi Alam: esai skena musik, rekomendasi melodi, catatan wawancara Bicara Melodi, dan liputan panggung.",
};

export default async function JournalPage() {
  // Payload when the database is reachable, the static file otherwise.
  const articles = await allArticles();

  return (
    <Reveal>
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-4xl tracking-tight sm:text-5xl">Journal &amp; Stories</h2>
        <span className="font-serif text-sm italic text-neutral-600">
          (kurasi redaksi — oktober 2026)
        </span>
      </div>
      <JournalBrowser articles={articles} />
    </Reveal>
  );
}
