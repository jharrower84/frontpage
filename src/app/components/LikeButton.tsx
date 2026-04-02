"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LikeButton({
  postId,
  authorId,
  compact = false,
}: {
  postId: string;
  authorId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLikes();
    checkUser();
  }, [postId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const loadLikes = async () => {
    const { count: likeCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    setCount(likeCount || 0);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      setLiked(!!data);
    }

    setLoading(false);
  };

  const handleLike = async () => {
    if (!userId) {
      router.push("/signin");
      return;
    }

    setLoading(true);

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      setLiked(false);
      setCount(count - 1);
    } else {
      await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: userId });
      setLiked(true);
      setCount(count + 1);

      if (userId !== authorId) {
        await supabase.from("notifications").insert({
          user_id: authorId,
          actor_id: userId,
          type: "like",
          post_id: postId,
        });
      }
    }

    setLoading(false);
  };

  if (compact) {
    return (
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40 ${
          liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
        }`}
      >
        <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-xs font-medium">{count}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40 ${
        liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
      }`}
    >
      <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}