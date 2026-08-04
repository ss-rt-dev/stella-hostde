import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Produkte — Stella Host",
  description: "Minecraft-Server, Discord-Bots und mehr – LXC-Hosting von Stella Host",
};

function NavIcon({ type }: { type: "produkte" | "warum" | "ablauf" | "faq" }) {
  const cls = "h-3.5 w-3.5 shrink-0 opacity-80";
  if (type === "produkte") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
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
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <a href="/" className="justify-self-start text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Host</span>
          </a>
          <nav className="hidden items-center justify-center gap-0.5 md:flex">
            <a href="/produkte" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-amber-300">
              <NavIcon type="produkte" /> Produkte
            </a>
            <a href="/#warum" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="warum" /> Warum Stella
            </a>
            <a href="/#ablauf" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="ablauf" /> Ablauf
            </a>
            <a href="/#faq" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-amber-300">
              <NavIcon type="faq" /> FAQ
            </a>
          </nav>
          <div className="flex items-center justify-end gap-2">
            {!session && (
              <a href="/login" className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline">
                Anmelden
              </a>
            )}
            <a href={dashHref} className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300">
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

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <a
            href={ctaHref}
            className="group relative flex min-h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-[#121214] transition hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
          >
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <span className="inline-flex rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  Beliebt
                </span>
                <h2 className="mt-3 text-lg font-semibold text-white sm:text-xl">Minecraft Server</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Eigener LXC mit fester CPU, RAM und SSD. Paper, Mods oder Vanilla – du entscheidest im Dashboard.
                </p>
                <p className="mt-3 text-xl font-bold text-amber-400">
                  2,50&nbsp;€
                  <span className="ml-1 text-sm font-normal text-zinc-500">/ Monat</span>
                </p>
              </div>
              <div className="mt-5">
                <span className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black transition group-hover:bg-amber-300">
                  Jetzt starten
                </span>
              </div>
            </div>
            <div className="relative hidden w-[40%] min-w-[140px] shrink-0 overflow-hidden sm:block">
              <img
                src="https://wallpapers.com/images/featured/minecraft-bilder-m1p4bwepy03eh8zg.jpg"
                alt="Minecraft"
                className="absolute left-1/2 top-1/2 h-[112%] w-[112%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/50 to-transparent" />
            </div>
          </a>

          <a
            href={ctaHref}
            className="group relative flex min-h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-[#121214] transition hover:border-[#5865F2]/50 hover:shadow-lg hover:shadow-[#5865F2]/10"
          >
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <span className="inline-flex rounded-md bg-[#5865F2]/15 px-2 py-0.5 text-[11px] font-medium text-[#a5b0ff]">
                  Bot-Hosting
                </span>
                <h2 className="mt-3 text-lg font-semibold text-white sm:text-xl">Discord Bot</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Node.js oder Python – stabiler LXC für deinen Bot. 24/7 online, ohne deinen PC.
                </p>
                <p className="mt-3 text-xl font-bold text-amber-400">
                  1,50&nbsp;€
                  <span className="ml-1 text-sm font-normal text-zinc-500">/ Monat</span>
                </p>
              </div>
              <div className="mt-5">
                <span className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black transition group-hover:bg-amber-300">
                  Jetzt starten
                </span>
              </div>
            </div>
            <div className="relative hidden w-[40%] min-w-[140px] shrink-0 overflow-hidden sm:block">
              <img
                src="https://dxbapps.com/blogimages/Discord.webp"
                alt="Discord Bot Hosting"
                className="absolute left-1/2 top-1/2 h-[112%] w-[112%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/55 to-transparent" />
            </div>
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
