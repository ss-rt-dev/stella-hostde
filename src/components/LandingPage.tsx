"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const PILLARS = [
  { kicker: "1", title: "Eigene LXC, keine geteilte Kiste", text: "Du bekommst feste CPU, RAM und SSD. Nicht das, was gerade übrig ist." },
  { kicker: "2", title: "Schnell online", text: "Konfigurator ausfüllen, bestätigen – Proxmox legt den Container an. Meist in Minuten." },
  { kicker: "3", title: "Guthaben, kein Rätsel", text: "PayPal aufladen, monatlicher Preis pro Server. Keine versteckten „Fair-Use“-Fallen." },
  { kicker: "4", title: "Support direkt im Dashboard", text: "Ticket oder Team-Bewerbung – inkl. Discord-Name, wenn du dich bewirbst." },
] as const;

const WORKFLOW = [
  { title: "Bestellen", items: ["Ressourcen wählen", "Setup (Debian / MC / Bot)", "Optional Rabattcode"] },
  { title: "Laufen lassen", items: ["Start / Stop", "Status sehen", "Console im Browser"] },
  { title: "Dranbleiben", items: ["Dateien ändern", "Configs anpassen", "Ticket schreiben"] },
] as const;

const FAQ = [
  { q: "Wie komme ich rein?", a: "Account anlegen, Guthaben per PayPal laden, im Dashboard Server bauen. Der Rest läuft automatisch." },
  { q: "Womit zahle ich?", a: "Aktuell nur PayPal. Das Guthaben wird für die monatliche Servergebühr genutzt." },
  { q: "Wie lange dauert es bis der Server da ist?", a: "Meist ein paar Minuten. Hängt von Setup und Auslastung ab." },
  { q: "Kann ich den Account löschen?", a: "Ja, unter Konto → Gefahrenzone. Daten und Server werden mitgelöscht." },
] as const;

const HEADER_OFFSET = 72;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  el.classList.remove("section-flash");
  void el.offsetWidth;
  el.classList.add("section-flash");
  window.setTimeout(() => el.classList.remove("section-flash"), 900);
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function NavIcon({ type }: { type: "warum" | "ablauf" | "faq" }) {
  const cls = "h-3.5 w-3.5 shrink-0 opacity-80";
  if (type === "warum") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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

export default function LandingPage() {
  const { status } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activePillar, setActivePillar] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const warum = useInView();
  const ablauf = useInView();
  const dashHref = status === "authenticated" ? "/dashboard" : "/login";

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "warum" || hash === "ablauf" || hash === "faq") {
      window.setTimeout(() => scrollToId(hash), 80);
    }
  }, []);

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
    el.style.setProperty("--hx", `${x * 40}px`);
    el.style.setProperty("--hy", `${y * 26}px`);
    el.style.setProperty("--hx2", `${x * -28}px`);
    el.style.setProperty("--hy2", `${y * -18}px`);
  }

  function onHeroLeave() {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--hx", "0px");
    el.style.setProperty("--hy", "0px");
    el.style.setProperty("--hx2", "0px");
    el.style.setProperty("--hy2", "0px");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <div className="border-b border-white/5 bg-[#111113]">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-zinc-400 sm:px-6">
          Guthaben per PayPal · Server im Dashboard starten
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/92 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <a href="/" className="justify-self-start text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Host</span>
          </a>
          <nav className="hidden items-center justify-center gap-0.5 md:flex">
            <a href="#warum" onClick={(e) => onNavClick(e, "warum")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="warum" /> Warum Stella
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
            <a href={dashHref} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300">Dashboard</a>
          </div>
        </div>
      </header>

      <section ref={heroRef} onMouseMove={onHeroMove} onMouseLeave={onHeroLeave} className="relative overflow-hidden" style={{ "--hx": "0px", "--hy": "0px", "--hx2": "0px", "--hy2": "0px" } as React.CSSProperties}>
        <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-amber-500/20 blur-[80px] transition-transform duration-150 ease-out" style={{ transform: "translate(var(--hx), var(--hy))" }} />
        <div className="pointer-events-none absolute -right-12 bottom-4 h-56 w-56 rounded-full bg-amber-600/10 blur-[70px] transition-transform duration-150 ease-out" style={{ transform: "translate(var(--hx2), var(--hy2))" }} />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-sm text-amber-400/90">LXC · Proxmox · eigenes Dashboard</p>
            <h1 className="text-3xl font-bold leading-[1.15] text-white sm:text-4xl">
              Server ohne Theater.<br /><span className="text-amber-400">Einfach laufen lassen.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
              Minecraft, Bots oder plain Debian. Du baust im Dashboard, wir provisionieren auf Proxmox. Console und Dateien sind im gleichen Panel.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/register" className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300">Registrieren</a>
              <a href="#warum" onClick={(e) => onNavClick(e, "warum")} className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:border-white/20 hover:bg-white/[0.04]">Warum Stella?</a>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#121214] p-4 shadow-xl shadow-black/30 transition-transform duration-150 ease-out" style={{ transform: "translate(calc(var(--hx2) * 0.35), calc(var(--hy2) * 0.35))" }}>
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500"><span className="h-2 w-2 rounded-full bg-emerald-400" />dashboard · live</div>
            <div className="rounded-lg bg-black/40 px-3 py-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-white">mein-server</p><p className="text-xs text-zinc-500">2 vCPU · 2 GB · 20 GB</p></div>
                <span className="text-xs text-emerald-400">RUNNING</span>
              </div>
              <div className="mt-3 flex gap-2 text-xs text-zinc-500">
                <span className="rounded border border-white/10 px-2 py-1">Console</span>
                <span className="rounded border border-white/10 px-2 py-1">Dateien</span>
                <span className="rounded border border-white/10 px-2 py-1">Stop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="warum" className="scroll-mt-[72px] border-t border-white/5">
        <div ref={warum.ref} className={`mx-auto max-w-6xl px-4 py-14 sm:px-6 transition-opacity duration-500 ${warum.visible ? "opacity-100" : "opacity-40"}`}>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Warum Stella</h2>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">Kurz und ehrlich – was du wirklich bekommst.</p>
          <div className="relative mt-10">
            <ul className="space-y-4">
              {PILLARS.map((p, i) => {
                const open = activePillar === i;
                const isLast = i === PILLARS.length - 1;
                return (
                  <li key={p.kicker} className="relative flex gap-4 sm:gap-6">
                    {!isLast && (
                      <span className="pointer-events-none absolute left-[0.9rem] top-8 -bottom-4 hidden w-px -translate-x-1/2 bg-amber-500/30 sm:block" aria-hidden />
                    )}
                    <button type="button" onClick={() => setActivePillar(i)} className={`timeline-dot timeline-dot-core relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${open ? "timeline-dot-active border-amber-400 bg-amber-400 text-black" : "border-amber-500/40 bg-[#0a0a0c] text-amber-400"}`} style={{ animationDelay: `${i * 0.4}s` }}>
                      {p.kicker}
                    </button>
                    <button type="button" onClick={() => setActivePillar(i)} className={`flex-1 rounded-xl border px-4 py-3.5 text-left transition ${open ? "border-amber-500/30 bg-amber-500/[0.07]" : "border-white/10 bg-[#121214] hover:border-white/15"}`}>
                      <h3 className="font-medium text-white">{p.title}</h3>
                      {open ? <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{p.text}</p> : <p className="mt-1 text-xs text-zinc-600">öffnen</p>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section id="ablauf" className="scroll-mt-[72px] border-t border-white/5">
        <div ref={ablauf.ref} className={`mx-auto max-w-6xl px-4 py-14 sm:px-6 transition-opacity duration-500 ${ablauf.visible ? "opacity-100" : "opacity-40"}`}>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Ablauf</h2>
          <p className="mt-2 text-sm text-zinc-500">So sieht der Weg im Dashboard aus.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {WORKFLOW.map((w, i) => {
              const active = activeStep === i;
              return (
                <button key={w.title} type="button" onClick={() => setActiveStep(i)} onMouseEnter={() => setActiveStep(i)} className={`rounded-xl border p-5 text-left transition ${active ? "border-amber-500/35 bg-[#161618]" : "border-white/10 bg-[#121214] hover:border-white/15"}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${active ? "bg-amber-400 text-black" : "bg-white/10 text-zinc-400"}`}>{i + 1}</span>
                    <h3 className="font-medium text-white">{w.title}</h3>
                  </div>
                  <ul className="space-y-1.5">{w.items.map((item) => <li key={item} className="text-sm text-zinc-500">· {item}</li>)}</ul>
                </button>
              );
            })}
          </div>
          <div className="mt-6 text-sm text-zinc-500">
            Console, Dateien, Tickets – alles unter einem Login.{" "}
            <a href={dashHref} className="text-amber-400 hover:underline">Zum Dashboard</a>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-[72px] border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">FAQ</h2>
          <p className="mt-2 text-sm text-zinc-500">Die üblichen Fragen.</p>
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
              <p className="text-lg font-semibold text-white">Bereit?</p>
              <p className="text-sm text-zinc-500">Account, Guthaben, Server – in der Reihenfolge.</p>
            </div>
            <div className="flex gap-2">
              <a href="/register" className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">Registrieren</a>
              <a href={dashHref} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Dashboard</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:px-6">
          <p>Stella <span className="text-amber-400">Host</span> · 2026</p>
          <div className="flex gap-4">
            <a href="/impressum" className="hover:text-zinc-300">Impressum</a>
            <a href="/datenschutz" className="hover:text-zinc-300">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
