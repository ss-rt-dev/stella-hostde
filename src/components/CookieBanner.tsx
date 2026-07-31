"use client";

import { useEffect, useState } from "react";

const KEY = "stella_cookie_consent";

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
      className="fixed bottom-4 right-4 z-[100] w-[min(100vw-2rem,340px)] rounded-2xl border border-amber-500/25 bg-[#121214]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
      role="dialog"
      aria-label="Cookie-Hinweis"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🍪
        </span>
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
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 text-xs font-semibold text-black"
        >
          Alle akzeptieren
        </button>
        <button
          type="button"
          onClick={() => accept(false)}
          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
        >
          Nur notwendige
        </button>
      </div>
    </div>
  );
}
