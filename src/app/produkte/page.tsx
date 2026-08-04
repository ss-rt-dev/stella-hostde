import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Produkte — Stella Host",
  description: "Minecraft-Server und mehr – LXC-Hosting von Stella Host",
};

export default async function ProduktePage() {
  const session = await getServerSession(authOptions);
  const dashHref = session ? "/dashboard" : "/login";
  const ctaHref = session ? "/dashboard/servers" : "/register";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <div className="border-b border-white/5 bg-[#111113]">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-zinc-400 sm:px-6">
          Guthaben per PayPal · Server im Dashboard starten
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Host</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="/produkte"
              className="rounded-lg px-3 py-1.5 text-sm text-amber-300"
            >
              Produkte
            </a>
            <a
              href="/#warum"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300"
            >
              Warum Stella
            </a>
            <a
              href="/#faq"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {!session && (
              <a
                href="/login"
                className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline"
              >
                Anmelden
              </a>
            )}
            <a
              href={dashHref}
              className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Produkte</h1>
        <p className="mt-2 max-w-lg text-sm text-zinc-500">
          Wähle dein Setup – starte im Dashboard in wenigen Minuten.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Minecraft – Bild rechts, Hover ohne Spalt */}
          <a
            href={ctaHref}
            className="group relative flex min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#121214] transition hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 sm:col-span-2 lg:col-span-2"
          >
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <span className="inline-flex rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  Beliebt
                </span>
                <h2 className="mt-3 text-lg font-semibold text-white sm:text-xl">
                  Minecraft Server
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Eigener LXC mit fester CPU, RAM und SSD. Paper, Mods oder Vanilla – du
                  entscheidest im Dashboard.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <span className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black transition group-hover:bg-amber-300">
                  Jetzt starten
                </span>
                <span className="text-xs text-zinc-500">ab deinem Guthaben</span>
              </div>
            </div>

            {/* overflow-hidden + Bild leicht größer → kein Spalt beim Scale */}
            <div className="relative hidden w-[42%] min-w-[160px] shrink-0 overflow-hidden sm:block">
              <img
                src="https://wallpapers.com/images/featured/minecraft-bilder-m1p4bwepy03eh8zg.jpg"
                alt="Minecraft"
                className="absolute left-1/2 top-1/2 h-[112%] w-[112%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/50 to-transparent" />
            </div>
          </a>

          <div className="flex min-h-[180px] flex-col justify-center rounded-2xl border border-dashed border-white/10 bg-[#121214]/50 p-6 text-center">
            <p className="text-sm font-medium text-zinc-400">Weitere Produkte</p>
            <p className="mt-1 text-xs text-zinc-600">Bot-Hosting, plain Debian – bald hier.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:px-6">
          <p>
            Stella <span className="text-amber-400">Host</span> · 2026
          </p>
          <div className="flex gap-4">
            <a href="/impressum" className="hover:text-zinc-300">
              Impressum
            </a>
            <a href="/datenschutz" className="hover:text-zinc-300">
              Datenschutz
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
