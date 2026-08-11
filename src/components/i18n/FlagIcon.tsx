"use client";

import { useState } from "react";
import { flagUrl } from "@/lib/i18n/locales";

/** Echte Flagge als Bild – Fallback: Ländercode (DE, JP, …) */
export function FlagIcon({
  country,
  label,
  size = 24,
  className = "",
}: {
  country: string;
  label: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-white/10 font-mono font-semibold text-zinc-300 ${className}`}
        style={{ width: size, height: size * 0.75, fontSize: Math.max(9, size * 0.38) }}
        title={label}
      >
        {label}
      </span>
    );
  }

  return (
    <img
      src={flagUrl(country, size <= 20 ? 20 : size <= 32 ? 40 : 80)}
      alt={label}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`rounded-sm object-cover shadow-sm ring-1 ring-black/20 ${className}`}
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}
