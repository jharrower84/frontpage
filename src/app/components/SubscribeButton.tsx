"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SubscribeButton({ authorId }: { authorId: string }) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) checkSubscription(user.id);
    });
  }, [authorId]);

  const checkSubscription = async (uid: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", uid)
      .eq("author_id", authorId)
      .single();
    setSubscribed(!!data);
  };

  const handleSubscribe = async () => {
  setLoading(true);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { 
    router.push("/signin"); 
    setLoading(false);
    return; 
  }

  const currentUserId = user.id;

  if (subscribed) {
    await supabase.from("subscriptions").delete()
      .eq("subscriber_id", currentUserId)
      .eq("author_id", authorId);
    setSubscribed(false);
  } else {
    await supabase.from("subscriptions").insert({
      subscriber_id: currentUserId,
      author_id: authorId,
    });

    await supabase.from("notifications").insert({
      recipient_id: authorId,
      actor_id: currentUserId,
      type: "subscribe",
      read: false,
    });

    try {
      const [subscriberRes, authorRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", currentUserId).single(),
        supabase.from("profiles").select("full_name, username, publication_name").eq("id", authorId).single(),
      ]);

      if (user.email && authorRes.data) {
        await fetch("/api/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriberEmail: user.email,
            subscriberName: subscriberRes.data?.full_name,
            authorName: authorRes.data.full_name,
            authorUsername: authorRes.data.username,
            publicationName: authorRes.data.publication_name,
          }),
        });
      }
    } catch (e) {
      console.error("Welcome email failed:", e);
    }

    setSubscribed(true);
  }

  setLoading(false);
};

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="px-5 py-2 rounded-full text-sm font-semibold border transition-colors disabled:opacity-40"
      style={subscribed
        ? { borderColor: "#e5e7eb", color: "#6b7280" }
        : { backgroundColor: "#2979FF", borderColor: "#2979FF", color: "white" }
      }
    >
      {loading ? "..." : subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}