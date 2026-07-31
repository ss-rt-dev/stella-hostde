"use client";

import { useEffect, useState } from "react";

export function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [activeNow, setActiveNow] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function applyConfig(d: any) {
    setEnabled(Boolean(d.enabled));
    setActiveNow(Boolean(d.activeNow));
    setDateFrom(d.schedule?.dateFrom || "");
    setDateTo(d.schedule?.dateTo || "");
    setTimeFrom(d.schedule?.timeFrom || "");
    setTimeTo(d.schedule?.timeTo || "");
  }

  useEffect(() => {
    fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then(applyConfig)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(nextEnabled?: boolean) {
    const en = nextEnabled !== undefined ? nextEnabled : enabled;
    if (
      en &&
      nextEnabled === true &&
      !enabled &&
      !confirm(
        "Wartungsmodus aktivieren? Kunden sehen im Zeitfenster (oder dauerhaft) die Wartungsseite."
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: en,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          timeFrom: timeFrom || null,
          timeTo: timeTo || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Fehler");
        return;
      }
      applyConfig(data);
      setMsg("Gespeichert");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm text-zinc-500">
        Wartungsmodus wird geladen…
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 ${
        activeNow
          ? "border-amber-500/40 bg-amber-500/10"
          : enabled
            ? "border-amber-500/20 bg-[#121214]"
            : "border-white/10 bg-[#121214]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">Wartungsarbeiten</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {activeNow
              ? "Jetzt aktiv – Kunden sehen die Wartungsseite."
              : enabled
                ? "Eingeschaltet, aber außerhalb des Zeitfensters – Kunden haben Zugriff."
                : "Aus – alle Nutzer können das Dashboard nutzen."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => save(!enabled)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${
            enabled ? "bg-amber-400" : "bg-zinc-700"
          } disabled:opacity-50`}
          aria-pressed={enabled}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              enabled ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Von Tag <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Bis Tag <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Von Uhrzeit <span className="text-zinc-600">(optional, Berlin)</span>
          </label>
          <input
            type="time"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Bis Uhrzeit <span className="text-zinc-600">(optional, Berlin)</span>
          </label>
          <input
            type="time"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        Leer lassen = dauerhaft, solange der Schalter an ist. Datum und Zeit können
        einzeln oder kombiniert gesetzt werden (Zeitzone: Europe/Berlin).
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => save()}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Zeitplan speichern
        </button>
        {(dateFrom || dateTo || timeFrom || timeTo) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setTimeFrom("");
              setTimeTo("");
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            Felder leeren
          </button>
        )}
        {msg && <span className="text-xs text-emerald-400">{msg}</span>}
      </div>

      {activeNow && (
        <p className="text-xs font-medium text-amber-400">
          ● Wartung greift gerade für Kunden
        </p>
      )}
    </div>
  );
}
