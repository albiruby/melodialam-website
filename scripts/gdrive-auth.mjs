import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";

// One-shot OAuth helper for the Drive folders the site pulls photos from.
//
// Google redirects the browser back to loopback, so no public endpoint is
// needed: this serves the callback, swaps the code for tokens, and writes them
// where gdrive-fetch.mjs reads them. Nothing here touches the repo tree —
// .secrets/ sits beside the two repos and is never committed.
//
// Setup it expects, once, in the Cloud project that owns the client:
//   1. Credentials -> the OAuth *web* client -> Authorized redirect URIs:
//      add http://localhost:8420
//   2. APIs & Services -> Library -> Google Drive API: Enabled
//   3. If the consent screen is in "Testing", the signing-in account must be
//      listed under Test users.

const PORT = Number(process.env.GDRIVE_AUTH_PORT ?? 8420);
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const SECRETS = path.resolve(import.meta.dirname, "..", "..", ".secrets");
const CLIENT_FILE = process.env.GDRIVE_CLIENT_JSON ?? path.join(SECRETS, "gdrive-client.json");
const TOKEN_FILE = path.join(SECRETS, "gdrive-token.json");
const URL_FILE = path.join(SECRETS, "gdrive-auth-url.txt");

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(CLIENT_FILE)) {
  fail(`Client JSON tidak ada di ${CLIENT_FILE}\nCopy berkasnya ke sana (atau set GDRIVE_CLIENT_JSON) lalu jalankan ulang.`);
}

const client = (() => {
  const raw = JSON.parse(fs.readFileSync(CLIENT_FILE, "utf8"));
  const c = raw.web ?? raw.installed ?? raw;
  if (!c.client_id || !c.client_secret) fail(`Tidak ada client_id/client_secret di ${CLIENT_FILE}`);
  return { id: c.client_id, secret: c.client_secret };
})();

const state = crypto.randomBytes(16).toString("hex");

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", client.id);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("state", state);

fs.mkdirSync(SECRETS, { recursive: true });
fs.writeFileSync(URL_FILE, authUrl.toString());

const page = (title, body) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  `<body style="font:16px/1.6 system-ui;max-width:34rem;margin:4rem auto;padding:0 1.5rem">` +
  `<h1 style="font-size:1.25rem">${title}</h1>${body}</body>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error) {
    console.error(`\nGoogle menolak: ${error}`);
    res.end(page("Dibatalkan", `<p>Google menolak: <code>${error}</code>. Jalankan ulang skrip ini untuk mencoba lagi.</p>`));
    server.close();
    return;
  }

  if (!code || url.searchParams.get("state") !== state) {
    res.writeHead(400);
    res.end(page("Callback tidak valid", "<p>Parameter <code>code</code>/<code>state</code> tidak cocok. Ulangi dari link terbaru.</p>"));
    return;
  }

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.id,
      client_secret: client.secret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const token = await r.json();

  if (!r.ok) {
    console.error("\nTukar token gagal:", JSON.stringify(token));
    res.writeHead(500);
    res.end(page("Gagal tukar token", `<pre>${JSON.stringify(token, null, 2)}</pre>`));
    return;
  }

  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify(
      {
        refresh_token: token.refresh_token ?? null,
        access_token: token.access_token,
        expiry: Date.now() + (token.expires_in ?? 3600) * 1000,
        scope: token.scope,
        obtained_at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(`\nToken tersimpan: ${TOKEN_FILE}`);
  console.log(`refresh_token: ${token.refresh_token ? "ada" : "TIDAK ada — ulangi dengan prompt=consent"}`);
  res.end(page("Berhasil", "<p>Akun sudah tersambung. Tutup tab ini; token tersimpan di <code>.secrets/gdrive-token.json</code>.</p>"));
  server.close();
  setTimeout(() => process.exit(0), 400);
});

server.on("error", (err) => fail(`Tidak bisa listen di port ${PORT}: ${err.message}`));

server.listen(PORT, () => {
  console.log("\nBuka link ini di browser (login sebagai pemilik folder):\n");
  console.log(authUrl.toString());
  console.log(`\nURL juga ditulis ke ${URL_FILE}`);
  console.log(`Menunggu callback di ${REDIRECT_URI} ...`);
});
