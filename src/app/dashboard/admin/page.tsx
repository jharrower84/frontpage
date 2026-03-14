"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  post_count: number;
  subscriber_count: number;
}

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  post?: { title: string; slug: string; author_id: string };
  comment?: { content: string; post_id: string };
  reporter?: { username: string; full_name: string };
}

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalSubscriptions: number;
  newUsersThisWeek: number;
  newPostsThisWeek: number;
}

interface FeaturedPost {
  id: string;
  title: string;
  slug: string;
  featured: boolean;
  profiles: { full_name: string; username: string };
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"stats" | "users" | "reports" | "featured">("stats");
  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [featuredResults, setFeaturedResults] = useState<FeaturedPost[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      supabase.from("profiles").select("username").eq("id", user.id).single()
        .then(({ data }) => {
          if (data?.username !== "jharrower") {
            router.push("/");
            return;
          }
          setAuthorised(true);
          setLoading(false);
          loadStats();
          loadUsers();
          loadReports();
          loadFeatured();
        });
    });
  }, []);

  const loadStats = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString();

    const [users, posts, comments, likes, subs, newUsers, newPosts] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("likes").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekStr),
      supabase.from("posts").select("*", { count: "exact", head: true }).gte("published_at", weekStr),
    ]);

    setStats({
      totalUsers: users.count || 0,
      totalPosts: posts.count || 0,
      totalComments: comments.count || 0,
      totalLikes: likes.count || 0,
      totalSubscriptions: subs.count || 0,
      newUsersThisWeek: newUsers.count || 0,
      newPostsThisWeek: newPosts.count || 0,
    });
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) return;

    const enriched = await Promise.all(
      data.map(async (u) => {
        const [posts, subs] = await Promise.all([
          supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", u.id),
          supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("author_id", u.id),
        ]);
        return { ...u, post_count: posts.count || 0, subscriber_count: subs.count || 0 };
      })
    );

    setUsers(enriched);
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return;

    const enriched = await Promise.all(
      data.map(async (r) => {
        const [reporter, post] = await Promise.all([
          supabase.from("profiles").select("username, full_name").eq("id", r.reporter_id).single(),
          r.post_id ? supabase.from("posts").select("title, slug, author_id").eq("id", r.post_id).single() : Promise.resolve({ data: null }),
        ]);
        return { ...r, reporter: reporter.data, post: post.data };
      })
    );

    setReports(enriched);
  };

  const loadFeatured = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, featured, profiles!posts_author_id_fkey(full_name, username)")
      .eq("published", true)
      .eq("featured", true)
      .order("published_at", { ascending: false });

    setFeaturedPosts((data as any) || []);
  };

  const searchFeatured = async (q: string) => {
    setFeaturedSearch(q);
    if (!q.trim()) { setFeaturedResults([]); return; }

    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, featured, profiles!posts_author_id_fkey(full_name, username)")
      .eq("published", true)
      .ilike("title", `%${q}%`)
      .limit(10);

    setFeaturedResults((data as any) || []);
  };

  const toggleFeatured = async (postId: string, current: boolean) => {
    await supabase.from("posts").update({ featured: !current }).eq("id", postId);
    loadFeatured();
    setFeaturedResults((prev) => prev.map((p) => p.id === postId ? { ...p, featured: !current } : p));
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await supabase.from("posts").delete().eq("id", postId);
    loadReports();
  };

  const resolveReport = async (reportId: string) => {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "resolved" } : r));
  };

  const dismissReport = async (reportId: string) => {
    await supabase.from("reports").update({ status: "dismissed" }).eq("id", reportId);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "dismissed" } : r));
  };

  const suspendUser = async (userId: string, username: string) => {
    if (!confirm(`Suspend @${username}? This will delete all their posts and remove their account.`)) return;
    await supabase.from("posts").delete().eq("author_id", userId);
    await supabase.from("subscriptions").delete().eq("subscriber_id", userId);
    await supabase.from("subscriptions").delete().eq("author_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const pendingReports = reports.filter((r) => r.status === "pending");

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  if (!authorised) return null;

  const TABS = [
    { key: "stats", label: "Platform stats" },
    { key: "users", label: "Users" },
    { key: "reports", label: `Reports${pendingReports.length > 0 ? ` (${pendingReports.length})` : ""}` },
    { key: "featured", label: "Featured" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#e8a0a0" }}>A</div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Admin</h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>FrontPage platform management</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "32px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              paddingBottom: "12px", marginRight: "24px", fontSize: "14px",
              fontWeight: tab === t.key ? 600 : 400,
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: tab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
              color: tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
              background: "none", cursor: "pointer",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === "stats" && stats && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: "Total users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersThisWeek} this week` },
              { label: "Total posts", value: stats.totalPosts.toLocaleString(), sub: `+${stats.newPostsThisWeek} this week` },
              { label: "Total comments", value: stats.totalComments.toLocaleString(), sub: null },
              { label: "Total likes", value: stats.totalLikes.toLocaleString(), sub: null },
              { label: "Total subscriptions", value: stats.totalSubscriptions.toLocaleString(), sub: null },
              { label: "Pending reports", value: pendingReports.length.toString(), sub: pendingReports.length > 0 ? "Needs attention" : "All clear" },
            ].map((s) => (
              <div key={s.label} className="border border-gray-100 rounded-2xl p-5" style={{ borderColor: "var(--border)" }}>
                <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
                {s.sub && <p className="text-xs mt-1" style={{ color: "var(--pink)" }}>{s.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{users.length} users</p>
            <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users..."
              className="border rounded-full px-4 py-2 text-sm focus:outline-none w-52"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredUsers.map((user) => (
              <div key={user.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                      {user.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.full_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>@{user.username} · {user.post_count} posts · {user.subscriber_count} subscribers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs hidden sm:block" style={{ color: "var(--text-faint)" }}>{formatDate(user.created_at)}</p>
                  <Link href={`/profile/${user.username}`}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
                    View
                  </Link>
                  {user.username !== "jharrower" && (
                    <button onClick={() => suspendUser(user.id, user.username)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab === "reports" && (
        <div>
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-3">✓</p>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No reports yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>When users report content it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-2xl p-4" style={{ borderColor: report.status === "pending" ? "#e8a0a0" : "var(--border)", background: "var(--bg)" }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: report.status === "pending" ? "#fdf2f2" : "var(--bg-tertiary)",
                            color: report.status === "pending" ? "#c06060" : "var(--text-tertiary)"
                          }}>
                          {report.status}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>{formatDate(report.created_at)}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{report.reason}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        Reported by @{report.reporter?.username}
                      </p>
                    </div>
                  </div>

                  {report.post && (
                    <div className="rounded-xl p-3 mb-3" style={{ background: "var(--bg-secondary)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Reported post:</p>
                      <Link href={`/p/${report.post.slug}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                        {report.post.title}
                      </Link>
                    </div>
                  )}

                  {report.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => dismissReport(report.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
                        Dismiss
                      </button>
                      {report.post_id && (
                        <button onClick={() => deletePost(report.post_id!)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                          Delete post
                        </button>
                      )}
                      <button onClick={() => resolveReport(report.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-white transition-colors"
                        style={{ backgroundColor: "#e8a0a0" }}>
                        Mark resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURED */}
      {tab === "featured" && (
        <div>
          <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
            Featured posts are highlighted on the Explore page and home feed. Search for any post to feature it.
          </p>

          {/* Search to add featured */}
          <div className="mb-8">
            <input type="text" value={featuredSearch} onChange={(e) => searchFeatured(e.target.value)}
              placeholder="Search posts to feature..."
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none mb-3"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />

            {featuredResults.length > 0 && (
              <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {featuredResults.map((post) => (
                  <div key={post.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{post.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>by {(post.profiles as any)?.full_name}</p>
                    </div>
                    <button onClick={() => toggleFeatured(post.id, post.featured)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0"
                      style={post.featured
                        ? { backgroundColor: "#e8a0a0", borderColor: "#e8a0a0", color: "white" }
                        : { borderColor: "var(--border-strong)", color: "var(--text-secondary)" }
                      }>
                      {post.featured ? "✓ Featured" : "Feature"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Currently featured */}
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
            Currently featured ({featuredPosts.length})
          </h3>

          {featuredPosts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No featured posts yet. Search above to add some.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {featuredPosts.map((post) => (
                <div key={post.id} className="py-4 flex items-center justify-between">
                  <div>
                    <Link href={`/p/${post.slug}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                      {post.title}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>by {(post.profiles as any)?.full_name}</p>
                  </div>
                  <button onClick={() => toggleFeatured(post.id, true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors shrink-0">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}