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
