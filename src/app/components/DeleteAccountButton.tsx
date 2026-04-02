"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    setConfirming(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not signed in."); setConfirming(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    try {
      const res = await fetch("/api/send-deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          fullName: profile?.full_name,
          username: profile?.username,
        }),
      });

      if (!res.ok) throw new Error("Failed to send request");
      setDone(true);
    } catch (e) {
      setError("Something went wrong. Please email hello@frontpageapp.com directly.");
    }

    setConfirming(false);
  };

  const handleDone = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-600 transition-colors hover:opacity-80 shrink-0"
        style={{ background: "#fecaca" }}
      >
        Delete account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { if (!confirming && !done) setOpen(false); }}
          />
          <div
            className="relative rounded-2xl p-6 w-full max-w-sm shadow-xl"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            {done ? (
              <div className="text-center py-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#f0fdf4" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Deletion request received
                </p>
                <p className="text-sm mb-2" style={{ color: "var(--text-tertiary)" }}>
                Your account and all associated data has been permanently deleted.
              </p>
              <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>
                You'll now be signed out.
              </p>
                <button
                onClick={handleDone}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#2979FF" }}
              >
                Done
              </button>
              </div>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#fff5f5" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-center mb-2" style={{ color: "var(--text-primary)" }}>
                  Delete your account?
                </h3>
                <p className="text-sm text-center mb-4" style={{ color: "var(--text-tertiary)" }}>
                  This will permanently delete your profile, articles, comments and all associated data. This cannot be undone.
                </p>
                <p className="text-xs text-center mb-6" style={{ color: "var(--text-faint)" }}>
                  We'll send a deletion request to our team. Your account will be removed within 30 days.{" "}
                  <Link href="/data-deletion" className="underline hover:opacity-70" target="_blank">
                    Learn more
                  </Link>
                </p>

                {error && (
                  <p className="text-xs mb-4 text-center" style={{ color: "#e05555" }}>{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={confirming}
                    className="flex-1 py-2.5 rounded-xl border text-sm transition-colors disabled:opacity-40"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequest}
                    disabled={confirming}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#e05555" }}
                  >
                    {confirming ? "Sending..." : "Delete account"}
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