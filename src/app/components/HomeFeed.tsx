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
  const [tab, setTab] = useState<"for-you" | "following" | "tailored">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState<PostCounts>({});
  const [trending, setTrending] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data: subs } = await supabase
        .from("subscriptions").select("author_id").eq("subscriber_id", uid);
      const ids = subs?.map((s) => s.author_id) ?? [];
      if (ids.length === 0) { setPosts([]); setLoading(false); return; }
      const { data } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
        .eq("published", true).in("author_id", ids)
        .order("published_at", { ascending: false }).limit(20);
      loadedPosts = filter((data as any) || []);

    } else if (feedTab === "for-you") {
      if (userInterests.length > 0) {
        const { data } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true).overlaps("tags", userInterests)
          .order("published_at", { ascending: false }).limit(20);
        const filtered = filter((data as any) || []);
        if (filtered.length < 5) {
          const { data: fallback } = await supabase
            .from("posts")
            .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
            .eq("published", true).order("published_at", { ascending: false }).limit(20);
          loadedPosts = filter((fallback as any) || []);
        } else {
          loadedPosts = filtered;
        }
      } else {
        const { data } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true).order("published_at", { ascending: false }).limit(20);
        loadedPosts = filter((data as any) || []);
      }

    } else if (feedTab === "tailored" && uid) {
      const { data: scoredPosts, error } = await supabase.rpc("get_tailored_feed", {
        p_user_id: uid, p_limit: 20,
      });
      if (error || !scoredPosts || scoredPosts.length === 0) {
        const { data: fallback } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true).order("published_at", { ascending: false }).limit(20);
        loadedPosts = filter((fallback as any) || []);
      } else {
        const authorIds = [...new Set(scoredPosts.map((p: any) => p.author_id))];
        const { data: profiles } = await supabase
          .from("profiles").select("id, full_name, username, avatar_url").in("id", authorIds);
        const profileMap: Record<string, any> = {};
        profiles?.forEach((p) => { profileMap[p.id] = p; });
        loadedPosts = filter(scoredPosts.map((p: any) => ({
          ...p, profiles: profileMap[p.author_id] || null,
        })));
      }
    }

    setPosts(loadedPosts);
    setLoading(false);
    loadCounts(loadedPosts.map((p) => p.id));
  };

  const loadTrending = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
      .eq("published", true).order("view_count", { ascending: false }).limit(5);
    if (data) setTrending(data as any);
  };

  const handleTabChange = (t: "for-you" | "following" | "tailored") => {
    setTab(t);
    if (userId) loadFeed(userId, t, interests, blockedIds);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const hero = posts[0];
  const rest = posts.slice(1);

  const TABS = [
    { key: "for-you", label: "For You" },
    { key: "following", label: "Following" },
    { key: "tailored", label: "Tailored" },
  ] as const;

  const PostMeta = ({ postId, tags }: { postId: string; tags: string[] }) => {
    const c = counts[postId];
    if (!c) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "10px", flexWrap: "wrap" }}>
        {tags && tags.length > 0 && tags.slice(0, 3).map((tag) => (
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
          <Link
            key={tag}
            href={`/explore?tag=${encodeURIComponent(tag)}`}
            style={{
              fontSize: "11px", fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "6px", padding: "2px 8px",
              textDecoration: "none",
            }}
            className="hover:!text-white transition-colors"
          >
            {tag}
          </Link>
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
    <div style={{
      display: "flex",
      gap: "48px",
      maxWidth: "1080px",
      margin: "0 auto",
      padding: "36px 32px",
    }}>

      {/* Main feed */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "40px" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              style={{
                paddingBottom: "12px", marginRight: "28px", fontSize: "14px",
                fontWeight: tab === t.key ? 600 : 400, border: "none",
                borderBottom: tab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
                color: tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
                background: "none", cursor: "pointer", transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ height: "340px", borderRadius: "16px", background: "var(--bg-tertiary)" }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: "16px", paddingTop: "28px", borderTop: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: "12px", width: "120px", borderRadius: "6px", background: "var(--bg-tertiary)", marginBottom: "12px" }} />
                  <div style={{ height: "22px", width: "80%", borderRadius: "6px", background: "var(--bg-tertiary)", marginBottom: "8px" }} />
                  <div style={{ height: "14px", width: "60%", borderRadius: "6px", background: "var(--bg-tertiary)" }} />
                </div>
                <div style={{ width: "140px", height: "96px", borderRadius: "12px", background: "var(--bg-tertiary)", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "var(--text-tertiary)", fontSize: "15px", marginBottom: "12px" }}>
              {tab === "following"
                ? "Subscribe to writers to see their posts here."
                : tab === "tailored"
                ? "Not enough activity yet. Like and save some articles first."
                : interests.length === 0
                ? "Set your interests in Settings to personalise this feed."
                : "No posts matching your interests yet."}
            </p>
            {tab === "following" && (
              <Link href="/explore" style={{ fontSize: "14px", color: "#2979FF", fontWeight: 500 }}>Discover writers →</Link>
            )}
            {tab === "for-you" && interests.length === 0 && (
              <Link href="/settings" style={{ fontSize: "14px", color: "#2979FF", fontWeight: 500 }}>Update your interests →</Link>
            )}
            {tab === "tailored" && (
              <Link href="/explore" style={{ fontSize: "14px", color: "#2979FF", fontWeight: 500 }}>Explore articles →</Link>
            )}
          </div>
        ) : (
          <>
            {/* Hero post */}
            {hero && (
              <Link href={`/p/${hero.slug}`} style={{ display: "block", marginBottom: "48px" }} className="group">
                {hero.cover_image ? (
                  <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", height: "340px" }}>
                    <img src={hero.cover_image} alt={hero.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="group-hover:scale-[1.02] transition-transform duration-500" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 32px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <Avatar url={hero.profiles?.avatar_url} name={hero.profiles?.full_name} size={20} />
                        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>{hero.profiles?.full_name}</span>
                        <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{formatDate(hero.published_at)}</span>
                      </div>
                      <h2 style={{ color: "white", fontSize: "26px", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: hero.subtitle ? "6px" : 0 }}>
                        {hero.title}
                      </h2>
                      {hero.subtitle && (
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: 1.5 }}>{hero.subtitle}</p>
                      )}
                      <HeroMeta post={hero} />
                    </div>
                  </div>
                ) : (
                  <div style={{ borderRadius: "16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <Avatar url={hero.profiles?.avatar_url} name={hero.profiles?.full_name} size={20} />
                      <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>{hero.profiles?.full_name}</span>
                      <span style={{ color: "var(--text-faint)" }}>·</span>
                      <span style={{ color: "var(--text-faint)", fontSize: "13px" }}>{formatDate(hero.published_at)}</span>
                    </div>
                    <h2 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                      {hero.title}
                    </h2>
                    {hero.subtitle && (
                      <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6 }}>{hero.subtitle}</p>
                    )}
                    <PostMeta postId={hero.id} tags={hero.tags} />
                  </div>
                )}
              </Link>
            )}

            {/* Article list */}
            <div>
              {rest.map((post) => (
                <article key={post.id} style={{ padding: "28px 0", display: "flex", gap: "20px", alignItems: "flex-start", borderTop: "1px solid var(--border)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                      <Avatar url={post.profiles?.avatar_url} name={post.profiles?.full_name} size={20} />
                      <Link href={`/${post.profiles?.username}`} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }} className="hover:underline">
                        {post.profiles?.full_name}
                      </Link>
                      <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>·</span>
                      <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>{formatDate(post.published_at)}</span>
                    </div>
                    <Link href={`/p/${post.slug}`}>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35, letterSpacing: "-0.01em", marginBottom: "6px" }} className="hover:underline">
                        {post.title}
                      </h2>
                      {post.subtitle && (
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.subtitle}
                        </p>
                      )}
                    </Link>
                    <PostMeta postId={post.id} tags={post.tags} />
                  </div>
                  {post.cover_image && (
                    <Link href={`/p/${post.slug}`} style={{ flexShrink: 0 }}>
                      <img src={post.cover_image} alt={post.title} style={{ width: "140px", height: "96px", objectFit: "cover", borderRadius: "10px" }} />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right sidebar */}
      <div className="hidden lg:block" style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ position: "sticky", bottom: "32px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
            Trending
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {trending.map((post, i) => (
              <Link key={post.id} href={`/p/${post.slug}`} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 0", borderBottom: i < trending.length - 1 ? "1px solid var(--border)" : "none" }} className="group">
                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--border)", lineHeight: 1, width: "20px", flexShrink: 0, paddingTop: "2px" }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                    <Avatar url={post.profiles?.avatar_url} name={post.profiles?.full_name} size={16} />
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>{post.profiles?.full_name}</span>
                  </div>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} className="group-hover:underline">
                    {post.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: "24px" }}>
            <Link href="/explore" style={{ fontSize: "13px", color: "#2979FF", fontWeight: 500 }}>Browse all topics →</Link>
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

  useEffect(() => {
    loadWriters();
  }, [currentUserId]);

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
    <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
        Who to follow
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {writers.map((writer) => (
          <div key={writer.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <Link href={`/${writer.username}`} style={{ flexShrink: 0 }}>
              <Avatar url={writer.avatar_url} name={writer.full_name} size={32} />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/${writer.username}`} className="hover:underline" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}>
                {writer.full_name}
              </Link>
              {writer.bio && (
                <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {writer.bio}
                </p>
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