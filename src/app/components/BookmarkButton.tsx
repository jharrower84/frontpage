"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function BookmarkButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, [postId]);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data } = await supabase
      .from("reading_list")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    setSaved(!!data);
    setLoading(false);
  };

  const handleToggle = async () => {
    if (!userId) {
      router.push("/signin");
      return;
    }

    setLoading(true);

    if (saved) {
      await supabase
        .from("reading_list")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      setSaved(false);
    } else {
      await supabase
        .from("reading_list")
        .insert({ post_id: postId, user_id: userId });
      setSaved(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={saved ? "Remove from reading list" : "Save to reading list"}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40 ${
        saved ? "text-black font-medium" : "text-gray-400 hover:text-black"
      }`}
    >
      <span className="text-lg">{saved ? "🔖" : "☆"}</span>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}