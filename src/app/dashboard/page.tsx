"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  published: boolean;
  published_at: string;
  created_at: string;
  cover_image: string | null;
  tags: string[];
  view_count: number;
}

interface Subscriber {
  subscriber_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface Stats {
  posts: number;
  subscribers: number;
  likes: number;
  comments: number;
  views: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "live");

  useEffect(() => {
    const newTab = searchParams.get("tab") || "live";
    setTab(newTab);
  }, [searchParams]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ posts: 0, subscribers: 0, likes: 0, comments: 0, views: 0 });
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriberSearch, setSubscriberSearch] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);
      loadData(user.id);
    });
  }, []);

  const loadData = async (uid: string) => {
    const [postsRes, subsRes, likesRes, commentsRes, viewsRes] = await Promise.all([
      supabase.from("posts").select("*").eq("author_id", uid).order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*, profiles!subscriptions_subscriber_id_fkey(full_name, username, avatar_url)").eq("author_id", uid).order("created_at", { ascending: false }),
      supabase.from("likes").select("*", { count: "exact", head: true }).eq("author_id", uid),
      supabase.from("comments").select("*", { count: "exact", head: true }).eq("author_id", uid),
      supabase.from("posts").select("view_count").eq("author_id", uid).eq("published", true),
    ]);

    const postsData = postsRes.data || [];
    const subsData = subsRes.data || [];
    const totalViews = (viewsRes.data || []).reduce((sum, p) => sum + (p.view_count || 0), 0);

    setPosts(postsData as Post[]);
    setSubscribers(subsData as Subscriber[]);
    setStats({
      posts: postsData.length,
      subscribers: subsData.length,
      likes: likesRes.count || 0,
      comments: commentsRes.count || 0,
      views: totalViews,
    });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const livePosts = posts.filter((p) => p.published);
  const draftPosts = posts.filter((p) => !p.published);

  const filteredSubscribers = subscribers.filter((s) => {
    if (!subscriberSearch.trim()) return true;
    const q = subscriberSearch.toLowerCase();
    return (
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.profiles?.username?.toLowerCase().includes(q)
    );
  });

  const TABS = [
    { key: "live", label: "Live posts" },
    { key: "drafts", label: "Drafts" },
    { key: "subscribers", label: "Subscribers" },
    { key: "stats", label: "Stats" },
  ];

  const PostList = ({ items }: { items: Post[] }) => (
    items.length === 0 ? (
      <div className="text-center py-16">
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          {tab === "live" ? "No published posts yet." : "No drafts yet."}
        </p>
        <Link href="/dashboard/new" className="text-sm font-medium hover:underline" style={{ color: "#2979FF" }}>
          {tab === "live" ? "Write your first post →" : "Start a draft →"}
        </Link>
      </div>
    ) : (
      <div style={{ borderTop: "1px solid var(--border)" }}>
        {items.map((post) => (
          <article key={post.id} className="py-4 flex items-start gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
            {post.cover_image && (
              <Link href={`/dashboard/edit/${post.id}`} className="shrink-0">
                <img src={post.cover_image} alt={post.title} className="w-16 h-12 object-cover rounded-lg" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/dashboard/edit/${post.id}`} className="text-sm font-semibold truncate hover:underline" style={{ color: "var(--text-primary)" }}>{post.title}</Link>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  post.published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              {post.subtitle && (
                <p className="text-xs line-clamp-1" style={{ color: "var(--text-tertiary)" }}>{post.subtitle}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{formatDate(post.published_at || post.created_at)}</p>
                {post.view_count > 0 && (
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{post.view_count} views</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/dashboard/edit/${post.id}`} className="text-xs font-medium" style={{ color: "#2979FF" }}>Edit</Link>
              {post.published && (
                <Link href={`/p/${post.slug}`} className="text-xs" style={{ color: "var(--text-tertiary)" }}>View</Link>
              )}
              <button onClick={() => handleDelete(post.id)} className="text-xs" style={{ color: "#e03535" }}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    )
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Dashboard
        </h1>
        <Link
          href="/dashboard/new"
          className="text-sm px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#2979FF", color: "white" }}
        >
          + New post
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "32px" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => router.push(`/dashboard?tab=${t.key}`)}
            style={{
              paddingBottom: "12px",
              marginRight: "24px",
              fontSize: "14px",
              fontWeight: tab === t.key ? 600 : 400,
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
              color: tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
              background: "none",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {t.label}
            {t.key === "drafts" && draftPosts.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--text-faint)" }}>
                {draftPosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading...</p>
      ) : (
        <>
          {tab === "live" && <PostList items={livePosts} />}

          {tab === "drafts" && <PostList items={draftPosts} />}

          {tab === "subscribers" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{subscribers.length} total subscribers</p>
                <input
                  type="text"
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  placeholder="Search subscribers..."
                  className="text-sm px-4 py-2 rounded-lg focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", width: "180px" }}
                />
              </div>
              {subscribers.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-3xl mb-3">✉️</p>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No subscribers yet</p>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Share your work and they'll come.</p>
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-tertiary)" }}>No subscribers match your search.</p>
              ) : (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {filteredSubscribers.map((sub) => (
                    <div key={sub.subscriber_id} className="py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3">
                        {sub.profiles?.avatar_url ? (
                          <img src={sub.profiles.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                            {sub.profiles?.full_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link href={`/${sub.profiles?.username}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                            {sub.profiles?.full_name}
                          </Link>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>@{sub.profiles?.username}</p>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>Subscribed {formatDate(sub.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "stats" && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Total views", value: stats.views },
                  { label: "Live posts", value: livePosts.length },
                  { label: "Subscribers", value: stats.subscribers },
                  { label: "Likes received", value: stats.likes },
                  { label: "Comments received", value: stats.comments },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
                    <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/stats" className="text-sm hover:underline transition-colors" style={{ color: "var(--text-tertiary)" }}>
                View detailed stats →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}