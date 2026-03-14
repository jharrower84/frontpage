"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NewsletterComposer from "@/app/components/NewsletterComposer";

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  published: boolean;
  published_at: string;
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
  const [tab, setTab] = useState(searchParams.get("tab") || "posts");
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

  const filteredSubscribers = subscribers.filter((s) => {
    if (!subscriberSearch.trim()) return true;
    const q = subscriberSearch.toLowerCase();
    return (
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.profiles?.username?.toLowerCase().includes(q)
    );
  });

  const tabs = ["posts", "subscribers", "newsletter", "stats", "settings"];
  const isAdmin = true; // controlled by username check below

  return (
    <div className="flex max-w-5xl mx-auto px-6 py-10 gap-8">

      {/* Dashboard sub-nav */}
      <div className="w-44 shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Dashboard</p>
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors focus:outline-none ${
                tab === t ? "bg-gray-100 font-medium text-black" : "text-gray-500 hover:text-black"
                }`}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* POSTS */}
        {tab === "posts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">Posts</h2>
              <Link href="/dashboard/new"
                className="text-sm px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: "#e8a0a0" }}>
                + New post
              </Link>
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-4">No posts yet.</p>
                <Link href="/dashboard/new" className="text-sm font-medium text-black hover:underline">
                  Write your first post →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <article key={post.id} className="py-4 flex items-start gap-4">
                    {post.cover_image && (
                      <img src={post.cover_image} alt={post.title} className="w-16 h-12 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-black truncate">{post.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          post.published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      {post.subtitle && <p className="text-xs text-gray-400 line-clamp-1">{post.subtitle}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-300">{formatDate(post.published_at)}</p>
                        {post.view_count > 0 && (
                          <p className="text-xs text-gray-400">{post.view_count} views</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link href={`/dashboard/edit/${post.id}`} className="text-xs text-gray-400 hover:text-black transition-colors">Edit</Link>
                      {post.published && (
                        <Link href={`/p/${post.slug}`} className="text-xs text-gray-400 hover:text-black transition-colors">View</Link>
                      )}
                      <button onClick={() => handleDelete(post.id)} className="text-xs text-red-300 hover:text-red-500 transition-colors">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBSCRIBERS */}
        {tab === "subscribers" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-black">Subscribers</h2>
                <p className="text-sm text-gray-400 mt-0.5">{subscribers.length} total</p>
              </div>
              <input type="text" value={subscriberSearch} onChange={(e) => setSubscriberSearch(e.target.value)}
                placeholder="Search subscribers..."
                className="border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gray-400 w-44" />
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">✉️</p>
                <p className="text-gray-500 font-medium mb-1">No subscribers yet</p>
                <p className="text-gray-400 text-sm">Share your work and they'll come.</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No subscribers match your search.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSubscribers.map((sub) => (
                  <div key={sub.subscriber_id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {sub.profiles?.avatar_url ? (
                        <img src={sub.profiles.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700">
                          {sub.profiles?.full_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/profile/${sub.profiles?.username}`} className="text-sm font-medium hover:underline" style={{ color: "#0f0f0f" }}>
                        {sub.profiles?.full_name}
                        </Link>
                        <p className="text-xs text-gray-400">@{sub.profiles?.username}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Subscribed {formatDate(sub.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEWSLETTER */}
        {tab === "newsletter" && userId && (
          <NewsletterComposer
            authorId={userId}
            subscriberCount={subscribers.length}
            loading={loading}
          />
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div>
            <h2 className="text-xl font-bold text-black mb-6">Stats</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: "Total views", value: stats.views },
                { label: "Posts", value: stats.posts },
                { label: "Subscribers", value: stats.subscribers },
                { label: "Likes received", value: stats.likes },
                { label: "Comments received", value: stats.comments },
              ].map((s) => (
                <div key={s.label} className="border border-gray-100 rounded-2xl p-5">
                  <p className="text-3xl font-bold text-black mb-1">{s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/stats" className="text-sm text-gray-400 hover:text-black transition-colors">
              View detailed stats →
            </Link>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div>
            <h2 className="text-xl font-bold text-black mb-6">Settings</h2>
            <div className="space-y-3">
              <Link href="/settings" className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-black">Profile settings</p>
                  <p className="text-xs text-gray-400">Name, username, bio, avatar</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
              </Link>
              <Link href="/onboarding" className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-black">Re-run onboarding</p>
                  <p className="text-xs text-gray-400">Update your interests and profile</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}