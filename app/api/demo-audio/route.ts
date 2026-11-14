import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  DEMO_AUDIO_CLAIM_COUNT_QUERY,
  demoAudioUrl,
  isDemoAudioPathname,
} from "@/lib/blob-audio";
import { DEMO_AUDIO_MAX_BYTES, DEMO_AUDIO_TYPES } from "@/lib/taxonomy";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { submissionsClient } from "@/lib/sanity-server";

/**
 * Signed uploads for a demo's audio file.
 *
 * Two-phase since the F04/F05 remediation:
 *
 *  1. `POST /api/demos` validates the form, then CLAIMS one object key
 *     (`demo-audio/<uuid>.<ext>`) by writing its canonical URL onto the demo
 *     document in the private dataset. The response carries that pathname.
 *  2. This route mints the Blob token — but only for a pathname a submission
 *     claimed. `onBeforeGenerateToken` checks the exact URL against the
 *     private dataset and refuses anything else, so an anonymous caller can
 *     no longer mint tokens for arbitrary (or guessed) keys.
 *
 * The key is a UUID under `demo-audio/` — never the original filename, which
 * can carry a person's name. The browser uploads straight to Vercel Blob, so
 * a 25 MB demo never passes through a serverless function.
 *
 * Needs `BLOB_READ_WRITE_TOKEN`, which Vercel adds when a Blob store is
 * connected to the project. Without it the route answers 400 and the form
 * tells the visitor the audio could not be attached — it never silently
 * submits without the file.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // F04/F05: this endpoint mints upload tokens, and every token can be used to
  // write into our storage. Minting them is cheap, so it is capped per
  // client: a person picking one file needs a token or two, not fifty.
  const limit = await rateLimit(`demo-audio:${clientIp(request)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan unggah dari alamat ini. Coba lagi nanti." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isDemoAudioPathname(pathname)) {
          throw new Error("Pathname audio tidak sesuai.");
        }

        // F04/F05: the claim lives on the demo document in the private
        // dataset. Without Sanity there are no claims at all, so minting
        // fails closed rather than trusting the pathname's shape alone.
        if (!submissionsClient) {
          throw new Error("Antrean demo tidak tersedia.");
        }

        const url = demoAudioUrl(process.env.BLOB_STORE_ID, pathname);
        if (!url) {
          throw new Error("URL audio tidak dikenal.");
        }

        let claimed = 0;
        try {
          claimed = await submissionsClient.fetch<number>(
            DEMO_AUDIO_CLAIM_COUNT_QUERY,
            { url },
            { cache: "no-store" },
          );
        } catch (error) {
          const failure = error as { name?: string; statusCode?: number };
          console.error("[api/demo-audio] klaim audio tidak bisa diverifikasi:", {
            name: failure?.name ?? "Error",
            status: failure?.statusCode ?? "tidak ada",
          });
          throw new Error("Klaim audio tidak bisa diverifikasi.");
        }

        if (!claimed) {
          throw new Error("Pathname audio belum diklaim kiriman mana pun.");
        }

        return {
          allowedContentTypes: [...DEMO_AUDIO_TYPES],
          maximumSizeInBytes: DEMO_AUDIO_MAX_BYTES,
        };
      },
      onUploadCompleted: async () => {
        // The submission itself is written by /api/demos, which claimed this
        // object's URL before minting; nothing to do once the bytes land.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/demo-audio] gagal membuat token unggah:", error);
    return NextResponse.json(
      { error: "Unggah audio belum bisa diproses. Coba lagi nanti." },
      { status: 400 },
    );
  }
}
