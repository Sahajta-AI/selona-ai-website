# Assumptions and decisions

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
