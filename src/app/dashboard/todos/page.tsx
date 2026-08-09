"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  scope: "PERSONAL" | "TEAM";
  assignee: { id: string; name: string | null; email: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  dueAt: string | null;
  createdAt: string;
};

type Member = { id: string; name: string | null; email: string };

export default function TodosPage() {
  const searchParams = useSearchParams();
  const initialScope = searchParams.get("scope") || "ALL";

  const [todos, setTodos] = useState<Todo[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState(initialScope);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newScope, setNewScope] = useState<"PERSONAL" | "TEAM">("PERSONAL");
  const [assigneeId, setAssigneeId] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = scope !== "ALL" ? `?scope=${scope}` : "";
      const res = await fetch(`/api/team/todos${q}`);
      const data = await res.json();
      if (res.ok) {
        setTodos(data.todos || []);
        setCanAssign(Boolean(data.canAssign));
        if (data.canAssign) setNewScope("TEAM");
      }
    } catch {
      setError("Laden fehlgeschlagen");
    }
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canAssign) return;
    fetch("/api/team/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => {});
  }, [canAssign]);

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/team/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          scope: canAssign ? newScope : "PERSONAL",
          assigneeId: assigneeId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setShowForm(false);
      load();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: Todo["status"]) {
    await fetch(`/api/team/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function removeTodo(id: string) {
    if (!confirm("Todo löschen?")) return;
    await fetch(`/api/team/todos/${id}`, { method: "DELETE" });
    load();
  }

  const open = todos.filter((t) => t.status !== "DONE");
  const done = todos.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Todos</h1>
          <p className="text-sm text-zinc-500">Team-Aufgaben und persönliche Listen</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black"
        >
          {showForm ? "Abbrechen" : "+ Todo"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "Alle"],
            ["TEAM", "Team"],
            ["PERSONAL", "Persönlich"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              scope === id
                ? "bg-amber-400 text-black"
                : "border border-white/10 text-zinc-400 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={createTodo}
          className="space-y-4 rounded-2xl border border-amber-500/25 bg-[#121214] p-5"
        >
          <h2 className="font-semibold text-white">Neues Todo</h2>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="LOW">Niedrig</option>
              <option value="MEDIUM">Mittel</option>
              <option value="HIGH">Hoch</option>
            </select>
            {canAssign && (
              <>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                >
                  <option value="TEAM">Team</option>
                  <option value="PERSONAL">Persönlich</option>
                </select>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                >
                  <option value="">Kein Assignee</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "…" : "Anlegen"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Laden…</p>
      ) : (
        <div className="space-y-4">
          <TodoList
            title="Offen"
            items={open}
            onStatus={setStatus}
            onDelete={removeTodo}
          />
          {done.length > 0 && (
            <TodoList
              title="Erledigt"
              items={done}
              onStatus={setStatus}
              onDelete={removeTodo}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TodoList({
  title,
  items,
  onStatus,
  onDelete,
}: {
  title: string;
  items: Todo[];
  onStatus: (id: string, s: Todo["status"]) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-10 text-center text-sm text-zinc-500">
        Keine Einträge unter „{title}“
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
      <div className="border-b border-white/5 px-5 py-3">
        <h2 className="text-sm font-semibold text-white">
          {title} <span className="text-zinc-500">({items.length})</span>
        </h2>
      </div>
      <ul className="divide-y divide-white/5">
        {items.map((t) => (
          <li key={t.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-zinc-200">{t.title}</p>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                  {t.scope === "TEAM" ? "Team" : "Persönlich"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    t.priority === "HIGH"
                      ? "bg-red-500/15 text-red-400"
                      : t.priority === "LOW"
                        ? "bg-zinc-500/15 text-zinc-400"
                        : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
              {t.description && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{t.description}</p>
              )}
              <p className="mt-1 text-[11px] text-zinc-600">
                {t.assignee
                  ? `→ ${t.assignee.name || t.assignee.email}`
                  : "ohne Assignee"}{" "}
                · von {t.createdBy.name || t.createdBy.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {t.status !== "OPEN" && (
                <button
                  type="button"
                  onClick={() => onStatus(t.id, "OPEN")}
                  className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400"
                >
                  Offen
                </button>
              )}
              {t.status !== "IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={() => onStatus(t.id, "IN_PROGRESS")}
                  className="rounded-lg bg-sky-500/15 px-2.5 py-1 text-[11px] text-sky-400"
                >
                  Läuft
                </button>
              )}
              {t.status !== "DONE" && (
                <button
                  type="button"
                  onClick={() => onStatus(t.id, "DONE")}
                  className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-400"
                >
                  Fertig
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] text-red-400"
              >
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
