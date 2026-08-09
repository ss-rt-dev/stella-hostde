"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";

const FEATURES = [
  {
    title: "Mitglieder verwalten",
    text: "Owner und Admins sehen alle Team-Mitglieder, Rollen und offene Aufgaben auf einen Blick.",
  },
  {
    title: "Aufgaben & Todos",
    text: "Team-Todos für alle – oder persönliche Listen. Zuweisen, priorisieren, abhaken.",
  },
  {
    title: "Ankündigungen",
    text: "Wichtige Infos an das ganze Team pinnen. Kein Chaos in Discord-Threads.",
  },
  {
    title: "Rollen & Rechte",
    text: "Admin, Moderator, Mitglied – klar getrennt. Wer zuweist, wer nur erledigt.",
  },
] as const;

const STEPS = [
  { n: "1", title: "Einloggen", text: "Account anlegen oder anmelden – fertig." },
  { n: "2", title: "Team sehen", text: "Mitglieder, offene Tasks und Updates im Dashboard." },
  { n: "3", title: "Aufgaben geben", text: "Todo anlegen, jemandem zuweisen, Status tracken." },
  { n: "4", title: "Erledigen", text: "Jeder hakt ab – Owner behält den Überblick." },
] as const;

function NavIcon({ type }: { type: "features" | "ablauf" | "faq" }) {
  const cls = "h-3.5 w-3.5 shrink-0 opacity-80";
  if (type === "features") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (type === "ablauf") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const HEADER_OFFSET = 72;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function LandingPage() {
  const { status } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLElement>(null);
  const dashHref = status === "authenticated" ? "/dashboard" : "/login";

  function onNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    scrollToId(id);
    history.replaceState(null, "", `#${id}`);
  }

  function onHeroMove(e: React.MouseEvent) {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--hx", `${x * 36}px`);
    el.style.setProperty("--hy", `${y * 24}px`);
  }

  function onHeroLeave() {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--hx", "0px");
    el.style.setProperty("--hy", "0px");
  }

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) window.setTimeout(() => scrollToId(hash), 80);
  }, []);

  const FAQ = [
    {
      q: "Was ist das Stella Dashboard?",
      a: "Ein Team-Dashboard: Mitglieder verwalten, Aufgaben verteilen, persönliche und Team-Todos führen – alles an einem Ort.",
    },
    {
      q: "Wer kann Aufgaben zuweisen?",
      a: "Admins und Moderatoren können Team-Todos anlegen und Mitgliedern zuweisen. Jeder kann eigene persönliche Todos führen.",
    },
    {
      q: "Brauche ich Hosting dafür?",
      a: "Nein. Das Team-Dashboard ist der Kern. Server-Hosting bleibt optional für Teams, die es nutzen.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <div className="border-b border-white/5 bg-[#111113]">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-zinc-400 sm:px-6">
          Stella Dashboard · Team · Todos · Mitglieder
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/92 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <a href="/" className="justify-self-start text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Dashboard</span>
          </a>
          <nav className="hidden items-center justify-center gap-0.5 md:flex">
            <a href="#features" onClick={(e) => onNavClick(e, "features")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="features" /> Features
            </a>
            <a href="#ablauf" onClick={(e) => onNavClick(e, "ablauf")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="ablauf" /> Ablauf
            </a>
            <a href="#faq" onClick={(e) => onNavClick(e, "faq")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="faq" /> FAQ
            </a>
          </nav>
          <div className="flex items-center justify-end gap-2">
            <a href="/login" className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline">Anmelden</a>
            <a href={dashHref} className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300">Zum Dashboard</a>
          </div>
        </div>
      </header>

      <section
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        className="relative overflow-hidden"
        style={{ "--hx": "0px", "--hy": "0px" } as React.CSSProperties}
      >
        <div
          className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-amber-500/20 blur-[90px] transition-transform duration-150"
          style={{ transform: "translate(var(--hx), var(--hy))" }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-sm text-amber-400/90">Neu · Team-first</p>
            <h1 className="text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-[2.75rem]">
              Das Stella Dashboard.<br />
              <span className="text-amber-400">Dein Team. Deine Aufgaben.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
              Owner und Admins verwalten Mitglieder, verteilen Todos und behalten den Überblick.
              Jeder kann persönliche Listen führen – das Team arbeitet an denselben Zielen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/register" className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300">Kostenlos starten</a>
              <a href="#features" onClick={(e) => onNavClick(e, "features")} className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04]">Mehr erfahren</a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121214] p-4 shadow-2xl shadow-black/40">
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              team dashboard · live
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-black/35 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">Landing Page finalisieren</p>
                  <p className="text-xs text-zinc-500">Team · zugewiesen an Alex</p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">OPEN</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/35 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">API Review</p>
                  <p className="text-xs text-zinc-500">Persönlich · du</p>
                </div>
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-400">IN PROGRESS</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/35 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">Onboarding neuer Member</p>
                  <p className="text-xs text-zinc-500">Team · High</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">DONE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-[72px] border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Was du bekommst</h2>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">Kein weiteres Tool-Chaos – ein Dashboard fürs Team.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-[#121214] p-5 transition hover:border-amber-500/30">
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ablauf" className="scroll-mt-[72px] border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Ablauf</h2>
          <p className="mt-2 text-sm text-zinc-500">In vier Schritten produktiv.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-[#121214] p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-sm font-bold text-black">{s.n}</span>
                <h3 className="mt-3 font-medium text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-[72px] border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">FAQ</h2>
          <div className="mt-8 space-y-2">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className={`rounded-xl border ${open ? "border-white/15 bg-[#121214]" : "border-white/10 bg-[#121214]/70"}`}>
                  <button type="button" onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
                    <span className="text-sm font-medium text-white">{item.q}</span>
                    <span className="text-zinc-500">{open ? "−" : "+"}</span>
                  </button>
                  {open && <div className="border-t border-white/5 px-4 pb-3.5 pt-2 text-sm leading-relaxed text-zinc-400">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-semibold text-white">Bereit fürs Team?</p>
              <p className="text-sm text-zinc-500">Registrieren und direkt im Dashboard starten.</p>
            </div>
            <div className="flex gap-2">
              <a href="/register" className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">Registrieren</a>
              <a href={dashHref} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Dashboard</a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
