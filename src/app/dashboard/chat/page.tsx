"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Hash, Plus, Send, Trash2, UserPlus, X } from "lucide-react";

type Person = { id: string; name: string | null; email: string };

type Channel = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  memberCount: number;
  messageCount: number;
  members: Person[];
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  user: Person;
};

type TeamMember = Person & { role?: string };

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/team/channels");
    const data = await res.json();
    if (res.ok) {
      setChannels(data.channels || []);
      setIsOwner(Boolean(data.isOwner));
      if (!activeId && data.channels?.[0]) {
        setActiveId(data.channels[0].id);
      }
    }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    loadChannels();
    fetch("/api/team/members")
      .then((r) => r.json())
      .then((d) => setTeamMembers(d.members || []))
      .catch(() => {});
  }, [loadChannels]);

  const loadMessages = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/team/channels/${activeId}/messages`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages || []);
  }, [activeId]);

  useEffect(() => {
    loadMessages();
    if (!activeId) return;
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const active = channels.find((c) => c.id === activeId) || null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/team/channels/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (res.ok) {
        setText("");
        await loadMessages();
      }
    } finally {
      setSending(false);
    }
  }

  function toggleMember(id: string) {
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!chName.trim()) return;
    setError("");
    const res = await fetch("/api/team/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: chName.trim(),
        description: chDesc.trim() || undefined,
        memberIds: selectedIds,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setShowCreate(false);
    setChName("");
    setChDesc("");
    setSelectedIds([]);
    await loadChannels();
    if (data.channel?.id) setActiveId(data.channel.id);
  }

  async function addToChannel(userId: string) {
    if (!activeId) return;
    await fetch(`/api/team/channels/${activeId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "add" }),
    });
    await loadChannels();
  }

  async function removeFromChannel(userId: string) {
    if (!activeId) return;
    await fetch(`/api/team/channels/${activeId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "remove" }),
    });
    await loadChannels();
  }

  async function deleteChannel() {
    if (!activeId || !confirm("Kanal löschen?")) return;
    await fetch(`/api/team/channels/${activeId}`, { method: "DELETE" });
    setActiveId(null);
    await loadChannels();
  }

  if (loading) return <p className="text-zinc-500">Laden…</p>;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Team-Chat</h1>
          <p className="text-xs text-zinc-500">
            Kanäle · nur freigegebene Mitglieder sehen sie
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-black"
          >
            <Plus className="h-4 w-4" />
            Kanal
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid flex-1 gap-3 lg:grid-cols-[220px_1fr]">
        <aside className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="border-b border-white/5 px-3 py-2.5 text-xs font-semibold text-zinc-400">
            Kanäle
          </div>
          <ul className="flex-1 overflow-y-auto">
            {channels.length === 0 && (
              <li className="px-3 py-8 text-center text-xs text-zinc-600">
                {isOwner
                  ? "Noch kein Kanal – oben erstellen"
                  : "Keine Kanäle für dich"}
              </li>
            )}
            {channels.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm ${
                    activeId === c.id
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-zinc-400 hover:bg-white/[0.03]"
                  }`}
                >
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          {active ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-white">
                    <Hash className="h-4 w-4 text-amber-400" />
                    {active.name}
                  </p>
                  {active.description && (
                    <p className="text-xs text-zinc-500">{active.description}</p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowAdd(true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-zinc-400"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Leute
                    </button>
                    <button
                      type="button"
                      onClick={deleteChannel}
                      className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="py-10 text-center text-xs text-zinc-600">
                    Noch keine Nachrichten
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-400">
                      {(m.user.name || m.user.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">
                        <span className="font-medium text-zinc-300">
                          {m.user.name || m.user.email}
                        </span>{" "}
                        ·{" "}
                        {new Date(m.createdAt).toLocaleString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-200">
                        {m.body}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={send}
                className="flex gap-2 border-t border-white/5 p-3"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Nachricht in #${active.name}`}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/40"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="rounded-xl bg-amber-400 px-3 py-2 text-black disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center text-sm text-zinc-500">
              Kanal links auswählen
            </p>
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={createChannel}
            className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#121214] p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Kanal erstellen</h2>
              <button type="button" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <input
              required
              value={chName}
              onChange={(e) => setChName(e.target.value)}
              placeholder="Name (z.B. allgemein)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={chDesc}
              onChange={(e) => setChDesc(e.target.value)}
              placeholder="Beschreibung (optional)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">
                Wer darf den Kanal sehen?
              </p>
              <div className="grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {teamMembers.map((m) => {
                  const on = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs ${
                        on
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border-white/10 text-zinc-400"
                      }`}
                    >
                      {m.name || m.email}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
            >
              Erstellen
            </button>
          </form>
        </div>
      )}

      {showAdd && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">
                Mitglieder in #{active.name}
              </h2>
              <button type="button" onClick={() => setShowAdd(false)}>
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            {teamMembers.map((m) => {
              const inCh = active.members.some((x) => x.id === m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2"
                >
                  <span className="text-sm text-zinc-300">
                    {m.name || m.email}
                  </span>
                  {inCh ? (
                    <button
                      type="button"
                      onClick={() => removeFromChannel(m.id)}
                      className="text-xs text-red-400"
                    >
                      Entfernen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToChannel(m.id)}
                      className="text-xs text-amber-400"
                    >
                      Hinzufügen
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
