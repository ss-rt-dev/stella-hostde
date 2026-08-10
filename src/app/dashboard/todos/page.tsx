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
  ArrowLeft,
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

  /** Zuerst Aufgabe wählen – dann Unteraufgaben */
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [dragSubId, setDragSubId] = useState<string | null>(null);
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

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

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
      if (data.todo?.id) setActiveTaskId(data.todo.id);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  async function removeTask(id: string) {
    if (!confirm("Aufgabe löschen?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
    void fetch(`/api/team/todos/${id}`, { method: "DELETE" });
  }

  async function setTaskStatus(id: string, status: Task["status"]) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    void fetch(`/api/team/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => {
      if (!r.ok) load();
    });
  }

  async function setSubDone(todoId: string, sub: Subtask, done: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== todoId
          ? t
          : {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === sub.id ? { ...s, done } : s
              ),
            }
      )
    );
    void fetch(`/api/team/todos/${todoId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
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
    if (res.ok) await load();
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

  function onDragStart(e: React.DragEvent, subId: string) {
    setDragSubId(subId);
    e.dataTransfer.setData("text/plain", subId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDragSubId(null);
    setDropOver(null);
  }

  function onDropColumn(col: "open" | "done") {
    if (!activeTask || !dragSubId) return;
    const sub = activeTask.subtasks.find((s) => s.id === dragSubId);
    if (!sub) return;
    const done = col === "done";
    if (sub.done !== done) {
      void setSubDone(activeTask.id, sub, done);
    }
    setDragSubId(null);
    setDropOver(null);
  }

  const openSubs = activeTask?.subtasks.filter((s) => !s.done) || [];
  const doneSubs = activeTask?.subtasks.filter((s) => s.done) || [];

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Aufgaben</h1>
            <p className="text-xs text-zinc-500">
              {activeTask
                ? "Unteraufgaben links ziehen → Nicht erledigt / Erledigt"
                : "Zuerst eine Aufgabe auswählen"}
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

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Für wen? (anklicken)
              </p>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-zinc-600">Keine Mitglieder</p>
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
      ) : !activeTask ? (
        /* ========== SCHRITT 1: Aufgabe auswählen ========== */
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Wähle eine Aufgabe – danach siehst du die Unteraufgaben zum Drag &amp;
            Drop.
          </p>
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-14 text-center text-sm text-zinc-500">
              Noch keine Aufgaben. Oben „Aufgabe“ anlegen.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((t) => {
                const people =
                  t.assignees?.length > 0
                    ? t.assignees
                    : t.assignee
                      ? [t.assignee]
                      : [];
                const doneCount = t.subtasks.filter((s) => s.done).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTaskId(t.id)}
                    className="rounded-2xl border border-white/10 bg-[#121214] p-4 text-left transition hover:border-amber-500/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{t.title}</p>
                        {t.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          t.status === "DONE"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {t.status === "DONE" ? "Fertig" : "Offen"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <ListTodo className="h-3 w-3" />
                        {doneCount}/{t.subtasks.length} Unteraufgaben
                      </span>
                      {t.priority === "HIGH" && (
                        <span className="inline-flex items-center gap-0.5 text-red-400">
                          <Flag className="h-3 w-3" /> Hoch
                        </span>
                      )}
                      {people.slice(0, 2).map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-0.5"
                        >
                          <User className="h-3 w-3" />
                          {(p.name || p.email).split("@")[0]}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] font-medium text-amber-400">
                      Öffnen →
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========== SCHRITT 2: Unteraufgaben Drag & Drop ========== */
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#121214] px-4 py-3">
            <button
              type="button"
              onClick={() => setActiveTaskId(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Alle Aufgaben
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{activeTask.title}</p>
              {activeTask.description && (
                <p className="truncate text-xs text-zinc-500">
                  {activeTask.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setTaskStatus(
                  activeTask.id,
                  activeTask.status === "DONE" ? "OPEN" : "DONE"
                )
              }
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                activeTask.status === "DONE"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/5 text-zinc-400"
              }`}
            >
              {activeTask.status === "DONE" ? "Wieder öffnen" : "Aufgabe fertig"}
            </button>
            <button
              type="button"
              onClick={() => removeTask(activeTask.id)}
              className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] text-red-400"
            >
              Löschen
            </button>
          </div>

          <div className="grid flex-1 gap-3 lg:grid-cols-[260px_1fr_1fr]">
            {/* LINKS: Unteraufgaben dieser Aufgabe */}
            <aside className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
              <div className="border-b border-white/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-300">
                    Unteraufgaben ({activeTask.subtasks.length})
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  Ziehen in die Spalten rechts
                </p>
              </div>
              <ul className="flex-1 overflow-y-auto">
                {activeTask.subtasks.length === 0 && (
                  <li className="px-3 py-8 text-center text-xs text-zinc-600">
                    Noch keine – unten hinzufügen
                  </li>
                )}
                {activeTask.subtasks.map((s) => (
                  <li key={s.id}>
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, s.id)}
                      onDragEnd={onDragEnd}
                      className={`flex cursor-grab items-start gap-2 border-b border-white/5 px-3 py-2.5 active:cursor-grabbing ${
                        dragSubId === s.id ? "opacity-40" : ""
                      } hover:bg-white/[0.03]`}
                    >
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                      {s.done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      )}
                      <p
                        className={`min-w-0 flex-1 text-sm ${
                          s.done
                            ? "text-zinc-500 line-through"
                            : "text-zinc-200"
                        }`}
                      >
                        {s.title}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/5 p-2">
                <div className="flex gap-1.5">
                  <input
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    placeholder="Neue Unteraufgabe"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSub(activeTask.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addSub(activeTask.id)}
                    className="rounded-lg bg-amber-400 px-2.5 py-1.5 text-black"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </aside>

            <DropColumn
              title="Nicht erledigt"
              count={openSubs.length}
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
              {openSubs.map((s) => (
                <SubCard
                  key={s.id}
                  sub={s}
                  dragging={dragSubId === s.id}
                  onDragStart={(e) => onDragStart(e, s.id)}
                  onDragEnd={onDragEnd}
                  onToggle={() => setSubDone(activeTask.id, s, true)}
                  onDelete={() => deleteSub(activeTask.id, s.id)}
                />
              ))}
              {openSubs.length === 0 && (
                <p className="px-2 py-12 text-center text-xs text-zinc-600">
                  Von links hierher ziehen
                </p>
              )}
            </DropColumn>

            <DropColumn
              title="Erledigt"
              count={doneSubs.length}
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
              {doneSubs.map((s) => (
                <SubCard
                  key={s.id}
                  sub={s}
                  dragging={dragSubId === s.id}
                  onDragStart={(e) => onDragStart(e, s.id)}
                  onDragEnd={onDragEnd}
                  onToggle={() => setSubDone(activeTask.id, s, false)}
                  onDelete={() => deleteSub(activeTask.id, s.id)}
                />
              ))}
              {doneSubs.length === 0 && (
                <p className="px-2 py-12 text-center text-xs text-zinc-600">
                  Hierher = erledigt
                </p>
              )}
            </DropColumn>
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

function SubCard({
  sub,
  dragging,
  onDragStart,
  onDragEnd,
  onToggle,
  onDelete,
}: {
  sub: Subtask;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab rounded-xl border border-white/10 bg-[#0c0c0e] p-3 active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            sub.done
              ? "border-emerald-500/50 bg-emerald-500/25 text-emerald-400"
              : "border-white/25 hover:border-amber-400/50"
          }`}
        >
          {sub.done && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
        <p
          className={`min-w-0 flex-1 text-sm ${
            sub.done ? "text-zinc-500 line-through" : "text-zinc-100"
          }`}
        >
          {sub.title}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 text-zinc-600 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
