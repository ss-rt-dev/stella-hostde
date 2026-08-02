"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const PILLARS = [
  {
    kicker: "01",
    title: "LXC statt Teilen",
    text: "Jeder Server läuft isoliert. Feste vCPU, RAM und SSD – ohne „Fair-Use“-Überraschungen.",
  },
  {
    kicker: "02",
    title: "Minuten bis online",
    text: "Konfigurator, Provisionierung über Proxmox, fertig. Kein Ticket für den ersten Start.",
  },
  {
    kicker: "03",
    title: "Geld bleibt nachvollziehbar",
    text: "Guthaben per PayPal, klare Monatspreise. Was du siehst, wird abgebucht.",
  },
  {
    kicker: "04",
    title: "Hilfe im Dashboard",
    text: "Support-Tickets und Team-Bewerbungen direkt im Dashboard – Discord-Name, Rolle, Kontext.",
  },
] as const;

const WORKFLOW = [
  {
    step: "A",
    title: "Bauen",
    items: ["CPU / RAM / SSD wählen", "Debian, Minecraft oder Bot", "Rabattcode optional"],
  },
  {
    step: "B",
    title: "Steuern",
    items: ["Start & Stop", "Live-Status", "Web-Console im Browser"],
  },
  {
    step: "C",
    title: "Pflegen",
    items: ["Dateimanager", "Configs anpassen", "Support-Ticket öffnen"],
  },
] as const;

const FAQ = [
  {
    q: "Wie starte ich?",
    a: "Registrieren, Guthaben per PayPal aufladen und im Dashboard einen Server konfigurieren. Die Erstellung läuft automatisch.",
  },
  {
    q: "Welche Zahlungsmittel gibt es?",
    a: "Aktuell PayPal. Das Guthaben wird für die monatliche Servergebühr verwendet.",
  },
  {
    q: "Wie schnell ist ein Server online?",
    a: "In der Regel innerhalb weniger Minuten nach erfolgreicher Erstellung – abhängig von Setup und Last.",
  },
  {
    q: "Kann ich meinen Account löschen?",
    a: "Ja. Unter Konto → Gefahrenzone kannst du Konto und zugehörige Daten selbst löschen.",
  },
] as const;

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    );
  }
  if (type === "ablauf") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
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

  function onHeroMove(e: React.MouseEvent) {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--hx", `${x * 55}px`);
    el.style.setProperty("--hy", `${y * 36}px`);
    el.style.setProperty("--hx2", `${x * -40}px`);
    el.style.setProperty("--hy2", `${y * -28}px`);
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
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm">
          <span className="text-amber-300">Angebot</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-300">
            Starte im Dashboard – Guthaben aufladen und Server in Minuten online
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <a href="/" className="justify-self-start text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Host</span>
          </a>
          <nav className="hidden items-center justify-center gap-1 md:flex">
            <a
              href="#warum"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300"
            >
              <NavIcon type="warum" />
              Warum Stella
            </a>
            <a
              href="#ablauf"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300"
            >
              <NavIcon type="ablauf" />
              Ablauf
            </a>
            <a
              href="#faq"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300"
            >
              <NavIcon type="faq" />
              FAQ
            </a>
          </nav>
          <div className="flex items-center justify-end gap-2">
            <a
              href="/login"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline"
            >
              Anmelden
            </a>
            <a
              href={dashHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <section
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        className="relative overflow-hidden"
        style={
          {
            "--hx": "0px",
            "--hy": "0px",
            "--hx2": "0px",
            "--hy2": "0px",
          } as React.CSSProperties
        }
      >
        <div
          className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-500/30 blur-[90px] transition-transform duration-100 ease-out"
          style={{ transform: "translate(var(--hx), var(--hy))" }}
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-yellow-500/20 blur-[80px] transition-transform duration-100 ease-out"
          style={{ transform: "translate(var(--hx2), var(--hy2))" }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div
            className="page-slide-in"
            style={{
              transform: "translate(calc(var(--hx) * 0.2), calc(var(--hy) * 0.2))",
              transition: "transform 0.1s ease-out",
            }}
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              LXC · Proxmox · Dashboard
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Hosting mit klarer Kontrolle –
              <span className="text-amber-400"> ohne Chaos.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-400">
              Minecraft, Discord-Bots oder Debian-LXC. Provisionierung über Proxmox,
              Verwaltung im Dashboard – Console, Dateien und Support an einem Ort.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:scale-[1.03] hover:from-amber-300 hover:to-yellow-400 active:scale-[0.98]"
              >
                Kostenlos registrieren
              </a>
              <a
                href="#warum"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-amber-500/30 hover:bg-white/[0.06]"
              >
                Mehr erfahren
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-xs text-zinc-500">
              <div>
                <p className="text-lg font-semibold text-white">Minuten</p>
                <p>bis zum Server</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">LXC</p>
                <p>isolierte Container</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">PayPal</p>
                <p>Guthaben aufladen</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border border-white/10 bg-[#121214] p-1 shadow-2xl shadow-black/40 transition-transform duration-100 ease-out"
            style={{
              transform:
                "translate(calc(var(--hx2) * 0.55), calc(var(--hy2) * 0.55))",
            }}
          >
            <div className="rounded-xl border border-white/5 bg-[#0c0c0e] p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs text-zinc-500">stella-host · dashboard</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 transition hover:bg-white/[0.06]">
                  <div>
                    <p className="text-sm font-medium text-white">mein-server</p>
                    <p className="text-xs text-zinc-500">2 vCPU · 2 GB RAM · 20 GB</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    RUNNING
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Console", "Dateien", "Stop"].map((l) => (
                    <div
                      key={l}
                      className="cursor-default rounded-lg border border-white/5 bg-white/[0.03] py-2 text-center text-xs text-zinc-400 transition hover:border-amber-500/30 hover:text-amber-300"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs font-medium text-amber-400">Status</p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Node online · Setup bereit · Support aktiv
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="warum" className="border-t border-white/5">
        <div
          ref={warum.ref}
          className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 transition-all duration-700 ${
            warum.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                Haltung
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Warum Stella anders läuft
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
              Klick auf einen Punkt – Details öffnen sich.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-[1.15rem] top-4 bottom-4 hidden w-0.5 bg-gradient-to-b from-amber-400/70 via-amber-500/25 to-transparent sm:block" />
            <ul className="space-y-5 sm:space-y-6">
              {PILLARS.map((p, i) => {
                const open = activePillar === i;
                return (
                  <li
                    key={p.kicker}
                    className={`relative flex gap-5 sm:gap-8 transition-all duration-500 ${
                      warum.visible
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-6"
                    }`}
                    style={{ transitionDelay: warum.visible ? `${i * 120}ms` : "0ms" }}
                  >
                    <button
                      type="button"
                      onClick={() => setActivePillar(i)}
                      className={`timeline-dot timeline-dot-core relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                        open
                          ? "timeline-dot-active scale-110 border-amber-300 bg-amber-400 text-black"
                          : "border-amber-500/50 bg-[#0a0a0c] text-amber-400 hover:border-amber-400"
                      }`}
                      style={{ animationDelay: `${i * 0.35}s` }}
                    >
                      {p.kicker}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePillar(i)}
                      className={`flex-1 rounded-2xl border px-5 py-4 text-left transition duration-300 sm:px-6 sm:py-5 ${
                        open
                          ? "border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-transparent shadow-[0_0_48px_-10px_rgba(251,191,36,0.45)]"
                          : "border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-white/20"
                      }`}
                    >
                      <h3 className="text-base font-semibold text-white sm:text-lg">{p.title}</h3>
                      <div
                        className={`grid transition-all duration-350 ${
                          open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <p className="overflow-hidden max-w-2xl text-sm leading-relaxed text-zinc-400">
                          {p.text}
                        </p>
                      </div>
                      {!open && (
                        <p className="mt-1 text-xs text-zinc-600">Tippen zum Lesen</p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section id="ablauf" className="border-t border-white/5">
        <div
          ref={ablauf.ref}
          className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 transition-all duration-700 ${
            ablauf.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
              Im Dashboard
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Drei Schritte. Fertig.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Klicke die Karten – so läuft dein Weg im Dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {WORKFLOW.map((w, i) => {
              const active = activeStep === i;
              return (
                <button
                  key={w.step}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  onMouseEnter={() => setActiveStep(i)}
                  className={`relative overflow-hidden rounded-2xl border p-6 text-left transition duration-300 ${
                    active
                      ? "scale-[1.03] border-amber-500/50 bg-[#161618] shadow-[0_0_55px_-12px_rgba(251,191,36,0.5)]"
                      : "border-white/10 bg-[#121214] hover:border-white/20"
                  } ${
                    ablauf.visible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    transitionDelay: ablauf.visible ? `${i * 100}ms` : "0ms",
                  }}
                >
                  <span
                    className={`pointer-events-none absolute -right-2 -top-4 text-7xl font-black transition ${
                      active ? "text-amber-500/15" : "text-white/[0.03]"
                    }`}
                  >
                    {w.step}
                  </span>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition ${
                        active ? "bg-amber-400 text-black" : "bg-white/10 text-zinc-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{w.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {w.items.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2 text-sm transition ${
                          active ? "text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            active ? "bg-amber-400" : "bg-zinc-600"
                          }`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-center text-sm text-zinc-300">
            <span>Console · Dateien · Tickets · Team-Bewerbung</span>
            <a
              href={dashHref}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black transition hover:scale-105 hover:bg-amber-300"
            >
              Dashboard öffnen
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Häufige Fragen</h2>
            <p className="mt-2 text-sm text-zinc-400">Kurze Antworten vor dem Start</p>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-xl border transition ${
                    open
                      ? "border-amber-500/25 bg-[#121214]"
                      : "border-white/10 bg-[#121214]/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-medium text-white">{item.q}</span>
                    <span
                      className={`text-lg text-zinc-500 transition ${
                        open ? "rotate-45 text-amber-400" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-white/5 px-4 pb-4 pt-2 text-sm leading-relaxed text-zinc-400">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Bereit für deinen Server?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Account anlegen, Guthaben laden, Server starten.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/register"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-300"
            >
              Registrieren
            </a>
            <a
              href={dashHref}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Zum Dashboard
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-xs text-zinc-500 sm:px-6">
          <p className="font-medium text-zinc-400">
            Stella <span className="text-amber-400">Host</span> · © 2026
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/impressum" className="hover:text-amber-400">
              Impressum
            </a>
            <span>·</span>
            <a href="/datenschutz" className="hover:text-amber-400">
              Datenschutz
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
