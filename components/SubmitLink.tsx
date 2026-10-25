import Link from "next/link";

/** Small helper so other sections can link straight to the demo form. */
export function SubmitLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/submit"
      className={`bg-forest px-3.5 py-1.5 font-bold text-white transition-all duration-300 hover:bg-ink hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#0D0D0D] ${className}`.trim()}
    >
      Submit Karya
    </Link>
  );
}
