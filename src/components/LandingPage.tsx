"use client";

import { useState } from "react";
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
    title: "Hilfe im Panel",
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

export default function LandingPage() {
  const { status } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const dashHref = status === "authenticated" ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      {/* Promo */}
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm">
          <span className="text-amber-300">Angebot</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-300">
            Starte im Dashboard – Guthaben aufladen und Server in Minuten online
          </span>
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Host</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#warum" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              Warum Stella
            </a>
            <a href="#ablauf" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              Ablauf
            </a>
            <a href="#faq" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              LXC · Proxmox · Dashboard
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Hosting mit klarer Kontrolle –
              <span className="text-amber-400"> ohne Chaos.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-400">
              Minecraft, Discord-Bots oder Debian-LXC. Provisionierung über Proxmox,
              Verwaltung im Panel – Console, Dateien und Support an einem Ort.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-yellow-400"
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

          <div className="rounded-2xl border border-white/10 bg-[#121214] p-1 shadow-2xl shadow-black/40">
            <div className="rounded-xl border border-white/5 bg-[#0c0c0e] p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs text-zinc-500">stella-host · dashboard</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
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
                      className="rounded-lg border border-white/5 bg-white/[0.03] py-2 text-center text-xs text-zinc-400"
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

      {/* Warum Stella – statt "Essential Features" 6er-Grid */}
      <section id="warum" className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
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
              Keine Feature-Liste zum Abhaken – vier Punkte, die den Alltag bestimmen.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-[1.15rem] top-3 bottom-3 hidden w-px bg-gradient-to-b from-amber-500/40 via-white/10 to-transparent sm:block" />
            <ul className="space-y-6 sm:space-y-8">
              {PILLARS.map((p) => (
                <li key={p.kicker} className="relative flex gap-5 sm:gap-8">
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-[#0a0a0c] text-xs font-bold text-amber-400">
                    {p.kicker}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent px-5 py-4 sm:px-6 sm:py-5">
                    <h3 className="text-base font-semibold text-white sm:text-lg">{p.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ablauf – statt "Advanced Server Management" Sidebar-Tabs */}
      <section id="ablauf" className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
              Im Panel
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Drei Schritte. Fertig.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Von der Bestellung bis zur Pflege – ohne komplizierte „Advanced Management“-Show.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {WORKFLOW.map((w, i) => (
              <div
                key={w.step}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214] p-6"
              >
                <span className="pointer-events-none absolute -right-2 -top-4 text-7xl font-black text-white/[0.03]">
                  {w.step}
                </span>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-sm font-bold text-black">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{w.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {w.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-center text-sm text-zinc-300">
            <span>Console · Dateien · Tickets · Team-Bewerbung</span>
            <a
              href={dashHref}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300"
            >
              Panel öffnen
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
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
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
            >
              Registrieren
            </a>
            <a
              href={dashHref}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
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
