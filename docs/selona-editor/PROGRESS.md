# Progress

One line per finished or blocked task: `<IST time> <task-id> <done|BLOCKED>: <one line>`.

2026-11-25 22:03 IST T01 done: branch feature/editor-and-connector from main 506e2ae; brief and working files committed.
2026-11-25 22:03 IST T03 done: ASSUMPTIONS.md seeded.
2026-11-25 22:08 IST T02 done: baseline text + 1440/390 screenshots for 7 routes from local build of 506e2ae (live blocked from here; prod /pricing HTML matched).
2026-11-25 22:10 IST T04 done: read caching, revalidation, draft mode and route handler docs; choices in ASSUMPTIONS.md.
2026-11-25 22:12 IST T05 done: content/defaults.json holds 400 texts, 13 images, 2 videos; inventory in CONTENT-INVENTORY.md.
2026-11-25 22:14 IST T06 done: lib/content (paths, store, versions, getContent) + unit tests green; build green.
2026-11-25 22:24 IST T07 done: layout metadata, nav, footer, logo, 404 read from content; parity test (text + 1440/390 screenshots) 21/21 green locally.
2026-11-25 22:30 IST T08 done: every home section reads from content (committed with T09: Faq is shared, so the build needed both).
2026-11-25 22:30 IST T09 done: pricing, contact (+form labels/messages), security, privacy, apply-now, titles/meta read from content; dead components removed; parity 21/21 green.
2026-11-25 22:31 IST T10 done: all 13 images + 2 hero videos come from content keys ending in Src; next/image allows Blob URLs; screenshots 14/14 match.
2026-11-25 22:31 IST T11 done: parity spec (from T07) takes BASE_URL; 21/21 green on local production build.
2026-11-25 22:51 IST T12 done: Blob store created; BLOB_STORE_ID set for Preview only (OIDC, no secret); fallback to defaults verified with unreachable store; stored version shown.
2026-11-25 23:09 IST T13 done: preview dpl_4N9eZRMLc3eHLBnSY6yfAtNduYEJ READY (branch alias selona-git-feature-editor-and-connector-sahajta-projects.vercel.app); from a Vercel Sandbox: text parity 7/7, 1440 screenshots 7/7; 390 differs by font rendering, re-checked against a same-machine baseline. Blob on preview BLOCKED (owner must connect store).
2026-11-25 23:12 IST T14 done: signed 8h sessions, EDITOR_ALLOWED_EMAILS, /editor + API guarded on the server, noindex headers, 'You don't have access' page; auth tests 8/8 + parity 21/21 locally. Pushes now go to Sahajta-AI/selona-ai-website.
2026-11-25 23:12 IST T15 done: keys generated into gitignored .env.editor-keys.local; hashes Sensitive on Preview; EDITOR_ACCESS_KEYS_ENABLED=true on Preview only (off by default); 5/15min lock tested.
2026-11-25 23:13 IST T16 done: Google OAuth (state cookie, openid email, verified + allowlisted) built; tested up to Google and refusal of forged replies; live sign-in BLOCKED B1.
2026-11-25 23:27 IST T17 done: editor at /editor shows the real page (Draft Mode) with click-to-edit text via invisible markers; proof 3 green locally.
2026-11-25 23:27 IST T18 done: shared draft saved on the server; Preview shows the full page; live site unchanged until Publish (proof 3).
2026-11-25 23:27 IST T19 done: Ctrl/Cmd+Z, Ctrl+Shift+Z/Ctrl+Y, Undo and Redo buttons (proof 4).
2026-11-25 23:27 IST T20 done: lists: move up/down, add another, remove (proof 6).
2026-11-25 23:27 IST T21 done: picture/video replacement with browser compression and server type/size checks (proof 5).
2026-11-25 23:27 IST T22 done: Publish refreshes pages without redeploy; "Live now ✓" only after the public page shows the new version.
2026-11-25 23:27 IST T23 done: conflict warnings for drafts and publishing (proof 10).
2026-11-25 23:27 IST T24 done: plain-words labels everywhere (key names translated); works at 390px (no sideways scroll; panel collapsible).
2026-11-25 23:27 IST T25 done: History with date/time/who; Restore as draft; restores are new versions; nothing deleted (proof 7).
(T17–T26 share one editor component and one in-page script, so they were built and committed together in one commit, "T17-T26".)
2026-11-25 23:27 IST T26 done: Saved versions: name + save the live site, bring back in one step, original archive seeded automatically (proof 8). Full suite 42/42 + editor 7/7 green on local production build.
2026-11-26 09:19 IST T27 done: MCP server at /api/mcp/<token> (Streamable HTTP, stateless) with 7 plain-described tools; none can publish.
2026-11-26 09:19 IST T28 done: private per-person connector address, hashed in EDITOR_CONNECTOR_TOKENS (Preview, Sensitive), revocable.
2026-11-26 09:19 IST T29 done: changing tools return /editor?review=1 links showing old vs new with Undo and Publish; proof 9 green locally with the MCP SDK client.
2026-11-26 09:25 IST T30 done: full suite 43/43 green on a local production build (proofs 1–10; Blob on Preview BLOCKED, see ASSUMPTIONS). Output in test-output/.
2026-11-26 09:25 IST T31 done: npm run build exit 0; eslint 0 errors (3 warnings: plain <img> thumbnails in the editor panel).
2026-11-26 09:35 IST T32 done: STATUS.md written (BUILT/PARTIAL/MISSING per brief bullet).
2026-11-26 09:35 IST T33 done: gaps G1, G2 BLOCKED (owner), G3 noted.
2026-11-26 09:35 IST T35 done: MORNING.md.
2026-11-26 09:35 IST T36 done: RAHUL-GUIDE.md.
2026-11-26 09:35 IST T37 done: TUTORIAL.md.
2026-11-26 09:35 IST T38 BLOCKED: no main branch in the new repo to open a PR against.
2026-11-26 09:36 IST T34 done: Preview shows the default (= original) content; old-repo main and new-repo main both 506e2ae; production still dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt; no Production variables touched.
2026-11-26 09:36 IST T38: main now exists in the new repo (506e2ae, created overnight by someone else), so the PR can be opened.
2026-11-26 09:36 IST T39 done: REPORT.md.
2026-11-26 09:37 IST T38 BLOCKED: correction: the new repo has no main (the main seen at 09:37 was the old repo's, because a restart had reset the remote). Remote fixed; branch pushed to Sahajta-AI/selona-ai-website.
2026-11-26 10:08 IST Time limit (10:00 IST) reached: building stopped. REPORT.md and MORNING.md describe what works and what is BLOCKED. Last Preview: dpl_HbzMdVq57Yw2DfymrLzYL7jgEt8S (READY, commit fbce91a).
2026-11-26 11:05 IST Bug found by the first test run on the real Vercel Blob store: saved versions couldn't be found by id because Blob adds a random suffix to file names. Fixed the lookup; the local disk store now adds the same suffix so local tests match Vercel. Local: 16/16 store tests green.
2026-11-26 15:09 IST Second bug from the test site: Blob listing lag could make a rebuilt page show the previous version after Publish/Bring back (proof 8 failed there). Added current-version pointers read without cache; local suite 43/43.
