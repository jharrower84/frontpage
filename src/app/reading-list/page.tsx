"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const metadata = {
  title: "Reading List",
  description: "Your saved articles on FrontPage.",
};

interface SavedPost {
  id: string;
  post: {
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
      avatar_url: string | null;
    };
  };
}

interface Counts {
  [postId: string]: { likes: number; saves: number; comments: number };
}

export default function ReadingListPage() {
  const [items, setItems] = useState<SavedPost[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadingList();
  }, []);

  const loadReadingList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reading_list")
      .select(`id, post:post_id(id, title, subtitle, slug, published_at, cover_image, tags, profiles!posts_author_id_fkey(full_name, username, avatar_url))`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setItems(data as any);
      const ids = (data as any).map((i: any) => i.post?.id).filter(Boolean);
      if (ids.length > 0) {
        const [likesRes, savesRes, commentsRes] = await Promise.all([
          supabase.from("likes").select("post_id").in("post_id", ids),
          supabase.from("reading_list").select("post_id").in("post_id", ids),
          supabase.from("comments").select("post_id").in("post_id", ids),
        ]);
        const newCounts: Counts = {};
        ids.forEach((id: string) => { newCounts[id] = { likes: 0, saves: 0, comments: 0 }; });
        likesRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].likes++; });
        savesRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].saves++; });
        commentsRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].comments++; });
        setCounts(newCounts);
      }
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from("reading_list").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Reading list</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>Articles you've saved to read later.</p>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔖</div>
          <p style={{ color: "var(--text-tertiary)" }}>Nothing saved yet.</p>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-tertiary)" }}>
            Tap the bookmark icon on any article to save it here.
          </p>
          <Link href="/explore" style={{
            fontSize: "14px", padding: "10px 20px", borderRadius: "999px",
            background: "var(--text-primary)", color: "var(--bg)", fontWeight: 500,
          }}>
            Explore articles
          </Link>
        </div>
      ) : (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {items.map((item) => {
            const post = item.post;
            const c = counts[post?.id];
            return (
              <article key={item.id} className="py-5 flex gap-4 items-start" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {post?.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-faint)" }}>
                        {post?.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <Link href={`/${post?.profiles?.username}`}
                      className="text-xs font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                      {post?.profiles?.full_name}
                    </Link>
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(post?.published_at)}</span>
                  </div>
                  <Link href={`/p/${post?.slug}`}>
                    <h2 className="font-bold hover:underline leading-snug mb-1" style={{ color: "var(--text-primary)" }}>
                      {post?.title}
                    </h2>
                    {post?.subtitle && (
                      <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>{post.subtitle}</p>
                    )}
                  </Link>

                  {/* Tags + counts row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                    {post?.tags && post.tags.length > 0 && post.tags.slice(0, 3).map((tag) => (
                      <Link
                        key={tag}
                        href={`/explore?tag=${encodeURIComponent(tag)}`}
                        style={{
                          fontSize: "11px", fontWeight: 500,
                          color: "var(--text-secondary)",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px", padding: "2px 8px",
                          textDecoration: "none",
                        }}
                        className="hover:!text-blue-500 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                    {c && (
                      <>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2979FF" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {c.likes}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2979FF" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {c.saves}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2979FF" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {c.comments}
                        </span>
                      </>
                    )}
                    <button onClick={() => handleRemove(item.id)}
                      className="text-xs hover:text-red-500 transition-colors ml-auto"
                      style={{ color: "var(--text-faint)" }}>
                      Remove
                    </button>
                  </div>
                </div>
                {post?.cover_image && (
                  <Link href={`/p/${post?.slug}`} className="shrink-0">
                    <img src={post.cover_image} alt={post.title} className="w-20 h-14 object-cover rounded-lg" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}