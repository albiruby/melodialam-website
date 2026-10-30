/**
 * Smoke test against a running server.
 *
 * Not an end-to-end test — no browser, no clicks. It asks the questions a
 * deploy can break silently and a unit test cannot see: does every route still
 * answer, is the redirect still a redirect, does the sitemap still list what it
 * should, and is page 2 of Stories still reachable.
 *
 * Run it against a local build (`npm run start`) or production:
 *
 *   node scripts/smoke.mjs                      # http://localhost:3100
 *   node scripts/smoke.mjs https://melodialam-website.vercel.app
 *
 * CI runs it between the build and the end of the job.
 */
const base = (process.argv[2] ?? "http://localhost:3100").replace(/\/+$/, "");

let failed = 0;

function check(label, ok, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

async function get(path, init = {}) {
  return fetch(base + path, { redirect: "manual", ...init });
}

console.log(`Smoke test: ${base}\n`);

// 1. Setiap rute menjawab.
const routes = [
  "/",
  "/stories",
  "/stories/page/2",
  "/discover",
  "/videos",
  "/bicara-melodi",
  "/tentang",
  "/submit",
  "/privasi",
  "/ketentuan",
  "/sitemap.xml",
  "/rss.xml",
  "/robots.txt",
  "/api/demos",
  "/api/health",
];

for (const route of routes) {
  const res = await get(route);
  check(`${route} → 200`, res.status === 200, `status ${res.status}`);
}

// 2. Redirect lama tetap redirect — ke path relatif, bukan origin dari request.
const journal = await get("/journal");
check("/journal → 308", journal.status === 308, `status ${journal.status}`);
check(
  "/journal mengarah ke /stories (relatif)",
  (journal.headers.get("location") ?? "") === "/stories",
  journal.headers.get("location") ?? "tanpa location",
);

const discover = await get("/kurasi");
check("/kurasi → 308", discover.status === 308, `status ${discover.status}`);
check(
  "/kurasi mengarah ke /discover (relatif)",
  (discover.headers.get("location") ?? "") === "/discover",
  discover.headers.get("location") ?? "tanpa location",
);

// 3. Halaman 2 benar-benar memuat empat artikel yang tidak ada di halaman 1.
const page1 = await (await get("/stories")).text();
const page2 = await (await get("/stories/page/2")).text();
const slugs = (html) => new Set([...html.matchAll(/href="\/stories\/([^"/]+)"/g)].map((m) => m[1]));

const first = slugs(page1);
const second = slugs(page2);
check("halaman 1 memuat 8 artikel", [...first].filter((s) => s !== "page").length === 8, `${first.size} tautan`);
check("halaman 2 memuat 4 artikel", [...second].filter((s) => s !== "page").length === 4, `${second.size} tautan`);
check("halaman 2 punya artikel yang tidak ada di halaman 1", [...second].some((s) => s !== "page" && !first.has(s)));

// 4. Sitemap memuat semua artikel.
const sitemap = await (await get("/sitemap.xml")).text();
const articleUrls = (sitemap.match(/\/stories\/[a-z0-9-]+</g) ?? []).length;
check("sitemap memuat 12 artikel", articleUrls === 12, `${articleUrls} artikel`);
check("sitemap memuat halaman 2", sitemap.includes("/stories/page/2"));
check("sitemap memuat halaman legal", sitemap.includes("/privasi") && sitemap.includes("/ketentuan"));

// 5. Antrean publik menyaring status.
const queue = await (await get("/api/demos")).json();
check(
  "antrean publik hanya berisi status disetujui",
  (queue.queue ?? []).every((row) => ["SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)"].includes(row.status)),
  `${queue.count} baris`,
);

// 6. Kesehatan.
const health = await (await get("/api/health")).json();
check("Sanity terjangkau", health.ok === true, JSON.stringify(health));

console.log(failed ? `\n${failed} pemeriksaan gagal.` : "\nSemua pemeriksaan lulus.");
process.exit(failed ? 1 : 0);
