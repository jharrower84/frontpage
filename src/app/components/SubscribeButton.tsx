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
    if (!userId) { router.push("/signin"); return; }
    setLoading(true);

    if (subscribed) {
      await supabase.from("subscriptions").delete()
        .eq("subscriber_id", userId)
        .eq("author_id", authorId);
      setSubscribed(false);
    } else {
      await supabase.from("subscriptions").insert({
        subscriber_id: userId,
        author_id: authorId,
      });

      // Notification
      await supabase.from("notifications").insert({
        recipient_id: authorId,
        actor_id: userId,
        type: "subscribe",
        read: false,
      });

      // Send welcome email
      try {
        const [subscriberRes, authorRes] = await Promise.all([
          supabase.from("profiles").select("full_name, email:id").eq("id", userId).single(),
          supabase.from("profiles").select("full_name, username, publication_name").eq("id", authorId).single(),
        ]);

        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email && authorRes.data) {
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
        // Email failure shouldn't block the subscribe action
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
        : { backgroundColor: "#e8a0a0", borderColor: "#e8a0a0", color: "white" }
      }
    >
      {loading ? "..." : subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}