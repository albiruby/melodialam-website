"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import {
  DEMO_AUDIO_EXTENSIONS,
  DEMO_AUDIO_MAX_BYTES,
  DEMO_AUDIO_TYPES,
  DEMO_GENRES,
  DEMO_PROGRAMS,
} from "@/lib/content-fallback";

interface ApiError {
  error?: string;
  errors?: Record<string, string>;
}

export function DemoPortal() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerIsError, setBannerIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const audioUrl = useRef<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [audioSize, setAudioSize] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  /**
   * Only one object URL exists at a time, and it is revoked both when a new file
   * replaces it and when the component goes away. Leaving it alive would keep
   * the picked file readable for the life of the document.
   */
  useEffect(
    () => () => {
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    },
    [],
  );

  function clearAudio() {
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null;
    setAudioFile(null);
    setAudioName(null);
    setAudioSize(0);
    setAudioSrc(null);
  }

  /** BR-001 — the browser is the first of the two places this rule is enforced. */
  function onPickAudio(input: HTMLInputElement) {
    const file = input.files?.[0];
    setAudioError(null);

    if (!file) {
      clearAudio();
      return;
    }

    const lower = file.name.toLowerCase();
    const extensionOk = DEMO_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
    // Some browsers report an empty MIME type for WAV, so an empty type is not
    // treated as a failure; the extension is the reliable signal there.
    const typeOk = !file.type || (DEMO_AUDIO_TYPES as readonly string[]).includes(file.type);

    const reject = (message: string) => {
      setAudioError(message);
      // Clear the input too, so an invalid pick cannot be submitted by a
      // subsequent submit of the otherwise-valid form.
      input.value = "";
      clearAudio();
    };

    if (!extensionOk || !typeOk) {
      reject(`Format berkas harus ${DEMO_AUDIO_EXTENSIONS.join(", ")}.`);
      return;
    }
    if (file.size > DEMO_AUDIO_MAX_BYTES) {
      reject("Ukuran berkas melebihi batas 25 MB.");
      return;
    }

    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    const url = URL.createObjectURL(file);
    audioUrl.current = url;
    setAudioFile(file);
    setAudioName(file.name);
    setAudioSize(file.size);
    setAudioSrc(url);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setBanner(null);

    const form = new FormData(event.currentTarget);
    // The audio size is a number, not a string: the server reads it as a byte
    // count, and a size that arrives as "26214400" instead of 26214400 would
    // never be compared against the 25 MB limit.
    const payload: Record<string, string | number> = Object.fromEntries(
      [...form.entries()].filter(([, value]) => typeof value === "string"),
    ) as Record<string, string | number>;

    try {
      // The file goes straight to Vercel Blob, not through this request: a
      // 25 MB body would never clear the function's limit. The submission then
      // carries the URL, so the desk can play it from the Studio.
      if (audioFile) {
        try {
          const blob = await upload(`demo-audio/${Date.now()}-${audioFile.name}`, audioFile, {
            access: "public",
            handleUploadUrl: "/api/demo-audio",
          });
          payload.audioUrl = blob.url;
          payload.audioName = audioFile.name;
          payload.audioSize = audioFile.size;
        } catch {
          setBannerIsError(true);
          setBanner("Audio gagal diunggah. Coba lagi, atau hapus berkasnya lalu kirim tanpa audio.");
          return;
        }
      }

      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ApiError;

      if (!res.ok) {
        const fieldErrors = data.errors ?? {};
        setErrors(fieldErrors);
        setBannerIsError(true);
        setBanner(data.error ?? "Pengiriman gagal. Coba lagi sebentar.");

        // Put the caret on the first field that needs attention, so a keyboard
        // user is not left hunting for it.
        const first = Object.keys(fieldErrors)[0];
        if (first) {
          formRef.current
            ?.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)
            ?.focus();
        }
      } else {
        setBannerIsError(false);
        setBanner("Demo berhasil dikirim dan sudah masuk antrean tinjauan kurator.");
        formRef.current?.reset();
        clearAudio();
      }
    } catch {
      setBannerIsError(true);
      setBanner("Tidak bisa menghubungi server. Periksa koneksi Anda lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-x border-b border-ink">
      <div className="bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-ink pb-4">
          <span className="font-mono text-xs font-bold uppercase">
            Formulir Pengiriman Karya Musisi / Band
          </span>
          <span className="font-serif text-[11px] italic">
            (terbuka untuk seluruh kota di Indonesia)
          </span>
        </div>

        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
          <Field label="(01) Nama Band / Solois *" htmlFor="demo-artist" error={errors.artist}>
            <input
              id="demo-artist"
              name="artist"
              required
              autoComplete="organization"
              placeholder="Contoh: Shroomeater / Skyline"
              className={inputClass}
            />
          </Field>

          <Field label="(02) Kota Asal *" htmlFor="demo-city" error={errors.city}>
            <input
              id="demo-city"
              name="city"
              required
              autoComplete="address-level2"
              placeholder="Contoh: Bogor / Bandung / Malang"
              className={inputClass}
            />
          </Field>

          <Field label="(03) Judul Lagu / EP *" htmlFor="demo-title" error={errors.title}>
            <input
              id="demo-title"
              name="title"
              required
              autoComplete="off"
              placeholder="Judul rilisan…"
              className={inputClass}
            />
          </Field>

          <Field label="(04) Genre Utama" htmlFor="demo-genre" error={errors.genre}>
            <select
              id="demo-genre"
              name="genre"
              defaultValue={DEMO_GENRES[0]}
              className={inputClass}
            >
              {DEMO_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="(05) Tujuan Submit" htmlFor="demo-program" error={errors.program}>
            <select
              id="demo-program"
              name="program"
              defaultValue={DEMO_PROGRAMS[0]}
              className={inputClass}
            >
              {DEMO_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="(06) Link Streaming / EPK *" htmlFor="demo-link" error={errors.link}>
            <input
              id="demo-link"
              name="link"
              type="url"
              required
              autoComplete="url"
              spellCheck={false}
              placeholder="https://open.spotify.com/…"
              className={inputClass}
            />
          </Field>

          <Field
            label="(07) Kontak WhatsApp / Email Manajer *"
            htmlFor="demo-contact"
            error={errors.contact}
          >
            <input
              id="demo-contact"
              name="contact"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="0812xxxx atau management@band.id"
              className={inputClass}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
              Hanya dibaca kurator Melodi Alam. Tidak pernah ditampilkan di antrean publik.
            </p>
          </Field>

          {/*
            (08) is not wrapped in <Field>. The file input's own <label> is the
            dropzone, so a Field label here would nest one label inside another,
            which is invalid. The heading is a plain span instead.
          */}
          <div>
            <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider">
              (08) Opsional: Pratinjau File Audio (.MP3 / .WAV / .OGG, maks 25 MB)
            </span>
            <label
              htmlFor="demo-audio"
              className="editorial-paper flex cursor-pointer flex-col items-center justify-center border border-dashed border-ink p-5 text-center transition-all duration-300 hover:bg-white hover:shadow-[4px_4px_0px_#0D0D0D] focus-within:bg-white focus-within:shadow-[4px_4px_0px_#0D0D0D]"
            >
              <span className="text-xs font-bold uppercase">
                {audioName ? `File dipilih: ${audioName}` : "Pilih file audio dari perangkat ini"}
              </span>
              <span className="mt-1 font-serif text-xs italic text-neutral-600">
                Berkas ini ikut terkirim ke redaksi dan hanya dibaca kurator.
              </span>
              <input
                id="demo-audio"
                type="file"
                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                className="sr-only"
                onChange={(e) => onPickAudio(e.currentTarget)}
              />
            </label>

            {audioError ? (
              <p role="alert" className="mt-1.5 font-mono text-[11px] text-red-700">
                {audioError}
              </p>
            ) : null}

            {audioSrc ? (
              <div className="mt-3 flex items-center justify-between gap-4 border border-ink bg-paper p-3">
                <span className="min-w-0 truncate font-mono text-xs">
                  {audioName} · {(audioSize / 1024 / 1024).toFixed(1)} MB
                </span>
                <audio src={audioSrc} controls className="h-8 w-60" />
              </div>
            ) : null}
          </div>

          <Field label="(09) Cerita Singkat di Balik Lagu / Press Release *" htmlFor="demo-story" error={errors.story}>
            <textarea
              id="demo-story"
              name="story"
              rows={3}
              required
              placeholder="Ceritakan latar belakang lagu, proses rekaman, atau pesan yang ingin disampaikan…"
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
              className="group flex items-center gap-4 bg-ink px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-1 hover:bg-forest hover:shadow-[5px_5px_0px_#0D0D0D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest active:translate-y-0 disabled:opacity-50"
            >
              <span>{pending ? "Mengirim…" : "Kirim Demo Sekarang"}</span>
              <span
                aria-hidden
                className="inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-1"
              >
                ↗
              </span>
            </button>
          </div>
        </form>

        {banner ? (
          <div
            role={bannerIsError ? "alert" : "status"}
            className={`stagger-item mt-6 border-2 p-4 font-mono text-xs ${
              bannerIsError
                ? "border-red-700 bg-red-50 text-red-800"
                : "border-forest bg-green-50 text-forest"
            }`}
          >
            {banner}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * An explicit `htmlFor` plus a matching `id` on the control, rather than a
 * wrapping label. Wrapping works too, but it cannot be nested — and one of these
 * fields used to wrap a file input that had its own label inside it, which is
 * invalid HTML.
 */
const inputClass =
  "w-full border border-ink bg-white px-3 py-2.5 text-sm text-ink transition-all duration-300 focus:bg-paper focus:shadow-[4px_4px_0px_#1B3B2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider"
      >
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
