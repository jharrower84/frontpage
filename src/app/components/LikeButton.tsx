"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LikeButton({ postId, authorId }: { postId: string; authorId: string }) {
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

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 text-sm transition-colors disabled:opacity-40 ${
        liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
      }`}
    >
      <span className="text-xl">{liked ? "❤️" : "🤍"}</span>
      <span>{count} {count === 1 ? "like" : "likes"}</span>
    </button>
  );
}