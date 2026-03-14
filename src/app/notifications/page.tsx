"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor: {
    full_name: string;
    username: string;
  };
  post: {
    title: string;
    slug: string;
  } | null;
}

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
        id, type, read, created_at,
        actor:actor_id(full_name, username),
        post:post_id(title, slug)
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setNotifications(data as any);

    // Mark all as read
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", user.id)
      .eq("read", false);

    setLoading(false);
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
    return "interacted with your content";
  };

  const getIcon = (type: string) => {
    if (type === "like") return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: "#fdf2f2" }}>
        ❤️
      </div>
    );
    if (type === "comment") return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: "#f0f4ff" }}>
        💬
      </div>
    );
    if (type === "subscribe") return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: "#f0fff4" }}>
        ✅
      </div>
    );
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
        🔔
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      <h1 className="text-2xl font-bold text-black mb-2">Activity</h1>
      <p className="text-sm text-gray-400 mb-8">Likes, comments and new subscribers.</p>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔔</div>
          <p className="text-gray-400">No activity yet.</p>
          <p className="text-sm text-gray-400 mt-1">When someone likes or comments on your articles, it'll show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`py-4 flex items-start gap-4 ${!n.read ? "opacity-100" : "opacity-70"}`}
            >
              {getIcon(n.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-black">
                    <Link
                      href={`/profile/${n.actor?.username}`}
                      className="font-semibold hover:underline"
                    >
                      {n.actor?.full_name}
                    </Link>
                    {" "}{getNotificationText(n)}
                    {n.post && (
                      <>
                        {" — "}
                        <Link
                          href={`/p/${n.post.slug}`}
                          className="text-gray-500 hover:underline italic"
                        >
                          {n.post.title}
                        </Link>
                      </>
                    )}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">{formatTime(n.created_at)}</span>
                </div>
                {!n.read && (
                  <span className="inline-block w-2 h-2 rounded-full mt-1" style={{ backgroundColor: "#e8a0a0" }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}