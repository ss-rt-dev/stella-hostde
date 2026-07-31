"use client";

import { useEffect, useState } from "react";

export function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    const next = !enabled;
    if (
      next &&
      !confirm(
        "Wartungsmodus aktivieren? Nur Admins können dann noch das Dashboard nutzen."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (res.ok) setEnabled(Boolean(data.enabled));
      else alert(data.error || "Fehler");
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
      className={`rounded-2xl border p-5 ${
        enabled
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-white/10 bg-[#121214]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">Wartungsarbeiten</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {enabled
              ? "Aktiv – Kunden sehen nur die Wartungsseite. Admins haben vollen Zugriff."
              : "Aus – alle Nutzer können das Dashboard nutzen."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${
            enabled ? "bg-amber-400" : "bg-zinc-700"
          } disabled:opacity-50`}
          aria-pressed={enabled}
          title={enabled ? "Wartung deaktivieren" : "Wartung aktivieren"}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              enabled ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
      {enabled && (
        <p className="mt-3 text-xs font-medium text-amber-400">
          ● Wartungsmodus ist eingeschaltet
        </p>
      )}
    </div>
  );
}
