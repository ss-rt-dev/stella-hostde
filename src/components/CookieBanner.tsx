"use client";

import { useEffect, useState } from "react";

const KEY = "stella_cookie_consent";

function CookieIcon() {
  return (
    <svg
      className="h-5 w-5 text-amber-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a9 9 0 1 0 9 9c0-.5-.3-1-.8-1.1a2.5 2.5 0 0 1-2.2-3.6A2.5 2.5 0 0 1 14 3.9C13.7 3.3 12.9 3 12 3z"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="15.5" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept(all: boolean) {
    try {
      localStorage.setItem(KEY, all ? "all" : "necessary");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="glass-strong fixed bottom-4 right-4 z-[100] w-[min(100vw-2rem,340px)] rounded-2xl border border-amber-500/30 p-4 shadow-2xl shadow-black/40"
      style={{
        background: "rgba(12, 12, 14, 0.55)",
        backdropFilter: "blur(20px) saturate(1.5)",
        WebkitBackdropFilter: "blur(20px) saturate(1.5)",
      }}
      role="dialog"
      aria-label="Cookie-Hinweis"
    >
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
          <CookieIcon />
        </div>
        <p className="text-sm font-semibold text-white">Cookies</p>
      </div>
      <p className="text-xs leading-relaxed text-zinc-400">
        Wir nutzen notwendige Cookies für Login und Sicherheit. Optional können
        wir anonyme Nutzungsdaten speichern, um Stella Host zu verbessern.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => accept(true)}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-amber-500/20"
        >
          Alle akzeptieren
        </button>
        <button
          type="button"
          onClick={() => accept(false)}
          className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm hover:bg-white/10"
        >
          Nur notwendige
        </button>
      </div>
    </div>
  );
}
