"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface PostStat {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

interface ViewPoint {
  date: string;
  views: number;
}

export default function StatsPage() {
  const [posts, setPosts] = useState<PostStat[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostStat | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: postsData } = await supabase
      .from("posts")
      .select("id, title, slug, published_at, view_count")
      .eq("author_id", user.id)
      .eq("published", true)
      .order("view_count", { ascending: false });

    if (!postsData) return;

    const postIds = postsData.map((p) => p.id);

    const [likesData, commentsData] = await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);

    const likeCounts: Record<string, number> = {};
    const commentCounts: Record<string, number> = {};

    likesData.data?.forEach((l) => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
    });
    commentsData.data?.forEach((c) => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    });

    const enriched: PostStat[] = postsData.map((p) => ({
      ...p,
      like_count: likeCounts[p.id] || 0,
      comment_count: commentCounts[p.id] || 0,
    }));

    setPosts(enriched);
    setTotalViews(enriched.reduce((s, p) => s + (p.view_count || 0), 0));
    setTotalLikes(enriched.reduce((s, p) => s + p.like_count, 0));
    setTotalComments(enriched.reduce((s, p) => s + p.comment_count, 0));
    setLoading(false);

    if (enriched.length > 0) loadViewHistory(enriched[0]);
  };

  const loadViewHistory = async (post: PostStat) => {
    setSelectedPost(post);
    setChartLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("post_views")
      .select("viewed_at")
      .eq("post_id", post.id)
      .gte("viewed_at", thirtyDaysAgo.toISOString());

    // Group by day
    const counts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[d.toISOString().slice(0, 10)] = 0;
    }

    data?.forEach((v) => {
      const day = v.viewed_at.slice(0, 10);
      if (counts[day] !== undefined) counts[day]++;
    });

    setViewHistory(
      Object.entries(counts).map(([date, views]) => ({ date, views }))
    );
    setChartLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const maxViews = Math.max(...viewHistory.map((v) => v.views), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-black transition-colors">
          ← Dashboard
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-xl font-bold text-black">Detailed stats</h1>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total views", value: totalViews },
          { label: "Total likes", value: totalLikes },
          { label: "Total comments", value: totalComments },
        ].map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-2xl p-5">
            <p className="text-3xl font-bold text-black mb-1">{s.value}</p>
            <p className="text-sm text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No published posts yet.</p>
      ) : (
        <div className="grid grid-cols-5 gap-8">

          {/* Post list */}
          <div className="col-span-2 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Posts
            </p>
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => loadViewHistory(post)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selectedPost?.id === post.id
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <p className="text-sm font-medium text-black line-clamp-1 mb-1">
                  {post.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{post.view_count} views</span>
                  <span>♥ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="col-span-3">
            {selectedPost && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                      Views over 30 days
                    </p>
                    <p className="text-sm font-medium text-black line-clamp-1">
                      {selectedPost.title}
                    </p>
                  </div>
                  <Link
                    href={`/p/${selectedPost.slug}`}
                    className="text-xs text-gray-400 hover:text-black transition-colors shrink-0"
                  >
                    View post →
                  </Link>
                </div>

                {chartLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Loading chart...</p>
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-2xl p-4">
                    {/* Bar chart */}
                    <div className="flex items-end gap-0.5 h-32 mb-2">
                      {viewHistory.map((point) => (
                        <div
                          key={point.date}
                          className="flex-1 flex flex-col items-center justify-end group relative"
                        >
                          <div
                            className="w-full rounded-sm transition-all"
                            style={{
                              height: `${Math.max(2, (point.views / maxViews) * 100)}%`,
                              backgroundColor: point.views > 0 ? "#e8a0a0" : "#f3f4f6",
                            }}
                          />
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {point.views} views
                            <br />
                            {formatDate(point.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* X axis labels — show every 7 days */}
                    <div className="flex justify-between text-xs text-gray-300 px-0.5">
                      {viewHistory
                        .filter((_, i) => i % 7 === 0)
                        .map((point) => (
                          <span key={point.date}>{formatDate(point.date)}</span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Post breakdown */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: "Views", value: selectedPost.view_count },
                    { label: "Likes", value: selectedPost.like_count },
                    { label: "Comments", value: selectedPost.comment_count },
                  ].map((s) => (
                    <div key={s.label} className="border border-gray-100 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-black">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}