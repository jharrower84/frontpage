"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Publisher {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  category: string;
}

export default function PublishersSettingsPage() {
  const router = useRouter();
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestWebsite, setRequestWebsite] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);
      fetchPublishers(user.id);
    });
  }, []);

  const fetchPublishers = async (uid: string) => {
    const [{ data: allPublishers }, { data: subs }] = await Promise.all([
      supabase.from("publishers").select("*").eq("active", true).order("name"),
      supabase.from("publisher_subscriptions").select("publisher_id").eq("user_id", uid),
    ]);
    setPublishers(allPublishers || []);
    setFollowed(new Set(subs?.map((s) => s.publisher_id) || []));
    setLoading(false);
  };

  const handleToggle = async (publisherId: string) => {
    if (!userId) return;
    const isFollowed = followed.has(publisherId);
    if (isFollowed) {
      setFollowed((prev) => { const s = new Set(prev); s.delete(publisherId); return s; });
      await supabase.from("publisher_subscriptions").delete().eq("user_id", userId).eq("publisher_id", publisherId);
    } else {
      setFollowed((prev) => new Set(prev).add(publisherId));
      await supabase.from("publisher_subscriptions").insert({ user_id: userId, publisher_id: publisherId });
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestName.trim() || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("publisher_requests").insert({
      user_id: userId,
      publisher_name: requestName.trim(),
      publisher_website: requestWebsite.trim() || null,
      notes: requestNotes.trim() || null,
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      setRequestName("");
      setRequestWebsite("");
      setRequestNotes("");
      setShowRequest(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/settings")}
          className="p-2 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Publications</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Follow publications to see their latest articles in your feed.
          </p>
        </div>
      </div>

      {submitted && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0" }}>
          ✓ Request submitted — we'll review it and add it if it's a good fit.
        </div>
      )}

      {/* Publisher list */}
      <div className="space-y-3 mb-8">
        {publishers.map((publisher) => {
          const isFollowed = followed.has(publisher.id);
          return (
            <div key={publisher.id} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {publisher.logo_url ? (
                <img src={publisher.logo_url} alt={publisher.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                  style={{ border: "1px solid var(--border)" }} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ backgroundColor: "#2979FF" }}>
                  {publisher.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{publisher.name}</p>
                <p className="text-xs mb-0.5" style={{ color: "#2979FF" }}>{publisher.category}</p>
                {publisher.description && (
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                    {publisher.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggle(publisher.id)}
                className="text-xs font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-80 shrink-0"
                style={isFollowed
                  ? { backgroundColor: "#2979FF", color: "white" }
                  : { border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg)" }
                }
              >
                {isFollowed ? "Following" : "Follow"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Request a publication */}
      <button
        onClick={() => setShowRequest((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl mb-4 transition-opacity hover:opacity-80"
        style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: "#2979FF" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium" style={{ color: "#2979FF" }}>Request a publication</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 transition-transform ${showRequest ? "rotate-180" : ""}`} style={{ color: "var(--text-faint)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showRequest && (
        <div className="p-5 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Suggest a publication</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Tell us which publication you'd like to see on FrontPage and we'll review it.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>Publication name *</label>
              <input type="text" value={requestName} onChange={(e) => setRequestName(e.target.value)}
                placeholder="e.g. Vogue, Dazed, i-D"
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>Website (optional)</label>
              <input type="url" value={requestWebsite} onChange={(e) => setRequestWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>Why this publication? (optional)</label>
              <textarea value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Tell us why you'd like to see this publication..."
                rows={3} maxLength={300}
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none resize-none"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
            </div>
            <button
              onClick={handleSubmitRequest}
              disabled={submitting || !requestName.trim()}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#2979FF" }}
            >
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}