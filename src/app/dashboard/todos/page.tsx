"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Person = { id: string; name: string | null; email: string };
type Subtask = { id: string; title: string; done: boolean };
type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  scope: string;
  status: string;
  subtasks: Subtask[];
  createdBy: Person;
};
type Member = Person & { role?: string };

export default function AufgabenPage() {
  const { t: tr } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [newScope, setNewScope] = useState("TEAM");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  const load = useCallback(async () => {
    const [trRes, mRes] = await Promise.all([
      fetch("/api/team/todos"),
      fetch("/api/team/members"),
    ]);
    const tData = await trRes.json();
    const mData = await mRes.json();
    if (!trRes.ok) {
      setError(tData.error || tr("load_failed"));
      setLoading(false);
      return;
    }
    setTasks(tData.todos || tData.tasks || []);
    setCanAssign(Boolean(tData.canAssign ?? mData.canManage));
    setMembers(mData.members || []);
    setLoading(false);
  }, [tr]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const subs = subtaskDrafts.map((s) => s.trim()).filter(Boolean);
    try {
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
        setError(data.error || tr("error"));
        setCreating(false);
        return;
      }
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setSelectedIds([]);
      setSubtaskDrafts([""]);
      setShowForm(false);
      setCreating(false);
      load();
    } catch {
      setError(tr("network_error"));
      setCreating(false);
    }
  }

  async function removeTask(id: string) {
    if (!confirm(tr("delete_task_confirm"))) return;
    await fetch(`/api/team/todos/${id}`, { method: "DELETE" });
    if (activeTaskId === id) setActiveTaskId(null);
    load();
  }

  async function toggleSubtask(todoId: string, sub: Subtask) {
    await fetch(`/api/team/todos/${todoId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !sub.done }),
    });
    load();
  }

  async function markTaskDone(id: string) {
    await fetch(`/api/team/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    if (activeTaskId === id) setActiveTaskId(null);
    load();
  }

  const openTasks = tasks.filter((t) => t.status !== "DONE");
  const openSubs = activeTask?.subtasks.filter((s) => !s.done) || [];
  const doneSubs = activeTask?.subtasks.filter((s) => s.done) || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">{tr("tasks_title")}</h1>
          <p className="text-sm text-zinc-500">{tr("tasks_sub")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
        >
          {showForm ? tr("close") : tr("new_task")}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={createTask}
          className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
        >
          <h2 className="font-semibold text-white">{tr("new_task_title")}</h2>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tr("task_title_ph")}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/40"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tr("description_optional")}
            rows={2}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/40"
          />
          <div className="flex flex-wrap gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-lg px-3 py-1 text-xs ${
                  priority === p ? "bg-amber-400 text-black" : "border border-white/10 text-zinc-400"
                }`}
              >
                {p === "LOW"
                  ? tr("priority_low")
                  : p === "HIGH"
                    ? tr("priority_high")
                    : tr("priority_medium")}
              </button>
            ))}
          </div>
          {canAssign && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setNewScope("TEAM")}
                className={`rounded-lg px-3 py-1 text-xs ${
                  newScope === "TEAM" ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                {tr("team_task")}
              </button>
              <button
                type="button"
                onClick={() => setNewScope("PERSONAL")}
                className={`rounded-lg px-3 py-1 text-xs ${
                  newScope === "PERSONAL" ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                {tr("personal")}
              </button>
            </div>
          )}
          {canAssign && newScope === "TEAM" && (
            <div>
              <p className="mb-1 text-xs text-zinc-500">{tr("for_whom")}</p>
              <div className="flex flex-wrap gap-1">
                {members.length === 0 ? (
                  <span className="text-xs text-zinc-600">{tr("no_members")}</span>
                ) : (
                  members.map((m) => {
                    const on = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setSelectedIds((ids) =>
                            on ? ids.filter((x) => x !== m.id) : [...ids, m.id]
                          )
                        }
                        className={`rounded-lg px-2 py-1 text-xs ${
                          on ? "bg-amber-400/20 text-amber-300" : "bg-white/5 text-zinc-400"
                        }`}
                      >
                        {m.name || m.email}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs text-zinc-500">{tr("subtasks_optional")}</p>
            {subtaskDrafts.map((s, i) => (
              <input
                key={i}
                value={s}
                onChange={(e) => {
                  const next = [...subtaskDrafts];
                  next[i] = e.target.value;
                  setSubtaskDrafts(next);
                }}
                placeholder={tr("new_subtask")}
                className="mb-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
            ))}
            <button
              type="button"
              onClick={() => setSubtaskDrafts((d) => [...d, ""])}
              className="text-xs text-amber-400"
            >
              {tr("add_subtask")}
            </button>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "…" : tr("create_task")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">{tr("loading_ellipsis")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {tr("all_tasks")}
            </p>
            <ul className="space-y-1">
              {openTasks.length === 0 ? (
                <li className="px-2 py-6 text-center text-xs text-zinc-500">{tr("no_open_tasks")}</li>
              ) : (
                openTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTaskId(task.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                        activeTaskId === task.id
                          ? "bg-amber-400/15 text-amber-300"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="block truncate font-medium">{task.title}</span>
                      <span className="text-[10px] text-zinc-500">
                        {task.priority} · {task.subtasks?.filter((s) => s.done).length || 0}/
                        {task.subtasks?.length || 0}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121214] p-4">
            {!activeTask ? (
              <p className="py-16 text-center text-sm text-zinc-500">{tr("select_task_first")}</p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{activeTask.title}</h2>
                    {activeTask.description && (
                      <p className="mt-1 text-sm text-zinc-400">{activeTask.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => markTaskDone(activeTask.id)}
                      className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-400"
                    >
                      {tr("task_done")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(activeTask.id)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
                    >
                      {tr("delete")}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase text-zinc-500">
                      {tr("not_done")}
                    </p>
                    <ul className="space-y-1">
                      {openSubs.length === 0 ? (
                        <li className="text-xs text-zinc-600">{tr("no_results")}</li>
                      ) : (
                        openSubs.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => toggleSubtask(activeTask.id, s)}
                              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-zinc-300 hover:bg-white/5"
                            >
                              ○ {s.title}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase text-emerald-500/80">
                      {tr("done")}
                    </p>
                    <ul className="space-y-1">
                      {doneSubs.length === 0 ? (
                        <li className="text-xs text-zinc-600">{tr("drag_here_done")}</li>
                      ) : (
                        doneSubs.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => toggleSubtask(activeTask.id, s)}
                              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-zinc-400 line-through hover:bg-white/5"
                            >
                              ✓ {s.title}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
