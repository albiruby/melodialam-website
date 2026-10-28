import Link from "next/link";

/**
 * The closing invitation: one thought, one action.
 *
 * Centred like a magazine's newsletter block, but in the site's action green.
 * The partner address lives in the footer and on /tentang; The homepage asks
 * the reader to do one thing — send a demo.
 */
export function SubmitCTA() {
  return (
    <section
      aria-labelledby="submit-title"
      className="-mx-4 bg-forest px-4 py-14 text-white sm:-mx-8 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
          Open Submission
        </p>
        <h2
          id="submit-title"
          className="mt-3 font-display text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl"
        >
          Punya karya untuk didengar?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
          Kirim demo atau ajak kami berkolaborasi. Setiap demo masuk antrean kurator.
        </p>
        <Link
          href="/submit"
          className="mt-7 inline-flex min-h-12 items-center justify-center border-2 border-white bg-paper px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-[color,background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-white"
        >
          Submit Karya
        </Link>
      </div>
    </section>
  );
}
