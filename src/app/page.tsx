"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HomeFeed from "./components/HomeFeed";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  cover_image: string | null;
  published_at: string;
  profiles: { full_name: string; username: string; avatar_url: string | null };
}

export default function HomePage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      if (!session) loadPosts();
    });
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, subtitle, cover_image, published_at, profiles!posts_author_id_fkey(full_name, username, avatar_url)")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(6);
    if (data) setPosts(data as any);
    setPostsLoading(false);
  };

  if (loggedIn === null) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-6 h-6 rounded-full border-2 border-gray-100 border-t-gray-400 animate-spin" />
    </div>
  );

  if (loggedIn) return <HomeFeed />;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <div className="min-h-screen bg-white" style={{ color: "#111" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white" style={{ borderBottom: "1px solid #e8e8e8" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          <span className="text-lg font-bold" style={{ letterSpacing: "-0.03em" }}>FrontPage</span>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm font-medium hover:opacity-60 transition-opacity" style={{ color: "#666" }}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#2979FF", color: "#fff", borderRadius: "6px" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ borderBottom: "1px solid #e8e8e8" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2979FF" }}>
              The home for independent fashion writing
            </p>
            <h1
              className="text-5xl lg:text-7xl font-bold mb-6"
              style={{ letterSpacing: "-0.04em", lineHeight: 0.95 }}
            >
              Read. Write.<br />
              <span style={{ color: "#2979FF" }}>Fashion.</span>
            </h1>
            <p className="text-lg max-w-xl leading-relaxed mb-8" style={{ color: "#555" }}>
              A platform for fashion writers who have something real to say — and readers who want to hear it. Subscribe to voices you love. Publish your own.
            </p>
            <div className="flex items-center gap-3 pb-2">
              <Link
                href="/signup"
                className="text-sm font-semibold px-7 py-3 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#111", color: "#fff", borderRadius: "8px" }}
              >
                Start reading free
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold px-7 py-3 transition-opacity hover:opacity-70"
                style={{ border: "1px solid #ddd", color: "#333", borderRadius: "8px" }}
              >
                Start writing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Article cards */}
      <div style={{ borderBottom: "1px solid #e8e8e8" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#999" }}>
              Latest on FrontPage
            </p>
            <button
              onClick={() => router.push("/signin")}
              className="text-xs font-medium hover:opacity-60 transition-opacity"
              style={{ color: "#2979FF" }}
            >
              See all →
            </button>
          </div>

          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="w-full rounded-xl mb-4 animate-pulse" style={{ aspectRatio: "16/9", background: "#f0f0f0" }} />
                  <div className="h-3 rounded w-1/3 mb-3 animate-pulse" style={{ background: "#f0f0f0" }} />
                  <div className="h-4 rounded w-3/4 mb-2 animate-pulse" style={{ background: "#f0f0f0" }} />
                  <div className="h-3 rounded w-2/3 animate-pulse" style={{ background: "#f0f0f0" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => router.push("/signin")}
                className="text-left group flex flex-col w-full"
              >
                {/* Image — fixed height always */}
                <div className="w-full rounded-xl overflow-hidden mb-4 shrink-0" style={{ height: "180px", background: "#f5f5f5" }}>
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs uppercase tracking-widest" style={{ color: "#ccc" }}>FrontPage</span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  {(post.profiles as any)?.avatar_url ? (
                    <img src={(post.profiles as any).avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#eef3ff", color: "#2979FF" }}>
                      {(post.profiles as any)?.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs" style={{ color: "#999" }}>{(post.profiles as any)?.full_name}</span>
                  <span style={{ color: "#ddd" }}>·</span>
                  <span className="text-xs" style={{ color: "#bbb" }}>{formatDate(post.published_at)}</span>
                </div>

                {/* Title — fixed 2 lines */}
                <h3
                  className="text-base font-bold leading-snug mb-1 group-hover:opacity-60 transition-opacity line-clamp-2 shrink-0"
                  style={{ color: "#111", minHeight: "48px" }}
                >
                  {post.title}
                </h3>

                {/* Subtitle — fixed 2 lines always reserved */}
                <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "#888", minHeight: "40px" }}>
                  {post.subtitle || ""}
                </p>
              </button>
            ))}
          </div>
          )}

          {/* Sign in prompt */}
          <div
            className="mt-8 rounded-xl px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ background: "#f7f9ff", border: "1px solid #e8eeff" }}
          >
            <div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "#111" }}>Sign in to read the full article</p>
              <p className="text-xs" style={{ color: "#888" }}>FrontPage is free. No credit card required.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/signin" className="text-xs font-medium hover:opacity-60 transition-opacity" style={{ color: "#666" }}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold px-5 py-2.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#2979FF", color: "#fff", borderRadius: "6px" }}
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Three pillars */}
      <div style={{ borderBottom: "1px solid #e8e8e8", background: "#fafafa" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            {[
              {
                label: "For readers",
                title: "Writing worth your time",
                body: "Runway analysis, sustainability reporting, business of fashion, street culture. Told by writers who live inside the industry.",
              },
              {
                label: "For writers",
                title: "An audience that cares",
                body: "Publish to subscribers who follow you specifically. A clean editor, subscriber notifications, and a feed that surfaces your work.",
              },
              {
                label: "For fashion",
                title: "Independent voices only",
                body: "No brand deals deciding the editorial line. No algorithm killing your reach. Just writers with a point of view.",
              },
            ].map((col) => (
              <div key={col.label}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2979FF" }}>
                  {col.label}
                </p>
                <h3 className="text-xl font-bold mb-3" style={{ letterSpacing: "-0.02em", color: "#111" }}>
                  {col.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#777" }}>{col.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#fff", borderTop: "1px solid #e8e8e8" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold" style={{ color: "#111", letterSpacing: "-0.02em" }}>FrontPage</span>
          <div className="flex items-center gap-8">
            {[
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
              { label: "Help", href: "/help" },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="text-xs hover:opacity-60 transition-opacity" style={{ color: "#888" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}