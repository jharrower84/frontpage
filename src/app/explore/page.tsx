"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import SubscribeButton from "@/app/components/SubscribeButton";

const FASHION_TAGS = [
  "Trends", "Runway", "Street Style", "Sustainability",
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

type Counts = { [postId: string]: { likes: number; saves: number; comments: number } };

const Avatar = ({ url, name, size = 20 }: { url: string | null | undefined; name: string | undefined; size?: number }) => (
  url ? (
    <img src={url} alt={name || ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--bg-tertiary)", color: "var(--text-faint)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, fontWeight: 600,
    }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  )
);

const TagCountsRow = ({ post, counts, handleTagClick }: { post: Post; counts: Counts; handleTagClick: (tag: string) => void }) => {
  const c = counts[post.id];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
      {post.tags && post.tags.length > 0 && post.tags.slice(0, 3).map((tag) => (
        <button
          key={tag}
          onClick={() => handleTagClick(tag)}
          style={{
            fontSize: "11px", fontWeight: 500,
            color: "var(--text-secondary)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "6px", padding: "2px 8px", cursor: "pointer",
          }}
          className="hover:!text-blue-500 transition-colors"
        >
          {tag}
        </button>
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
  );
};

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [writerResults, setWriterResults] = useState<Writer[]>([]);
  const [tagSections, setTagSections] = useState<{ tag: string; posts: Post[] }[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") || "");
  const [searchTab, setSearchTab] = useState<"articles" | "writers">("articles");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, activeTag, allPosts, writers]);

  const loadData = async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(200);

    if (postsData) {
      setAllPosts(postsData as any);

      // Load counts for all posts
      const ids = postsData.map((p: any) => p.id);
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
    let results = allPosts;

    if (activeTag) {
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
      setWriterResults(writers.filter(
        (w) =>
          w.full_name?.toLowerCase().includes(q) ||
          w.username?.toLowerCase().includes(q) ||
          w.bio?.toLowerCase().includes(q)
      ));
    } else {
      setWriterResults([]);
    }

    setFiltered(results);

    if (!search.trim() && !activeTag) {
      const sections = FASHION_TAGS.map((tag) => ({
        tag,
        posts: allPosts.filter((p) => p.tags?.includes(tag)).slice(0, 3),
      })).filter((s) => s.posts.length > 0);
      setTagSections(sections);
    }
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag === activeTag ? "" : tag);
    setSearch("");
    router.push(tag === activeTag ? "/explore" : `/explore?tag=${encodeURIComponent(tag)}`);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setActiveTag("");
    router.push(q.trim() ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const isSearching = search.trim().length > 0;
  const isTagFiltered = !!activeTag && !isSearching;
  const isBrowsing = !isSearching && !isTagFiltered;

  const hero = (isTagFiltered || isSearching) ? null : allPosts[0];

  return (
    <div className="flex gap-10 max-w-5xl mx-auto px-6 py-10">

      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Explore
          </h1>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", width: "220px" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search articles or writers..."
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            {search && (
              <button onClick={() => handleSearch("")} style={{ color: "var(--text-faint)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tag filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: "none" }}>
          {FASHION_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="text-sm px-4 py-1.5 rounded-full whitespace-nowrap border transition-colors shrink-0"
              style={activeTag === tag
                ? { background: "var(--text-primary)", color: "var(--bg)", borderColor: "var(--text-primary)" }
                : { borderColor: "var(--border)", color: "var(--text-tertiary)" }
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div style={{ height: "320px", borderRadius: "16px", background: "var(--bg-tertiary)" }} className="animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex-1 space-y-2">
                  <div style={{ height: "12px", width: "100px", borderRadius: "6px", background: "var(--bg-tertiary)" }} />
                  <div style={{ height: "20px", width: "75%", borderRadius: "6px", background: "var(--bg-tertiary)" }} />
                  <div style={{ height: "14px", width: "55%", borderRadius: "6px", background: "var(--bg-tertiary)" }} />
                </div>
                <div style={{ width: "140px", height: "96px", borderRadius: "10px", background: "var(--bg-tertiary)", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Search results */}
            {isSearching && (
              <>
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
                  {(["articles", "writers"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSearchTab(t)}
                      style={{
                        paddingBottom: "12px", marginRight: "24px", fontSize: "14px",
                        fontWeight: searchTab === t ? 600 : 400,
                        border: "none",
                        borderBottom: searchTab === t ? "2px solid var(--text-primary)" : "2px solid transparent",
                        color: searchTab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                        background: "none", cursor: "pointer", textTransform: "capitalize",
                      }}
                    >
                      {t === "articles" ? `Articles (${filtered.length})` : `Writers (${writerResults.length})`}
                    </button>
                  ))}
                </div>

                {searchTab === "writers" ? (
                  writerResults.length === 0 ? (
                    <p className="text-center py-16 text-sm" style={{ color: "var(--text-tertiary)" }}>
                      No writers found for "{search}"
                    </p>
                  ) : (
                    <div>
                      {writerResults.map((writer, i) => (
                        <div
                          key={writer.id}
                          className="flex items-center justify-between py-4"
                          style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar url={writer.avatar_url} name={writer.full_name} size={40} />
                            <div>
                              <Link href={`/${writer.username}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                                {writer.full_name}
                              </Link>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                                @{writer.username} · {writer.post_count} posts
                              </p>
                              {writer.bio && (
                                <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                  {writer.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <SubscribeButton authorId={writer.id} />
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  filtered.length === 0 ? (
                    <p className="text-center py-16 text-sm" style={{ color: "var(--text-tertiary)" }}>
                      No articles found for "{search}"
                    </p>
                  ) : (
                    <ArticleList posts={filtered} counts={counts} formatDate={formatDate} handleTagClick={handleTagClick} />
                  )
                )}
              </>
            )}

            {/* Tag filtered view */}
            {isTagFiltered && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {activeTag}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {filtered.length} articles
                  </p>
                </div>
                {filtered.length === 0 ? (
                  <p className="text-center py-16 text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No articles tagged with {activeTag} yet.
                  </p>
                ) : (
                  <>
                    {filtered[0] && (
                      <Link href={`/p/${filtered[0].slug}`} className="block mb-8 group">
                        {filtered[0].cover_image ? (
                          <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", height: "300px" }}>
                            <img src={filtered[0].cover_image} alt={filtered[0].title} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="group-hover:scale-[1.02] transition-transform duration-500" />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 32px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <Avatar url={filtered[0].profiles?.avatar_url} name={filtered[0].profiles?.full_name} size={18} />
                                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{filtered[0].profiles?.full_name}</span>
                                <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{formatDate(filtered[0].published_at)}</span>
                              </div>
                              <h2 style={{ color: "white", fontSize: "22px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                                {filtered[0].title}
                              </h2>
                              {filtered[0].subtitle && (
                                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "6px" }}>
                                  {filtered[0].subtitle}
                                </p>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                                {filtered[0].tags && filtered[0].tags.slice(0, 3).map((tag) => (
                                  <button key={tag} onClick={(e) => { e.preventDefault(); handleTagClick(tag); }}
                                    style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.15)", borderRadius: "6px", padding: "2px 8px", cursor: "pointer", border: "none" }}
                                    className="hover:!text-white transition-colors"
                                  >
                                    {tag}
                                  </button>
                                ))}
                                {counts[filtered[0].id] && (
                                  <>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      {counts[filtered[0].id].likes}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                      </svg>
                                      {counts[filtered[0].id].saves}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      {counts[filtered[0].id].comments}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ borderRadius: "16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "36px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                              <Avatar url={filtered[0].profiles?.avatar_url} name={filtered[0].profiles?.full_name} size={18} />
                              <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>{filtered[0].profiles?.full_name}</span>
                            </div>
                            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                              {filtered[0].title}
                            </h2>
                          </div>
                        )}
                      </Link>
                    )}
                    <ArticleList posts={filtered.slice(1)} counts={counts} formatDate={formatDate} handleTagClick={handleTagClick} />
                  </>
                )}
              </>
            )}

            {/* Default browse view */}
            {isBrowsing && (
              <>
                {hero && (
                  <Link href={`/p/${hero.slug}`} className="block mb-10 group">
                    {hero.cover_image ? (
                      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", height: "320px" }}>
                        <img src={hero.cover_image} alt={hero.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="group-hover:scale-[1.02] transition-transform duration-500" />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 32px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                            <Avatar url={hero.profiles?.avatar_url} name={hero.profiles?.full_name} size={20} />
                            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>{hero.profiles?.full_name}</span>
                            <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{formatDate(hero.published_at)}</span>
                          </div>
                          <h2 style={{ color: "white", fontSize: "26px", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                            {hero.title}
                          </h2>
                          {hero.subtitle && (
                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", marginTop: "6px" }}>
                              {hero.subtitle}
                            </p>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                            {hero.tags && hero.tags.slice(0, 3).map((tag) => (
                              <button key={tag} onClick={(e) => { e.preventDefault(); handleTagClick(tag); }}
                                style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.15)", borderRadius: "6px", padding: "2px 8px", cursor: "pointer", border: "none" }}
                                className="hover:!text-white transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                            {counts[hero.id] && (
                              <>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {counts[hero.id].likes}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                  {counts[hero.id].saves}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  {counts[hero.id].comments}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderRadius: "16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "40px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                          <Avatar url={hero.profiles?.avatar_url} name={hero.profiles?.full_name} size={20} />
                          <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>{hero.profiles?.full_name}</span>
                        </div>
                        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                          {hero.title}
                        </h2>
                        {hero.subtitle && (
                          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "8px" }}>{hero.subtitle}</p>
                        )}
                      </div>
                    )}
                  </Link>
                )}

                {tagSections.map((section) => (
                  <div key={section.tag} className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => handleTagClick(section.tag)}
                        className="text-sm font-semibold hover:opacity-70 transition-opacity"
                        style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
                      >
                        {section.tag}
                      </button>
                      <button
                        onClick={() => handleTagClick(section.tag)}
                        className="text-xs hover:opacity-70 transition-opacity"
                        style={{ color: "#2979FF" }}
                      >
                        See all →
                      </button>
                    </div>

                    <div className="space-y-0">
                      {section.posts.map((post, i) => (
                        <article
                          key={post.id}
                          style={{
                            padding: "16px 0",
                            display: "flex",
                            gap: "16px",
                            alignItems: "flex-start",
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
                              <Avatar url={post.profiles?.avatar_url} name={post.profiles?.full_name} size={18} />
                              <Link
                                href={`/${post.profiles?.username}`}
                                className="hover:underline"
                                style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}
                              >
                                {post.profiles?.full_name}
                              </Link>
                              <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>·</span>
                              <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>{formatDate(post.published_at)}</span>
                            </div>
                            <Link href={`/p/${post.slug}`}>
                              <h3
                                className="hover:underline"
                                style={{
                                  fontSize: "15px", fontWeight: 700, color: "var(--text-primary)",
                                  lineHeight: 1.35, letterSpacing: "-0.01em",
                                  marginBottom: post.subtitle ? "4px" : 0,
                                }}
                              >
                                {post.title}
                              </h3>
                              {post.subtitle && (
                                <p style={{
                                  fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5,
                                  display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
                                }}>
                                  {post.subtitle}
                                </p>
                              )}
                            </Link>
                            <TagCountsRow post={post} counts={counts} handleTagClick={handleTagClick} />
                          </div>
                          {post.cover_image && (
                            <Link href={`/p/${post.slug}`} style={{ flexShrink: 0 }}>
                              <img src={post.cover_image} alt={post.title} style={{ width: "80px", height: "56px", objectFit: "cover", borderRadius: "8px" }} />
                            </Link>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Writers sidebar */}
      <div className="w-56 shrink-0 hidden lg:block">
        <div className="sticky top-10">
          <p style={{
            fontSize: "11px", fontWeight: 600, color: "var(--text-faint)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px",
          }}>
            Writers to follow
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {writers.slice(0, 6).map((writer, i) => (
              <div
                key={writer.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "12px 0",
                  borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                }}
              >
                <Avatar url={writer.avatar_url} name={writer.full_name} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    href={`/${writer.username}`}
                    className="hover:underline"
                    style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}
                  >
                    {writer.full_name}
                  </Link>
                  <p style={{
                    fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    lineHeight: 1.4,
                  }}>
                    {writer.bio || `${writer.post_count} posts`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "20px" }}>
            <Link href="/explore" style={{ fontSize: "13px", color: "#2979FF", fontWeight: 500 }}>
              See more writers →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArticleList({
  posts,
  counts,
  formatDate,
  handleTagClick,
}: {
  posts: Post[];
  counts: Counts;
  formatDate: (d: string) => string;
  handleTagClick: (tag: string) => void;
}) {
  if (posts.length === 0) return null;

  return (
    <div>
      {posts.map((post) => (
        <article
          key={post.id}
          style={{
            padding: "24px 0",
            display: "flex",
            gap: "20px",
            alignItems: "flex-start",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-tertiary)", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, flexShrink: 0 }}>
                  {post.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <Link href={`/${post.profiles?.username}`} className="hover:underline" style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                {post.profiles?.full_name}
              </Link>
              <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>·</span>
              <span style={{ fontSize: "13px", color: "var(--text-faint)" }}>{formatDate(post.published_at)}</span>
            </div>
            <Link href={`/p/${post.slug}`}>
              <h2
                className="hover:underline"
                style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35, letterSpacing: "-0.01em", marginBottom: "5px" }}
              >
                {post.title}
              </h2>
              {post.subtitle && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.subtitle}
                </p>
              )}
            </Link>
            <TagCountsRow post={post} counts={counts} handleTagClick={handleTagClick} />
          </div>
          {post.cover_image && (
            <Link href={`/p/${post.slug}`} style={{ flexShrink: 0 }}>
              <img src={post.cover_image} alt={post.title} style={{ width: "140px", height: "96px", objectFit: "cover", borderRadius: "10px" }} />
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}