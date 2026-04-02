"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function BlockButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", profileId)
        .maybeSingle()
        .then(({ data }) => {
          setBlocked(!!data);
          setLoading(false);
        });
    });
  }, [profileId]);

  const handleToggle = async () => {
    if (!userId) { router.push("/signin"); return; }
    setLoading(true);

    if (blocked) {
      await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", userId)
        .eq("blocked_id", profileId);
      setBlocked(false);
    } else {
      await supabase
        .from("blocked_users")
        .insert({ blocker_id: userId, blocked_id: profileId });
      setBlocked(true);
    }

    setLoading(false);
  };

  if (loading || !userId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-colors disabled:opacity-40"
      style={blocked
        ? { borderColor: "#fecaca", color: "#e05555", background: "#fff5f5" }
        : { borderColor: "var(--border)", color: "var(--text-faint)" }
      }
    >
      {blocked ? "Unblock" : "Block"}
    </button>
  );
}