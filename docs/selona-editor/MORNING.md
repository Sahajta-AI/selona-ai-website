# Morning steps for Pranamya

Do these in order. Nothing below has been done to production yet: production is still `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt` (main at 506e2ae) and no Production environment variable was touched.

**Repo:** all work is on branch `feature/editor-and-connector` in **Sahajta-AI/selona-ai-website** (as you asked last night). The old repo `pranamyajainn/selona-website` has a copy only up to T13; ignore it.

## 1. Review the pull request (15 min)

`main` in the new repo is exactly 506e2ae, the commit production was built from (checked at 09:37 IST). The pull request from `feature/editor-and-connector` into `main` is open; its link is at the top of the night's final message. Start with `docs/selona-editor/REPORT.md` and `STATUS.md`. Don't merge until steps 2–4 are done.

## 2. Connect the content store (2 min, needed for Preview and Production)

Vercel → team **Sahajta AI** → **Storage** → **selona-content** → **Connect Project** → project **selona** → tick **Preview** and **Production** (Development optional) → **Connect**.

This adds `BLOB_READ_WRITE_TOKEN`. I couldn't do it for Preview alone. Then, in **selona → Settings → Environment Variables**, delete:
- the empty Preview `BLOB_READ_WRITE_TOKEN` whose comment says "EMPTY PLACEHOLDER" (keep the one the connection just made);
- optional tidy-up: the project **selona-editor-store** and its store **selona-editor-content** (empty leftovers from a failed attempt).

## 3. Create the Google sign-in client (10 min)

Google Cloud Console → APIs & Services → **OAuth consent screen**: External, app name "Selona website editor", scopes `openid`, `email`. Then **Credentials → Create credentials → OAuth client ID → Web application**:

- **Authorised JavaScript origins:** `https://selona.ai`, `https://www.selona.ai`, `https://selona-git-feature-editor-and-connector-sahajta-projects.vercel.app`
- **Authorised redirect URIs:**
  - `https://selona.ai/api/editor/google/callback`
  - `https://www.selona.ai/api/editor/google/callback`
  - `https://selona-git-feature-editor-and-connector-sahajta-projects.vercel.app/api/editor/google/callback`

Copy the client ID and secret into step 4.

## 4. Set Production environment variables (names only; mark every secret Sensitive)

In **selona → Settings → Environment Variables**, target **Production**:

| Name | Value | Sensitive |
|---|---|---|
| `EDITOR_ALLOWED_EMAILS` | `rahul@selona.ai,pranamya@sahajta.com,pranamyajeet@gmail.com` | no |
| `EDITOR_SESSION_SECRET` | a new random value, at least 32 characters (`openssl rand -base64 48`) | **yes** |
| `GOOGLE_CLIENT_ID` | from step 3 | no |
| `GOOGLE_CLIENT_SECRET` | from step 3 | **yes** |
| `EDITOR_CONNECTOR_TOKENS` | `email:sha256(token)` pairs, see below | **yes** |
| `BLOB_READ_WRITE_TOKEN` | added by step 2 | yes (automatic) |
| `EDITOR_ACCESS_KEYS_ENABLED` | leave **unset** (backup sign-in stays off in production) | – |
| `EDITOR_ACCESS_KEY_HASHES` | only if you switch the backup on | **yes** |

Connector tokens for production: make one per person and put only the hash in Vercel:

```bash
T=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '='); echo "token: $T"; echo -n "$T" | shasum -a 256
```

Value format: `rahul@selona.ai:<hash>,pranamya@sahajta.com:<hash>`. Each person's connector URL is `https://selona.ai/api/mcp/<their token>`.

**Preview keys and connector URLs** made last night are in `.env.editor-keys.local` in the night session's working copy (gitignored, never committed). They work only on the Preview.

## 5. Merge and check selona.ai

1. Merge the PR. Vercel isn't connected to GitHub for this project, so deploy production yourself the way you did in July (from `main`, e.g. `vercel --prod` in the repo), or connect the repo to the project in Vercel first.
2. Open https://selona.ai: it must read exactly as before (production's store starts empty, so the site shows the repo default, which is today's site).
3. Open https://selona.ai/editor → Sign in with Google → check that it opens. The first visit creates the saved version "Original site, before the editor (25 Nov 2026)".

## 6. Add the connector in claude.ai (Mr Rahul and you, each on your own account)

claude.ai → **Settings → Connectors → Add custom connector** → Name: `Selona website` → URL: `https://selona.ai/api/mcp/<your token>` → **Add**. In a chat, turn on the connector from the tools menu and try "Show me the pages of the Selona website".

## Roll back in one step

- **Wrong words on the site:** /editor → **Saved versions** → "Original site, before the editor (25 Nov 2026)" → **Bring back this version**.
- **The new code itself misbehaves:** Vercel → selona → Deployments → `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt` → **Instant Rollback** (Promote). That is the July production build.
