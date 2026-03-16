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

export default function HomeFeed() {
  const [tab, setTab] = useState<"for-you" | "following" | "tailored">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        supabase.from("profiles").select("interests").eq("id", user.id).single()
          .then(({ data }) => {
            const userInterests = data?.interests || [];
            setInterests(userInterests);
            loadFeed(user.id, "for-you", userInterests);
          });
      }
      loadTrending();
    });
  }, []);

  const loadFeed = async (uid: string | null, feedTab: string, userInterests: string[] = interests) => {
    setLoading(true);

    if (feedTab === "following" && uid) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("author_id")
        .eq("subscriber_id", uid);
      const ids = subs?.map((s) => s.author_id) ?? [];
      if (ids.length === 0) { setPosts([]); setLoading(false); return; }

      const { data } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
        .eq("published", true)
        .in("author_id", ids)
        .order("published_at", { ascending: false })
        .limit(20);

      setPosts((data as any) || []);

    } else if (feedTab === "for-you") {
      if (userInterests.length > 0) {
        const { data } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true)
          .overlaps("tags", userInterests)
          .order("published_at", { ascending: false })
          .limit(20);

        if ((data?.length || 0) < 5) {
          const { data: fallback } = await supabase
            .from("posts")
            .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
            .eq("published", true)
            .order("published_at", { ascending: false })
            .limit(20);
          setPosts((fallback as any) || []);
        } else {
          setPosts((data as any) || []);
        }
      } else {
        const { data } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(20);
        setPosts((data as any) || []);
      }

    } else if (feedTab === "tailored" && uid) {
      // Use the scoring function
      const { data: scoredPosts, error } = await supabase
        .rpc("get_tailored_feed", {
          p_user_id: uid,
          p_limit: 20,
        });

      if (error || !scoredPosts || scoredPosts.length === 0) {
        // Fall back to interest-based if scoring fails or no results
        const { data: fallback } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(20);
        setPosts((fallback as any) || []);
        setLoading(false);
        return;
      }

      // Fetch profiles for scored posts
      const authorIds = [...new Set(scoredPosts.map((p: any) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", authorIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p) => { profileMap[p.id] = p; });

      const enriched = scoredPosts.map((p: any) => ({
        ...p,
        profiles: profileMap[p.author_id] || null,
      }));

      setPosts(enriched);
    }

    setLoading(false);
  };

  const loadTrending = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
      .eq("published", true)
      .order("view_count", { ascending: false })
      .limit(5);
    if (data) setTrending(data as any);
  };

  const handleTabChange = (t: "for-you" | "following" | "tailored") => {
    setTab(t);
    if (userId) loadFeed(userId, t);
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

  return (
    <div style={{ display: "flex", gap: "40px", maxWidth: "1024px", margin: "0 auto", padding: "40px 24px" }}>

      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "32px" }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              style={{
                paddingBottom: "12px", marginRight: "24px", fontSize: "14px",
                fontWeight: tab === t.key ? 600 : 400,
                borderTop: "none", borderLeft: "none", borderRight: "none",
                borderBottom: tab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
                color: tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
                background: "none", cursor: "pointer",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: "192px", borderRadius: "16px", background: "var(--bg-tertiary)" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
              {tab === "following"
                ? "Subscribe to writers to see their posts here."
                : tab === "tailored"
                ? "Not enough activity yet to tailor your feed. Like and save some articles first."
                : interests.length === 0
                ? "Set your interests in Settings to personalise this feed."
                : "No posts matching your interests yet."}
            </p>
            {tab === "following" && (
              <Link href="/explore" style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, display: "block", marginTop: "8px" }}>
                Discover writers →
              </Link>
            )}
            {tab === "for-you" && interests.length === 0 && (
              <Link href="/settings" style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, display: "block", marginTop: "8px" }}>
                Update your interests →
              </Link>
            )}
            {tab === "tailored" && (
              <Link href="/explore" style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, display: "block", marginTop: "8px" }}>
                Explore articles →
              </Link>
            )}
          </div>
        ) : (
          <>
            {hero && (
              <Link href={`/p/${hero.slug}`} style={{ display: "block", marginBottom: "40px" }} className="group">
                {hero.cover_image ? (
                  <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", height: "288px" }}>
                    <img src={hero.cover_image} alt={hero.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="group-hover:scale-105 transition-transform duration-500" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1), transparent)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        {hero.profiles?.avatar_url ? (
                          <img src={hero.profiles.avatar_url} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} alt="" />
                        ) : (
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#e8a0a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#c06060" }}>
                            {hero.profiles?.full_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{hero.profiles?.full_name}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>·</span>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{formatDate(hero.published_at)}</span>
                      </div>
                      <h2 style={{ color: "white", fontSize: "24px", fontWeight: 700, lineHeight: 1.3 }}>{hero.title}</h2>
                      {hero.subtitle && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "4px" }}>{hero.subtitle}</p>}
                    </div>
                  </div>
                ) : (
                  <div style={{ borderRadius: "16px", background: "var(--bg-secondary)", padding: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#e8a0a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#c06060" }}>
                        {hero.profiles?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>{hero.profiles?.full_name}</span>
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{hero.title}</h2>
                    {hero.subtitle && <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>{hero.subtitle}</p>}
                  </div>
                )}
              </Link>
            )}

            <div>
              {rest.map((post, i) => (
                <article key={post.id} style={{ padding: "20px 0", display: "flex", gap: "16px", alignItems: "flex-start", borderTop: i === 0 ? "none" : `1px solid var(--border)` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
                      ) : (
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#e8a0a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#c06060", flexShrink: 0 }}>
                          {post.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                        </div>
                      )}
                      <Link href={`/profile/${post.profiles?.username}`} style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                        {post.profiles?.full_name}
                      </Link>
                      <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>·</span>
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{formatDate(post.published_at)}</span>
                    </div>
                    <Link href={`/p/${post.slug}`}>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: "4px" }} className="hover:underline">
                        {post.title}
                      </h2>
                      {post.subtitle && (
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.subtitle}
                        </p>
                      )}
                    </Link>
                    {post.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        {post.tags.slice(0, 2).map((tag) => (
                          <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`}
                            style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "999px", background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {post.cover_image && (
                    <Link href={`/p/${post.slug}`} style={{ flexShrink: 0 }}>
                      <img src={post.cover_image} alt={post.title} style={{ width: "96px", height: "64px", objectFit: "cover", borderRadius: "12px" }} />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Trending sidebar */}
      <div style={{ width: "240px", flexShrink: 0, display: "none" }} className="lg:!block">
        <div style={{ position: "sticky", top: "40px" }}>
          <h3 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
            Trending
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {trending.map((post, i) => (
              <Link key={post.id} href={`/p/${post.slug}`} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }} className="group">
                <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-faint)", lineHeight: 1, width: "24px", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "cover" }} alt="" />
                    ) : (
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#e8a0a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#c06060" }}>
                        {post.profiles?.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{post.profiles?.full_name}</span>
                  </div>
                  <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} className="group-hover:underline">
                    {post.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
            <Link href="/explore" style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              Browse all topics →
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}