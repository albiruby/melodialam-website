"use client";

import { useRef, useState } from "react";
import {
  DEMO_GENRES,
  DEMO_PROGRAMS,
  SEED_DEMOS,
  type DemoSubmission,
} from "@/lib/content";

interface ApiError {
  error?: string;
  errors?: Record<string, string>;
}

export function DemoPortal() {
  const [queue, setQueue] = useState<DemoSubmission[]>(SEED_DEMOS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const audioUrl = useRef<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  function onPickAudio(file: File | undefined) {
    if (!file) return;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    const url = URL.createObjectURL(file);
    audioUrl.current = url;
    setAudioName(file.name);
    setAudioSrc(url);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setBanner(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ApiError & { entry?: DemoSubmission };

      if (!res.ok) {
        setErrors(data.errors ?? {});
        setBanner(data.error ?? "Pengiriman gagal. Coba lagi sebentar.");
      } else {
        if (data.entry) setQueue((q) => [data.entry as DemoSubmission, ...q]);
        setBanner("✓ Demo berhasil dikirim. Karya Anda sudah masuk antreanIncoming Demo Queue.");
        formRef.current?.reset();
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = null;
        setAudioName(null);
        setAudioSrc(null);
      }
    } catch {
      setBanner("Tidak bisa menghubungi server. Periksa koneksi Anda.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 border-x border-b border-ink divide-y divide-ink lg:grid-cols-12 lg:divide-y-0">
      {/* Form */}
      <div className="bg-white p-6 sm:p-8 lg:col-span-8">
        <div className="mb-6 flex items-center justify-between border-b border-ink pb-4">
          <span className="font-mono text-xs font-bold uppercase">
            Formulir Pengiriman Karya Musisi / Band
          </span>
          <span className="font-serif text-[11px] italic">
            (terbuka untuk seluruh kota di Indonesia)
          </span>
        </div>

        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
          <Field label="(01) Nama Band / Solois *" error={errors.artist}>
            <input
              name="artist"
              required
              placeholder="Contoh: Shroomeater / Skyline"
              className={inputClass}
            />
          </Field>

          <Field label="(02) Kota Asal *" error={errors.city}>
            <input
              name="city"
              required
              placeholder="Contoh: Bogor / Bandung / Malang"
              className={inputClass}
            />
          </Field>

          <Field label="(03) Judul Lagu / EP *" error={errors.title}>
            <input name="title" required placeholder="Judul rilisan..." className={inputClass} />
          </Field>

          <Field label="(04) Genre Utama" error={errors.genre}>
            <select name="genre" defaultValue={DEMO_GENRES[0]} className={inputClass}>
              {DEMO_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="(05) Tujuan Submit" error={errors.program}>
            <select name="program" defaultValue={DEMO_PROGRAMS[0]} className={inputClass}>
              {DEMO_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="(06) Link Streaming / EPK *" error={errors.link}>
            <input
              name="link"
              type="url"
              required
              placeholder="https://open.spotify.com/..."
              className={inputClass}
            />
          </Field>

          <Field label="(07) Kontak WhatsApp / Email Manajer *" error={errors.contact}>
            <input
              name="contact"
              required
              placeholder="0812xxxx / management@band.id"
              className={inputClass}
            />
          </Field>

          {/* Local audio preview — the file itself is never uploaded */}
          <Field label="(08) Opsional: Pratinjau File Audio (.MP3 / .WAV)">
            <label
              htmlFor="demo-audio"
              className="editorial-paper flex cursor-pointer flex-col items-center justify-center border border-dashed border-ink p-5 text-center transition-all duration-300 hover:bg-white hover:shadow-[4px_4px_0px_#0D0D0D]"
            >
              <span className="text-xs font-bold uppercase transition-colors group-hover:text-forest">
                {audioName ? `✓ File dipilih: ${audioName}` : "+ Pilih file audio ke Sini"}
              </span>
              <span className="mt-1 font-serif text-xs italic text-neutral-600">
                File hanya diputar lokal di peramban Anda untuk dipratinjau.
              </span>
              <input
                id="demo-audio"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => onPickAudio(e.target.files?.[0])}
              />
            </label>

            {audioSrc ? (
              <div className="mt-3 flex items-center justify-between gap-4 border border-ink bg-paper p-3">
                <span className="truncate font-mono text-xs">{audioName}</span>
                <audio src={audioSrc} controls className="h-8 w-60" />
              </div>
            ) : null}
          </Field>

          <Field label="(09) Cerita Singkat di Balik Lagu / Press Release *" error={errors.story}>
            <textarea
              name="story"
              rows={3}
              required
              placeholder="Ceritakan latar belakang lagu, proses rekaman, atau pesan yang ingin disampaikan..."
              className={`${inputClass} h-auto py-3`}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="max-w-md text-xs text-neutral-500">
              Dengan mengirim form ini, karya Anda masuk ke antrean dengar redaksi Melodi Alam dan
              kurator panggung Samsara Bogor.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="group flex items-center gap-4 bg-ink px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-1 hover:bg-forest hover:shadow-[5px_5px_0px_#0D0D0D] active:translate-y-0 disabled:opacity-50"
            >
              <span>{pending ? "Mengirim..." : "Kirim Demo Sekarang"}</span>
              <span className="inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-1">
                ↗
              </span>
            </button>
          </div>
        </form>

        {banner ? (
          <div
            role="status"
            className="stagger-item mt-6 border-2 border-forest bg-green-50 p-4 font-mono text-xs text-forest"
          >
            {banner}
          </div>
        ) : null}
      </div>

      {/* Queue */}
      <aside className="editorial-paper flex flex-col justify-between lg:col-span-4">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-ink pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase">Incoming Demo Queue</span>
              <span className="flex h-3.5 items-end gap-0.5 text-forest">
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
              </span>
            </div>
            <span className="bg-ink px-2 py-0.5 font-mono text-[11px] text-white">
              {queue.length} TRACKS
            </span>
          </div>

          <p className="mb-5 text-xs leading-relaxed text-neutral-600">
            Daftar kiriman demo terbaru dari Sobat Melolam yang sedang dalam tahap kurasi redaksi
            pekan ini.
          </p>

          <div className="space-y-4">
            {queue.map((demo, i) => (
              <div
                key={demo.id}
                style={{ animationDelay: `${i * 80}ms` }}
                className="brutalist-card space-y-2 border border-ink bg-white p-4"
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="bg-ink px-1.5 py-0.5 font-bold text-white">{demo.status}</span>
                  <span className="uppercase text-neutral-500">
                    {demo.city} • {demo.genre}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-snug">
                    {demo.artist} — &ldquo;{demo.title}&rdquo;
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{demo.story}</p>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200 pt-2 font-mono text-[11px]">
                  <span className="font-bold text-forest">Target: {demo.program}</span>
                  <a
                    href={demo.link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-forest"
                  >
                    EPK / Track ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-ink bg-white p-6">
          <div>
            <div className="text-xs font-bold uppercase">Jadwal Open Stage Samsara</div>
            <div className="text-[11px] text-neutral-500">
              Setiap Rabu &amp; Sabtu malam • Bogor
            </div>
          </div>
          <a
            href="https://www.instagram.com/samsara.bogor/"
            target="_blank"
            rel="noreferrer"
            className="border border-ink px-3 py-2 text-xs font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
          >
            Info Slot ↗
          </a>
        </div>
      </aside>
    </div>
  );
}

const inputClass =
  "w-full border border-ink px-3 py-2.5 text-sm outline-none transition-all duration-300 focus:bg-paper focus:shadow-[4px_4px_0px_#1B3B2B]";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 font-mono text-[11px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}