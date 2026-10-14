import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { SPACE_ITEMS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Spaces & Instruments",
  description:
    "Ruang dengar, perox analog, dan Memorabilia Melodi Alam: Samsara Bogor, Svarga dan Acasa, serta Svvara.",
};

export default function SpacesPage() {
  return (
    <Reveal>
      <div className="mb-6 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-4xl tracking-tight sm:text-5xl">Spaces &amp; Instruments</h2>
          <span className="font-serif text-sm italic text-neutral-600">
            (svvara, samsara, svarga &amp; acasa)
          </span>
        </div>
        <a
          href="https://www.instagram.com/samsara.bogor/"
          target="_blank"
          rel="noreferrer"
          className="nav-link-anim text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
        >
          Show All ↗
        </a>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SPACE_ITEMS.map((item) => {
          const inner = (
            <>
              <div
                className={`relative mb-4 overflow-hidden ${
                  item.ratio === "tall" ? "aspect-[4/5] border border-neutral-200" : "aspect-square"
                } ${item.dark ? "bg-neutral-800" : "bg-paper"}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="editorial-img object-cover"
                />
              </div>
              <div>
                <span
                  className={`text-[10px] uppercase ${
                    item.dark ? "text-green-400" : "text-neutral-500"
                  }`}
                >
                  {item.label}
                </span>
                <h3
                  className={`mt-1 text-xs font-bold uppercase ${
                    item.dark ? "" : "transition-colors group-hover:text-forest"
                  }`}
                >
                  {item.title}
                </h3>
                {item.price ? (
                  <p className="mt-2 font-mono text-xs font-bold">{item.price}</p>
                ) : (
                  <p
                    className={`mt-2 font-mono text-xs transition-colors ${
                      item.dark ? "text-neutral-300 group-hover:text-green-400" : "text-forest"
                    }`}
                  >
                    {item.slug === "samsara-bogor" ? "Reservasi Meja" : "Explore Stay"} ↗
                  </p>
                )}
              </div>
            </>
          );

          const shell = `brutalist-card group flex h-full flex-col justify-between border border-ink p-4 ${
            item.dark ? "bg-ink text-white" : "bg-white"
          }`;

          return item.href ? (
            <a
              key={item.slug}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={shell}
            >
              {inner}
            </a>
          ) : (
            <div key={item.slug} className={shell}>
              {inner}
            </div>
          );
        })}
      </div>

      <p className="mt-8 max-w-2xl font-serif text-sm italic leading-relaxed text-neutral-600">
        Setiap ruang dan perangkat di sini adalah bagian dari satu ekosistem: tempat orang
        mendengar lebih perlahan, lalu pulang dengan ide yang lebih jernih.
      </p>
    </Reveal>
  );
}