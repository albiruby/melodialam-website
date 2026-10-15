<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **melodi-alam** (341 symbols, 553 relationships, 14 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/melodi-alam/context` | Codebase overview, check index freshness |
| `gitnexus://repo/melodi-alam/clusters` | All functional areas |
| `gitnexus://repo/melodi-alam/processes` | All execution flows |
| `gitnexus://repo/melodi-alam/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# Melodi Alam — project context for agents

The blocks above are written and re-added by tooling (`next dev`, `gitnexus`). This
section is maintained by hand. Keep it accurate or delete it.

## What this repo is

A Next.js 16 App Router + React 19 + TypeScript site for **Melodi Alam**, an Indonesian
music-media platform: editorial articles (*Stories*), a YouTube catalogue hub (*Watch*),
and a demo-submission pipeline (*Submit Demo*). Content is edited in a Sanity Studio
embedded at `/studio`.

**Read `docs/README.md` first.** It indexes the whole documentation set and says who each
document is for. Twelve documents live in `docs/`, plus eight ADRs in `docs/adr/`.
`docs/SANITY-INTEGRATION.md` is the CMS guide; several older documents carry a
"superseded" banner from the Payload era — heed it.

## Commands (these are all of them)

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on port **3100** |
| `npm run build` | Production build — 28 static pages |
| `npm run start` | Serve the production build on 3100 |
| `npm run lint` | ESLint |
| `npm run catalogue` | Regenerate `lib/catalogue.json` |
| `npm run brand` | Regenerate brand assets + app icons |
| `npm run photos` | Copy the placeholder photo set |
| `npm run sanity` | Sanity CLI (`npm run sanity -- dataset list`) |
| `npm run sanity:deploy` | Deploy the Studio to Sanity hosting |

Port 3000 is deliberately avoided. There is no `test` script yet.

Do **not** run `npm run build` while the dev server is running — they share Turbopack
state and the pages come out blank. Stop the dev server first.

## Hard rules — each one is here because it already broke

These are measured regressions, not style preferences. Full detail in
`docs/DESIGN-SYSTEM.md` §7.2 and `docs/CONTRIBUTING.md` §4.

1. **`next/image` with `fill` needs a positioned parent.** A `static` parent makes the
   image stretch to a distant ancestor's width while `sizes` still asks for
   thumbnail-sized pixels — an 8× upscale that reads as a blurry photo.
2. **Never bake a hidden state into server-rendered HTML.** SSR renders the finished
   state; animation only enhances it. The opposite left headings permanently invisible
   when one viewport callback was missed.
3. **Never build Tailwind class names by interpolation.** `aspect-[${x}]` produces no
   rule at all, with no error. Write classes as complete literals.
4. **Never read layout geometry inside a frame loop.** A per-frame `scrollWidth` read
   starved the page to **1 requestAnimationFrame per second**, which stopped
   `IntersectionObserver` callbacks and froze content at `opacity: 0`. Measure with
   `ResizeObserver`.
5. **Never use `transform: scale()` to enlarge an image.** The browser rasterises at
   layout size then upscales the bitmap. Enlarge the box instead.
6. **Any new tool directory at the project root needs `@source not "../<dir>"` in
   `app/globals.css`.** Tailwind's content scan walked `.codegraph/`, hit a locked SQLite
   file, and made Turbopack panic — silently producing an empty stylesheet.
7. **Never hand-edit generated artefacts**: `lib/catalogue.json`, `public/brand/*`,
   `public/photos/*`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`. Note that
   ESLint already ignores `.codegraph/**`, `.gitnexus/**`, and `lib/catalogue.json`.
8. **Next 16 deprecated `priority` on `next/image`** in favour of `preload`, and changed
   the default `qualities` to `[75]`. The Next.js docs are in `node_modules/next/dist/docs/`.
9. **`lib/sanity-server.ts` is server-only.** It holds `SANITY_API_READ_TOKEN`, which reads
   the private `submissions` dataset — every musician's contact number. Import it from
   server code only; a client component that imports it ships the token to the browser.
   `lib/sanity.ts` is the tokenless one and is safe anywhere. See
   `docs/SANITY-INTEGRATION.md` §8.

## Design system is locked

`border-radius: 0` everywhere except the circular video play button. Hard offset shadows
only, never blurred. `1px` hairline borders are the structural device. Three brand
colours: `ink #0d0d0d`, `paper #f6f5f2`, `forest #1b3b2b`. The `DEC-002` (dash strip) and
`DEC-003` (row action group) hover interactions must be preserved, not replaced with
generic behaviour. See `docs/DESIGN-SYSTEM.md`.

## Accessibility obligations

`prefers-reduced-motion` must be honoured by every new animation. Hover-revealed
affordances must also work on keyboard focus (`ACC-002`). **This is currently a real
gap — there are zero `:focus*` selectors in `app/globals.css`.** Do not add more; close
it if you touch that code.

## Decided but not yet built

Do not implement these without being asked. They are documented targets.

| Decision | ADR |
|---|---|
| CMS is **Sanity Studio**, embedded at `/studio`, two datasets (`production` public, `submissions` private) | `docs/adr/0008` (supersedes `docs/adr/0002`, `docs/adr/0003`) |
| Video catalogue stays a build-time artefact, not a CMS collection | `docs/adr/0004` |
| Demo queue is **moderated** — private until a curator approves | `docs/adr/0005` |
| Vitest + Playwright, deploy to Vercel | `docs/adr/0006` |

## Phase discipline

The documentation set describes both what exists and what is planned. Every claim in
`docs/` carries a `TERVERIFIKASI` / `RENCANA` / `ASUMSI` label. When you change
behaviour that a document describes, update that document in the same change — the docs
are part of the work, not an afterthought.

If you write a new document, follow the conventions in `docs/README.md` §"Konvensi
penulisan": Indonesian prose, English identifiers, explicit status labels, and always a
*Verification Notes* section stating what was actually checked.
