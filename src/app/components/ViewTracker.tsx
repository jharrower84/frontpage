"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      await Promise.all([
        supabase.rpc("increment_view_count", { post_id: postId }),
        supabase.from("post_views").insert({ post_id: postId }),
      ]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [postId]);

  return null;
}