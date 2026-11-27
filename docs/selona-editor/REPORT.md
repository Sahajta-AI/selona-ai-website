# Report: Selona website editor and Claude connector

## Update, 26 Nov (afternoon)

- **Where it is now:** all work is on `main` of **Sahajta-AI/selona-ai-website** (Pranamya's decision: no branch, no pull request), deployed as its own Vercel project **selona-ai-website** at **https://selona-ai-website.vercel.app**, with its own Blob content store. selona.ai and the July repo/project are untouched (production still `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt`).
- **Tests on the real site:** the full suite passed there, **43/43** (`test-output/test-site-selona-ai-website.txt`). Getting there found and fixed two bugs that only show on real Vercel Blob: (1) saved versions couldn't be found by id because Blob adds a random suffix to file names; (2) Blob's listing can lag a moment behind a write, so a page rebuilt right after Publish could show the previous version. Now every save waits until its file is listed. The local disk store mimics Blob's suffix so local tests catch the first kind of problem.
- **Pranamya's first try** also found: Publish could look stuck on "Publishing…" (the screen didn't show the outcome) and the connector address opened in Chrome showed a raw error. Fixed: every action ends with a clear status, requests give up after 30 seconds with a message, a failed save stops Publish, warnings are larger, and the connector address opened in a browser explains itself in plain words.
- **Open:** Pranamya finds the editor's look poor; a redesign of the editor screen (not the site) waits on her specifics. Google sign-in client and the connector in claude.ai are still hers to do (MORNING.md).


Branch `feature/editor-and-connector` in **Sahajta-AI/selona-ai-website** (moved there at 22:58 IST on Pranamya's request). Built overnight 25–26 Nov 2026 from `BRIEF.md`. Production is untouched: it is still `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt`, `main` is still 506e2ae in both repos, and no Production environment variable was created or changed.

Read first: `STATUS.md` (the brief, bullet by bullet), then `MORNING.md` (your steps).

## What works

- **Content out of the code.** Every word, picture and both background videos on all 7 routes now come from `content/defaults.json` plus the content store. The site reads **exactly** as before: the parity test checks the text of every page against the 506e2ae baseline (21/21 locally; text 7/7 on the Preview too).
- **Editor at /editor.** Sign in, click any text and type, change lists, replace pictures and video, Undo/Redo with Ctrl+Z, Preview, Publish with a real "Live now ✓" check, a conflict warning, History with restore, and Saved versions with a one-step bring-back. Plain words throughout; works on a phone.
- **Claude connector at /api/mcp/<private token>.** 7 tools; it can only prepare drafts and returns a review link; publishing stays in the editor. *(27 Nov: now everything the editor can do, including publishing the previewed draft when asked; see ASSUMPTIONS.md "27 Nov".)*
- **Sign-in:** allowlist, signed 8-hour sessions, access-key backup (Preview only), Google built and ready for its keys.

## What isn't finished (BLOCKED, needs Pranamya)

1. **Content store on the Preview and Production.** Connecting the Blob store adds a token to every environment, Production included, which tonight's rules forbid. Reading a token out of Vercel to set it on Preview only was refused by this session's permission guard. Result: the Preview deployment builds and shows the site perfectly (default content), but saving in the editor there needs the store. → MORNING.md step 2 (two clicks).
2. **Google sign-in client** (B1) → MORNING.md step 3.
3. **Adding the connector in claude.ai** (B2) → MORNING.md step 6.

Because of (1), proofs 2–10 ran against a **local production build** of the same code (`next build && next start`, on-disk content store), not the Preview. Proof 1 also ran on the Preview from a Vercel Sandbox (this machine can't reach `*.vercel.app`).

## Tests and results

Full output: `test-output/local-production-build.txt` (43 passed) and `test-output/npm-run-build.txt`.

| Proof | Test | Local production build | Preview |
|---|---|---|---|
| 1 Text parity, every page | `tests/e2e/parity.spec.ts` (text) | 7/7 pass | 7/7 pass (Sandbox, commit 4ebc9db) |
| 1 Screenshots 1440/390 | `parity.spec.ts` (look) | 14/14 pass | 1440: 7/7; 390: 3/7 (pages 20 px taller on the Sandbox's Chromium; font rendering, text identical) |
| 2 Allowlist sign-in and refusal; routes refuse without sign-in | `auth.spec.ts` (8 tests) + `google.spec.ts` (2) | 10/10 pass | not run (sign-in needs the store for its attempt limit) |
| 3 Edit → preview → publish → site shows it | `editor.spec.ts` "3:" | pass | BLOCKED (store) |
| 4 Ctrl+Z, Undo, Redo | "4:" | pass | BLOCKED (store) |
| 5 Replace a picture | "5:" | pass | BLOCKED (store) |
| 6 List add/remove/reorder | "6:" | pass | BLOCKED (store) |
| 7 Restore an older version | "7:" | pass | BLOCKED (store) |
| 8 Archive → 3 changes → bring back → identical | "8:" | pass | BLOCKED (store) |
| 9 Connector via MCP SDK client; review link; can't publish | `connector.spec.ts` | pass | BLOCKED (store) |
| 10 Racing edits warn | "10:" | pass | BLOCKED (store) |
| 11 `npm run build` | – | exit 0; eslint 0 errors (3 warnings: `<img>` thumbnails in the editor panel) | Vercel build READY (`dpl_DT2E8U2jixYWfbEWNxb4mnBJ89m4`) |
| 12 Preview content = original; main and production untouched | – | tests end by bringing back the original | Preview shows the default (= original) content; main 506e2ae; production `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt` |
| Unit: content helpers | `tests/unit/paths.spec.ts` | 4/4 pass | – |

Run them yourself: `BASE_URL=<site> npx playwright test` (see `tests/README.md`; local keys come from `.env.e2e.local`).

## What was built, file by file

**Content**
- `content/defaults.json`: all site content (400 texts, 13 pictures, 2 videos), generated from the July code; the repo default.
- `lib/content/paths.ts`: content keys, plain-word labels, merging stored content over the default (with shape and safety checks), diffs.
- `lib/content/store.ts`: Vercel Blob (or an on-disk store locally), per-environment prefix, write-once files.
- `lib/content/versions.ts`: live versions, drafts, saved versions, publish with conflict check, the "Original site" archive.
- `lib/content/stega.ts`: invisible markers naming each text, used only inside the editor.
- `lib/content/index.ts`: `getContent()` (cached live content, or the draft inside the editor) and the version stamp.
- Site components and pages (`app/(site)/*`, `components/*`, `components/home/*`): read from content instead of hard-coded text; same markup. `components/SiteChrome.tsx` holds the nav and footer for site pages and the 404.
- Deleted: 10 unused home components, `lib/content.ts`, `lib/testimonials.ts` (nothing rendered them).

**Sign-in**
- `lib/auth.ts`: allowlist, sessions, access keys, attempt limit. `lib/editor-redirect.ts`: safe redirects.
- `app/editor/sign-in`, `app/editor/no-access`, `app/api/editor/sign-in`, `sign-out`, `google`, `google/callback`.

**Editor**
- `app/editor/page.tsx`, `components/editor/EditorApp.tsx`: the editor screen.
- `components/editor/EditOverlay.tsx`: the in-page script inside the editor frame.
- `lib/editor-api.ts` and `app/api/editor/{enter,state,draft,publish,versions,restore,archive,bring-back,upload}`: the editor API, all checked on the server.
- `app/api/media/local/[...path]`: serves uploads in local development only (404 on Vercel).
- `next.config.ts`: Blob pictures allowed; noindex and no-store headers on `/editor` and `/api`.

**Connector**
- `lib/connector.ts`, `app/api/mcp/[token]/route.ts`: MCP server (Streamable HTTP, stateless) with 7 tools.

**Tests and tools**
- `playwright.config.ts`, `tests/e2e/*.spec.ts`, `tests/unit/paths.spec.ts`, `scripts/editor/capture.mjs` (baseline capture), `docs/selona-editor/baseline/` (text + screenshots of 506e2ae).

**Dependencies added:** `@vercel/blob` (content store), `@modelcontextprotocol/sdk` + `zod` (connector), `@playwright/test` (dev, test runner). Next.js not upgraded.

## Things I wasn't sure about, or noticed

- **Copy issue spotted, not changed:** the Privacy page says the contact form "opens a prefilled email … rather than submitting to a hidden form backend", but the form actually sends through FormSubmit.co. Mr Rahul may want to fix that wording in the editor.
- The hero headline and other word-by-word animated headings show as plain text while being edited (their animation is turned off inside the editor only).
- "Add another" on a list copies the neighbouring item, including its small decorative card style (colour), which can't be edited.
- The night lost about 10 hours to worker restarts (no work between ~23:30 and 09:15 IST). Every task was still finished or marked BLOCKED.
- The old repo `pranamyajainn/selona-website` has the branch only up to T13 (an in-between state); ignore it. The new repo also has `add-ponytail-skills`, which isn't part of this work.
- After a worker restart, the last commits (T29 onwards) were first pushed to the old repo's feature branch by mistake (the remote had been reset); they are now in the new repo too, and the old repo's `main` is untouched.
- Vercel isn't connected to GitHub for this project, so merging won't deploy by itself (MORNING.md step 5).

## ASSUMPTIONS.md (in full)

- 09:46 IST mistake, corrected: after a worker restart the `origin` remote of the working copy pointed back at `pranamyajainn/selona-website`, so commits 785358e…e7d435c (T29 to the final docs) were pushed to the **old** repo's feature branch before being pushed to `Sahajta-AI/selona-ai-website`. The old repo's `main` is untouched (506e2ae); its `feature/editor-and-connector` simply has the same commits. I misread that repo's `main` as the new repo's at 09:37; the new repo still has no `main`.

One line each. Decided without anyone to ask; revisit in the morning if any is wrong.

- BRIEF.md is the owner's message from "Hi." onward, word for word; the one-line preface before it ("Go through this first.") is left out.
- The feature branch starts from `main` at 506e2ae, not from `add-ponytail-skills`, so the PR holds only the editor work.
- The earlier `add-ponytail-skills` branch is left as it is; it is unrelated to this build and not part of the PR.
- Routes in scope (from the repo at 506e2ae): /, /pricing, /contact, /security, /privacy, /apply-now, and the 404 page.
- Tasks are numbered T01… and blocked owner-only items B1, B2; commit messages use these ids.
- The Vercel project is not connected to GitHub (all deployments came from the CLI; pushing a branch creates none), so preview deployments will be made explicitly with target "preview", never production.
- selona.ai, *.vercel.app, api.vercel.com and Blob storage are blocked by this machine's network policy (proxy 403), so the baseline was captured from a local production build of main at 506e2ae; /pricing HTML fetched from the production deployment via the Vercel tool matched it (title, meta, all copy).
- Baseline "visible text" = `document.body.innerText` after scrolling the page with reduced motion; plus `<title>` and meta description per route (1440px), screenshots full-page at 1440 and 390 wide.
- Preview testing plan: since this machine can't reach *.vercel.app, end-to-end tests run inside a Vercel Sandbox (cloned from the public repo) against the branch preview; if that fails, against a local production build, stated in REPORT.md.
- The repo's pinned Playwright (1.61) expects a different Chromium build than the one preinstalled here; scripts accept `PW_CHROME` to point at it. No new dependency.
- Next.js 16 APIs chosen (from node_modules/next/dist/docs): pages stay statically prerendered; content is read on the server through `unstable_cache` tagged `content` (Cache Components stay off, as in the repo); Publish calls `revalidateTag('content', { expire: 0 })` plus `revalidatePath('/', 'layout')` from a route handler, so no redeploy is needed.
- The editor shows the real pages through Next.js Draft Mode (`draftMode()`): a signed-in editor gets the bypass cookie, pages then render on each request with the shared draft; draft content is only served when the editor session cookie is also valid.
- Click-to-edit without changing the site's markup: in Draft Mode only, each content string carries invisible marker characters that name its content key; a small client script in the page reads them, strips them and makes that text editable. The public site never contains markers.
- Auth is checked inside every editor page and route handler on the server (no proxy/middleware), so nothing depends on hiding things in the browser.
- One shared draft per environment (not per person): the Claude connector and the editor work on the same draft, and the conflict warning covers two people publishing.
- Blob store is public-access (site images and the video must be served to visitors straight from the Blob CDN); content JSON files are written with random suffixes so their URLs can't be guessed, and listing needs the server token. The text is public website copy; documented as a security choice.
- Upload limit 4 MB per file (below Vercel's 4.5 MB request limit, so uploads go through a protected route handler); images are compressed in the browser to WebP (max 2400 px wide) before upload; the video slot accepts MP4/WebM only.
- The "showcase video" in the brief: since commit a24545a the showcase section shows an image (`/media/thinkaiwork-context-accelerator.jpeg`); the only videos on the live site are the hero background loops (desktop and mobile). All three are replaceable.
- The contact form's delivery address (FormSubmit recipient) stays in code, not editable content: letting the editor change it would let anyone signed in redirect enquiries.
- Lists that the code paired with a parallel array by index (use cases ↔ artifact cards, workflow steps ↔ images) are merged into one list of items, so adding, removing or reordering keeps them together. Same rendered text.
- Text built from several values in code (apply-now role cards, privacy paragraphs with the email) is stored as the full sentence, so Mr Rahul edits one sentence; rendered text is identical.
- New dependencies: `@vercel/blob` (the content store the brief asks for) and `@playwright/test` as a dev dependency, same version as the repo's `playwright` (the test runner for the end-to-end and unit tests).
- Screenshots (baseline and tests) hide the hero background video, which pauses on a different frame on every load; the home baseline screenshots were recaptured from 506e2ae that way. Text baseline unchanged.
- Ten home components that no page renders (Mission, Ticker, PromotedStat, Journey, About, PlatformLead, Testimonials, Credentials, Services, PlatformWalkthrough), the unused Traction block, `lib/content.ts` and `lib/testimonials.ts` were deleted: their text would otherwise sit outside the editor as a second, invisible copy. Nothing on the site changes (parity test green); they remain in git history.
- Blob store `selona-content` (store_d9mEmA3Txp0OP3oz, public, iad1) was created without "connecting" it to the project, because connecting adds a read-write token to every environment, Production included. Instead the site signs in to Blob with Vercel's short-lived OIDC identity plus `BLOB_STORE_ID`, set for Preview only. No long-lived Blob secret exists in any environment variable.
- Content files live under `selona-content/<environment>/` (preview, production, development), and the cached copy of live content is keyed by environment too, so preview testing can never touch production content.
- Checked by hand on a local production build: with an unreachable store every page renders the default content (HTTP 200, same text); with a stored version present, the pages show it.
- BLOCKED (owner action): the Preview deployment can't use the Blob store yet. Connecting a store to the project adds its token to all three environments (Production included), which tonight's rules forbid; the store can't be connected for Preview alone with the tools available, and reading a token out of Vercel was refused by this session's permission guard. Preview therefore runs with the default content (read-only fallback, verified), and the editor flows that save content are tested on a local production build. MORNING.md has the two-click fix (connect store `selona-content` to project `selona`).
- Left behind from that attempt, to delete in the morning: project `selona-editor-store` and its store `selona-editor-content` (empty, unused), and an empty Preview variable `BLOB_READ_WRITE_TOKEN` on `selona` (comment says delete; the code ignores an empty value).
- Screenshot comparisons on another machine (the Vercel Sandbox) use a baseline of 506e2ae taken on that same machine (`BASELINE_DIR`), because font rendering differs between machines; text is always compared with the committed baseline.
- 22:58 IST: Pranamya asked for all pushes to go to `Sahajta-AI/selona-ai-website` instead of `pranamyajainn/selona-website`. The new repo was empty. The feature branch was pushed there with its full history (it starts from 506e2ae). Creating that repo's `main` was refused as a push to main, so MORNING.md asks Pranamya to create `main` from commit 506e2ae (one command) before the pull request can be opened. The old repo keeps the branch as it was at T13; nothing more goes there.
- Security choices for sign-in: sessions are HMAC-signed cookies (HttpOnly, Secure, SameSite=Lax) that last 8 hours, and the allowlist is re-checked on every request, so removing an email takes effect at once. Access keys are 256-bit random strings, stored only as SHA-256 hashes (a slow hash adds nothing for keys this long). Failed attempts are recorded in the content store: 5 failures in 15 minutes lock an email and 20 lock a network address; if the store can't be reached, sign-in is refused (fails closed). Google sign-in checks the `state` value, asks only for `openid email`, and accepts only verified emails on the allowlist. Every redirect after sign-in is limited to `/editor` paths, so there are no open redirects.
- Site pages moved into the route group `app/(site)/` with their own layout (nav and footer), so the editor screens don't show the site's nav. URLs and output are unchanged (parity test green). The 404 page wraps itself in the same nav and footer. (The T13 commit carried the page move by accident before the layout arrived in T14; T14 is the first good state.)
- Preview access keys are in `.env.editor-keys.local` at the root of the working copy (gitignored). Local test keys and a separate local session secret are in `.env.production.local` and `.env.e2e.local` (gitignored, local build only).
- Editor design: the real page is shown in a frame in Draft Mode; text is edited in place (click, type, Enter or click away). Words that aren't clickable on the page (page titles and descriptions, menu-button names, form messages) are edited in the side panel under "Words you can't click on". Lists are changed from the side panel after clicking any item ("Move up", "Move down", "Add another", "Remove"); "Add another" copies the item next to it, ready to be retyped.
- Undo/Redo cover every change in the editor session, including list changes and picture swaps; typing in one field is one undo step per pause of 1.5 seconds.
- Publish publishes the shared, already-saved draft. "Live now ✓" appears only after a visitor's copy of the page (fetched without editor cookies) carries the new version stamp (`<meta name="content-version">`), so it is never shown early. Pages refresh via `revalidateTag` + `revalidatePath`; no redeploy.
- Conflicts: saving a draft that someone else changed since you loaded it, or publishing when someone else published since you opened the editor, shows a warning with "Publish anyway", "See their version first" and "Cancel"; nothing is overwritten silently.
- "Saved versions" (the archive) saves the live website, not the draft. "Bring back this version" is the one-step restore (it publishes, after a confirmation); "Open as draft" is there too for a softer route. History's "Restore as draft" brings a published version back as a draft to preview, then Publish.
- Stored content is checked against the shape of the default content before use (wrong types, unknown keys and over-long text are dropped; picture/video addresses must be site files or this Blob store), so a bad save can't break a page.
- Uploads: pictures are made smaller in the browser (WebP, max 2400 px wide), then checked on the server by their first bytes (JPG/PNG/WebP/GIF only, 4 MB max); the video slots take MP4/WebM up to 4 MB.
- Claude connector access: a private address per person (`/api/mcp/<token>`), not OAuth. OAuth tied to the editor sign-in couldn't be tested end to end tonight (adding a connector in claude.ai needs Pranamya, B2), so the brief's fallback was used. Tokens are 256-bit, only their SHA-256 hashes are stored (`EDITOR_CONNECTOR_TOKENS`, Sensitive, Preview only), the email must also be on the allowlist, and removing an entry switches that address off. The connector has no publish tool: every changing tool only saves the shared draft and returns a review link (`/editor?review=1&path=…`) that opens the Changes panel with old vs new, Undo per change, and Publish.
- New dependencies: `@modelcontextprotocol/sdk` (the MCP server and the test client) and `zod` (the SDK's required companion for tool input schemas; it was already installed indirectly, now listed explicitly).
- 09:18 IST: repeated worker restarts lost most of the night (no work happened between about 23:30 and 09:15 IST), so the remaining time went to the connector, the tests and the morning documents.
