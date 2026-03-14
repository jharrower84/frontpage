"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Props {
  currentPostId: string;
  authorId: string;
  tags: string[];
}

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  published_at: string;
  cover_image: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function RelatedArticles({ currentPostId, authorId, tags }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadRelated();
  }, [currentPostId]);

  const loadRelated = async () => {
    // First try: same tags
    let results: Post[] = [];

    if (tags && tags.length > 0) {
      const { data: tagPosts } = await supabase
        .from("posts")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("published", true)
        .neq("id", currentPostId)
        .contains("tags", [tags[0]])
        .limit(3);

      if (tagPosts) results = tagPosts as any;
    }

    // Fallback: same author
    if (results.length < 3) {
      const { data: authorPosts } = await supabase
        .from("posts")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("published", true)
        .eq("author_id", authorId)
        .neq("id", currentPostId)
        .limit(3 - results.length);

      if (authorPosts) {
        const existing = new Set(results.map((p) => p.id));
        results = [...results, ...(authorPosts as any).filter((p: Post) => !existing.has(p.id))];
      }
    }

    // Fallback: latest posts
    if (results.length < 3) {
      const { data: latestPosts } = await supabase
        .from("posts")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("published", true)
        .neq("id", currentPostId)
        .order("published_at", { ascending: false })
        .limit(3 - results.length);

      if (latestPosts) {
        const existing = new Set(results.map((p) => p.id));
        results = [...results, ...(latestPosts as any).filter((p: Post) => !existing.has(p.id))];
      }
    }

    setPosts(results.slice(0, 3));
  };

  if (posts.length === 0) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="mt-16">
      <div className="border-t border-gray-100 mb-8" />
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
        More to read
      </h3>
      <div className="grid grid-cols-1 gap-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/p/${post.slug}`} className="flex gap-4 items-start group">
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-20 h-14 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-pink-200 flex items-center justify-center text-xs font-semibold text-pink-700">
                    {post.profiles?.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-gray-400">{post.profiles?.full_name}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
              </div>
              <h4 className="text-sm font-bold text-black group-hover:underline leading-snug">
                {post.title}
              </h4>
              {post.subtitle && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.subtitle}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}