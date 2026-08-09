"use client";

import { useCallback, useEffect, useState } from "react";

type Person = { id: string; name: string | null; email: string };

type Subtask = {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  scope: "PERSONAL" | "TEAM";
  assignee: Person | null;
  assignees: Person[];
  subtasks: Subtask[];
  createdBy: Person;
  dueAt: string | null;
  createdAt: string;
};

type Member = Person & { role?: string };

export default function AufgabenPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("ALL");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newScope, setNewScope] = useState<"PERSONAL" | "TEAM">("PERSONAL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newSubTitle, setNewSubTitle] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const s = new URLSearchParams(window.location.search).get("scope");
      if (s === "TEAM" || s === "PERSONAL" || s === "ALL") setScope(s);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = scope !== "ALL" ? `?scope=${scope}` : "";
      const res = await fetch(`/api/team/todos${q}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.todos || []);
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

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const subs = subtaskDrafts.map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/team/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          scope: canAssign ? newScope : "PERSONAL",
          assigneeIds: canAssign ? selectedIds : undefined,
          subtasks: subs.length ? subs : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      setTitle("");
      setDescription("");
      setSelectedIds([]);
      setSubtaskDrafts([""]);
      setShowForm(false);
      load();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: Task["status"]) {
    await fetch(`/api/team/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function removeTask(id: string) {
    if (!confirm("Aufgabe löschen?")) return;
    await fetch(`/api/team/todos/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleSub(todoId: string, sub: Subtask) {
    await fetch(`/api/team/todos/${todoId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !sub.done }),
    });
    load();
  }

  async function addSub(todoId: string) {
    const t = (newSubTitle[todoId] || "").trim();
    if (!t) return;
    await fetch(`/api/team/todos/${todoId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t }),
    });
    setNewSubTitle((m) => ({ ...m, [todoId]: "" }));
    load();
  }

  async function deleteSub(todoId: string, subId: string) {
    await fetch(`/api/team/todos/${todoId}/subtasks/${subId}`, {
      method: "DELETE",
    });
    load();
  }

  const open = tasks.filter((t) => t.status !== "DONE");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Aufgaben</h1>
          <p className="text-sm text-zinc-500">
            Nur zugewiesene Mitglieder sehen die Aufgabe · Unteraufgaben möglich
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black"
        >
          {showForm ? "Abbrechen" : "+ Aufgabe"}
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
          onSubmit={createTask}
          className="space-y-4 rounded-2xl border border-amber-500/25 bg-[#121214] p-5"
        >
          <h2 className="font-semibold text-white">Neue Aufgabe</h2>
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
              <select
                value={newScope}
                onChange={(e) => setNewScope(e.target.value as any)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="TEAM">Team</option>
                <option value="PERSONAL">Persönlich</option>
              </select>
            )}
          </div>

          {canAssign && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">
                Zugewiesen an (nur diese sehen die Aufgabe)
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const on = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        on
                          ? "bg-amber-400 text-black"
                          : "border border-white/10 text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      {m.name || m.email}
                    </button>
                  );
                })}
                {members.length === 0 && (
                  <p className="text-xs text-zinc-600">Keine Mitglieder geladen</p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Unteraufgaben (optional)</p>
            <div className="space-y-2">
              {subtaskDrafts.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={(e) => {
                      const next = [...subtaskDrafts];
                      next[i] = e.target.value;
                      setSubtaskDrafts(next);
                    }}
                    placeholder={`Unteraufgabe ${i + 1}`}
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                  {subtaskDrafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSubtaskDrafts(subtaskDrafts.filter((_, j) => j !== i))
                      }
                      className="rounded-xl px-2 text-xs text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSubtaskDrafts([...subtaskDrafts, ""])}
                className="text-xs text-amber-400 hover:underline"
              >
                + Unteraufgabe
              </button>
            </div>
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
          <TaskList
            title="Offen"
            items={open}
            expanded={expanded}
            setExpanded={setExpanded}
            onStatus={setStatus}
            onDelete={removeTask}
            onToggleSub={toggleSub}
            onAddSub={addSub}
            onDeleteSub={deleteSub}
            newSubTitle={newSubTitle}
            setNewSubTitle={setNewSubTitle}
          />
          {done.length > 0 && (
            <TaskList
              title="Erledigt"
              items={done}
              expanded={expanded}
              setExpanded={setExpanded}
              onStatus={setStatus}
              onDelete={removeTask}
              onToggleSub={toggleSub}
              onAddSub={addSub}
              onDeleteSub={deleteSub}
              newSubTitle={newSubTitle}
              setNewSubTitle={setNewSubTitle}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TaskList({
  title,
  items,
  expanded,
  setExpanded,
  onStatus,
  onDelete,
  onToggleSub,
  onAddSub,
  onDeleteSub,
  newSubTitle,
  setNewSubTitle,
}: {
  title: string;
  items: Task[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  onStatus: (id: string, s: Task["status"]) => void;
  onDelete: (id: string) => void;
  onToggleSub: (todoId: string, sub: Subtask) => void;
  onAddSub: (todoId: string) => void;
  onDeleteSub: (todoId: string, subId: string) => void;
  newSubTitle: Record<string, string>;
  setNewSubTitle: React.Dispatch<React.SetStateAction<Record<string, string>>>;
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
        {items.map((t) => {
          const open = expanded === t.id;
          const doneCount = t.subtasks.filter((s) => s.done).length;
          const people =
            t.assignees?.length > 0
              ? t.assignees
              : t.assignee
                ? [t.assignee]
                : [];

          return (
            <li key={t.id} className="px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : t.id)}
                    className="text-left"
                  >
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
                      {t.subtasks.length > 0 && (
                        <span className="text-[10px] text-zinc-500">
                          {doneCount}/{t.subtasks.length} Unteraufgaben
                        </span>
                      )}
                    </div>
                  </button>
                  {t.description && (
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{t.description}</p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {people.length
                      ? `→ ${people.map((p) => p.name || p.email).join(", ")}`
                      : "niemand zugewiesen (nur Owner/Admin)"}{" "}
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
              </div>

              {open && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-black/30 p-3">
                  <p className="text-xs font-medium text-zinc-400">Unteraufgaben</p>
                  {t.subtasks.length === 0 && (
                    <p className="text-xs text-zinc-600">Noch keine</p>
                  )}
                  {t.subtasks.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleSub(t.id, s)}
                        className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${
                          s.done
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-white/20 text-transparent"
                        }`}
                      >
                        ✓
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          s.done ? "text-zinc-500 line-through" : "text-zinc-200"
                        }`}
                      >
                        {s.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteSub(t.id, s.id)}
                        className="text-[10px] text-red-400/80"
                      >
                        Löschen
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      value={newSubTitle[t.id] || ""}
                      onChange={(e) =>
                        setNewSubTitle((m) => ({ ...m, [t.id]: e.target.value }))
                      }
                      placeholder="Neue Unteraufgabe"
                      className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onAddSub(t.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onAddSub(t.id)}
                      className="rounded-lg bg-amber-400/90 px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      + 
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
