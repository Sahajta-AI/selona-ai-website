"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PAGES,
  describeKey,
  diffContent,
  flatten,
  getAt,
  isMediaKey,
  isTextKey,
  isVideoKey,
  setAt,
  type Change,
  type Content,
  type Json,
} from "@/lib/content/paths";

type State = { email: string; draft: Content; draftId: string | null; live: Content; liveId: string; liveAt: string | null; liveBy: string | null };
type VersionMeta = { id: string; at: string; by: string; kind: string; name?: string };
type Tab = "changes" | "page" | "history" | "archive";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const short = (v: Json | undefined) => {
  const s = typeof v === "string" ? v : Array.isArray(v) ? `${v.length} items` : JSON.stringify(v ?? "");
  return s.length > 160 ? s.slice(0, 157) + "…" : s;
};
const pageOfKey = (key: string) => Object.entries(PAGES).find(([, p]) => p.groups[0] === key.split(".")[0])?.[1].path ?? null;

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; data: Record<string, string> }> {
  // never leave a button "working" forever: give up after 30 seconds with a clear message
  const res = await fetch(path, {
    ...init,
    headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res) return { ok: false, status: 0, data: { error: "The website didn't answer in time. Please check your internet connection and try again." } };
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) window.location.href = "/editor/sign-in?e=expired";
  return res.ok ? { ok: true, data } : { ok: false, status: res.status, data };
}

/** Pictures are made smaller in the browser before upload (WebP, at most 2400 px wide). */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a picture (JPG, PNG, WebP or GIF).");
  if (file.size > 25 * 1024 * 1024) throw new Error("That picture is too big. Please use one under 25 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (blob && blob.size <= 4 * 1024 * 1024) return blob;
  }
  throw new Error("That picture is too big even after making it smaller. Please use a smaller one.");
}

export function EditorApp({ initial, startPath, startTab }: { initial: State; startPath: string; startTab: Tab }) {
  const [state, setState] = useState(initial);
  const draft = state.draft;
  const [path, setPath] = useState(startPath);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [tab, setTab] = useState<Tab>(startTab);
  const [panelOpen, setPanelOpen] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [notice, setNotice] = useState<string>(""); // one-off messages, cleared by the next edit
  const [problem, setProblem] = useState<string>("");
  const [conflict, setConflict] = useState<null | "draft" | "publish" | { bringBack: VersionMeta }>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [frameNonce, setFrameNonce] = useState(0);
  const [versions, setVersions] = useState<{ published: VersionMeta[]; archives: VersionMeta[] } | null>(null);
  const [archiveName, setArchiveName] = useState("");
  const [liveCheck, setLiveCheck] = useState<null | "waiting" | "live" | "slow">(null);

  const frame = useRef<HTMLIFrameElement>(null);
  const history = useRef<{ stack: Content[]; index: number; lastKey: string | null; lastAt: number }>({ stack: [initial.draft], index: 0, lastKey: null, lastAt: 0 });
  const [canStep, setCanStep] = useState({ undo: false, redo: false });
  const syncSteps = () => setCanStep({ undo: history.current.index > 0, redo: history.current.index < history.current.stack.length - 1 });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<void>>(Promise.resolve());
  const lastSaveOk = useRef(true);
  const draftIdRef = useRef(initial.draftId);
  const latestDraft = useRef(initial.draft);
  const reloadAfterSave = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingMedia = useRef<string | null>(null);

  const changes = useMemo(() => diffContent(state.live, draft), [state.live, draft]);
  const toPage = useCallback((m: object) => frame.current?.contentWindow?.postMessage(m, window.location.origin), []);
  const reloadFrame = useCallback(() => setFrameNonce((n) => n + 1), []);

  // ---- saving the shared draft -------------------------------------------
  const save = useCallback(() => {
    saving.current = saving.current.then(async () => {
      setStatus("Saving…");
      const r = await api<{ draftId: string }>("/api/editor/draft", {
        method: "POST",
        body: JSON.stringify({ content: latestDraft.current, draftId: draftIdRef.current }),
      });
      lastSaveOk.current = r.ok;
      if (r.ok) {
        draftIdRef.current = r.data.draftId;
        setState((s) => ({ ...s, draftId: r.data.draftId }));
        setStatus("Saved as a draft. Not live yet.");
        setProblem("");
        if (reloadAfterSave.current) {
          reloadAfterSave.current = false;
          reloadFrame();
        }
      } else {
        setStatus("Not saved yet.");
        if (r.status === 409) setConflict("draft");
        else setProblem(r.data.error || "We couldn't save that just now. Please try again in a minute.");
      }
    });
    return saving.current;
  }, [reloadFrame]);

  const flush = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      await save();
    }
    await saving.current;
  }, [save]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setStatus("Saving…");
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      save();
    }, 700);
  }, [save]);

  /** Every change goes through here: undo history, the draft, the page. */
  const apply = useCallback(
    (next: Content, opts: { key?: string; structural?: boolean } = {}) => {
          const h = history.current;
      const typingSameField = opts.key && h.lastKey === opts.key && Date.now() - h.lastAt < 1500 && h.index === h.stack.length - 1;
      if (typingSameField) h.stack[h.index] = next;
      else {
        h.stack = [...h.stack.slice(0, h.index + 1), next];
        h.index = h.stack.length - 1;
      }
      h.lastKey = opts.key ?? null;
      h.lastAt = Date.now();
      latestDraft.current = next;
      setState((s) => ({ ...s, draft: next }));
      if (opts.structural) reloadAfterSave.current = true;
      setLiveCheck(null);
      setNotice("");
      syncSteps();
      scheduleSave();
    },
    [scheduleSave],
  );

  const jump = useCallback(
    (to: number) => {
      const h = history.current;
      if (to < 0 || to >= h.stack.length) return;
      const from = h.stack[h.index];
      h.index = to;
      h.lastKey = null;
      const next = h.stack[to];
      latestDraft.current = next;
      setState((s) => ({ ...s, draft: next }));
      const diff = diffContent(from, next);
      if (diff.every((c) => c.kind === "text")) diff.forEach((c) => toPage({ type: "set", key: c.key, value: c.after }));
      else reloadAfterSave.current = true;
      syncSteps();
      scheduleSave();
    },
    [scheduleSave, toPage],
  );
  const undo = useCallback(() => jump(history.current.index - 1), [jump]);
  const redo = useCallback(() => jump(history.current.index + 1), [jump]);

  // ---- messages from the page inside the frame -----------------------------
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "selona-page") return;
      const m = e.data;
      if (m.type === "ready") {
        setVisibleKeys(m.keys);
        if (m.path && m.path !== path) setPath(m.path);
        toPage({ type: "mode", mode });
      } else if (m.type === "edit" || m.type === "commit") {
        if (getAt(latestDraft.current, m.key) !== m.value) apply(setAt(latestDraft.current, m.key, m.value), { key: m.key });
      } else if (m.type === "select") {
        setSelected(m.key);
        setTab("page");
        setPanelOpen(true);
      } else if (m.type === "pick-image") {
        pendingMedia.current = m.key;
        fileInput.current!.accept = "image/*";
        fileInput.current!.click();
      } else if (m.type === "undo") undo();
      else if (m.type === "redo") redo();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [apply, mode, path, redo, toPage, undo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if ((e.target as HTMLElement).closest("input,textarea")) return; // their own undo
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo]);

  useEffect(() => toPage({ type: "mode", mode }), [mode, toPage]);
  useEffect(() => toPage({ type: "select", key: selected }), [selected, toPage]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveTimer.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // ---- publishing -----------------------------------------------------------
  const waitUntilLive = useCallback(async (liveId: string, pagePath: string) => {
    setLiveCheck("waiting");
    for (let i = 0; i < 40; i++) {
      // as a visitor sees it: no editor cookies
      const html = await fetch(`${pagePath}?check=${Date.now()}`, { credentials: "omit", cache: "no-store" }).then((r) => r.text()).catch(() => "");
      if (html.includes(`name="content-version" content="${liveId}"`)) return setLiveCheck("live");
      await new Promise((r) => setTimeout(r, 1500));
    }
    setLiveCheck("slow");
  }, []);

  const afterLive = useCallback(
    async (liveId: string) => {
      const s = await api<State>("/api/editor/state");
      if (s.ok) {
        setState(s.data);
        draftIdRef.current = s.data.draftId;
        latestDraft.current = s.data.draft;
        history.current = { stack: [s.data.draft], index: 0, lastKey: null, lastAt: 0 };
        setCanStep({ undo: false, redo: false });
      }
      setVersions(null);
      reloadFrame();
      await waitUntilLive(liveId, path);
    },
    [path, reloadFrame, waitUntilLive],
  );

  const publish = useCallback(
    async (force = false) => {
      setConflict(null);
      await flush();
      if (!lastSaveOk.current) return setStatus("Not published: your last change couldn't be saved. See the message above.");
      setStatus("Publishing…");
      const r = await api<{ liveId: string }>("/api/editor/publish", { method: "POST", body: JSON.stringify({ liveId: state.liveId, force }) });
      if (!r.ok) {
        setStatus("Not published yet.");
        if (r.status === 409) return setConflict("publish");
        return setProblem(r.data.error || "Publishing didn't work. Please try again.");
      }
      setStatus("Published.");
      await afterLive(r.data.liveId);
    },
    [afterLive, flush, state.liveId],
  );

  const bringBack = useCallback(
    async (v: VersionMeta, force = false) => {
      setConflict(null);
      if (!force && !window.confirm(`Put “${v.name}” live again? It replaces what's on the website now. You can always bring today's version back from History.`)) return;
      await flush();
      setStatus("Bringing it back…");
      const r = await api<{ liveId: string }>("/api/editor/bring-back", { method: "POST", body: JSON.stringify({ id: v.id, liveId: state.liveId, force }) });
      if (!r.ok) {
        setStatus("Not brought back yet.");
        if (r.status === 409) return setConflict({ bringBack: v });
        return setProblem(r.data.error || "That didn't work. Please try again.");
      }
      setStatus(`“${v.name}” is back.`);
      await afterLive(r.data.liveId);
    },
    [afterLive, flush, state.liveId],
  );

  const undoPublish = useCallback(
    async (v: VersionMeta) => {
      const dropped = changes.length ? " Changes you haven't published yet will be dropped." : "";
      if (!window.confirm(`Undo the publish of ${when(v.at)}? The website goes back to how it was just before.${dropped} Nothing is deleted: this version stays in History.`)) return;
      await flush();
      setStatus("Undoing…");
      const r = await api<{ liveId: string }>("/api/editor/undo-publish", { method: "POST", body: JSON.stringify({ id: v.id }) });
      if (!r.ok) {
        setStatus("Nothing was undone.");
        setVersions(null);
        return setProblem(r.status === 409 ? "Someone else published in the meantime, so nothing was undone. History is now up to date: have a look, then try again." : r.data.error || "That didn't work. Please try again.");
      }
      setStatus("Undone. The website is going back to how it was.");
      await afterLive(r.data.liveId);
    },
    [afterLive, changes.length, flush],
  );

  const restore = useCallback(
    async (folder: "published" | "archives", v: VersionMeta) => {
      await flush();
      const r = await api<{ draftId: string; draft: Content }>("/api/editor/restore", { method: "POST", body: JSON.stringify({ folder, id: v.id, draftId: draftIdRef.current }) });
      if (!r.ok) return r.status === 409 ? setConflict("draft") : setProblem(r.data.error || "That didn't work. Please try again.");
      draftIdRef.current = r.data.draftId;
      apply(r.data.draft, { structural: true });
      setNotice(`The version from ${when(v.at)} is now your draft. Preview it, then press Publish.`);
    },
    [apply, flush],
  );

  const saveArchive = useCallback(async () => {
    const r = await api<{ id: string }>("/api/editor/archive", { method: "POST", body: JSON.stringify({ name: archiveName }) });
    if (!r.ok) return setProblem(r.data.error || "That didn't work. Please try again.");
    setArchiveName("");
    setVersions(null);
    setNotice("Saved. You can bring this version back any time.");
  }, [archiveName]);

  useEffect(() => {
    if ((tab === "history" || tab === "archive") && !versions)
      api<{ published: VersionMeta[]; archives: VersionMeta[] }>("/api/editor/versions").then((r) => r.ok && setVersions(r.data));
  }, [tab, versions]);

  // ---- pictures and videos ----------------------------------------------------
  const onFile = useCallback(
    async (file: File | undefined) => {
      const key = pendingMedia.current;
      if (!file || !key) return;
      try {
        setStatus("Uploading…");
        const video = isVideoKey(key);
        const body = new FormData();
        body.append("kind", video ? "video" : "image");
        body.append("file", video ? file : await compressImage(file), video ? file.name : "picture.webp");
        if (video && file.size > 4 * 1024 * 1024) throw new Error("That video is too big. Please use one under 4 MB.");
        const r = await api<{ url: string }>("/api/editor/upload", { method: "POST", body });
        if (!r.ok) throw new Error(r.data.error || "Uploading didn't work. Please try again.");
        apply(setAt(latestDraft.current, key, r.data.url), { structural: true });
      } catch (err) {
        setProblem((err as Error).message);
        setStatus("");
      } finally {
        pendingMedia.current = null;
        if (fileInput.current) fileInput.current.value = "";
      }
    },
    [apply],
  );
  const chooseMedia = (key: string) => {
    pendingMedia.current = key;
    fileInput.current!.accept = isVideoKey(key) ? "video/mp4,video/webm" : "image/*";
    fileInput.current!.click();
  };

  // ---- lists ----------------------------------------------------------------
  const listsFor = (key: string | null) => {
    if (!key) return [];
    const parts = key.split(".");
    const out: { list: string; index: number; length: number }[] = [];
    for (let i = 1; i < parts.length; i++) {
      if (!/^\d+$/.test(parts[i])) continue;
      const list = parts.slice(0, i).join(".");
      const arr = getAt(draft, list);
      if (Array.isArray(arr)) out.push({ list, index: Number(parts[i]), length: arr.length });
    }
    return out.reverse(); // innermost first
  };
  const changeList = (list: string, fn: (items: Json[]) => Json[]) => {
    const items = getAt(latestDraft.current, list) as Json[];
    apply(setAt(latestDraft.current, list, fn([...items])), { structural: true });
  };
  const move = (list: string, i: number, by: number) =>
    changeList(list, (a) => {
      const [it] = a.splice(i, 1);
      a.splice(i + by, 0, it);
      setSelected(null);
      return a;
    });
  const addAfter = (list: string, i: number) => changeList(list, (a) => (a.splice(i + 1, 0, structuredClone(a[i])), a));
  const remove = (list: string, i: number) => {
    if (window.confirm("Remove this item from the list? You can undo this.")) changeList(list, (a) => (a.splice(i, 1), a));
    setSelected(null);
  };

  // ---- what this page contains (for the side panel) ------------------------
  const pageEntry = Object.entries(PAGES).find(([, p]) => p.path === path) ?? Object.entries(PAGES)[0];
  const pageKeys = flatten(draft).filter(([k]) => pageEntry[1].groups.includes(k.split(".")[0]));
  const hiddenTexts = pageKeys.filter(([k, v]) => typeof v === "string" && isTextKey(k) && !visibleKeys.includes(k) && !/Alt$/.test(k));
  const media = pageKeys.filter(([k]) => isMediaKey(k));

  const tabs: [Tab, string][] = [
    ["changes", `Changes${changes.length ? ` (${changes.length})` : ""}`],
    ["page", "This page"],
    ["history", "History"],
    ["archive", "Saved versions"],
  ];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-3 py-2 text-sm">
        <strong className="mr-2 text-ink-deep">Website editor</strong>
        <label className="flex items-center gap-1">
          <span className="sr-only">Page</span>
          <select
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              setSelected(null);
            }}
            className="min-h-[40px] rounded-lg border border-line bg-white px-2"
          >
            {Object.values(PAGES).map((p) => (
              <option key={p.path} value={p.path}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={undo} disabled={!canStep.undo} className="btn-ed">
          Undo
        </button>
        <button type="button" onClick={redo} disabled={!canStep.redo} className="btn-ed">
          Redo
        </button>
        <button type="button" onClick={() => setMode(mode === "edit" ? "preview" : "edit")} className="btn-ed">
          {mode === "edit" ? "Preview" : "Back to editing"}
        </button>
        <button
          type="button"
          onClick={() => publish(false)}
          disabled={changes.length === 0 || liveCheck === "waiting"}
          className="min-h-[40px] rounded-full bg-ink-deep px-4 font-medium text-white disabled:opacity-40"
        >
          Publish
        </button>
        <span role="status" aria-live="polite" className="min-w-0 flex-1 truncate text-body-60">
          {liveCheck === "waiting"
            ? "Putting it live… checking the website"
            : liveCheck === "live"
              ? "Live now ✓"
              : liveCheck === "slow"
                ? "Published. The website is taking longer than usual to update; check again in a minute."
                : notice && status !== "Saving…"
                  ? notice
                  : changes.length === 0 && status !== "Saving…"
                  ? "Everything is live."
                  : status}
        </span>
        <button type="button" onClick={() => setPanelOpen((o) => !o)} className="btn-ed md:hidden">
          {panelOpen ? "Hide panel" : "Show panel"}
        </button>
        <form method="post" action="/api/editor/sign-out">
          <button type="submit" className="btn-ed">
            Sign out
          </button>
        </form>
      </header>

      {problem ? (
        <p role="alert" className="flex items-center justify-between gap-3 border-b-4 border-red-300 bg-red-50 px-4 py-3 text-base text-red-900">
          {problem}
          <button type="button" onClick={() => setProblem("")} className="underline">
            OK
          </button>
        </p>
      ) : null}

      {conflict ? (
        <div role="alertdialog" aria-label="Someone else made changes" className="border-b-4 border-amber-400 bg-amber-100 px-4 py-4 text-base text-amber-950 shadow-md">
          {conflict === "draft" ? (
            <>
              <p className="font-medium">Someone else changed this draft while you were editing.</p>
              <p>Load their version to carry on from it. Your last unsaved change will be lost.</p>
              <button type="button" className="btn-ed mt-2" onClick={() => window.location.reload()}>
                Load their version
              </button>
            </>
          ) : (
            <>
              <p className="font-medium">Someone else published the website after you opened the editor.</p>
              <p>If you publish now, what they published will be replaced by your version. Their version stays in History.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-ed" onClick={() => (conflict === "publish" ? publish(true) : bringBack(conflict.bringBack, true))}>
                  Publish anyway
                </button>
                <button type="button" className="btn-ed" onClick={() => window.location.reload()}>
                  See their version first
                </button>
                <button type="button" className="btn-ed" onClick={() => setConflict(null)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <iframe
          ref={frame}
          key={`${path}-${frameNonce}`}
          title="Your website, ready to edit"
          src={`/api/editor/enter?path=${encodeURIComponent(path)}&n=${frameNonce}`}
          className="min-h-[60vh] w-full flex-1 border-0 bg-white"
        />
        {panelOpen && mode === "edit" ? (
          <aside className="flex max-h-[50vh] w-full flex-col border-t border-line bg-white md:max-h-none md:w-[380px] md:border-l md:border-t-0">
            <nav className="flex flex-wrap gap-1 border-b border-line p-2 text-sm" aria-label="Editor panels">
              {tabs.map(([t, label]) => (
                <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={`rounded-full px-3 py-1.5 ${tab === t ? "bg-ink-deep text-white" : "hover:bg-tint"}`}>
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto p-3 text-sm">
              {tab === "changes" ? (
                <ChangesPanel changes={changes} onUndo={(c) => apply(setAt(latestDraft.current, c.key, (c.before ?? "") as Json), { structural: c.kind !== "text" })} onGo={(c) => {
                  const p = pageOfKey(c.key);
                  if (p && p !== path) setPath(p);
                }} />
              ) : null}

              {tab === "page" ? (
                <div className="flex flex-col gap-4">
                  {selected ? (
                    <section className="rounded-lg border border-line p-3">
                      <p className="font-medium text-ink-deep">Selected</p>
                      <p className="text-body-60">{describeKey(selected)}</p>
                      {listsFor(selected).map(({ list, index, length }) => (
                        <div key={list} className="mt-2 flex flex-wrap items-center gap-1">
                          <span className="w-full text-body-60">
                            Item {index + 1} of {length} in “{describeKey(list)}”
                          </span>
                          <button type="button" className="btn-ed" disabled={index === 0} onClick={() => move(list, index, -1)}>
                            Move up
                          </button>
                          <button type="button" className="btn-ed" disabled={index === length - 1} onClick={() => move(list, index, 1)}>
                            Move down
                          </button>
                          <button type="button" className="btn-ed" onClick={() => addAfter(list, index)}>
                            Add another
                          </button>
                          <button type="button" className="btn-ed" onClick={() => remove(list, index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </section>
                  ) : (
                    <p className="text-body-60">Click any text on the page to change it. Click a picture to replace it.</p>
                  )}

                  <section>
                    <h2 className="mb-2 font-medium text-ink-deep">Pictures and videos</h2>
                    <ul className="flex flex-col gap-2">
                      {media.map(([k, v]) => (
                        <li key={k} className="flex items-center gap-2">
                          {isVideoKey(k) ? <span className="w-16 text-center text-xs text-body-60">Video</span> : <img src={String(v)} alt="" className="h-10 w-16 rounded border border-line object-contain" />}
                          <span className="min-w-0 flex-1 truncate">{describeKey(k)}</span>
                          <button type="button" className="btn-ed" onClick={() => chooseMedia(k)}>
                            Replace
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h2 className="mb-2 font-medium text-ink-deep">Words you can&apos;t click on</h2>
                    <p className="mb-2 text-body-60">Page titles, messages and labels that only show sometimes.</p>
                    {hiddenTexts.map(([k, v]) => (
                      <label key={k} className="mb-2 flex flex-col gap-1">
                        <span className="text-body-60">{describeKey(k)}</span>
                        <textarea
                          value={String(v)}
                          rows={String(v).length > 60 ? 3 : 1}
                          onChange={(e) => apply(setAt(latestDraft.current, k, e.target.value), { key: k })}
                          className="rounded-lg border border-line px-2 py-1"
                        />
                      </label>
                    ))}
                  </section>
                </div>
              ) : null}

              {tab === "history" ? (
                <section>
                  <p className="mb-3 text-body-60">Every version that went live. Published something by mistake? Press <strong>Undo this publish</strong> on the top one and the website goes straight back. Restoring an older one makes it your draft, so you can preview it before publishing.</p>
                  {!versions ? <p>Loading…</p> : versions.published.length === 0 ? <p>Nothing has been published from the editor yet.</p> : null}
                  <ul className="flex flex-col gap-2">
                    {versions?.published.map((v, i) => (
                      <li key={v.id} className="rounded-lg border border-line p-2">
                        <p className="font-medium">
                          {when(v.at)}
                          {i === 0 ? " · live now" : ""}
                        </p>
                        <p className="text-body-60">
                          {v.kind === "restore" ? (v.name ?? "Brought back") : "Published"} by {v.by}
                        </p>
                        {i === 0 ? (
                          <button type="button" className="btn-ed mt-1" onClick={() => undoPublish(v)}>
                            Undo this publish
                          </button>
                        ) : (
                          <button type="button" className="btn-ed mt-1" onClick={() => restore("published", v)}>
                            Restore as draft
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {tab === "archive" ? (
                <section className="flex flex-col gap-3">
                  <p className="text-body-60">Save the whole website as it is now, and bring it back later in one step.</p>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <span className="sr-only">Name for this version</span>
                      <input value={archiveName} onChange={(e) => setArchiveName(e.target.value)} placeholder="For example: Before the March changes" className="min-h-[40px] w-full rounded-lg border border-line px-2" />
                    </label>
                    <button type="button" className="btn-ed" disabled={!archiveName.trim()} onClick={saveArchive}>
                      Save
                    </button>
                  </div>
                  {!versions ? <p>Loading…</p> : null}
                  <ul className="flex flex-col gap-2">
                    {versions?.archives.map((v) => (
                      <li key={v.id} className="rounded-lg border border-line p-2">
                        <p className="font-medium">{v.name}</p>
                        <p className="text-body-60">
                          Saved {when(v.at)} by {v.by}
                        </p>
                        <div className="mt-1 flex gap-1">
                          <button type="button" className="btn-ed" onClick={() => bringBack(v)}>
                            Bring back this version
                          </button>
                          <button type="button" className="btn-ed" onClick={() => restore("archives", v)}>
                            Open as draft
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
      <input ref={fileInput} type="file" className="hidden" aria-hidden="true" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

function ChangesPanel({ changes, onUndo, onGo }: { changes: Change[]; onUndo: (c: Change) => void; onGo: (c: Change) => void }) {
  if (!changes.length) return <p className="text-body-60">No changes yet. Everything you see is what&apos;s live on the website.</p>;
  return (
    <section>
      <p className="mb-3 text-body-60">These changes are saved but not live yet. Press Publish to put them on the website.</p>
      <ul className="flex flex-col gap-2">
        {changes.map((c) => (
          <li key={c.key} className="rounded-lg border border-line p-2" data-change={c.key}>
            <button type="button" className="text-left font-medium text-ink-deep hover:underline" onClick={() => onGo(c)}>
              {describeKey(c.key)}
            </button>
            {c.kind === "media" ? (
              <div className="mt-1 flex items-center gap-2">
                <img src={String(c.before)} alt="Before" className="h-12 w-20 rounded border border-line object-contain" />
                <span aria-hidden="true">→</span>
                <img src={String(c.after)} alt="After" className="h-12 w-20 rounded border border-line object-contain" />
              </div>
            ) : (
              <div className="mt-1 grid gap-1">
                <p className="rounded bg-red-50 px-2 py-1 text-red-900">
                  <span className="sr-only">Before: </span>
                  {c.kind === "list" ? `${(c.before as Json[]).length} items: ${(c.before as Json[]).map((x) => short(typeof x === "string" ? x : Object.values(x as object)[0])).join(" · ")}` : short(c.before)}
                </p>
                <p className="rounded bg-emerald-50 px-2 py-1 text-emerald-900">
                  <span className="sr-only">After: </span>
                  {c.kind === "list" ? `${(c.after as Json[]).length} items: ${(c.after as Json[]).map((x) => short(typeof x === "string" ? x : Object.values(x as object)[0])).join(" · ")}` : short(c.after)}
                </p>
              </div>
            )}
            <button type="button" className="btn-ed mt-1" onClick={() => onUndo(c)}>
              Undo this change
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
