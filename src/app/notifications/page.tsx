"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const metadata = {
  title: "Notifications",
};

interface Notification {
  id: string;
  type: string;
  message: string | null;
  read: boolean;
  created_at: string;
  actor: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  post: {
    title: string;
    slug: string;
    cover_image: string | null;
  } | null;
}

type Group = "Today" | "This Week" | "Earlier";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select(`
        id, type, message, read, created_at,
        actor:actor_id(full_name, username, avatar_url),
        post:post_id(title, slug, cover_image)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data as any);

      // Mark all as read in DB
      const unreadIds = (data as any[]).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .in("id", unreadIds);

        // Tell TopBar to clear the badge immediately
        window.dispatchEvent(new Event("notifications-read"));

        // Update local state so blue dots disappear
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }

    setLoading(false);
  };

  const getGroup = (dateString: string): Group => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return "Today";
    if (diffDays < 7) return "This Week";
    return "Earlier";
  };

  const groupedNotifications = (): { group: Group; items: Notification[] }[] => {
    const groups: Record<Group, Notification[]> = {
      "Today": [],
      "This Week": [],
      "Earlier": [],
    };
    notifications.forEach((n) => { groups[getGroup(n.created_at)].push(n); });
    return (["Today", "This Week", "Earlier"] as Group[])
      .filter((g) => groups[g].length > 0)
      .map((g) => ({ group: g, items: groups[g] }));
  };

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationText = (n: Notification) => {
    if (n.type === "like") return "liked your article";
    if (n.type === "comment") return "commented on your article";
    if (n.type === "subscribe") return "subscribed to you";
    if (n.type === "creator_approved") return "Your creator application has been approved! You can now publish on FrontPage.";
    if (n.type === "creator_rejected") return n.message || "Your creator application was not approved.";
    if (n.type === "creator_application") return "submitted a creator application.";
    return n.message || "interacted with your content";
  };

  const getIconBg = (type: string) => {
    if (type === "like") return { bg: "#fff0f0", emoji: "❤️" };
    if (type === "comment") return { bg: "#f0f4ff", emoji: "💬" };
    if (type === "subscribe") return { bg: "#f0fff4", emoji: "✅" };
    if (type === "creator_approved") return { bg: "#f0fff4", emoji: "🎉" };
    if (type === "creator_rejected") return { bg: "#fff5f5", emoji: "📋" };
    if (type === "creator_application") return { bg: "#eef3ff", emoji: "✍️" };
    return { bg: "#f3f4f6", emoji: "🔔" };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading...</p>
    </div>
  );

  const groups = groupedNotifications();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Activity</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>Likes, comments and new subscribers.</p>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔔</div>
          <p style={{ color: "var(--text-tertiary)" }}>No activity yet.</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            When someone likes or comments on your articles, it'll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>
                {group}
              </p>
              <div className="space-y-1">
                {items.map((n) => {
                  const { bg, emoji } = getIconBg(n.type);
                  const isUnread = !n.read;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-3 py-3 rounded-xl transition-colors"
                      style={{ background: isUnread ? "var(--bg-secondary)" : "transparent" }}
                    >
                      <div className="relative shrink-0">
                        {n.actor?.avatar_url ? (
                          <img src={n.actor.avatar_url} alt={n.actor.full_name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                          >
                            {n.actor?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: bg, fontSize: "9px" }}
                        >
                          {emoji}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                              {n.actor?.username ? (
                                <Link href={`/${n.actor.username}`} className="font-semibold hover:underline">
                                  {n.actor.full_name}
                                </Link>
                              ) : (
                                <span className="font-semibold">Someone</span>
                              )}
                              {" "}{getNotificationText(n)}
                              {n.post && (
                                <>
                                  {" — "}
                                  <Link href={`/p/${n.post.slug}`} className="hover:underline italic" style={{ color: "var(--text-tertiary)" }}>
                                    {n.post.title}
                                  </Link>
                                </>
                              )}
                            </p>
                            {n.type === "comment" && n.message && (
                              <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                                "{n.message}"
                              </p>
                            )}
                            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                              {formatTime(n.created_at)}
                            </p>
                          </div>
                          {n.post?.cover_image && (
                            <Link href={`/p/${n.post.slug}`} className="shrink-0">
                              <img src={n.post.cover_image} alt={n.post.title} className="w-12 h-12 rounded-lg object-cover" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: "#2979FF" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}