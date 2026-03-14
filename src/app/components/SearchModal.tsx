"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface Writer {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setWriters([]);
      return;
    }

    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const search = async (q: string) => {
    setLoading(true);
    const term = q.toLowerCase();

    const [postsRes, writersRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id, title, slug, cover_image, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
        .eq("published", true)
        .or(`title.ilike.%${term}%,subtitle.ilike.%${term}%`)
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio")
        .or(`full_name.ilike.%${term}%,username.ilike.%${term}%,bio.ilike.%${term}%`)
        .limit(4),
    ]);

    setPosts((postsRes.data as any) || []);
    setWriters(writersRes.data || []);
    setLoading(false);
  };

  const hasResults = posts.length > 0 || writers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0" style={{ color: "var(--text-tertiary)" }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles and writers..."
            className="flex-1 text-sm focus:outline-none bg-transparent"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--text-tertiary)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button onClick={onClose}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Searching...</p>
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No results for "{query}"</p>
            </div>
          )}

          {!loading && !query && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Type to search articles and writers</p>
            </div>
          )}

          {/* Writers */}
          {writers.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>Writers</p>
              <div className="space-y-2">
                {writers.map((writer) => (
                  <Link key={writer.id} href={`/profile/${writer.username}`} onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:opacity-80">
                    {writer.avatar_url ? (
                      <img src={writer.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                        {writer.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{writer.full_name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>@{writer.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Articles */}
          {posts.length > 0 && (
            <div className="px-4 pt-4 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>Articles</p>
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link key={post.id} href={`/p/${post.slug}`} onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:opacity-80">
                    {post.cover_image ? (
                      <img src={post.cover_image} className="w-12 h-9 object-cover rounded-lg shrink-0" alt="" />
                    ) : (
                      <div className="w-12 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4" style={{ color: "var(--text-faint)" }}>
                          <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--text-primary)" }}>{post.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{(post.profiles as any)?.full_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* View all in explore */}
          {hasResults && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <Link href={`/explore?q=${encodeURIComponent(query)}`} onClick={onClose}
                className="flex items-center justify-center gap-2 py-3 text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--text-tertiary)" }}>
                View all results in Explore →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}