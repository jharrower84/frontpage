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
  const [tab, setTab] = useState<"stats" | "users" | "reports" | "featured" | "publishers" | "applications">("stats");
  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [featuredResults, setFeaturedResults] = useState<FeaturedPost[]>([]);

  // Publishers state
  const [publishers, setPublishers] = useState<any[]>([]);
  const [pubRequests, setPubRequests] = useState<any[]>([]);
  const [showAddPub, setShowAddPub] = useState(false);
  const [addingPub, setAddingPub] = useState(false);
  const [newPubName, setNewPubName] = useState("");
  const [newPubDescription, setNewPubDescription] = useState("");
  const [newPubWebsite, setNewPubWebsite] = useState("");
  const [newPubRss, setNewPubRss] = useState("");
  const [newPubCategory, setNewPubCategory] = useState("");
  const [newPubLogo, setNewPubLogo] = useState("");

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [processingApp, setProcessingApp] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      supabase.from("profiles").select("username").eq("id", user.id).single()
        .then(({ data }) => {
          if (data?.username !== "jharrower") { router.push("/"); return; }
          setAuthorised(true);
          setLoading(false);
          loadStats();
          loadUsers();
          loadReports();
          loadFeatured();
          loadPublishers();
          loadPubRequests();
          loadApplications();
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
      totalUsers: users.count || 0, totalPosts: posts.count || 0,
      totalComments: comments.count || 0, totalLikes: likes.count || 0,
      totalSubscriptions: subs.count || 0,
      newUsersThisWeek: newUsers.count || 0, newPostsThisWeek: newPosts.count || 0,
    });
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles")
      .select("id, full_name, username, avatar_url, bio, created_at, approved_creator")
      .order("created_at", { ascending: false }).limit(100);
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
    const { data } = await supabase.from("reports").select("*")
      .order("created_at", { ascending: false }).limit(50);
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
    const { data } = await supabase.from("posts")
      .select("id, title, slug, featured, profiles!posts_author_id_fkey(full_name, username)")
      .eq("published", true).eq("featured", true).order("published_at", { ascending: false });
    setFeaturedPosts((data as any) || []);
  };

  const loadPublishers = async () => {
    const { data } = await supabase.from("publishers").select("*").order("name");
    setPublishers(data || []);
  };

  const loadPubRequests = async () => {
    const { data } = await supabase.from("publisher_requests")
      .select("*, profiles!publisher_requests_user_id_fkey(full_name, username)")
      .order("created_at", { ascending: false });
    setPubRequests(data || []);
  };

  const loadApplications = async () => {
    const { data } = await supabase.from("creator_applications").select("*")
      .order("created_at", { ascending: false });
    if (!data) return;
    const userIds = [...new Set(data.map((a) => a.user_id))];
    const { data: profiles } = await supabase.from("profiles")
      .select("id, username, avatar_url").in("id", userIds);
    const profileMap: Record<string, any> = {};
    profiles?.forEach((p) => { profileMap[p.id] = p; });
    const enriched = data.map((a) => ({ ...a, profile: profileMap[a.user_id] || null }));
    setApplications(enriched);
    setPendingApplications(enriched.filter((a) => a.status === "pending"));
  };

  const searchFeatured = async (q: string) => {
    setFeaturedSearch(q);
    if (!q.trim()) { setFeaturedResults([]); return; }
    const { data } = await supabase.from("posts")
      .select("id, title, slug, featured, profiles!posts_author_id_fkey(full_name, username)")
      .eq("published", true).ilike("title", `%${q}%`).limit(10);
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

const revokeCreator = async (userId: string) => {
    if (!confirm("Revoke this user's creator access? They will no longer be able to publish but their account and existing posts will remain.")) return;
    await supabase.from("profiles").update({ approved_creator: false }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, approved_creator: false } as any : u));
  };

  const togglePublisherActive = async (id: string, current: boolean) => {
    await supabase.from("publishers").update({ active: !current }).eq("id", id);
    setPublishers((prev) => prev.map((p) => p.id === id ? { ...p, active: !current } : p));
  };

  const handleAddPublisher = async () => {
    if (!newPubName.trim() || !newPubRss.trim()) return;
    setAddingPub(true);
    const { error } = await supabase.from("publishers").insert({
      name: newPubName.trim(), description: newPubDescription.trim() || null,
      website: newPubWebsite.trim() || null, rss_url: newPubRss.trim(),
      category: newPubCategory.trim() || null, logo_url: newPubLogo.trim() || null, active: true,
    });
    setAddingPub(false);
    if (!error) {
      setNewPubName(""); setNewPubDescription(""); setNewPubWebsite("");
      setNewPubRss(""); setNewPubCategory(""); setNewPubLogo("");
      setShowAddPub(false);
      loadPublishers();
    }
  };

  const approveRequest = async (request: any) => {
    await supabase.from("publisher_requests").update({ status: "approved" }).eq("id", request.id);
    setNewPubName(request.publisher_name);
    setNewPubWebsite(request.publisher_website || "");
    setShowAddPub(true);
    setTab("publishers");
    loadPubRequests();
  };

  const rejectRequest = async (id: string) => {
    await supabase.from("publisher_requests").update({ status: "rejected" }).eq("id", id);
    loadPubRequests();
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm("Approve this application?")) return;
    setProcessingApp(applicationId);
    const { data: { user } } = await supabase.auth.getUser();
    await fetch("/api/creator-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, action: "approve", adminId: user?.id }),
    });
    setProcessingApp(null);
    setSelectedApplication(null);
    loadApplications();
    window.dispatchEvent(new CustomEvent("admin-action-completed"));
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) return;
    setProcessingApp(applicationId);
    const { data: { user } } = await supabase.auth.getUser();
    await fetch("/api/creator-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, action: "reject", rejectionReason, adminId: user?.id }),
    });
    setProcessingApp(null);
    setShowRejectForm(null);
    setRejectionReason("");
    setSelectedApplication(null);
    loadApplications();
    window.dispatchEvent(new CustomEvent("admin-action-completed"));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const filteredApplications = applications.filter((a) =>
    appFilter === "all" ? true : a.status === appFilter
  );

  const pendingReports = reports.filter((r) => r.status === "pending");
  const pendingPubRequests = pubRequests.filter((r) => r.status === "pending");

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
    { key: "publishers", label: `Publishers${pendingPubRequests.length > 0 ? ` (${pendingPubRequests.length})` : ""}` },
    { key: "applications", label: `Applications${pendingApplications.length > 0 ? ` (${pendingApplications.length})` : ""}` },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#2979FF" }}>A</div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Admin</h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>FrontPage platform management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", marginBottom: "32px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="text-sm pb-3 mr-6 shrink-0 transition-colors"
            style={{
              fontWeight: tab === t.key ? 600 : 400, border: "none",
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
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: "Total users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersThisWeek} this week` },
            { label: "Total posts", value: stats.totalPosts.toLocaleString(), sub: `+${stats.newPostsThisWeek} this week` },
            { label: "Total comments", value: stats.totalComments.toLocaleString(), sub: null },
            { label: "Total likes", value: stats.totalLikes.toLocaleString(), sub: null },
            { label: "Total subscriptions", value: stats.totalSubscriptions.toLocaleString(), sub: null },
            { label: "Pending reports", value: pendingReports.length.toString(), sub: pendingReports.length > 0 ? "Needs attention" : "All clear" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{s.value}</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
              {s.sub && <p className="text-xs mt-1" style={{ color: "#2979FF" }}>{s.sub}</p>}
            </div>
          ))}
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
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
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
                    <>
                      {(user as any).approved_creator && (
                        <button onClick={() => revokeCreator(user.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-orange-200 text-orange-400 hover:bg-orange-50 transition-colors">
                          Revoke
                        </button>
                      )}
                      <button onClick={() => suspendUser(user.id, user.username)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                        Remove
                      </button>
                    </>
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
                <div key={report.id} className="border rounded-2xl p-4"
                  style={{ borderColor: report.status === "pending" ? "#2979FF" : "var(--border)", background: "var(--bg)" }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: report.status === "pending" ? "#eef3ff" : "var(--bg-tertiary)",
                            color: report.status === "pending" ? "#2979FF" : "var(--text-tertiary)"
                          }}>
                          {report.status}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>{formatDate(report.created_at)}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{report.reason}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Reported by @{report.reporter?.username}</p>
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
                        style={{ backgroundColor: "#2979FF" }}>
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
            Featured posts are highlighted on the Explore page and home feed.
          </p>
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
                        ? { backgroundColor: "#2979FF", borderColor: "#2979FF", color: "white" }
                        : { borderColor: "var(--border-strong)", color: "var(--text-secondary)" }
                      }>
                      {post.featured ? "✓ Featured" : "Feature"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
            Currently featured ({featuredPosts.length})
          </h3>
          {featuredPosts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No featured posts yet.</p>
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

      {/* PUBLISHERS */}
      {tab === "publishers" && (
        <div>
          {pendingPubRequests.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
                Pending requests ({pendingPubRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingPubRequests.map((req) => (
                  <div key={req.id} className="border rounded-2xl p-4" style={{ borderColor: "#2979FF", background: "var(--bg)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{req.publisher_name}</p>
                        {req.publisher_website && (
                          <a href={req.publisher_website} target="_blank" rel="noopener noreferrer"
                            className="text-xs hover:underline" style={{ color: "#2979FF" }}>
                            {req.publisher_website}
                          </a>
                        )}
                        {req.notes && <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>{req.notes}</p>}
                        <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                          from @{req.profiles?.username} · {formatDate(req.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => rejectRequest(req.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                          Reject
                        </button>
                        <button onClick={() => approveRequest(req)}
                          className="text-xs px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#2979FF" }}>
                          Approve & add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <button onClick={() => setShowAddPub((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold mb-4 hover:opacity-70 transition-opacity"
              style={{ color: "#2979FF" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add new publisher
            </button>
            {showAddPub && (
              <div className="border rounded-2xl p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                {[
                  { label: "Name *", value: newPubName, set: setNewPubName, placeholder: "e.g. Vogue" },
                  { label: "RSS URL *", value: newPubRss, set: setNewPubRss, placeholder: "https://..." },
                  { label: "Website", value: newPubWebsite, set: setNewPubWebsite, placeholder: "https://..." },
                  { label: "Category", value: newPubCategory, set: setNewPubCategory, placeholder: "Fashion, Business..." },
                  { label: "Logo URL", value: newPubLogo, set: setNewPubLogo, placeholder: "https://..." },
                  { label: "Description", value: newPubDescription, set: setNewPubDescription, placeholder: "Short description..." },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
                      {field.label}
                    </label>
                    <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none"
                      style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
                  </div>
                ))}
                <button onClick={handleAddPublisher}
                  disabled={addingPub || !newPubName.trim() || !newPubRss.trim()}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#2979FF" }}>
                  {addingPub ? "Adding..." : "Add publisher"}
                </button>
              </div>
            )}
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
            All publishers ({publishers.length})
          </h3>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {publishers.map((pub) => (
              <div key={pub.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {pub.logo_url ? (
                    <img src={pub.logo_url} alt={pub.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: "#2979FF" }}>
                      {pub.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{pub.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {pub.category} · <a href={pub.rss_url} target="_blank" rel="noopener noreferrer"
                        className="hover:underline" style={{ color: "#2979FF" }}>RSS</a>
                    </p>
                  </div>
                </div>
                <button onClick={() => togglePublisherActive(pub.id, pub.active)}
                  className="text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-opacity hover:opacity-80"
                  style={pub.active
                    ? { backgroundColor: "#2979FF", borderColor: "#2979FF", color: "white" }
                    : { borderColor: "var(--border)", color: "var(--text-secondary)" }
                  }>
                  {pub.active ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>

          {pubRequests.filter((r) => r.status !== "pending").length > 0 && (
            <div className="mt-10">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
                Past requests
              </h3>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {pubRequests.filter((r) => r.status !== "pending").map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{req.publisher_name}</p>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                        @{req.profiles?.username} · {formatDate(req.created_at)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: req.status === "approved" ? "#f0fdf4" : "var(--bg-tertiary)",
                        color: req.status === "approved" ? "#22c55e" : "var(--text-tertiary)",
                      }}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS */}
      {tab === "applications" && (
        <div>
          {selectedApplication ? (
            <div>
              <button onClick={() => { setSelectedApplication(null); setShowRejectForm(null); setRejectionReason(""); }}
                className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-secondary)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
                </svg>
                Back to applications
              </button>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{selectedApplication.full_name}</h2>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {selectedApplication.publication_name} · @{selectedApplication.profile?.username}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: selectedApplication.status === "pending" ? "#eef3ff" : selectedApplication.status === "approved" ? "#f0fdf4" : "#fff5f5",
                    color: selectedApplication.status === "pending" ? "#2979FF" : selectedApplication.status === "approved" ? "#22c55e" : "#e05555",
                  }}>
                  {selectedApplication.status}
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Bio", value: selectedApplication.bio },
                  { label: "Pitch", value: selectedApplication.pitch },
                  { label: "Niche", value: selectedApplication.niche?.join(", ") },
                  { label: "Instagram", value: selectedApplication.instagram ? `@${selectedApplication.instagram}` : null },
                  { label: "TikTok", value: selectedApplication.tiktok ? `@${selectedApplication.tiktok}` : null },
                  { label: "LinkedIn", value: selectedApplication.linkedin },
                  { label: "Website", value: selectedApplication.website },
                  { label: "Writing samples", value: selectedApplication.writing_samples },
                  { label: "Rejection feedback", value: selectedApplication.rejection_reason },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label} className="rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>{field.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{field.value}</p>
                  </div>
                ))}
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>Applied {formatDate(selectedApplication.created_at)}</p>
              </div>

              {selectedApplication.status === "pending" && (
                <div className="mt-8 space-y-3">
                  {showRejectForm === selectedApplication.id ? (
                    <div className="space-y-3">
                      <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide feedback for the applicant..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none resize-none"
                        style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowRejectForm(null); setRejectionReason(""); }}
                          className="text-sm px-4 py-2 rounded-lg border transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                          Cancel
                        </button>
                        <button onClick={() => handleReject(selectedApplication.id)}
                          disabled={!rejectionReason.trim() || !!processingApp}
                          className="text-sm px-4 py-2 rounded-lg text-white disabled:opacity-40"
                          style={{ backgroundColor: "#e05555" }}>
                          {processingApp === selectedApplication.id ? "Sending..." : "Send rejection"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => setShowRejectForm(selectedApplication.id)}
                        className="text-sm px-5 py-2.5 rounded-xl border transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                        Reject
                      </button>
                      <button onClick={() => handleApprove(selectedApplication.id)}
                        disabled={!!processingApp}
                        className="text-sm px-5 py-2.5 rounded-xl text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#2979FF" }}>
                        {processingApp === selectedApplication.id ? "Approving..." : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-6 flex-wrap">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button key={f} onClick={() => setAppFilter(f)}
                    className="text-xs px-3 py-1.5 rounded-full capitalize transition-colors"
                    style={{
                      background: appFilter === f ? "#2979FF" : "var(--bg-secondary)",
                      color: appFilter === f ? "white" : "var(--text-secondary)",
                      border: appFilter === f ? "1px solid #2979FF" : "1px solid var(--border)",
                    }}>
                    {f} ({f === "all" ? applications.length : applications.filter((a) => a.status === f).length})
                  </button>
                ))}
              </div>

              {filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No applications yet</p>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Applications will appear here when users apply to become creators.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filteredApplications.map((app) => (
                    <button key={app.id} onClick={() => setSelectedApplication(app)}
                      className="w-full py-4 flex items-center justify-between gap-4 text-left hover:opacity-70 transition-opacity">
                      <div className="flex items-center gap-3 min-w-0">
                        {app.profile?.avatar_url ? (
                          <img src={app.profile.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                            {app.full_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{app.full_name}</p>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {app.publication_name} · {formatDate(app.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            background: app.status === "pending" ? "#eef3ff" : app.status === "approved" ? "#f0fdf4" : "#fff5f5",
                            color: app.status === "pending" ? "#2979FF" : app.status === "approved" ? "#22c55e" : "#e05555",
                          }}>
                          {app.status}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4" style={{ color: "var(--text-faint)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}