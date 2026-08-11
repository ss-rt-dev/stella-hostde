"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
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
type Message = { id: string; body: string; createdAt: string; user: Person };
type TeamMember = Person & { role?: string };

export default function ChatPage() {
  const { t: tr } = useI18n();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = channels.find((c) => c.id === activeId) || null;

  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/team/channels");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || tr("load_failed"));
      setLoading(false);
      return;
    }
    setChannels(data.channels || []);
    setIsOwner(!!data.isOwner);
    setMembers(data.teamMembers || []);
    if (!activeId && data.channels?.[0]) setActiveId(data.channels[0].id);
    setLoading(false);
  }, [activeId, tr]);

  const loadMessages = useCallback(async (channelId: string) => {
    const res = await fetch(`/api/team/channels/${channelId}/messages`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/team/channels/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || tr("error"));
      } else {
        setBody("");
        loadMessages(activeId);
      }
    } catch {
      setError(tr("network_error"));
    }
    setSending(false);
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/team/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          memberIds: selectedMemberIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tr("error"));
        return;
      }
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setSelectedMemberIds([]);
      await loadChannels();
      if (data.channel?.id) setActiveId(data.channel.id);
    } catch {
      setError(tr("network_error"));
    }
  }

  async function deleteChannel(id: string) {
    if (!confirm(tr("delete_channel_confirm"))) return;
    await fetch(`/api/team/channels/${id}`, { method: "DELETE" });
    setActiveId(null);
    loadChannels();
  }

  async function addToChannel(userId: string) {
    if (!activeId) return;
    await fetch(`/api/team/channels/${activeId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadChannels();
  }

  async function removeFromChannel(userId: string) {
    if (!activeId) return;
    await fetch(`/api/team/channels/${activeId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadChannels();
  }

  if (loading) return <p className="text-zinc-500">{tr("loading_ellipsis")}</p>;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <aside className="flex w-full flex-col rounded-2xl border border-white/10 bg-[#121214] lg:w-64">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h1 className="text-sm font-semibold text-white">{tr("chat_title")}</h1>
            <p className="text-[11px] text-zinc-500">{tr("channels")}</p>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-amber-400/15 p-1.5 text-amber-400"
              title={tr("new_channel")}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {channels.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-zinc-500">{tr("no_channels")}</p>
          ) : (
            channels.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                  activeId === c.id
                    ? "bg-amber-400/15 text-amber-300"
                    : "text-zinc-400 hover:bg-white/5"
                }`}
              >
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-[#121214]">
        {active ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-zinc-500" />
                <span className="font-medium text-white">{active.name}</span>
              </div>
              <div className="flex gap-1">
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowMembers(true)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5"
                      title={tr("add_members")}
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                    {!active.isDefault && (
                      <button
                        type="button"
                        onClick={() => deleteChannel(active.id)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                        title={tr("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-500">{tr("no_messages")}</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    <div className="mb-0.5 flex gap-2 text-[11px] text-zinc-500">
                      <span className="font-medium text-zinc-300">
                        {m.user.name || m.user.email}
                      </span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-zinc-200">{m.body}</p>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={tr("write_message")}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/40"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="rounded-xl bg-amber-400 px-3 py-2 text-black disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <p className="m-auto text-sm text-zinc-500">{tr("select_task_first")}</p>
        )}
      </section>

      {error && (
        <p className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={createChannel}
            className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{tr("new_channel")}</h2>
              <button type="button" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={tr("channel_name")}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={tr("channel_desc")}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <p className="text-xs text-zinc-500">{tr("members_in_channel")}</p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {members.map((m) => {
                const on = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSelectedMemberIds((ids) =>
                        on ? ids.filter((x) => x !== m.id) : [...ids, m.id]
                      )
                    }
                    className={`flex w-full rounded-lg px-3 py-1.5 text-left text-xs ${
                      on ? "bg-amber-400/15 text-amber-300" : "text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    {m.name || m.email}
                  </button>
                );
              })}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-400 py-2 text-sm font-semibold text-black"
            >
              {tr("create_channel")}
            </button>
          </form>
        </div>
      )}

      {showMembers && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">
                {tr("members_in_channel")} #{active.name}
              </h2>
              <button type="button" onClick={() => setShowMembers(false)}>
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {members.map((m) => {
                const inCh = active.members?.some((x) => x.id === m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                  >
                    <span>{m.name || m.email}</span>
                    {inCh ? (
                      <button
                        type="button"
                        onClick={() => removeFromChannel(m.id)}
                        className="text-red-400"
                      >
                        {tr("delete")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToChannel(m.id)}
                        className="text-amber-400"
                      >
                        {tr("add_members")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
