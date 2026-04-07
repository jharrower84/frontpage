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
  author_id?: string;
  profiles?: {
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
  bio: string | null;
  subscriber_count: number;
}

interface PostCounts {
  [postId: string]: {
    likes: number;
    saves: number;
    comments: number;
  };
}

const Avatar = ({ url, name, size = 22 }: { url: string | null | undefined; name: string | undefined; size?: number }) => (
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

export default function HomeFeed() {
  const [tab, setTab] = useState<"for-you" | "following" | "tailored" | "publications">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState<PostCounts>({});
  const [trending, setTrending] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pubArticles, setPubArticles] = useState<any[]>([]);
  const [pubLoading, setPubLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        supabase.from("blocked_users")
          .select("blocked_id")
          .eq("blocker_id", user.id)
          .then(({ data: blocked }) => {
            const ids = blocked?.map((b) => b.blocked_id) || [];
            setBlockedIds(ids);
            supabase.from("profiles").select("interests").eq("id", user.id).single()
              .then(({ data }) => {
                const userInterests = data?.interests || [];
                setInterests(userInterests);
                loadFeed(user.id, "for-you", userInterests, ids);
              });
          });
      }
      loadTrending();
    });
  }, []);

  const loadCounts = async (postIds: string[]) => {
    if (postIds.length === 0) return;
    const [likesRes, savesRes, commentsRes] = await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("reading_list").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);
    const newCounts: PostCounts = {};
    postIds.forEach((id) => { newCounts[id] = { likes: 0, saves: 0, comments: 0 }; });
    likesRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].likes++; });
    savesRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].saves++; });
    commentsRes.data?.forEach((r) => { if (newCounts[r.post_id]) newCounts[r.post_id].comments++; });
    setCounts(newCounts);
  };

  const loadFeed = async (
    uid: string | null,
    feedTab: string,
    userInterests: string[] = interests,
    blocked: string[] = blockedIds,
  ) => {
    setLoading(true);
    setCounts({});
    const filter = (data: any[]) => data.filter((p) => !blocked.includes(p.author_id));
    let loadedPosts: Post[] = [];

    if (feedTab === "following" && uid) {
      const { data: subs } = await supabase.from("subscriptions").select("author_id").eq("subscriber_id", uid);
      const ids = subs?.map((s) => s.author_id) ?? [];
      if (ids.length === 0) { setPosts([]); setLoading(false); return; }
      const { data } = await supabase.from("posts")
        .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
        .eq("published", true).in("author_id", ids)
        .order("published_at", { ascending: false }).limit(20);
      loadedPosts = filter((data as any) || []);

    } else if (feedTab === "for-you") {
      if (userInterests.length > 0) {
        const { data } = await supabase.from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true).overlaps("tags", userInterests)
          .order("published_at", { ascending: false }).limit(20);
        const filtered = filter((data as any) || []);
        if (filtered.length < 5) {
          const { data: fallback } = await supabase.from("posts")
            .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
            .eq("published", true).order("published_at", { ascending: false }).limit(20);
          loadedPosts = filter((fallback as any) || []);
        } else {
          loadedPosts = filtered;
        }
      } else {
        const { data } = await supabase.from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true).order("published_at", { ascending: false }).limit(20);
        loadedPosts = filter((data as any) || []);
      }

    } else if (feedTab === "tailored" && uid) {
      const { data: scoredPosts, error } = await supabase.rpc("get_tailored_feed", { p_user_id: uid, p_limit: 20 });
      if (error || !scoredPosts || scoredPosts.length === 0) {
        const { data: fallback } = await supabase.from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true).order("published_at", { ascending: false }).limit(20);
        loadedPosts = filter((fallback as any) || []);
      } else {
        const authorIds = [...new Set(scoredPosts.map((p: any) => p.author_id))];
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, username, avatar_url").in("id", authorIds);
        const profileMap: Record<string, any> = {};
        profiles?.forEach((p) => { profileMap[p.id] = p; });
        loadedPosts = filter(scoredPosts.map((p: any) => ({ ...p, profiles: profileMap[p.author_id] || null })));
      }
    }

    setPosts(loadedPosts);
    setLoading(false);
    loadCounts(loadedPosts.map((p) => p.id));
  };

  const loadTrending = async () => {
    const { data } = await supabase.from("posts")
      .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
      .eq("published", true).order("view_count", { ascending: false }).limit(5);
    if (data) setTrending(data as any);
  };

  const loadPublications = async (uid: string) => {
    setPubLoading(true);
    setPubArticles([]);

    const { data: subs } = await supabase
      .from("publisher_subscriptions")
      .select("publisher_id, publishers(id, name, logo_url, rss_url)")
      .eq("user_id", uid);

    if (!subs || subs.length === 0) {
      setPubLoading(false);
      return;
    }

    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-rss`;

    const results = await Promise.allSettled(
      subs.map(async (sub: any) => {
        const publisher = sub.publishers;
        if (!publisher?.rss_url) return [];
        try {
          const res = await fetch(EDGE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${ANON_KEY}`,
            },
            body: JSON.stringify({ url: publisher.rss_url }),
          });
          const json = await res.json();
          return (json.articles || []).map((a: any) => ({
            ...a,
            publisher_name: publisher.name,
            publisher_logo: publisher.logo_url,
          }));
        } catch {
          return [];
        }
      })
    );

    const all: any[] = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") all.push(...r.value);
    });
    all.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    setPubArticles(all);
    setPubLoading(false);
  };

  const handleTabChange = (t: "for-you" | "following" | "tailored" | "publications") => {
    setTab(t);
    if (t === "publications") {
      if (userId) loadPublications(userId);
    } else if (userId) {
      loadFeed(userId, t, interests, blockedIds);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const hero = posts[0];
  const rest = posts.slice(1);

  const TABS = [
    { key: "for-you", label: "For You" },
    { key: "following", label: "Following" },
    { key: "tailored", label: "Tailored" },
    { key: "publications", label: "Publications" },
  ] as const;

  const PostMeta = ({ postId, tags }: { postId: string; tags: string[] }) => {
    const c = counts[postId];
    if (!c) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "10px", flexWrap: "wrap" }}>
        {tags && tags.length > 0 && tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/explore?tag=${encodeURIComponent(tag)}`; }}
            style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "2px 8px", cursor: "pointer" }}
            className="hover:!text-blue-500 transition-colors"
          >
            {tag}
          </span>
        ))}
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
      </div>
    );
  };

  const HeroMeta = ({ post }: { post: Post }) => {
    const c = counts[post.id];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
        {post.tags && post.tags.length > 0 && post.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/explore?tag=${encodeURIComponent(tag)}`; }}
            style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.15)", borderRadius: "6px", padding: "2px 8px", cursor: "pointer" }}
            className="hover:!text-white transition-colors"
          >
            {tag}
          </span>
        ))}
        {c && (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {c.likes}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 13, height: 13 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {c.saves}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
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

  return (
    <div className="flex gap-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Main feed */}
      <div className="flex-1 min-w-0">

        {/* Tabs */}
        <div className="flex mb-10" style={{ borderBottom: "1px solid var(--border)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className="text-sm pb-3 mr-5 transition-colors shrink-0"
              style={{
                fontWeight: tab === t.key ? 600 : 400,
                border: "none",
                borderBottom: t.key === "publications"
                  ? tab === t.key ? "2px solid #2979FF" : "2px solid transparent"
                  : tab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
                color: t.key === "publications"
                  ? "#2979FF"
                  : tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
                background: "none",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Publications tab */}
        {tab === "publications" && (
          pubLoading ? (
            <div className="flex flex-col gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 pt-7" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="h-3 w-28 rounded-md mb-3 animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                    <div className="h-5 w-4/5 rounded-md mb-2 animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                    <div className="h-3 w-3/5 rounded-md animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                  </div>
                  <div className="rounded-xl animate-pulse shrink-0 hidden sm:block" style={{ width: 120, height: 80, background: "var(--bg-tertiary)" }} />
                </div>
              ))}
            </div>
          ) : pubArticles.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">📰</div>
              <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No publications followed yet</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
                Follow publications to see their latest articles here.
              </p>
              <a href="/settings/publishers"
                className="text-sm font-semibold px-6 py-2.5 rounded-xl inline-block hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#2979FF", color: "#ffffff" }}>
                Manage publications
              </a>
            </div>
          ) : (
            <div>
              {pubArticles.map((article, i) => (
                
                  <a key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 py-6 group"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {article.publisher_logo ? (
                        <img src={article.publisher_logo} alt={article.publisher_name}
                          className="w-5 h-5 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: "#2979FF" }}>
                          {article.publisher_name?.[0]}
                        </div>
                      )}
                      <span className="text-xs font-medium" style={{ color: "#2979FF" }}>{article.publisher_name}</span>
                      {article.published_at && (
                        <>
                          <span style={{ color: "var(--text-faint)" }}>·</span>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {new Date(article.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="font-bold mb-1 leading-snug group-hover:underline"
                      style={{ fontSize: "16px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      {article.title}
                    </h2>
                    {article.description && (
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {article.description}
                      </p>
                    )}
                    <p className="text-xs mt-2 font-medium" style={{ color: "#2979FF" }}>
                      Read on {article.publisher_name} →
                    </p>
                  </div>
                  {article.cover_image && (
                    <div className="shrink-0 hidden sm:block">
                      <img src={article.cover_image} alt={article.title}
                        className="rounded-xl object-cover" style={{ width: 120, height: 80 }} />
                    </div>
                  )}
                </a>
              ))}
            </div>
          )
        )}

        {/* Other tabs */}
        {tab !== "publications" && (
          <>
            {loading ? (
              <div className="flex flex-col gap-8">
                <div className="rounded-2xl h-64 sm:h-80 animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 pt-7" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex-1">
                      <div className="h-3 w-28 rounded-md mb-3 animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                      <div className="h-5 w-4/5 rounded-md mb-2 animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                      <div className="h-3 w-3/5 rounded-md animate-pulse" style={{ background: "var(--bg-tertiary)" }} />
                    </div>
                    <div className="rounded-xl animate-pulse shrink-0 hidden sm:block" style={{ width: 120, height: 80, background: "var(--bg-tertiary)" }} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>
                  {tab === "following" ? "Subscribe to writers to see their posts here."
                    : tab === "tailored" ? "Not enough activity yet. Like and save some articles first."
                    : interests.length === 0 ? "Set your interests in Settings to personalise this feed."
                    : "No posts matching your interests yet."}
                </p>
                {tab === "following" && <Link href="/explore" className="text-sm font-medium" style={{ color: "#2979FF" }}>Discover writers →</Link>}
                {tab === "for-you" && interests.length === 0 && <Link href="/settings" className="text-sm font-medium" style={{ color: "#2979FF" }}>Update your interests →</Link>}
                {tab === "tailored" && <Link href="/explore" className="text-sm font-medium" style={{ color: "#2979FF" }}>Explore articles →</Link>}
              </div>
            ) : (
              <>
                {hero && (
                  <Link href={`/p/${hero.slug}`} className="block mb-10 group">
                    {hero.cover_image ? (
                      <div className="relative rounded-2xl overflow-hidden" style={{ height: "280px" }}>
                        <img src={hero.cover_image} alt={hero.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }} />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar url={hero.profiles?.avatar_url} name={hero.profiles?.full_name} size={20} />
                            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{hero.profiles?.full_name}</span>
                            <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{formatDate(hero.published_at)}</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold leading-snug mb-1" style={{ color: "white", letterSpacing: "-0.02em" }}>
                            {hero.title}
                          </h2>
                          {hero.subtitle && (
                            <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{hero.subtitle}</p>
                          )}
                          <HeroMeta post={hero} />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl p-8" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar url={hero.profiles?.avatar_url} name={hero.profiles?.full_name} size={20} />
                          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{hero.profiles?.full_name}</span>
                          <span style={{ color: "var(--text-faint)" }}>·</span>
                          <span className="text-sm" style={{ color: "var(--text-faint)" }}>{formatDate(hero.published_at)}</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{hero.title}</h2>
                        {hero.subtitle && <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{hero.subtitle}</p>}
                        <PostMeta postId={hero.id} tags={hero.tags} />
                      </div>
                    )}
                  </Link>
                )}
                <div>
                  {rest.map((post) => (
                    <article key={post.id} className="flex gap-4 py-6" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar url={post.profiles?.avatar_url} name={post.profiles?.full_name} size={18} />
                          <Link href={`/${post.profiles?.username}`} className="text-xs font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                            {post.profiles?.full_name}
                          </Link>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>·</span>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(post.published_at)}</span>
                        </div>
                        <Link href={`/p/${post.slug}`}>
                          <h2 className="font-bold mb-1 hover:underline leading-snug" style={{ fontSize: "16px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                            {post.title}
                          </h2>
                          {post.subtitle && (
                            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                              {post.subtitle}
                            </p>
                          )}
                        </Link>
                        <PostMeta postId={post.id} tags={post.tags} />
                      </div>
                      {post.cover_image && (
                        <Link href={`/p/${post.slug}`} className="shrink-0 hidden sm:block">
                          <img src={post.cover_image} alt={post.title} className="rounded-xl object-cover" style={{ width: 120, height: 80 }} />
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <div className="hidden lg:flex flex-col w-52 shrink-0">
        <div className="sticky bottom-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-faint)" }}>
            Trending
          </p>
          <div className="flex flex-col">
            {trending.map((post, i) => (
              <Link
                key={post.id}
                href={`/p/${post.slug}`}
                className="flex gap-3 items-start py-3 group"
                style={{ borderBottom: i < trending.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <span className="text-lg font-bold shrink-0 pt-0.5" style={{ color: "var(--border)", width: 20 }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Avatar url={post.profiles?.avatar_url} name={post.profiles?.full_name} size={14} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{post.profiles?.full_name}</span>
                  </div>
                  <h4 className="text-xs font-semibold leading-snug line-clamp-2 group-hover:underline" style={{ color: "var(--text-primary)" }}>
                    {post.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-5">
            <Link href="/explore" className="text-xs font-medium" style={{ color: "#2979FF" }}>Browse all topics →</Link>
          </div>
          <WhoToFollow currentUserId={userId} />
        </div>
      </div>
    </div>
  );
}

function WhoToFollow({ currentUserId }: { currentUserId: string | null }) {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWriters(); }, [currentUserId]);

  const loadWriters = async () => {
    if (!currentUserId) { setLoading(false); return; }
    const { data: subs } = await supabase.from("subscriptions").select("author_id").eq("subscriber_id", currentUserId);
    const followingIds = new Set(subs?.map((s) => s.author_id) || []);
    setFollowing(followingIds);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, username, avatar_url, bio").neq("id", currentUserId).limit(50);
    if (!profiles) { setLoading(false); return; }
    const withCounts = await Promise.all(
      profiles.filter((p) => !followingIds.has(p.id)).slice(0, 20).map(async (p) => {
        const { count } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("author_id", p.id);
        return { ...p, subscriber_count: count || 0 };
      })
    );
    withCounts.sort((a, b) => b.subscriber_count - a.subscriber_count);
    setWriters(withCounts.slice(0, 5));
    setLoading(false);
  };

  const handleFollow = async (authorId: string) => {
    if (!currentUserId) return;
    if (following.has(authorId)) {
      await supabase.from("subscriptions").delete().eq("subscriber_id", currentUserId).eq("author_id", authorId);
      setFollowing((prev) => { const next = new Set(prev); next.delete(authorId); return next; });
    } else {
      await supabase.from("subscriptions").insert({ subscriber_id: currentUserId, author_id: authorId });
      setFollowing((prev) => new Set(prev).add(authorId));
      setWriters((prev) => prev.filter((w) => w.id !== authorId));
    }
  };

  if (loading || writers.length === 0) return null;

  return (
    <div className="mt-8 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-faint)" }}>
        Who to follow
      </p>
      <div className="flex flex-col gap-4">
        {writers.map((writer) => (
          <div key={writer.id} className="flex items-start gap-2.5">
            <Link href={`/${writer.username}`} className="shrink-0">
              <Avatar url={writer.avatar_url} name={writer.full_name} size={30} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/${writer.username}`} className="text-xs font-semibold hover:underline block leading-snug" style={{ color: "var(--text-primary)" }}>
                {writer.full_name}
              </Link>
              {writer.bio && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-tertiary)" }}>{writer.bio}</p>
              )}
              <button
                onClick={() => handleFollow(writer.id)}
                className="mt-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                style={following.has(writer.id)
                  ? { border: "1px solid var(--border)", color: "var(--text-tertiary)", background: "transparent" }
                  : { backgroundColor: "#2979FF", color: "white" }
                }
              >
                {following.has(writer.id) ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}