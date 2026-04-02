"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PreviewPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("posts")
      .select("*, profiles!posts_author_id_fkey(id, full_name, username, avatar_url, bio, verified)")
      .eq("id", postId)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [postId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  if (!post) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ color: "var(--text-tertiary)" }}>Post not found.</p>
    </div>
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Preview banner */}
      <div className="w-full py-2.5 text-center text-sm font-medium" style={{ background: "#2979FF", color: "white" }}>
        Preview mode — this article is not yet published.{" "}
        <a href={`/dashboard/edit/${postId}`} className="underline hover:opacity-80">
          Back to editor
        </a>
      </div>

      {post.cover_image && (
        <div className="w-full h-96">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <article className="max-w-2xl mx-auto px-6 pt-12 pb-24">
        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="text-xl leading-relaxed mb-8" style={{ color: "var(--text-tertiary)" }}>
            {post.subtitle}
          </p>
        )}

        <div className="flex items-center gap-3 mb-8">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} className="w-11 h-11 rounded-full object-cover shrink-0" alt="" />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              {post.profiles?.full_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {post.profiles?.full_name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Draft · {post.content ? `${Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200))} min read` : ""}
            </p>
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full border"
                style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose prose-lg max-w-none leading-relaxed"
          style={{ color: "var(--text-primary)" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}