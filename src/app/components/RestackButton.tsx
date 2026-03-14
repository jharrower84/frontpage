"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Props {
  postId: string;
  postTitle: string;
}

export default function RestackButton({ postId, postTitle }: Props) {
  const router = useRouter();
  const [restacked, setRestacked] = useState(false);
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) checkRestack(user.id);
    });
    loadCount();
  }, [postId]);

  const loadCount = async () => {
    const { count } = await supabase
      .from("restacks")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    setCount(count || 0);
  };

  const checkRestack = async (uid: string) => {
    const { data } = await supabase
      .from("restacks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", uid)
      .single();
    setRestacked(!!data);
  };

  const handleRestack = async () => {
    if (!userId) { router.push("/signin"); return; }
    if (restacked) return;
    setShowModal(true);
  };

  const submitRestack = async () => {
    if (!userId) return;
    setSubmitting(true);

    await supabase.from("restacks").insert({ post_id: postId, user_id: userId });

    if (note.trim()) {
      await supabase.from("notes").insert({
        author_id: userId,
        content: note.trim(),
        restack_of: postId,
        restack_note: note.trim(),
      });
    }

    setRestacked(true);
    setCount((c) => c + 1);
    setShowModal(false);
    setNote("");
    setSubmitting(false);
  };

  return (
    <>
      <button
        onClick={handleRestack}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          restacked ? "text-green-500" : "text-gray-400 hover:text-black"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        {count > 0 && <span>{count}</span>}
        {restacked ? "Restacked" : "Restack"}
      </button>

      {/* Restack modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-black mb-1">Restack this post</h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-1">"{postTitle}"</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional) — why are you sharing this?"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors">
                Cancel
              </button>
              <button onClick={submitRestack} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#e8a0a0" }}>
                {submitting ? "Restacking..." : "Restack"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}