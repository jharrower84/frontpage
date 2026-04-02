"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Props {
  postId?: string;
  commentId?: string;
  compact?: boolean;
}

const REASONS = [
  "Spam or misleading",
  "Harassment or hate speech",
  "Inappropriate content",
  "Copyright violation",
  "Other",
];

export default function ReportButton({ postId, commentId, compact = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/signin"); return; }
    if (!reason) return;
    setSubmitting(true);

    await supabase.from("reports").insert({
      reporter_id: user.id,
      post_id: postId || null,
      comment_id: commentId || null,
      reason,
      status: "pending",
    });

    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setOpen(false); setDone(false); setReason(""); }, 2000);
  };

  const trigger = compact ? (
    <button
      onClick={() => setOpen(true)}
      className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-red-500 transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H9.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
      <span className="text-xs font-medium">Report</span>
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H9.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
      Report
    </button>
  );

  return (
    <>
      {trigger}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ background: "var(--bg)" }}>
            {done ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Report submitted</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>We'll review it shortly.</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Report this content</h3>
                <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>Why are you reporting this?</p>
                <div className="space-y-2 mb-4">
                  {REASONS.map((r) => (
                    <button key={r} onClick={() => setReason(r)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-colors"
                      style={reason === r
                        ? { borderColor: "#2979FF", background: "#eef3ff", color: "var(--text-primary)" }
                        : { borderColor: "var(--border-strong)", color: "var(--text-secondary)" }
                      }>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
                    Cancel
                  </button>
                  <button onClick={handleReport} disabled={!reason || submitting}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                    style={{ backgroundColor: "#2979FF" }}>
                    {submitting ? "Submitting..." : "Submit report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}