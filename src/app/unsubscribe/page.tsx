"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const authorUsername = searchParams.get("author");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    if (authorUsername && email) handleUnsubscribe();
  }, []);

  const handleUnsubscribe = async () => {
    const { data: author } = await supabase
      .from("profiles")
      .select("id, full_name, publication_name")
      .eq("username", authorUsername)
      .single();

    if (!author) { setStatus("error"); return; }

    setAuthorName(author.publication_name || author.full_name);

    // Find user by email via the API
    const res = await fetch(`/api/get-user-by-email?email=${encodeURIComponent(email!)}`);
    const { userId } = await res.json();

    if (!userId) { setStatus("error"); return; }

    await supabase.from("subscriptions")
      .delete()
      .eq("subscriber_id", userId)
      .eq("author_id", author.id);

    setStatus("done");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-2xl font-bold text-black mb-3">
          {status === "loading" && "Unsubscribing..."}
          {status === "done" && "You've been unsubscribed"}
          {status === "error" && "Something went wrong"}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {status === "done" && `You'll no longer receive emails from ${authorName}.`}
          {status === "error" && "We couldn't process your unsubscribe request. Please try again."}
        </p>
        <Link href="/" className="text-sm text-gray-400 hover:text-black transition-colors">
          Back to FrontPage
        </Link>
      </div>
    </div>
  );
}