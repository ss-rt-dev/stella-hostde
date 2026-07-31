"use client";

import { useEffect, useState } from "react";

type Discount = {
  id: string;
  code: string;
  percent: number;
  label: string | null;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
};

export default function AdminDiscountsPage() {
  const [list, setList] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(10);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/discounts");
    if (res.ok) setList(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        percent,
        label: label || undefined,
        maxUses: maxUses ? Number(maxUses) : null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Fehler");
      return;
    }
    setCode("");
    setLabel("");
    setMaxUses("");
    setMsg("Code gespeichert");
    load();
  }

  async function toggle(d: Discount) {
    setBusy(true);
    await fetch(`/api/admin/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Code löschen?")) return;
    setBusy(true);
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    setBusy(false);
    load();
  }

  if (loading) return <p className="text-zinc-500">Lade…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Rabatte</h1>
        <p className="text-sm text-zinc-500">Codes werden in der Datenbank gespeichert</p>
      </div>

      {msg && (
        <p className="text-sm text-amber-400">{msg}</p>
      )}

      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border border-white/10 bg-[#121214] p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          placeholder="Code (z.B. STELLA20)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
        />
        <input
          type="number"
          min={1}
          max={100}
          required
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          placeholder="%"
        />
        <input
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
        />
        <input
          type="number"
          min={1}
          placeholder="Max. Nutzungen (opt.)"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 lg:col-span-4 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Code speichern
        </button>
      </form>

      <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">Noch keine Codes</p>
        ) : (
          <div className="divide-y divide-white/5">
            {list.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-amber-400">{d.code}</p>
                  <p className="text-xs text-zinc-500">
                    {d.percent}% · {d.label || "—"} · benutzt {d.usedCount}
                    {d.maxUses != null ? `/${d.maxUses}` : ""}
                    {!d.active && " · DEAKTIVIERT"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggle(d)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                  >
                    {d.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(d.id)}
                    className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-400"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
