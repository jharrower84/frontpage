"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  published_at: string;
  cover_image: string | null;
  tags: string[];
  profiles: {
    full_name: string;
    username: string;
  };
}

export default function SubscriptionsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionFeed();
  }, []);

  const loadSubscriptionFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("author_id")
      .eq("subscriber_id", user.id);

    if (!subs || subs.length === 0) { setLoading(false); return; }

    const authorIds = subs.map((s) => s.author_id);

    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(full_name, username)")
      .eq("published", true)
      .in("author_id", authorIds)
      .order("published_at", { ascending: false });

    if (data) setPosts(data as any);
    setLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Subscriptions</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>Articles from writers you follow.</p>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="mb-2" style={{ color: "var(--text-tertiary)" }}>Nothing here yet.</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>Follow some writers to see their articles here.</p>
          <Link href="/explore" style={{
            fontSize: "14px", padding: "10px 20px", borderRadius: "999px",
            background: "var(--text-primary)", color: "var(--bg)", fontWeight: 500,
          }}>
            Explore writers
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <article key={post.id} className="py-6 flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-xs font-semibold text-pink-700 shrink-0">
                    {post.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <Link href={`/profile/${post.profiles?.username}`}
                    className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                    {post.profiles?.full_name}
                  </Link>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(post.published_at)}</span>
                </div>
                <Link href={`/p/${post.slug}`}>
                  <h2 className="text-lg font-bold leading-snug hover:underline mb-1" style={{ color: "var(--text-primary)" }}>
                    {post.title}
                  </h2>
                  {post.subtitle && <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>{post.subtitle}</p>}
                </Link>
                {post.tags?.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`}
                        className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {post.cover_image && (
                <Link href={`/p/${post.slug}`} className="shrink-0">
                  <img src={post.cover_image} alt={post.title} className="w-24 h-16 object-cover rounded-lg" />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}