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
}

interface Counts {
  [postId: string]: { likes: number; saves: number; comments: number };
}

export default function ProfilePostList({ posts }: { posts: Post[] }) {
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    if (posts.length === 0) return;
    const ids = posts.map((p) => p.id);

    const loadCounts = async () => {
      const [likesRes, savesRes, commentsRes] = await Promise.all([
        supabase.from("likes").select("post_id").in("post_id", ids),
        supabase.from("reading_list").select("post_id").in("post_id", ids),
        supabase.from("comments").select("post_id").in("post_id", ids),
      ]);

      const newCounts: Counts = {};
      ids.forEach((id) => { newCounts[id] = { likes: 0, saves: 0, comments: 0 }; });
      likesRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].likes++; });
      savesRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].saves++; });
      commentsRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].comments++; });
      setCounts(newCounts);
    };

    loadCounts();
  }, [posts]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (posts.length === 0) {
    return <p className="text-gray-400 text-center py-10">No published posts yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {posts.map((post) => {
        const c = counts[post.id];
        return (
          <article key={post.id} className="py-5 flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <Link href={`/p/${post.slug}`}>
                <div className="flex items-baseline gap-3 flex-wrap mb-1">
                  <h2 className="font-bold hover:underline leading-snug" style={{ color: "var(--text-primary)" }}>
                    {post.title}
                  </h2>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {formatDate(post.published_at)}
                  </span>
                </div>
                {post.subtitle && (
                  <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {post.subtitle}
                  </p>
                )}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "10px", flexWrap: "wrap" }}>
                {post.tags && post.tags.length > 0 && post.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "2px 8px",
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
              </div>
            </div>
            {post.cover_image && (
              <Link href={`/p/${post.slug}`} className="shrink-0">
                <img src={post.cover_image} alt={post.title} className="w-20 h-14 object-cover rounded-lg" />
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}