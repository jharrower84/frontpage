"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HomeFeed from "./components/HomeFeed";
import Link from "next/link";

interface Writer {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  post_count: number;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  profiles: { full_name: string; username: string; avatar_url: string | null };
}

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      if (!session) loadMarketingData();
    });
  }, []);

  const loadMarketingData = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio");

    if (profilesData) {
      const withCounts = await Promise.all(
        profilesData.map(async (p) => {
          const { count } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("author_id", p.id)
            .eq("published", true);
          return { ...p, post_count: count || 0 };
        })
      );
      setWriters(withCounts.filter((w) => w.post_count > 0).slice(0, 6));
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select("id, title, slug, cover_image, profiles(full_name, username, avatar_url)")
      .eq("published", true)
      .not("cover_image", "is", null)
      .order("published_at", { ascending: false })
      .limit(6);

    if (postsData) setFeaturedPosts(postsData as any);
  };

  if (loggedIn === null) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  if (loggedIn) return <HomeFeed />;

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 h-16 flex items-center justify-between sticky top-0 bg-white z-10">
        <span className="text-xl font-bold text-black">FrontPage</span>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm text-gray-500 hover:text-black transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors" style={{ color: "#ffffff" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block text-xs font-semibold text-pink-500 bg-pink-50 px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
          Fashion writing platform
        </div>
        <h1 className="text-6xl font-bold text-black mb-6 leading-tight">
          The home for<br />independent fashion writing.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          Read the writers who actually know fashion. Subscribe to your favourites. Write your own.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup"
            className="bg-black px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-800 transition-colors" style={{ color: "#ffffff" }}>
            Start reading free
          </Link>
          <Link href="/explore"
            className="border border-gray-200 text-gray-600 px-8 py-4 rounded-full text-base font-semibold hover:border-gray-400 transition-colors">
            Explore writers
          </Link>
        </div>
      </div>

      {/* Featured articles */}
      {featuredPosts.length > 0 && (
        <div className="max-w-5xl mx-auto px-8 pb-20">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Recent from FrontPage
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/p/${post.slug}`} className="group">
                <div className="relative rounded-xl overflow-hidden h-40 mb-3">
                  <img src={post.cover_image!} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold text-pink-700">
                          {post.profiles?.full_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-white/70 text-xs">{post.profiles?.full_name}</span>
                    </div>
                    <h3 className="text-white text-sm font-bold leading-snug line-clamp-2">{post.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured writers */}
      {writers.length > 0 && (
        <div className="border-t border-gray-100 py-20">
          <div className="max-w-5xl mx-auto px-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8 text-center">
              Writers on FrontPage
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {writers.map((writer) => (
                <Link key={writer.id} href={`/profile/${writer.username}`}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group">
                  {writer.avatar_url ? (
                    <img src={writer.avatar_url} alt={writer.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                      {writer.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black group-hover:underline truncate">{writer.full_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{writer.bio || `${writer.post_count} posts`}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/explore"
                className="border border-gray-200 text-gray-600 px-6 py-3 rounded-full text-sm font-medium hover:border-gray-400 transition-colors">
                Browse all writers →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CTA footer */}
      <div className="py-24 text-center" style={{ backgroundColor: "#fdf2f2" }}>
        <h2 className="text-4xl font-bold text-black mb-4">Ready to start writing?</h2>
        <p className="text-gray-500 mb-8">Join FrontPage and share your fashion perspective with the world.</p>
        <Link href="/signup"
          className="inline-block text-white px-8 py-4 rounded-full text-base font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#e8a0a0" }}>
          Create your free account
        </Link>
      </div>

    </div>
  );
}