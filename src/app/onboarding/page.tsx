"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const FASHION_TAGS = [
  "Trends", "Runway", "Street Style", "Sustainability",
  "Business of Fashion", "Beauty", "Accessories", "Menswear",
  "Womenswear", "Vintage", "Luxury", "High Street"
];

interface Writer {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? null);
      supabase.from("profiles").select("*").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setFullName(data.full_name || "");
            setUsername(data.username || "");
            setBio(data.bio || "");
            setInterests(data.interests || []);
          }
        });
    });
  }, []);

  useEffect(() => {
    if (step === 3) loadWriters();
  }, [step]);

  const loadWriters = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio")
      .neq("id", userId)
      .limit(12);
    if (data) setWriters(data);
  };

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      bio: bio.trim(),
    }).eq("id", userId);
    setSaving(false);
    setStep(2);
  };

  const saveInterests = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ interests }).eq("id", userId);
    setSaving(false);
    setStep(3);
  };

  const toggleInterest = (tag: string) =>
    setInterests((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const toggleFollow = (writerId: string) =>
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(writerId) ? next.delete(writerId) : next.add(writerId);
      return next;
    });

  const finishOnboarding = async () => {
    if (!userId) return;
    setSaving(true);

    if (following.size > 0) {
      await supabase.from("subscriptions").insert(
        Array.from(following).map((authorId) => ({
          subscriber_id: userId,
          author_id: authorId,
        }))
      );
    }

    // Send personalised welcome email
    if (userEmail) {
      try {
        await fetch("/api/send-signup-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            fullName,
            interests,
            userId,
          }),
        });
      } catch (e) {
        console.error("Welcome email failed:", e);
      }
    }

    setSaving(false);
    router.push("/");
  };

  const progressWidth = `${(step / 4) * 100}%`;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <div className="h-1 bg-gray-100">
        <div className="h-full transition-all duration-500" style={{ width: progressWidth, backgroundColor: "#e8a0a0" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Step 1: Profile */}
          {step === 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Step 1 of 4</p>
              <h1 className="text-3xl font-bold text-black mb-2">Set up your profile</h1>
              <p className="text-gray-400 text-sm mb-8">This is how you'll appear to other writers and readers.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Full name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Username</label>
                  <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-gray-400">
                    <span className="text-sm text-gray-400 mr-1">@</span>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 text-sm focus:outline-none" placeholder="yourhandle" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Short bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
                    placeholder="A sentence about you and what you write about..." />
                </div>
              </div>

              <button onClick={saveProfile} disabled={!fullName.trim() || !username.trim() || saving}
                className="w-full mt-8 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#e8a0a0" }}>
                {saving ? "Saving..." : "Continue →"}
              </button>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Step 2 of 4</p>
              <h1 className="text-3xl font-bold text-black mb-2">What are you into?</h1>
              <p className="text-gray-400 text-sm mb-8">Select the topics you care about. We'll use these to personalise your feed.</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {FASHION_TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleInterest(tag)}
                    className="px-4 py-2 rounded-full text-sm border transition-colors"
                    style={interests.includes(tag)
                      ? { backgroundColor: "#e8a0a0", borderColor: "#e8a0a0", color: "white" }
                      : { borderColor: "#e5e7eb", color: "#6b7280" }
                    }>
                    {tag}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-6">
                {interests.length === 0 ? "Select at least one topic" : `${interests.length} selected`}
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors">
                  ← Back
                </button>
                <button onClick={saveInterests} disabled={interests.length === 0 || saving}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                  style={{ backgroundColor: "#e8a0a0" }}>
                  {saving ? "Saving..." : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Follow writers */}
          {step === 3 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Step 3 of 4</p>
              <h1 className="text-3xl font-bold text-black mb-2">Follow some writers</h1>
              <p className="text-gray-400 text-sm mb-8">Get your feed started by following a few writers you might enjoy.</p>

              <div className="space-y-3 mb-8 max-h-80 overflow-y-auto">
                {writers.map((writer) => (
                  <div key={writer.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      {writer.avatar_url ? (
                        <img src={writer.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                          {writer.full_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-black">{writer.full_name}</p>
                        {writer.bio && <p className="text-xs text-gray-400 line-clamp-1">{writer.bio}</p>}
                      </div>
                    </div>
                    <button onClick={() => toggleFollow(writer.id)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0"
                      style={following.has(writer.id)
                        ? { backgroundColor: "#e8a0a0", borderColor: "#e8a0a0", color: "white" }
                        : { borderColor: "#e5e7eb", color: "#6b7280" }
                      }>
                      {following.has(writer.id) ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors">
                  ← Back
                </button>
                <button onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: "#e8a0a0" }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Step 4 of 4</p>
              <div className="text-5xl mb-6">🎉</div>
              <h1 className="text-3xl font-bold text-black mb-3">You're all set</h1>
              <p className="text-gray-400 text-sm mb-2">
                Your feed is personalised around: <strong className="text-black">{interests.slice(0, 3).join(", ")}{interests.length > 3 ? ` +${interests.length - 3} more` : ""}</strong>
              </p>
              <p className="text-gray-400 text-sm mb-10">
                {following.size > 0 ? `You're following ${following.size} writer${following.size !== 1 ? "s" : ""}. Your feed is ready.` : "Explore writers to build your feed."}
              </p>
              <button onClick={finishOnboarding} disabled={saving}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#e8a0a0" }}>
                {saving ? "Setting up..." : "Go to FrontPage →"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}