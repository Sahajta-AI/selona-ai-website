# Status: BRIEF.md against the real code

**Update 26 Nov (afternoon):** the work is on `main` of Sahajta-AI/selona-ai-website and runs as its own Vercel project at https://selona-ai-website.vercel.app with its own content store. The full end-to-end suite passed there, 43/43 (proofs 1–11), so every "PARTIAL … ran locally" row below is now proven on Vercel too. The pull request row no longer applies: Pranamya chose `main` directly. Still waiting on Pranamya: Google sign-in client, adding the connector in claude.ai, moving selona.ai over after Mr Rahul approves.

## As of the self-audit (26 Nov 09:30 IST)

BUILT = done and tested. PARTIAL = done but not fully proven where the brief wanted it. MISSING = not built.

## Content out of the code
| Brief bullet | Status | Where / note |
|---|---|---|
| Every text on every page, nav, footer, buttons, FAQs, form labels, titles, meta in a content store | BUILT | `content/defaults.json` (400 texts), every page and component reads `getContent()`; inventory in `CONTENT-INVENTORY.md` |
| Every image and the video replaceable | BUILT | 13 pictures + 2 background videos; keys ending in `Src`; proof 5 |
| Baseline captured; zero text differences; screenshots match | BUILT | `baseline/`; parity test 21/21 locally; on the Preview (from a Vercel Sandbox): text 7/7, 1440px 7/7, 390px 3/7 (font rendering on that machine; see REPORT) |
| Publishing without a redeploy; preview and production content kept apart | BUILT | `revalidateTag`/`revalidatePath`; files under `selona-content/<environment>/`, cache keyed per environment |
| Repo default shown if the store is empty or unreachable | BUILT | verified locally and on the Preview build (Blob refused → default content, pages 200) |

## Sign-in
| Brief bullet | Status | Where / note |
|---|---|---|
| /editor unlinked, noindex, every route protected on the server | BUILT | `lib/auth.ts`, `app/editor`, `app/api/editor/*`; auth tests 8/8 |
| Allowlist in an environment variable | BUILT | `EDITOR_ALLOWED_EMAILS` (Preview set) |
| Google sign-in, switches on with its variables | PARTIAL | built and tested up to Google; live sign-in BLOCKED (B1: Google client) |
| Access-key backup sign-in, hashed, limited attempts, off in production by default | BUILT | `EDITOR_ACCESS_KEYS_ENABLED`, `EDITOR_ACCESS_KEY_HASHES`; 5 tries/15 min |
| "You don't have access" page | BUILT | `/editor/no-access` |

## The editor
| Brief bullet | Status | Where / note |
|---|---|---|
| Click any text, type, see it change in place | BUILT | `components/editor/EditOverlay.tsx`; proof 3 |
| Numbers are just text | BUILT | all values are strings |
| Replace images by upload (images only, size limit, compressed) | BUILT | browser WebP compression, server byte check, 4 MB; proof 5 |
| Lists: add, remove, reorder | BUILT | side panel; proof 6 |
| Undo: Ctrl/Cmd+Z, Undo and Redo buttons | BUILT | proof 4 |
| Preview full page before publishing | BUILT | Preview button |
| Nothing live until Publish; "Live now" only when the page shows it | BUILT | version stamp check; proof 3 |
| Warn if someone else published after you opened the editor | BUILT | proof 10 |
| Plain words; laptop first; works on a phone | BUILT | labels translated (`describeKey`); 390px has no sideways scroll |

## History and archive
| Brief bullet | Status | Where / note |
|---|---|---|
| History with date, time, who | BUILT | History panel |
| Restore any version as a draft | BUILT | proof 7 |
| Archive the whole site by name; bring it back in one step | BUILT | Saved versions panel; proof 8 |
| Nothing ever deleted; restore is a new version | BUILT | every write is a new file; nothing deletes |
| Seed "Original site, before the editor (25 Nov 2026)" | BUILT | created automatically the first time the editor or connector opens in an environment |

## The Claude connector
| Brief bullet | Status | Where / note |
|---|---|---|
| Remote MCP server served by the site | BUILT | `/api/mcp/<token>`, Streamable HTTP |
| Tools: list pages, read page, find phrase, propose text, propose list changes, history, prepare restore | BUILT | `lib/connector.ts` |
| Drafts only; review link with old vs new, Undo per change, Publish | BUILT | proof 9 |
| Only Rahul and Pranamya; OAuth or private URL per person | BUILT (private URL) | OAuth not testable tonight; see ASSUMPTIONS |
| Added in claude.ai | BLOCKED | B2, needs the account owner |

## Proof on the Preview
| Item | Status | Note |
|---|---|---|
| Proofs 1–11 on the Preview deployment | PARTIAL | Preview has no working content store until the store is connected (owner action, rules forbade adding a Production variable), so proofs 2–10 ran on a local production build of the same commit; proof 1 also ran on the Preview |
| Proof 12: preview content back to the original; main and production untouched | BUILT | Preview content = default (= original archive content); production still dpl_9UFr6DteNbfALPrPJGe2vij3Jmtt; old repo `main` still 506e2ae |

## Morning files
| Item | Status |
|---|---|
| MORNING.md, RAHUL-GUIDE.md, TUTORIAL.md, REPORT.md | BUILT |
| Pull request into main | BLOCKED: the new repo has no `main` (creating it was refused as a push to main). MORNING.md step 1 creates it and opens the PR |

## Gaps found and what happened to them
- G1 Preview content store not connected → BLOCKED (owner, two clicks; MORNING.md step 2).
- G2 Pull request can't be opened without a `main` branch in the new repo → BLOCKED (MORNING.md step 1).
- G3 390px screenshots on the Sandbox differ by font rendering → noted; a same-machine baseline option (`BASELINE_DIR`) exists for re-running there.
