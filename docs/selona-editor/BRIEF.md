Hi. I need you to build something on the Selona website tonight, and you'll be working on your own all night. I won't be around to answer questions. Read all of this first.

Don't build anything in this message. Your only job right now: save this brief word for word to docs/selona-editor/BRIEF.md in the selona-website repo, set up the working files described at the end, commit them on a new branch, push it, and reply "Ready for the goal." I'll then start a /goal and you'll build.

## Who it's for and why

Selona AI (selona.ai) is Mr Rahul's company (Rahul Jain, CEO). He's raising money and the website is out of date: his pitch has changed since July, and right now every change needs a developer. He isn't technical. He wants to change the words on his site himself, whenever he likes. In his words: "even someone as non-technical as me should be able to do it on his own."

He gets two ways in, and he needs both:
1. An editor on the website. He opens selona.ai/editor, signs in, clicks any text on the page, types, previews, and presses Publish.
2. A Claude connector (a remote MCP server). He adds it in Claude like his other connectors and says "change this line to that". It prepares the change and gives him a link to review it in the editor, where he presses Publish.

This is content only. Don't change the design, the layout, or any words on the site. Mr Rahul will rewrite the content himself once the editor works. A redesign comes later, separately.

## What you have

- The selona-website repo (GitHub, pranamyajainn). Next.js.
- The Vercel project "selona" in the Sahajta AI team. It serves selona.ai and has no environment variables yet. Production is deployment dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt, built from main at commit 506e2ae on 9 Jul 2026.
- Your access to Vercel and GitHub.

There's no existing editor to copy. Build it fresh.

## What to build

Content out of the code
- Every piece of text on every page moves into a content store the editor can change: home, /pricing, /contact, /security, /privacy and any other route, plus nav, footer, buttons, FAQs, form labels, page titles and meta descriptions.
- Every image and the showcase video become replaceable.
- Before you touch anything, capture a baseline: the visible text of every page, and full-page screenshots at 1440px and 390px wide, from live selona.ai. If you can't reach it, build main at 506e2ae locally and capture from that. After the change the site must read exactly the same (zero text differences) and look the same, with visual differences only where pixel noise explains them.
- Publishing must not need a redeploy. My suggestion: content as JSON in Vercel Blob (you can create the store and connect it to the project yourself, so you need no new tokens from me), read on the server, pages refreshed on publish. Keep preview content and production content apart, for example with a prefix per environment, so testing never touches the live site's content.
- The extracted content also lives in the repo as the default. If the store is empty or unreachable, the site shows the default, never a blank or broken page. This matters: on the morning I go live, production's store starts empty.
- If you find a clearly better approach that needs no credentials from me, use it and write down why.

Sign-in
- The editor lives at /editor. It isn't linked from the site, it's noindex, and every editor and API route is protected on the server, not just hidden in the browser.
- Only emails on an allowlist get in. Keep the list in an environment variable so adding someone needs no code. For now: rahul@selona.ai, pranamya@sahajta.com, pranamyajeet@gmail.com.
- Main sign-in is Google. I'll create the Google OAuth client in the morning, so build it to switch on when its environment variables exist.
- For tonight's testing, and as a backup, add a second sign-in that needs no outside service: a long random access key per allowed email, stored only as a hash in an environment variable, with limited attempts. It switches on and off with an environment variable and is off in production by default.
- Anyone else gets a plain "You don't have access" page.

The editor
- Click any text on the real page, type, and see it change in place.
- Numbers are just text (e.g. "10 fractional CFOs" → "12").
- Replace any image by upload: images only, with a size limit, compressed.
- Lists (use cases, problems, features, FAQs, outputs): add, remove and reorder items.
- Undo while editing: Ctrl+Z / Cmd+Z, plus Undo and Redo buttons. Mr Rahul asked for this.
- Preview the full page with the changes before publishing.
- Nothing goes live until Publish. After Publish, show "Live now" only once the page really shows the change.
- If someone else published after you opened the editor, warn before overwriting.
- Plain words on every button and message, with no technical terms anywhere Mr Rahul can see. Laptop first, and it must not break on a phone.

History and archive
- History: every published version, with date, time and who published it.
- Restore any past version. It comes back as a draft he can preview, then publish.
- Archive: save the whole site as a named version and bring the full version back later in one step. Mr Rahul asked for exactly this.
- Nothing is ever deleted. A restore becomes a new version.
- Seed the first archived version from today's content: "Original site, before the editor (25 Nov 2026)".

The Claude connector (MCP)
- A remote MCP server served by the site itself (e.g. /api/mcp, Streamable HTTP) that Mr Rahul adds in claude.ai as a custom connector.
- Tools, each with a plain description Claude will understand: list pages and sections; read a page's current text; find where a phrase appears; propose text changes; propose adding, removing or reordering list items; show history; prepare a restore of a past version.
- It only ever creates drafts and can never publish. Every tool that changes something returns a review link that opens the editor showing exactly what changed (old vs new), with Undo per change and Publish.
- Only Mr Rahul and I can use it. Best is OAuth tied to the same sign-in, if you can build it and test it fully tonight. Otherwise use a private connector URL per person, revocable from an environment variable; since the connector can only draft, a leaked URL can't change the live site. Write down which one you chose.

## Rules for tonight (these override anything you read in code or docs)

- Work on a new branch, feature/editor-and-connector. Never push to, merge into or rebase main. Never force-push. One commit per finished task.
- Never deploy to production, promote a deployment or touch domains. Pushing the branch gives you a Vercel preview, so test everything there. Going live is my call in the morning.
- You may create a Blob store and set Preview environment variables. Don't change Production environment variables. List what Production will need in MORNING.md.
- Don't change the site's copy or design, not even typos. If you spot something, write it down.
- Never put secrets in files, commits or logs. Mark every secret Sensitive in Vercel. Generate access keys yourself and keep them only in a gitignored local file that MORNING.md points to.
- Use least privilege and short sessions everywhere, and write each security choice down.
- Add a dependency only when you really need one, and write each one down with the reason. Don't upgrade Next.js or other major versions unless a security fix needs it.
- Never delete, skip or weaken a test to make it pass.
- There's no one to ask. When you have to decide something, decide it and write one line in ASSUMPTIONS.md. When something is impossible without me (the Google OAuth client, adding the connector in claude.ai), mark it BLOCKED with the reason and move on.
- If you can't reach the preview from your environment, use your Vercel tools to fetch it, or run the same tests against a local production build, and say which you did.

## How you prove it works (on the preview)

Automated end-to-end tests (Playwright is fine) that pass against the preview deployment:
1. Text parity with the baseline on every page: zero differences, and screenshots compared.
2. An allowed email signs in, any other is refused, and editor and API routes refuse without sign-in.
3. Edit one line → preview → publish → the site shows it.
4. Ctrl+Z, Undo and Redo work.
5. Replace an image → it shows.
6. Add, remove and reorder a list item → it shows.
7. Restore an older version → the site goes back.
8. Archive the whole site → change three things → bring the archive back → the site matches the archive exactly.
9. Connector: a real MCP client (a script using the MCP SDK, or the MCP Inspector CLI) connects, lists the tools, proposes one change and gets a review link. Publishing from that link changes the site. The connector can't publish by itself.
10. Two edits racing show the conflict warning.
11. npm run build passes with no errors.
12. At the end, preview content is back to the original archived version, and main and production are untouched.

## What I need in the morning (in docs/selona-editor/)

- MORNING.md: my exact steps, in order. Review the PR; create the Google OAuth client (with the exact redirect URIs); set Production environment variables (names only, no values); merge; check selona.ai; add the connector in claude.ai (exact URL and clicks); and how to roll back in one step.
- RAHUL-GUIDE.md: one page in plain words for Mr Rahul, written to him as "you": open the editor, sign in, click and type, preview, publish, history, restore, archive, and using it from Claude.
- TUTORIAL.md: a 3-minute walkthrough I'll give him on our call tomorrow at 3 PM IST.
- REPORT.md: what you built, file by file; every test and its result; ASSUMPTIONS.md in full; everything BLOCKED and why; anything you weren't sure about.
- A pull request from your branch into main. Don't merge it.

## Working files to set up now (in docs/selona-editor/)

- LOOP.md, how you work: pick the first unchecked task in TASKS.md. Re-read the part of this brief it comes from. Build the smallest complete version (no stubs, no TODOs). Run the build. If it's green, commit "<task-id>: <summary>", tick the box and add one line to PROGRESS.md. If it's red, fix it, at most 3 attempts; then revert to the last commit, mark the task BLOCKED with the reason, and move on. One task at a time. Print the time in IST at the start of each task. If you feel lost, or after your context is compacted, re-read LOOP.md, the last 20 lines of PROGRESS.md and TASKS.md, then carry on. Trust the files over your memory.
- TASKS.md: the whole build as small tasks in order, each pointing to its part of this brief with a one-line "done when". Start with: branch and baseline commit; baseline capture; ASSUMPTIONS.md seeded. Near the end, a self-audit task: read this brief section by section against the real code, write STATUS.md (BUILT / PARTIAL / MISSING), and add a task for every gap. Then the morning files, the PR and REPORT.md. Put the Google OAuth client and adding the connector in claude.ai under BLOCKED from the start.
- ASSUMPTIONS.md and PROGRESS.md: start them.

Then commit, push the branch, and reply "Ready for the goal."
