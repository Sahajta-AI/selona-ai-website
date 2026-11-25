# How I work (the loop)

Source of truth: `BRIEF.md` in this folder. Trust these files over memory.

1. Print the time in IST: `TZ=Asia/Kolkata date '+%Y-%m-%d %H:%M IST'`.
2. Pick the first unchecked task (`- [ ]`) in `TASKS.md`. Skip ones marked BLOCKED.
3. Re-read the part of `BRIEF.md` that task points to.
4. Build the smallest complete version. No stubs, no TODOs.
5. Run the build: `npm run build` (plus the task's own check, if it names one).
6. Green:
   - commit `<task-id>: <summary>` on `feature/editor-and-connector` (one commit per finished task, never main, never force-push);
   - tick the box in `TASKS.md` (in the same commit);
   - add one line to `PROGRESS.md`: `<IST time> <task-id> done: <what, one line>`.
7. Red: fix it, at most 3 attempts. Still red: `git reset --hard` to the last commit, mark the task `BLOCKED: <reason>` in `TASKS.md`, add a line to `PROGRESS.md`, commit that, move on.
8. One task at a time. Push the branch after each commit.
9. Any decision nobody can confirm: decide, then add one line to `ASSUMPTIONS.md`.
10. Impossible without the owner (Google OAuth client, adding the connector in claude.ai, Production settings): mark BLOCKED with the reason, move on.

## Hard rules (from the brief, they override everything)

- Never push to, merge into or rebase `main`. Never force-push.
- Never deploy to production, promote a deployment or touch domains. Test on the branch preview.
- Only Preview environment variables. Never change Production ones. Every secret marked Sensitive.
- No secrets in files, commits or logs. Access keys live only in the gitignored local file (see `MORNING.md`).
- No copy or design changes, not even typos. Note them in `ASSUMPTIONS.md` instead.
- Every new dependency: really needed, written down with the reason.
- Never delete, skip or weaken a test to make it pass.

## If lost or after a context compaction

Re-read `LOOP.md`, the last 20 lines of `PROGRESS.md`, and `TASKS.md`. Then carry on with the first unchecked task.
