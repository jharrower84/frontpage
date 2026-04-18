"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export const metadata = {
  title: "Apply to Write",
};

const NICHES = ["Fashion", "Sustainability", "Luxury", "Streetwear", "Vintage", "Couture", "Beauty", "Photography", "Culture", "Business"];

type Status = "loading" | "approved" | "pending" | "rejected" | "none";

export default function ApplyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [rejection, setRejection] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [publicationName, setPublicationName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [niche, setNiche] = useState<string[]>([]);
  const [pitch, setPitch] = useState("");
  const [writingSamples, setWritingSamples] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("approved_creator, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.approved_creator) {
        router.push("/dashboard/new");
        return;
      }

      if (profile?.full_name) setFullName(profile.full_name);

      const { data: app } = await supabase
        .from("creator_applications")
        .select("status, rejection_reason")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!app) { setStatus("none"); return; }
      setStatus(app.status as Status);
      if (app.rejection_reason) setRejection(app.rejection_reason);
    });
  }, []);

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);

    const { error } = await supabase.from("creator_applications").insert({
      user_id: userId,
      full_name: fullName.trim(),
      publication_name: publicationName.trim(),
      bio: bio.trim(),
      instagram: instagram.trim() || null,
      tiktok: tiktok.trim() || null,
      linkedin: linkedin.trim() || null,
      website: website.trim() || null,
      niche,
      pitch: pitch.trim(),
      writing_samples: writingSamples.trim() || null,
      status: "pending",
    });

    if (!error) {
      // Notify admin
      await supabase.from("notifications").insert({
        user_id: "cd7ec406-45d0-4026-9566-f20a833fe392",
        actor_id: userId,
        type: "creator_application",
        message: `${fullName} has applied to become a creator.`,
      });
      setSubmitted(true);
      setStatus("pending");
    }

    setSubmitting(false);
  };

  const toggleNiche = (n: string) =>
    setNiche((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const canProceed = () => {
    if (step === 1) return fullName.trim().length > 0 && publicationName.trim().length > 0 && bio.trim().length >= 50;
    if (step === 2) return true;
    if (step === 3) return niche.length > 0;
    if (step === 4) return pitch.trim().length >= 100;
    return false;
  };

  if (status === "loading") return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  if (status === "approved") return null;

  if (status === "pending") return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#eef3ff" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth={2} className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        Application under review
      </h1>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
        We've received your application and will review it shortly. We'll notify you as soon as a decision has been made.
      </p>
    </div>
  );

  if (status === "rejected") return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#fff5f5" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth={2} className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Application not approved
        </h1>
        {rejection && (
          <div className="text-sm px-5 py-4 rounded-xl mb-6 text-left" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Feedback</p>
            <p style={{ color: "var(--text-secondary)" }}>{rejection}</p>
          </div>
        )}
        <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
          You can reapply immediately addressing the feedback above.
        </p>
        <button
          onClick={() => setStatus("none")}
          className="text-sm font-semibold px-8 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#2979FF" }}
        >
          Reapply now
        </button>
      </div>
    </div>
  );

  // Application form
  return (
    <div className="max-w-xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#2979FF" }}>
          Creator Programme
        </p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
          Apply to become a creator
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
          FrontPage is home to independent fashion writing. Tell us about yourself and what you'd like to publish.
        </p>

        {/* Benefits */}
        <div className="mt-6 space-y-2">
          {[
            "Publish to a built-in fashion audience",
            "Subscriber notifications on every post",
            "Your work surfaced through our tailored feed",
            "Available on web and iOS",
          ].map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "#eef3ff" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth={2.5} className="w-2.5 h-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                background: s === step ? "#2979FF" : s < step ? "#eef3ff" : "var(--bg-secondary)",
                color: s === step ? "white" : s < step ? "#2979FF" : "var(--text-faint)",
              }}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 4 && <div className="h-px w-6 shrink-0" style={{ background: s < step ? "#2979FF" : "var(--border)" }} />}
          </div>
        ))}
        <span className="text-xs ml-2" style={{ color: "var(--text-faint)" }}>
          {["About You", "Social Profiles", "Your Niche", "Your Pitch"][step - 1]}
        </span>
      </div>

      {/* Step 1 — About You */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              Full name *
            </label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              Publication name *
            </label>
            <input type="text" value={publicationName} onChange={(e) => setPublicationName(e.target.value)}
              placeholder="What you publish under"
              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              Bio * <span className="normal-case font-normal" style={{ color: "var(--text-faint)" }}>({bio.length}/50 min)</span>
            </label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your background in fashion..."
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none resize-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
            {bio.length > 0 && bio.length < 50 && (
              <p className="text-xs mt-1" style={{ color: "#e05555" }}>{50 - bio.length} more characters needed</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Social Profiles */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm mb-2" style={{ color: "var(--text-tertiary)" }}>All optional — share what's relevant.</p>
          {[
            { label: "Instagram", value: instagram, set: setInstagram, prefix: "@", placeholder: "yourhandle" },
            { label: "TikTok", value: tiktok, set: setTiktok, prefix: "@", placeholder: "yourhandle" },
            { label: "LinkedIn", value: linkedin, set: setLinkedin, prefix: null, placeholder: "linkedin.com/in/yourprofile" },
            { label: "Website", value: website, set: setWebsite, prefix: null, placeholder: "yourwebsite.com" },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
                {field.label}
              </label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {field.prefix && (
                  <span className="px-3 py-3 text-sm shrink-0" style={{ background: "var(--bg-secondary)", color: "var(--text-faint)", borderRight: "1px solid var(--border)" }}>
                    {field.prefix}
                  </span>
                )}
                <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="flex-1 px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "var(--bg)", color: "var(--text-primary)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 — Niche */}
      {step === 3 && (
        <div>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>Select all that apply. At least one required.</p>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <button
                key={n}
                onClick={() => toggleNiche(n)}
                className="text-sm px-4 py-2 rounded-full transition-colors"
                style={niche.includes(n)
                  ? { backgroundColor: "#2979FF", color: "white", border: "1px solid #2979FF" }
                  : { border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg)" }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Pitch */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              Your pitch * <span className="normal-case font-normal">({pitch.length}/100 min)</span>
            </label>
            <textarea value={pitch} onChange={(e) => setPitch(e.target.value)}
              placeholder="Why do you want to write for FrontPage? What would you cover?"
              rows={5}
              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none resize-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
            {pitch.length > 0 && pitch.length < 100 && (
              <p className="text-xs mt-1" style={{ color: "#e05555" }}>{100 - pitch.length} more characters needed</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              Previous writing links <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea value={writingSamples} onChange={(e) => setWritingSamples(e.target.value)}
              placeholder="Links to previous articles, blog posts, or writing samples..."
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none resize-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
          </div>

          {/* Summary card */}
          {pitch.length >= 100 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>Application summary</p>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{fullName}</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>{publicationName}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {niche.map((n) => (
                  <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#eef3ff", color: "#2979FF" }}>{n}</span>
                ))}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{pitch.slice(0, 120)}...</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)}
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-secondary)" }}>
            ← Back
          </button>
        ) : <div />}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="text-sm font-semibold px-8 py-3 rounded-xl text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2979FF" }}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="text-sm font-semibold px-8 py-3 rounded-xl text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2979FF" }}
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        )}
      </div>
    </div>
  );
}