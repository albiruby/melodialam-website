import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// Pulls photos out of the Drive folders the editorial team keeps. Every query
// is scoped to a root passed on the command line — no Drive-wide search — so
// the only folders this can touch are the ones named when it runs.
//
// Usage:
//   node scripts/gdrive-fetch.mjs [--out <dir>] [--list] <folder-link|folder-id> [...]
//
//   --list   print what is inside without downloading
//   --out    staging directory (default: workspace-root GDRIVE-INBOX)
//
// Re-runs are cheap: a file already downloaded at the same byte size is left
// alone, so an interrupted run just picks up where it stopped.

const DRIVE = "https://www.googleapis.com/drive/v3";
const SECRETS = path.resolve(import.meta.dirname, "..", "..", ".secrets");
const CLIENT_FILE = process.env.GDRIVE_CLIENT_JSON ?? path.join(SECRETS, "gdrive-client.json");
const TOKEN_FILE = path.join(SECRETS, "gdrive-token.json");
const DEFAULT_OUT = path.resolve(import.meta.dirname, "..", "..", "GDRIVE-INBOX");

const USAGE = `Usage: node scripts/gdrive-fetch.mjs [--out <dir>] [--list] <folder-link|folder-id> [...]`;

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function clientCredentials() {
  if (!fs.existsSync(CLIENT_FILE)) fail(`Client JSON tidak ada di ${CLIENT_FILE}`);
  const raw = JSON.parse(fs.readFileSync(CLIENT_FILE, "utf8"));
  const c = raw.web ?? raw.installed ?? raw;
  if (!c.client_id || !c.client_secret) fail(`Tidak ada client_id/client_secret di ${CLIENT_FILE}`);
  return { id: c.client_id, secret: c.client_secret };
}

async function accessToken() {
  if (!fs.existsSync(TOKEN_FILE)) fail(`Token belum ada (${TOKEN_FILE}). Jalankan dulu: node scripts/gdrive-auth.mjs`);

  const t = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  if (t.access_token && t.expiry && Date.now() < t.expiry - 120_000) return t.access_token;
  if (!t.refresh_token) fail("Token tanpa refresh_token — jalankan ulang scripts/gdrive-auth.mjs.");

  const { id, secret } = clientCredentials();
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: t.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const body = await r.json();
  if (!r.ok) {
    fail(`Refresh token gagal: ${JSON.stringify(body)}\nKalau error-nya invalid_grant, jalankan ulang scripts/gdrive-auth.mjs.`);
  }

  t.access_token = body.access_token;
  t.expiry = Date.now() + (body.expires_in ?? 3600) * 1000;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2));
  return t.access_token;
}

async function apiGet(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    const body = await r.text();
    const hint = body.includes("SERVICE_DISABLED")
      ? "\n  -> Google Drive API belum di-Enable di project Cloud itu (APIs & Services -> Library)."
      : "";
    fail(`Drive API ${r.status} untuk ${url}\n${body.slice(0, 600)}${hint}`);
  }
  return r.json();
}

async function children(folderId, token, acc = []) {
  let pageToken = "";
  do {
    const url = new URL(`${DRIVE}/files`);
    url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
    url.searchParams.set("fields", "nextPageToken, files(id, name, mimeType, size, modifiedTime)");
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("orderBy", "folder,name");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await apiGet(url, token);
    acc.push(...(page.files ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return acc;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|tiff?|avif|bmp|gif)$/i;
const isFolder = (f) => f.mimeType === "application/vnd.google-apps.folder";
const isImage = (f) =>
  f.mimeType?.startsWith("image/") || f.mimeType === "application/vnd.google-apps.photo" || IMAGE_EXT.test(f.name ?? "");

function safeName(name) {
  return (name ?? "unnamed")
    .replace(/[<>:"/\\|?\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/, "")
    .slice(0, 120);
}

function human(bytes) {
  if (bytes == null) return "?";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function folderId(input) {
  const fromPath = input.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (fromPath) return fromPath[1];
  const fromQuery = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (fromQuery) return fromQuery[1];
  return input; // already a bare id
}

async function collect(rootId, token, rel = "", depth = 0, out = []) {
  const items = await children(rootId, token);
  for (const item of items) {
    if (isFolder(item)) {
      if (depth >= 4) continue;
      await collect(item.id, token, path.join(rel, safeName(item.name)), depth + 1, out);
    } else {
      out.push({ ...item, rel });
    }
  }
  return out;
}

async function download(file, outDir, relDir, token) {
  const dest = path.join(outDir, relDir, safeName(file.name));
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (file.size != null && fs.existsSync(dest) && fs.statSync(dest).size === Number(file.size)) {
    return { dest, skipped: true };
  }

  const url = new URL(`${DRIVE}/files/${file.id}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("supportsAllDrives", "true");
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);

  await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(dest));
  return { dest, skipped: false };
}

async function main() {
  const argv = process.argv.slice(2);
  let outDir = DEFAULT_OUT;
  let listOnly = false;
  const roots = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") outDir = path.resolve(argv[++i] ?? fail(`--out butuh path\n${USAGE}`));
    else if (a === "--list") listOnly = true;
    else if (a.startsWith("-")) fail(`Flag tidak dikenal: ${a}\n${USAGE}`);
    else roots.push(a);
  }
  if (roots.length === 0) fail(USAGE);

  const token = await accessToken();
  const manifest = [];

  for (const root of roots) {
    const id = folderId(root);
    const meta = await apiGet(`${DRIVE}/files/${id}?fields=id,name,mimeType&supportsAllDrives=true`, token);
    if (meta.mimeType !== "application/vnd.google-apps.folder") fail(`${id} bukan folder (${meta.mimeType}).`);

    const files = await collect(id, token);
    const images = files.filter(isImage);
    const others = files.length - images.length;
    const rootDir = safeName(meta.name);

    console.log(`\n${meta.name}  (${id})`);
    console.log(
      listOnly
        ? `  ${files.length} berkas (${images.length} gambar, ${others} lainnya)`
        : `  ${images.length} gambar${others ? `, ${others} berkas lain dilewati` : ""}`,
    );

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of listOnly ? files : images) {
      const relDir = path.join(rootDir, file.rel ?? "");

      if (listOnly) {
        // `*` gambar (yang nanti diunduh), `-` berkas lain (ikon, video, doc).
        const marker = isImage(file) ? "*" : "-";
        console.log(`  ${marker} ${path.posix.join(rootDir, (file.rel ?? "").replace(/\\/g, "/"), file.name)}  ${human(file.size)}`);
      } else {
        try {
          const result = await download(file, outDir, relDir, token);
          if (result.skipped) skipped++;
          else downloaded++;
          console.log(`  ${result.skipped ? "=" : "+"} ${path.relative(outDir, result.dest)}  ${human(file.size)}`);
        } catch (err) {
          failed++;
          console.log(`  ! ${file.name}: ${err.message}`);
        }

        manifest.push({
          id: file.id,
          name: file.name,
          rel: path.posix.join(rootDir, (file.rel ?? "").replace(/\\/g, "/"), file.name),
          mimeType: file.mimeType,
          size: file.size ?? null,
          modifiedTime: file.modifiedTime ?? null,
        });
      }
    }

    if (!listOnly) console.log(`  -> ${downloaded} baru, ${skipped} sudah ada, ${failed} gagal`);
  }

  if (!listOnly) {
    fs.mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join(outDir, "_manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), files: manifest }, null, 2));
    console.log(`\nManifest: ${manifestPath}`);
  }
}

main().catch((err) => fail(err.stack ?? String(err)));
