"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import SubscribeButton from "@/app/components/SubscribeButton";

const FASHION_TAGS = [
  "All", "Trends", "Runway", "Street Style", "Sustainability",
  "Business of Fashion", "Beauty", "Accessories", "Menswear",
  "Womenswear", "Vintage", "Luxury", "High Street"
];

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
    avatar_url: string | null;
  };
}

interface Writer {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  post_count: number;
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [writerResults, setWriterResults] = useState<Writer[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") || "All");
  const [searchTab, setSearchTab] = useState<"articles" | "writers">("articles");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, activeTag, posts, writers]);

  const loadData = async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(200);

    if (postsData) setPosts(postsData as any);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio")
      .limit(200);

    if (profilesData) {
      const writersWithCounts = await Promise.all(
        profilesData.map(async (p) => {
          const { count } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("author_id", p.id)
            .eq("published", true);
          return { ...p, post_count: count || 0 };
        })
      );
      setWriters(writersWithCounts.filter((w) => w.post_count > 0));
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let results = posts;

    if (activeTag && activeTag !== "All") {
      results = results.filter((p) => p.tags?.includes(activeTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.profiles?.full_name?.toLowerCase().includes(q)
      );
      const writerRes = writers.filter(
        (w) =>
          w.full_name?.toLowerCase().includes(q) ||
          w.username?.toLowerCase().includes(q) ||
          w.bio?.toLowerCase().includes(q)
      );
      setWriterResults(writerRes);
    } else {
      setWriterResults([]);
    }

    setFiltered(results);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setSearch("");
    router.push(tag === "All" ? "/explore" : `/explore?tag=${encodeURIComponent(tag)}`);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setActiveTag("All");
    if (q.trim()) {
      router.push(`/explore?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/explore");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const hero = !search.trim() ? filtered[0] : null;
  const rest = !search.trim() ? filtered.slice(1) : filtered;
  const isSearching = search.trim().length > 0;

  return (
    <div className="flex gap-8 max-w-5xl mx-auto px-6 py-10">

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Explore</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search articles or writers..."
            className="border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors w-56"
          />
        </div>

        {!isSearching && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {FASHION_TAGS.map((tag) => (
              <button key={tag} onClick={() => handleTagClick(tag)}
                className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap border transition-colors shrink-0 ${
                  activeTag === tag ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
            {(["articles", "writers"] as const).map((t) => (
              <button key={t} onClick={() => setSearchTab(t)}
                style={{
                  paddingBottom: "12px", marginRight: "24px", fontSize: "14px",
                  fontWeight: searchTab === t ? 600 : 400,
                  borderTop: "none", borderLeft: "none", borderRight: "none",
                  borderBottom: searchTab === t ? "2px solid var(--text-primary)" : "2px solid transparent",
                  color: searchTab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                  background: "none", cursor: "pointer", textTransform: "capitalize",
                }}>
                {t === "articles" ? `Articles (${filtered.length})` : `Writers (${writerResults.length})`}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {isSearching && searchTab === "writers" && (
              <div>
                {writerResults.length === 0 ? (
                  <p className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>No writers found for "{search}"</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {writerResults.map((writer) => (
                      <div key={writer.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {writer.avatar_url ? (
                            <img src={writer.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                              {writer.full_name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link href={`/profile/${writer.username}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                              {writer.full_name}
                            </Link>
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>@{writer.username} · {writer.post_count} posts</p>
                            {writer.bio && <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-secondary)" }}>{writer.bio}</p>}
                          </div>
                        </div>
                        <SubscribeButton authorId={writer.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(!isSearching || searchTab === "articles") && (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <p style={{ color: "var(--text-tertiary)" }}>
                      {isSearching ? `No articles found for "${search}"` : "No articles yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    {hero && (
                      <Link href={`/p/${hero.slug}`} className="block mb-10 group">
                        {hero.cover_image ? (
                          <div className="relative rounded-2xl overflow-hidden h-72 mb-4">
                            <img src={hero.cover_image} alt={hero.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                              <div className="flex items-center gap-2 mb-2">
                                {hero.profiles?.avatar_url ? (
                                  <img src={hero.profiles.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold text-pink-700">
                                    {hero.profiles?.full_name?.[0]?.toUpperCase()}
                                  </div>
                                )}
                                <span className="text-white/70 text-xs">{hero.profiles?.full_name}</span>
                              </div>
                              <h2 className="text-white text-2xl font-bold leading-tight">{hero.title}</h2>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl p-8 group-hover:opacity-90 transition-opacity" style={{ background: "var(--bg-secondary)" }}>
                            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>{hero.profiles?.full_name}</p>
                            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{hero.title}</h2>
                          </div>
                        )}
                      </Link>
                    )}

                    <div className="divide-y divide-gray-100">
                      {rest.map((post) => (
                        <article key={post.id} className="py-5 flex gap-4 items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {post.profiles?.avatar_url ? (
                                <img src={post.profiles.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold text-pink-700 shrink-0">
                                  {post.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                                </div>
                              )}
                              <Link href={`/profile/${post.profiles?.username}`} className="text-xs font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                                {post.profiles?.full_name}
                              </Link>
                              <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
                              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(post.published_at)}</span>
                            </div>
                            <Link href={`/p/${post.slug}`}>
                              <h2 className="text-base font-bold hover:underline leading-snug mb-1" style={{ color: "var(--text-primary)" }}>{post.title}</h2>
                              {post.subtitle && <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>{post.subtitle}</p>}
                            </Link>
                            {post.tags?.length > 0 && (
                              <div className="flex gap-1.5 mt-2">
                                {post.tags.slice(0, 2).map((tag) => (
                                  <button key={tag} onClick={() => handleTagClick(tag)}
                                    className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {post.cover_image && (
                            <Link href={`/p/${post.slug}`} className="shrink-0">
                              <img src={post.cover_image} alt={post.title} className="w-20 h-14 object-cover rounded-lg" />
                            </Link>
                          )}
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-10">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
            Writers to follow
          </h3>
          <div className="space-y-4">
            {writers.slice(0, 6).map((writer) => (
              <div key={writer.id} className="flex items-start gap-3">
                {writer.avatar_url ? (
                  <img src={writer.avatar_url} alt={writer.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                    {writer.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${writer.username}`} className="text-sm font-medium hover:underline block truncate" style={{ color: "var(--text-primary)" }}>
                    {writer.full_name}
                  </Link>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                    {writer.bio || `${writer.post_count} posts`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}