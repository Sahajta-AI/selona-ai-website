# Assumptions and decisions

One line each. Decided without anyone to ask; revisit in the morning if any is wrong.

- BRIEF.md is the owner's message from "Hi." onward, word for word; the one-line preface before it ("Go through this first.") is left out.
- The feature branch starts from `main` at 506e2ae, not from `add-ponytail-skills`, so the PR holds only the editor work.
- The earlier `add-ponytail-skills` branch is left as it is; it is unrelated to this build and not part of the PR.
- Routes in scope (from the repo at 506e2ae): /, /pricing, /contact, /security, /privacy, /apply-now, and the 404 page.
- Tasks are numbered T01… and blocked owner-only items B1, B2; commit messages use these ids.
- The Vercel project is not connected to GitHub (all deployments came from the CLI; pushing a branch creates none), so preview deployments will be made explicitly with target "preview", never production.
