"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Conversation {
  userId: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  privacy_allow_messages: boolean | null;
}

export default function MessagesPage() {
  const router = useRouter();

  // Left panel state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  // Right panel state
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (userSearch.trim().length < 1) { setUserResults([]); return; }
    searchUsers(userSearch);
  }, [userSearch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check URL for username on load
  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split("/");
    if (parts.length === 3 && parts[1] === "messages" && parts[2]) {
      setSelectedUsername(parts[2]);
    }
  }, []);

  useEffect(() => {
    if (selectedUsername && currentUserId) {
      loadChat(selectedUsername);
      window.history.replaceState(null, "", `/messages/${selectedUsername}`);
    } else if (!selectedUsername) {
      window.history.replaceState(null, "", `/messages`);
    }
  }, [selectedUsername, currentUserId]);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/signin"); return; }
    setCurrentUserId(user.id);

    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id, recipient_id, content, read, created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) { setLoading(false); return; }

    const convMap: Record<string, { lastMessage: string; lastMessageAt: string; unreadCount: number }> = {};
    msgs.forEach((m) => {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!convMap[otherId]) {
        convMap[otherId] = { lastMessage: m.content, lastMessageAt: m.created_at, unreadCount: 0 };
      }
      if (!m.read && m.recipient_id === user.id) convMap[otherId].unreadCount++;
    });

    const otherIds = Object.keys(convMap);
    if (otherIds.length === 0) { setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name, username, avatar_url").in("id", otherIds);

    const convs: Conversation[] = (profiles || []).map((p) => ({
      userId: p.id, full_name: p.full_name, username: p.username, avatar_url: p.avatar_url,
      ...convMap[p.id],
    }));
    convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    setConversations(convs);
    setLoading(false);
  };

  const loadChat = async (uname: string) => {
    if (!currentUserId) return;
    setChatLoading(true);
    setMessages([]);

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, privacy_allow_messages")
      .eq("username", uname).single();

    if (!profile) { setChatLoading(false); return; }
    setOtherUser(profile);

    const { data: msgs } = await supabase
      .from("messages").select("*")
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${profile.id}),and(sender_id.eq.${profile.id},recipient_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);

    await supabase.from("messages").update({ read: true })
      .eq("sender_id", profile.id).eq("recipient_id", currentUserId).eq("read", false);

    // Update unread count in conversation list
    setConversations((prev) => prev.map((c) =>
      c.userId === profile.id ? { ...c, unreadCount: 0 } : c
    ));

    // Realtime
    const channel = supabase
      .channel(`chat:${currentUserId}:${profile.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `recipient_id=eq.${currentUserId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id === profile.id) {
          setMessages((prev) => [...prev, newMsg]);
          supabase.from("messages").update({ read: true }).eq("id", newMsg.id);
          setConversations((prev) => prev.map((c) =>
            c.userId === profile.id ? { ...c, lastMessage: newMsg.content, lastMessageAt: newMsg.created_at, unreadCount: 0 } : c
          ));
        }
      })
      .subscribe();

    channelRef.current = channel;
    setChatLoading(false);
  };

  const searchUsers = async (query: string) => {
    setSearching(true);
    const { data } = await supabase.from("profiles")
      .select("id, full_name, username, avatar_url, privacy_allow_messages")
      .neq("id", currentUserId)
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(8);
    setUserResults((data || []) as Profile[]);
    setSearching(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId || !otherUser || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    const { data: newMsg } = await supabase.from("messages")
      .insert({ sender_id: currentUserId, recipient_id: otherUser.id, content, read: false })
      .select().single();

    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      setConversations((prev) => {
        const exists = prev.find((c) => c.userId === otherUser.id);
        if (exists) {
          return [
            { ...exists, lastMessage: content, lastMessageAt: newMsg.created_at },
            ...prev.filter((c) => c.userId !== otherUser.id),
          ];
        }
        return [{ userId: otherUser.id, full_name: otherUser.full_name, username: otherUser.username, avatar_url: otherUser.avatar_url, lastMessage: content, lastMessageAt: newMsg.created_at, unreadCount: 0 }, ...prev];
      });
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const formatMessageTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    return new Date(messages[index - 1].created_at).toDateString() !== new Date(messages[index].created_at).toDateString();
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = !search.trim() || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-[calc(100vh-56px)]" style={{ background: "var(--bg)" }}>

      {/* Left panel — conversation list */}
      <div className="w-1/3 flex flex-col shrink-0" style={{ borderRight: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Messages</h1>
            <button
              onClick={() => setShowNewMessage(true)}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
              title="New message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." className="flex-1 text-xs bg-transparent focus:outline-none"
              style={{ color: "var(--text-primary)" }} />
          </div>

          {/* All / Unread toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
            {(["all", "unread"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize"
                style={{
                  background: filter === f ? "var(--bg)" : "transparent",
                  color: filter === f ? "var(--text-primary)" : "var(--text-faint)",
                  boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>
                {f === "unread" ? `Unread${conversations.filter(c => c.unreadCount > 0).length > 0 ? ` (${conversations.filter(c => c.unreadCount > 0).length})` : ""}` : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--bg-secondary)" }} />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                {filter === "unread" ? "No unread messages" : search ? "No results" : "No messages yet"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {filter === "all" && !search ? "Start a conversation using the compose button above." : ""}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => setSelectedUsername(conv.username)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left mb-0.5"
                style={{
                  background: selectedUsername === conv.username ? "var(--bg-secondary)" : "transparent",
                  borderLeft: selectedUsername === conv.username ? "2px solid #2979FF" : "2px solid transparent",
                }}
              >
                {conv.avatar_url ? (
                  <img src={conv.avatar_url} alt={conv.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                    {conv.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{conv.full_name}</p>
                    <span className="text-xs shrink-0" style={{ color: "var(--text-faint)", fontSize: "10px" }}>{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs truncate" style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                      <span className="text-xs text-white rounded-full px-1.5 py-0.5 font-semibold shrink-0"
                        style={{ backgroundColor: "#2979FF", fontSize: "9px" }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedUsername ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Your messages</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Select a conversation or start a new one.</p>
            </div>
          </div>
        ) : chatLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
          </div>
        ) : otherUser?.privacy_allow_messages === false ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="text-4xl mb-4">🔒</div>
              <p className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Messages are disabled</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{otherUser?.full_name} isn't accepting messages.</p>
            </div>
          </div>
        ) : otherUser ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                  {otherUser.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <Link href={`/${otherUser.username}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                  {otherUser.full_name}
                </Link>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>@{otherUser.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Start a conversation with {otherUser.full_name}.</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id}>
                    {shouldShowDate(i) && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-faint)" }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                      <div className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm"
                        style={isMe
                          ? { backgroundColor: "#2979FF", color: "white", borderBottomRightRadius: "4px" }
                          : { background: "var(--bg-secondary)", color: "var(--text-primary)", borderBottomLeftRadius: "4px" }
                        }>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className="text-xs mt-1" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--text-faint)" }}>
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-end gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${otherUser.full_name}...`}
                  rows={1} className="flex-1 text-sm bg-transparent focus:outline-none resize-none"
                  style={{ color: "var(--text-primary)", maxHeight: "120px" }} />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                  style={{ backgroundColor: "#2979FF" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: "var(--text-faint)" }}>Press Enter to send</p>
            </div>
          </>
        ) : null}
      </div>

      {/* New message modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowNewMessage(false); setUserSearch(""); setUserResults([]); }} />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>New message</h3>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0" style={{ color: "var(--text-faint)" }}>
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search for a writer..." className="flex-1 text-sm bg-transparent focus:outline-none"
                style={{ color: "var(--text-primary)" }} autoFocus />
            </div>
            {searching && <p className="text-sm text-center py-4" style={{ color: "var(--text-faint)" }}>Searching...</p>}
            {userResults.length > 0 && (
              <div className="space-y-1">
                {userResults.map((u) => (
                  <button key={u.id} onClick={() => {
                    setShowNewMessage(false); setUserSearch(""); setUserResults([]);
                    setSelectedUsername(u.username);
                  }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 text-left"
                    style={{ background: "var(--bg-secondary)" }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                        {u.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{u.full_name}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>@{u.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {userSearch.length > 0 && !searching && userResults.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-faint)" }}>No users found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}