"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "./LanguageProvider";
import { FlagIcon } from "./FlagIcon";
import type { LocaleCode } from "@/lib/i18n/locales";

export function LanguageButton() {
  const { locale, setLocale, t, info, locales } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const tmr = setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(tmr);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locales;
    return locales.filter(
      (l) =>
        l.native.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.label.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q)
    );
  }, [locales, query]);

  function pick(code: LocaleCode) {
    setLocale(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("chooseLanguage")}
        title={t("chooseLanguage")}
        className="fixed bottom-5 right-5 z-[80] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#121214]/90 shadow-lg shadow-black/40 backdrop-blur-xl transition hover:border-amber-400/40 hover:bg-[#1a1a1e] hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6"
      >
        <FlagIcon country={info.country} label={info.label} size={28} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-picker-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            className="relative z-[1] flex max-h-[min(85vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#121214] shadow-2xl shadow-black/50"
          >
            <div className="border-b border-white/5 px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FlagIcon country={info.country} label={info.label} size={32} />
                  <div>
                    <p
                      id="lang-picker-title"
                      className="text-base font-semibold text-white"
                    >
                      {t("chooseLanguage")}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {info.native} · {info.label}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  {t("close")}
                </button>
              </div>

              <div className="relative mt-4">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  ⌕
                </span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchLanguage")}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-zinc-500">
                  {t("no_results")}
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {filtered.map((l) => {
                    const active = l.code === locale;
                    return (
                      <li key={l.code}>
                        <button
                          type="button"
                          onClick={() => pick(l.code)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                            active
                              ? "bg-amber-400/15 ring-1 ring-amber-400/40"
                              : "hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                            <FlagIcon country={l.country} label={l.label} size={28} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-zinc-100">
                              {l.native}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {l.name} · {l.label}
                            </span>
                          </span>
                          {active && (
                            <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                              ✓
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-white/5 px-5 py-3 text-center text-[11px] text-zinc-600">
              {locales.length} · Stella Dashboard
            </div>
          </div>
        </div>
      )}
    </>
  );
}
