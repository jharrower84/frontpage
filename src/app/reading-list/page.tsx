"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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
    };
  };
}

export default function ReadingListPage() {
  const [items, setItems] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadingList();
  }, []);

  const loadReadingList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reading_list")
      .select(`id, post:post_id(id, title, subtitle, slug, published_at, cover_image, tags, profiles!posts_author_id_fkey(full_name, username))`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setItems(data as any);
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
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Reading list</h1>
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
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <article key={item.id} className="py-5 flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-pink-200 flex items-center justify-center text-xs font-semibold text-pink-700 shrink-0">
                    {item.post?.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <Link href={`/profile/${item.post?.profiles?.username}`}
                    className="text-xs font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                    {item.post?.profiles?.full_name}
                  </Link>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(item.post?.published_at)}</span>
                </div>
                <Link href={`/p/${item.post?.slug}`}>
                  <h2 className="font-bold hover:underline leading-snug mb-1" style={{ color: "var(--text-primary)" }}>
                    {item.post?.title}
                  </h2>
                  {item.post?.subtitle && (
                    <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>{item.post.subtitle}</p>
                  )}
                </Link>
                <button onClick={() => handleRemove(item.id)}
                  className="text-xs mt-2 hover:text-red-500 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}>
                  Remove
                </button>
              </div>
              {item.post?.cover_image && (
                <Link href={`/p/${item.post?.slug}`} className="shrink-0">
                  <img src={item.post.cover_image} alt={item.post.title} className="w-20 h-14 object-cover rounded-lg" />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}