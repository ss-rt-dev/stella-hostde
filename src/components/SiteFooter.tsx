/** Gemeinsamer Footer für Landing / Produkte / öffentliche Seiten */

// Links hier anpassen, sobald die Profile feststehen
const SOCIAL = {
  discord: "https://discord.gg/",
  instagram: "https://instagram.com/",
  tiktok: "https://www.tiktok.com/",
  youtube: "https://www.youtube.com/",
} as const;

function SocialIcon({ type }: { type: keyof typeof SOCIAL }) {
  const cls = "h-4 w-4";
  if (type === "discord") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
  }
  if (type === "instagram") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (type === "tiktok") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.94 4.37 6.3 6.3 0 001.86-4.47V8.73a8.2 8.2 0 004.84 1.55V6.84a4.84 4.84 0 01-1.2-.15z" />
      </svg>
    );
  }
  // youtube
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 px-4 py-6 text-xs text-zinc-500 sm:grid-cols-3 sm:px-6">
        {/* links: Platzhalter für Balance */}
        <div className="hidden sm:block" aria-hidden />

        {/* Mitte: Brand + Legal */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>
            Stella <span className="text-amber-400">Host</span> · 2026
          </span>
          <span className="hidden text-zinc-700 sm:inline" aria-hidden>
            ·
          </span>
          <a href="/impressum" className="transition hover:text-zinc-300">
            Impressum
          </a>
          <a href="/datenschutz" className="transition hover:text-zinc-300">
            Datenschutz
          </a>
        </div>

        {/* rechts: Social */}
        <div className="flex items-center justify-center gap-1 sm:justify-end">
          {(
            [
              ["discord", "Discord"],
              ["instagram", "Instagram"],
              ["tiktok", "TikTok"],
              ["youtube", "YouTube"],
            ] as const
          ).map(([key, label]) => (
            <a
              key={key}
              href={SOCIAL[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-amber-300"
            >
              <SocialIcon type={key} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
