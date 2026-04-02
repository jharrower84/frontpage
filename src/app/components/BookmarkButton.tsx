"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function BookmarkButton({
  postId,
  compact = false,
}: {
  postId: string;
  compact?: boolean;
}) {
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

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40 ${
          saved ? "text-black" : "text-gray-500 hover:text-black"
        }`}
      >
        <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span className="text-xs font-medium">{saved ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors disabled:opacity-40 ${
        saved
          ? "border-gray-400 bg-gray-50 text-black font-medium"
          : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black"
      }`}
    >
      <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}