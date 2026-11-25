# Tasks

In order. Each points to its part of `BRIEF.md` ("§" = section heading) and says when it is done. Work them with `LOOP.md`.

## Setup and baseline

- [x] T01 Branch and baseline commit. §Rules, §Working files. Done when `feature/editor-and-connector` exists from `main` at 506e2ae with BRIEF, LOOP, TASKS, ASSUMPTIONS, PROGRESS, and is pushed.
- [x] T02 Baseline capture. §Content out of the code (baseline bullet). Done when `docs/selona-editor/baseline/` has, for every route (home, /pricing, /contact, /security, /privacy, /apply-now, 404), the visible text and full-page screenshots at 1440px and 390px from live selona.ai (or a local build of 506e2ae if unreachable, noted in ASSUMPTIONS), plus the script that captured them.
- [x] T03 ASSUMPTIONS.md seeded. §Rules (decisions). Done when ASSUMPTIONS.md exists with the decisions made so far.
- [x] T04 Read this Next.js version's docs (`node_modules/next/dist/docs/`, per AGENTS.md) for data caching and revalidation, route handlers, proxy/middleware, metadata and server actions. Done when the relevant API choices are written as lines in ASSUMPTIONS.md.

## Content out of the code

- [x] T05 Content inventory. §Content out of the code. Done when every text string, image and the video on every route and shared component (nav, footer, buttons, FAQs, form labels, titles, meta descriptions) is listed with its future content key.
- [x] T06 Content model and repo defaults. §Content out of the code (defaults bullet). Done when a typed content schema and a defaults JSON in the repo hold the full inventory, and a server-side `getContent()` returns the defaults.
- [x] T07 Shared parts read from content: layout metadata, nav, footer, buttons, 404. Done when they render from `getContent()` and the text parity check passes for them.
- [x] T08 Home page sections read from content. Done when every home component renders from content and home text parity is zero differences.
- [x] T09 Other pages read from content (/pricing, /contact incl. form labels and messages, /security, /privacy, /apply-now, page titles and meta). Done when parity is zero differences on every route.
- [x] T10 Images and the showcase video come from content. Done when every image/video URL comes from content with repo files as defaults, and screenshots match the baseline.
- [x] T11 Parity test (text diff + screenshot compare, both widths) as a Playwright test that takes a base URL. Done when it is green against a local production build.
- [ ] T12 Content store. §Content out of the code (Blob, environments, fallback). Create a Vercel Blob store, connect it to the project for Preview only, prefix content per environment, read on the server, fall back to defaults when empty or unreachable, refresh pages on publish. Done when the site renders with an empty store, with an unreachable store (test), and with a stored version.
- [ ] T13 First preview deploy. §Rules (preview). Done when the branch preview builds READY and the parity test is green against it (or against a local production build, noted, if the preview can't be reached).

## Sign-in

- [ ] T14 Sessions, allowlist and server-side guards. §Sign-in. Done when `EDITOR_ALLOWED_EMAILS` drives access, sessions are short-lived signed cookies, every /editor page and editor/API route refuses without a session on the server, /editor is noindex and unlinked, and others get a plain "You don't have access" page.
- [ ] T15 Access-key sign-in. §Sign-in (backup). Done when keys are generated per allowed email into a gitignored local file, only hashes go into a Preview env var (Sensitive), attempts are limited, and an env switch turns it on (off in production by default).
- [ ] T16 Google sign-in. §Sign-in (main). Done when the Google flow is built, switches on only when its env vars exist, and is covered by a test of everything that can run without the real client. (Live test is BLOCKED B1.)

## The editor

- [ ] T17 Editor shell: /editor shows the real page for any route with click-to-edit text that changes in place. §The editor. Done when clicking any text on any page lets you type and see it change.
- [ ] T18 Drafts and full-page preview. §The editor (preview, nothing goes live). Done when edits are saved as a server-side draft and "Preview" shows the full page with changes while the live site is unchanged.
- [ ] T19 Undo and Redo. §The editor. Done when Ctrl+Z / Cmd+Z, Ctrl+Shift+Z / Cmd+Shift+Z and the Undo/Redo buttons work.
- [ ] T20 Lists: add, remove, reorder items (use cases, problems, features, FAQs, outputs). Done when each list on the site supports all three in the editor.
- [ ] T21 Image and video replacement by upload. §The editor (images). Done when only images (and the video slot only video) are accepted, there is a size limit, images are compressed, and the new file shows.
- [ ] T22 Publish and "Live now". §The editor. Done when Publish writes a new version, refreshes pages without a redeploy, and shows "Live now" only after the public page is confirmed to show the change.
- [ ] T23 Conflict warning. §The editor. Done when publishing over a newer version published by someone else since the editor was opened warns before overwriting.
- [ ] T24 Plain words and phone pass. §The editor (last bullet). Done when every visible label/message is jargon-free and the editor works at 390px without breaking.

## History and archive

- [ ] T25 History and restore. §History and archive. Done when every published version shows date, time and who, and restoring any version loads it as a draft to preview and publish; restore makes a new version; nothing is deleted.
- [ ] T26 Archive. §History and archive. Done when the whole site can be saved as a named version and brought back in one step, and the archive "Original site, before the editor (25 Nov 2026)" is seeded from today's content.

## The Claude connector (MCP)

- [ ] T27 MCP server at /api/mcp (Streamable HTTP). §The Claude connector. Done when the tools exist with plain descriptions: list pages and sections; read a page's text; find a phrase; propose text changes; propose list add/remove/reorder; show history; prepare a restore. None can publish.
- [ ] T28 Connector access. §The Claude connector (who can use it). Done when only the allowed people can use it, by OAuth tied to the editor sign-in if fully testable tonight, otherwise private per-person URLs revocable by env var; the choice is written in ASSUMPTIONS.md.
- [ ] T29 Review link. §The Claude connector. Done when every changing tool returns a link that opens the editor showing old vs new for each change, with Undo per change and Publish.

## Proof (end-to-end tests on the preview)

- [ ] T30 E2E tests 1–10 from §How you prove it works, run against the branch preview. Done when all pass (or each failure is fixed or marked BLOCKED with the reason; no test weakened).
- [ ] T31 `npm run build` and lint pass with no errors (proof 11).

## Self-audit

- [ ] T32 Self-audit: read BRIEF.md section by section against the real code, write STATUS.md (BUILT / PARTIAL / MISSING per bullet), and add a task below for every gap. Done when STATUS.md exists and every gap has a task.
- [ ] T33 Close the gaps found in T32 (tasks added under this line).

## Wrap-up

- [ ] T34 Reset and check. Proof 12. Done when preview content is back to the "Original site" archive, the parity test is green on the preview, `main` is still at 506e2ae and production is still dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt with no Production env var changes.
- [ ] T35 MORNING.md. §What I need in the morning. Done when it has the exact ordered steps: review PR, create Google OAuth client with exact redirect URIs, Production env var names, merge, check selona.ai, add the connector in claude.ai (URL and clicks), one-step rollback.
- [ ] T36 RAHUL-GUIDE.md. Done when it is one page, plain words, to "you", covering open, sign in, click and type, preview, publish, history, restore, archive, and Claude.
- [ ] T37 TUTORIAL.md. Done when it is a 3-minute walkthrough script for the 3 PM IST call.
- [ ] T38 Pull request from `feature/editor-and-connector` into `main`, not merged. Done when the PR exists.
- [ ] T39 REPORT.md. Done when it covers what was built file by file, every test and result, ASSUMPTIONS.md in full, everything BLOCKED and why, and open doubts.

## BLOCKED (needs the owner)

- B1 BLOCKED: Google OAuth client. Only the owner can create it in Google Cloud; sign-in is built to switch on once its env vars exist (see T16, MORNING.md).
- B2 BLOCKED: Adding the connector in claude.ai. Only Mr Rahul / the owner can add a custom connector to their own Claude account (steps in MORNING.md).
