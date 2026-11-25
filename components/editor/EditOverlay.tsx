"use client";

import { useEffect } from "react";

// Runs only inside the editor's frame (Draft Mode + signed in). It finds the
// invisible markers that name each piece of text, removes them, makes the text
// clickable and editable, and talks to the editor around it with postMessage.
const MARKER = /⁣([‌‍⁠﻿]+)⁤/g;
const DIGITS = ["‌", "‍", "⁠", "﻿"];

function decodeKey(payload: string) {
  const bytes: number[] = [];
  for (let i = 0; i + 4 <= payload.length; i += 4) {
    let b = 0;
    for (let j = 0; j < 4; j++) b = (b << 2) | DIGITS.indexOf(payload[i + j]);
    bytes.push(b);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}
const keysIn = (s: string) => [...s.matchAll(MARKER)].map((m) => decodeKey(m[1]));
const strip = (s: string) => s.replace(MARKER, "");

type Msg =
  | { type: "mode"; mode: "edit" | "preview" }
  | { type: "set"; key: string; value: string }
  | { type: "select"; key: string | null };

export function EditOverlay() {
  useEffect(() => {
    if (window.parent === window) return; // only inside the editor's frame
    const post = (m: object) => window.parent.postMessage({ source: "selona-page", ...m }, window.location.origin);
    let mode: "edit" | "preview" = "edit";
    const style = document.createElement("style");
    document.head.appendChild(style);
    const setMode = (m: typeof mode) => {
      mode = m;
      style.textContent =
        m === "edit"
          ? `[data-ck]{cursor:text;outline:1px dashed transparent;outline-offset:3px;border-radius:2px}
             [data-ck]:hover{outline-color:rgba(37,99,235,.55)}
             [data-ck][contenteditable]{outline:2px solid #2563eb;outline-offset:3px}
             [data-ck-selected]{outline:2px solid rgba(37,99,235,.35)}
             img[data-ck-img]{cursor:pointer}img[data-ck-img]:hover{outline:3px solid rgba(37,99,235,.7)}
             .reveal,.word-reveal .word,.word-inner{opacity:1!important;transform:none!important;filter:none!important}`
          : `.reveal,.word-reveal .word,.word-inner{opacity:1!important;transform:none!important;filter:none!important}`;
    };
    setMode("edit");

    // 1) labels (aria-label, alt) and text nodes carrying a marker
    const found = new Set<string>();
    for (const el of document.querySelectorAll<HTMLElement>("[aria-label],img[alt]")) {
      for (const attr of ["aria-label", "alt"]) {
        const v = el.getAttribute(attr);
        if (!v || !v.includes("⁣")) continue;
        const [key] = keysIn(v);
        el.setAttribute(attr, strip(v));
        found.add(key);
        if (el.tagName === "IMG") {
          // the picture is the content key next to its description: imageAlt -> imageSrc
          el.dataset.ckImg = key.replace(/Alt$/, "Src");
          el.dataset.ckAlt = key;
        } else if (/^H[1-6]$/.test(el.tagName)) {
          el.dataset.ck = key; // a heading whose words are animated one by one
        } // other labels (menu buttons, section names) are edited in the editor's side panel
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) if ((walker.currentNode as Text).data.includes("⁣")) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const [key] = keysIn(node.data);
      node.data = strip(node.data);
      found.add(key);
      const parent = node.parentElement;
      if (!parent || parent.closest(`[data-ck="${CSS.escape(key)}"]`)) continue;
      if (parent.childNodes.length === 1 && !parent.dataset.ck) parent.dataset.ck = key;
      else {
        const span = document.createElement("span");
        span.dataset.ck = key;
        node.replaceWith(span);
        span.appendChild(node);
      }
    }
    // headings split into words: the visible words show the whole text while editing
    for (const el of document.querySelectorAll<HTMLElement>("[data-ck]")) {
      if (el.hasAttribute("aria-label") || el.querySelector("[data-ck]")) {
        el.querySelectorAll("[data-ck]").forEach((c) => c.removeAttribute("data-ck"));
      }
    }

    let editingEl: HTMLElement | null = null;
    let startText = "";
    const finish = () => {
      if (!editingEl) return;
      editingEl.removeAttribute("contenteditable");
      // only real changes: an untouched field must not write back after a list item moved
      if ((editingEl.textContent ?? "") !== startText) post({ type: "commit", key: editingEl.dataset.ck, value: editingEl.textContent ?? "" });
      editingEl = null;
    };

    const onClick = (e: MouseEvent) => {
      if (mode !== "edit") return;
      const target = e.target as HTMLElement;
      const img = target.closest<HTMLElement>("img[data-ck-img]");
      const el = target.closest<HTMLElement>("[data-ck]");
      if (target.closest("a,button") || el || img) e.preventDefault(); // stay on this page while editing
      if (img && !el) return post({ type: "pick-image", key: img.dataset.ckImg, altKey: img.dataset.ckAlt });
      if (!el) return;
      if (el === editingEl) return;
      finish();
      editingEl = el;
      // a heading animated word by word shows its plain text while being edited
      if (el.hasAttribute("aria-label")) el.textContent = el.getAttribute("aria-label");
      startText = el.textContent ?? "";
      el.setAttribute("contenteditable", "plaintext-only");
      el.focus();
      post({ type: "select", key: el.dataset.ck });
    };
    const onInput = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.dataset.ck) post({ type: "edit", key: el.dataset.ck, value: el.textContent ?? "" });
    };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        post({ type: e.shiftKey ? "redo" : "undo" });
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        post({ type: "redo" });
      } else if (e.key === "Enter" && editingEl) {
        e.preventDefault();
        editingEl.blur();
      } else if (e.key === "Escape" && editingEl) editingEl.blur();
    };
    const onBlur = (e: FocusEvent) => {
      if (e.target === editingEl) finish();
    };
    const onMessage = (e: MessageEvent<Msg>) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const m = e.data;
      if (m.type === "mode") {
        finish();
        setMode(m.mode);
      } else if (m.type === "set") {
        document.querySelectorAll<HTMLElement>(`[data-ck="${CSS.escape(m.key)}"]`).forEach((el) => {
          if (el.textContent !== m.value) el.textContent = m.value;
          if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", m.value);
        });
      } else if (m.type === "select") {
        document.querySelectorAll("[data-ck-selected]").forEach((el) => el.removeAttribute("data-ck-selected"));
        if (m.key) document.querySelectorAll<HTMLElement>(`[data-ck="${CSS.escape(m.key)}"]`).forEach((el) => (el.dataset.ckSelected = ""));
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusout", onBlur, true);
    window.addEventListener("message", onMessage);
    post({ type: "ready", path: window.location.pathname, keys: [...found] });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusout", onBlur, true);
      window.removeEventListener("message", onMessage);
      style.remove();
    };
  }, []);
  return null;
}
