# Next steps for Pranamya

## Where things are (26 Nov)

- **Code:** `main` of **Sahajta-AI/selona-ai-website** holds the whole editor and Claude connector (your decision: no separate branch, no pull request). The July repo `pranamyajainn/selona-website` and the live **selona.ai** are untouched; production there is still `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt`.
- **Test site for Mr Rahul:** **https://selona-ai-website.vercel.app**, Vercel project `selona-ai-website`. It's connected to the repo (every push to `main` redeploys it) and has its own content store, `selona-ai-website-content`.
- **Sign-in on the test site:** personal access keys (Google isn't set up yet). The keys and the private Claude connector addresses for Mr Rahul and you are in `.env.editor-keys.local`, in the section "NEW TEST PROJECT", in this session's working copy. That file is gitignored and never committed, so copy them somewhere safe and send Mr Rahul only his own.

## 1. Share the test site with Mr Rahul

Send him:
- the link **https://selona-ai-website.vercel.app/editor**;
- his email `rahul@selona.ai` and **his** access key (privately, e.g. in a password manager share);
- `RAHUL-GUIDE.md`.

Anything he publishes there only changes the test site. selona.ai doesn't move.

## 2. (Optional, before or after he tests) Google sign-in

Google Cloud Console → APIs & Services → OAuth consent screen: External, app "Selona website editor", scopes `openid`, `email`. Then Credentials → Create OAuth client ID → Web application:
- **Authorised JavaScript origins:** `https://selona-ai-website.vercel.app` (and later `https://selona.ai`, `https://www.selona.ai`)
- **Authorised redirect URIs:** `https://selona-ai-website.vercel.app/api/editor/google/callback` (and later `https://selona.ai/api/editor/google/callback`, `https://www.selona.ai/api/editor/google/callback`)

In Vercel → `selona-ai-website` → Settings → Environment Variables, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (mark the secret **Sensitive**) for Production and Preview, then redeploy. The "Sign in with Google" button appears by itself.

## 3. Add the connector in claude.ai (each person, their own account)

claude.ai → **Settings → Connectors → Add custom connector** → Name `Selona website` → URL: your private connector address from `.env.editor-keys.local` → **Add**. In a chat, switch it on from the tools menu and try "Show me the pages of the Selona website".

## 4. When Mr Rahul is happy: move selona.ai to the new project

1. In Vercel → `selona-ai-website` → **Settings → Domains**, add `selona.ai` and `www.selona.ai`. Vercel moves them from the old `selona` project (it asks you to confirm).
2. Switch off the backup key sign-in once Google works: delete `EDITOR_ACCESS_KEYS_ENABLED` (and `EDITOR_ACCESS_KEY_HASHES`) from the project, then redeploy.
3. Check https://selona.ai reads exactly as before, then open https://selona.ai/editor.
4. Update the connector address in claude.ai to `https://selona.ai/api/mcp/<your token>` (same token).

The content on the test site carries over, because the same project and store keep serving. If you'd rather start clean, bring back "Original site, before the editor (25 Nov 2026)" in Saved versions first.

## Roll back in one step

- **Wrong words on the site:** /editor → **Saved versions** → "Original site, before the editor (25 Nov 2026)" → **Bring back this version**.
- **After moving the domain, if anything is wrong:** Vercel → `selona-ai-website` → Settings → Domains → remove `selona.ai`/`www.selona.ai`, then add them back on the old `selona` project, whose production is still `dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt`.

## Tidy-up (any time)

On the **old** `selona` project, delete the Preview-only variables from the night (`BLOB_STORE_ID`, the empty `BLOB_READ_WRITE_TOKEN`, `EDITOR_*`), plus the leftover project `selona-editor-store` and stores `selona-content` and `selona-editor-content`. The old repo's `feature/editor-and-connector` and `add-ponytail-skills` branches can go too. Nothing uses any of them.

In GitHub → Sahajta-AI/selona-ai-website → Settings → **Default branch**, switch to `main`, and delete `feature/editor-and-connector` (it's the same as `main`).
