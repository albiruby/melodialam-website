import Link from "next/link";
import { PRIMARY_NAV } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col justify-center">
      <span className="font-sans text-[11px] uppercase tracking-widest text-neutral-600">
        Error 404
      </span>
      <h1 className="mt-2 text-5xl font-black uppercase tracking-tight sm:text-7xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 max-w-xl font-sans text-lg italic text-neutral-600">
        Halaman yang kamu cari sudah pindah atau tidak pernah ada di arsip Melodi Alam.
      </p>

      <ul className="mt-8 flex flex-wrap gap-2">
        {PRIMARY_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="border border-ink px-3 py-1.5 font-sans text-xs font-bold uppercase transition-[color,background-color,border-color,transform,box-shadow,opacity] duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}