import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { DEMO_AUDIO_MAX_BYTES, DEMO_AUDIO_TYPES } from "@/lib/taxonomy";

/**
 * Signed uploads for a demo's audio file.
 *
 * The browser uploads straight to Vercel Blob; this route only mints the
 * token, so a 25 MB demo never passes through a serverless function (Vercel
 * caps request bodies well below that). The rules the form enforces in the
 * browser are enforced again here, because a crafted request does not have to
 * respect them.
 *
 * Needs `BLOB_READ_WRITE_TOKEN`, which Vercel adds when a Blob store is
 * connected to the project. Without it the route answers 400 and the form
 * tells the visitor the audio could not be attached — it never silently
 * submits without the file.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...DEMO_AUDIO_TYPES],
        maximumSizeInBytes: DEMO_AUDIO_MAX_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // The submission itself is written by /api/demos, which receives the
        // file's URL; nothing to do once the bytes have landed.
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
