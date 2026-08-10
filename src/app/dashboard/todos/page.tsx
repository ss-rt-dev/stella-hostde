"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  GripVertical,
  ListTodo,
  Plus,
  Trash2,
  User,
  Flag,
  X,
  Users,
} from "lucide-react";

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
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState<"open" | "done" | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newScope, setNewScope] = useState<"PERSONAL" | "TEAM">("TEAM");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState("");

  const load = useCallback(async () => {
    try {
      const [todosRes, membersRes] = await Promise.all([
        fetch("/api/team/todos"),
        fetch("/api/team/members"),
      ]);
      const todosData = await todosRes.json();
      const membersData = await membersRes.json();

      if (todosRes.ok) {
        setTasks(todosData.todos || []);
        setCanAssign(Boolean(todosData.canAssign));
        if (todosData.canAssign) setNewScope("TEAM");
      }
      if (membersRes.ok) {
        setMembers(membersData.members || []);
        if (membersData.canManage) setCanAssign(true);
      }
    } catch {
      setError("Laden fehlgeschlagen");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
          assigneeIds: selectedIds.length ? selectedIds : undefined,
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
      await load();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: Task["status"]) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    void fetch(`/api/team/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((res) => {
      if (!res.ok) load();
    });
  }

  async function removeTask(id: string) {
    if (!confirm("Aufgabe löschen?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
    void fetch(`/api/team/todos/${id}`, { method: "DELETE" });
  }

  async function toggleSub(todoId: string, sub: Subtask) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== todoId
          ? t
          : {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === sub.id ? { ...s, done: !s.done } : s
              ),
            }
      )
    );
    void fetch(`/api/team/todos/${todoId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !sub.done }),
    });
  }

  async function addSub(todoId: string) {
    const t = newSubTitle.trim();
    if (!t) return;
    setNewSubTitle("");
    const res = await fetch(`/api/team/todos/${todoId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t }),
    });
    if (res.ok) load();
  }

  async function deleteSub(todoId: string, subId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== todoId
          ? t
          : { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) }
      )
    );
    void fetch(`/api/team/todos/${todoId}/subtasks/${subId}`, {
      method: "DELETE",
    });
  }

  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDragId(null);
    setDropOver(null);
  }

  function onDropColumn(col: "open" | "done") {
    const id = dragId;
    if (!id) return;
    void setStatus(id, col === "done" ? "DONE" : "OPEN");
    setDragId(null);
    setDropOver(null);
  }

  const openTasks = tasks.filter((t) => t.status !== "DONE");
  const doneTasks = tasks.filter((t) => t.status === "DONE");
  const selected = tasks.find((t) => t.id === selectedId) || null;

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Aufgaben</h1>
            <p className="text-xs text-zinc-500">
              Links Aufgaben wählen · in „Nicht erledigt“ / „Erledigt“ ziehen
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Schließen" : "Aufgabe"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={createTask}
          className="space-y-4 rounded-2xl border border-amber-500/25 bg-[#121214] p-4 sm:p-5"
        >
          <h2 className="text-sm font-semibold text-white">Neue Aufgabe</h2>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel der Aufgabe"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />

          <div className="flex flex-wrap gap-2">
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
                <option value="TEAM">Team-Aufgabe</option>
                <option value="PERSONAL">Persönlich</option>
              </select>
            )}
          </div>

          {/* Mitglieder auswählen – wie Team-Karten */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Für wen? (anklicken zum Auswählen)
              </p>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-zinc-600">Keine Mitglieder im Team</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((m) => {
                  const on = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        on
                          ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                          : "border-white/10 bg-black/30 hover:border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              on
                                ? "bg-amber-400 text-black"
                                : "bg-white/10 text-zinc-300"
                            }`}
                          >
                            {(m.name || m.email || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {m.name || m.email}
                            </p>
                            <p className="truncate text-[11px] text-zinc-500">
                              {m.role || "MEMBER"}
                              {m.name ? ` · ${m.email}` : ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            on
                              ? "bg-amber-400 text-black"
                              : "bg-white/5 text-zinc-500"
                          }`}
                        >
                          {on ? "Ausgewählt" : "Wählen"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedIds.length > 0 && (
              <p className="mt-2 text-xs text-amber-400/90">
                {selectedIds.length} Mitglied
                {selectedIds.length === 1 ? "" : "er"} ausgewählt – nur diese
                sehen die Aufgabe
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500">Unteraufgaben (optional)</p>
            {subtaskDrafts.map((s, i) => (
              <input
                key={i}
                value={s}
                onChange={(e) => {
                  const next = [...subtaskDrafts];
                  next[i] = e.target.value;
                  setSubtaskDrafts(next);
                }}
                placeholder={`Unteraufgabe ${i + 1}`}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
              />
            ))}
            <button
              type="button"
              onClick={() => setSubtaskDrafts([...subtaskDrafts, ""])}
              className="text-xs text-amber-400"
            >
              + Unteraufgabe
            </button>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "…" : "Aufgabe anlegen"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Laden…</p>
      ) : (
        <div className="grid flex-1 gap-3 lg:grid-cols-[260px_1fr_1fr]">
          {/* LINKS: alle Aufgaben – von hier ziehen */}
          <aside className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
            <div className="border-b border-white/5 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-300">
                  Aufgaben ({tasks.length})
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                Ziehen → in die rechte Spalte legen
              </p>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {tasks.length === 0 && (
                <li className="px-3 py-10 text-center text-xs text-zinc-600">
                  Noch keine Aufgaben – oben „Aufgabe“ klicken
                </li>
              )}
              {tasks.map((t) => {
                const done = t.status === "DONE";
                const active = selectedId === t.id;
                const people =
                  t.assignees?.length > 0
                    ? t.assignees
                    : t.assignee
                      ? [t.assignee]
                      : [];
                return (
                  <li key={t.id}>
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => setSelectedId(t.id)}
                      className={`flex cursor-grab items-start gap-2 border-b border-white/5 px-3 py-2.5 transition active:cursor-grabbing ${
                        active ? "bg-amber-500/10" : "hover:bg-white/[0.03]"
                      } ${dragId === t.id ? "opacity-40" : ""}`}
                    >
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            done
                              ? "text-zinc-500 line-through"
                              : "text-zinc-200"
                          }`}
                        >
                          {t.title}
                        </p>
                        {people.length > 0 && (
                          <p className="truncate text-[10px] text-zinc-600">
                            {people.map((p) => p.name || p.email).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>

          <DropColumn
            title="Nicht erledigt"
            count={openTasks.length}
            variant="open"
            active={dropOver === "open"}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropOver("open");
            }}
            onDragLeave={() => setDropOver(null)}
            onDrop={() => onDropColumn("open")}
          >
            {openTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                selected={selectedId === t.id}
                dragging={dragId === t.id}
                onSelect={() => setSelectedId(t.id)}
                onDragStart={(e) => onDragStart(e, t.id)}
                onDragEnd={onDragEnd}
                onToggleDone={() => setStatus(t.id, "DONE")}
                onDelete={() => removeTask(t.id)}
              />
            ))}
            {openTasks.length === 0 && (
              <p className="px-2 py-12 text-center text-xs text-zinc-600">
                Aufgabe von links hierher ziehen
              </p>
            )}
          </DropColumn>

          <DropColumn
            title="Erledigt"
            count={doneTasks.length}
            variant="done"
            active={dropOver === "done"}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropOver("done");
            }}
            onDragLeave={() => setDropOver(null)}
            onDrop={() => onDropColumn("done")}
          >
            {doneTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                selected={selectedId === t.id}
                dragging={dragId === t.id}
                onSelect={() => setSelectedId(t.id)}
                onDragStart={(e) => onDragStart(e, t.id)}
                onDragEnd={onDragEnd}
                onToggleDone={() => setStatus(t.id, "OPEN")}
                onDelete={() => removeTask(t.id)}
              />
            ))}
            {doneTasks.length === 0 && (
              <p className="px-2 py-12 text-center text-xs text-zinc-600">
                Hierher ziehen = erledigt
              </p>
            )}
          </DropColumn>
        </div>
      )}

      {selected && (
        <div className="rounded-2xl border border-white/10 bg-[#121214] p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-white">{selected.title}</h2>
              {selected.description && (
                <p className="mt-1 text-sm text-zinc-500">{selected.description}</p>
              )}
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                <Flag className="h-3 w-3" />
                {selected.priority}
                {(selected.assignees?.length
                  ? selected.assignees
                  : selected.assignee
                    ? [selected.assignee]
                    : []
                ).map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-0.5">
                    <User className="h-3 w-3" />
                    {p.name || p.email}
                  </span>
                ))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg p-1 text-zinc-500 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-2 text-xs font-medium text-zinc-400">Unteraufgaben</p>
          <div className="space-y-1.5">
            {selected.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSub(selected.id, s)}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    s.done
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : "border-white/20 text-transparent hover:border-amber-500/40"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
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
                  onClick={() => deleteSub(selected.id, s.id)}
                  className="text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {selected.subtasks.length === 0 && (
              <p className="text-xs text-zinc-600">Keine Unteraufgaben</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newSubTitle}
              onChange={(e) => setNewSubTitle(e.target.value)}
              placeholder="Neue Unteraufgabe"
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSub(selected.id);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addSub(selected.id)}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropColumn({
  title,
  count,
  variant,
  active,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: {
  title: string;
  count: number;
  variant: "open" | "done";
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border transition ${
        active
          ? variant === "done"
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-amber-500/50 bg-amber-500/5"
          : "border-white/10 bg-[#121214]"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5">
        {variant === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Circle className="h-4 w-4 text-amber-400" />
        )}
        <span className="text-xs font-semibold text-zinc-300">{title}</span>
        <span className="rounded-full bg-white/5 px-1.5 text-[10px] text-zinc-500">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">{children}</div>
    </section>
  );
}

function TaskCard({
  task,
  selected,
  dragging,
  onSelect,
  onDragStart,
  onDragEnd,
  onToggleDone,
  onDelete,
}: {
  task: Task;
  selected: boolean;
  dragging: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "DONE";
  const people =
    task.assignees?.length > 0
      ? task.assignees
      : task.assignee
        ? [task.assignee]
        : [];
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`cursor-grab rounded-xl border bg-[#0c0c0e] p-3 active:cursor-grabbing ${
        selected
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : "border-white/10 hover:border-white/20"
      } ${dragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            done
              ? "border-emerald-500/50 bg-emerald-500/25 text-emerald-400"
              : "border-white/25 hover:border-amber-400/50"
          }`}
        >
          {done && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              done ? "text-zinc-500 line-through" : "text-zinc-100"
            }`}
          >
            {task.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.priority === "HIGH" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-400">
                <Flag className="h-2.5 w-2.5" /> Hoch
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="text-[10px] text-zinc-500">
                {subDone}/{task.subtasks.length}
              </span>
            )}
            {people.slice(0, 2).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-0.5 text-[10px] text-zinc-500"
              >
                <User className="h-2.5 w-2.5" />
                {(p.name || p.email).split("@")[0]}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 text-zinc-600 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
