"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);
      supabase.from("profiles").select("full_name, username, bio, avatar_url").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setFullName(data.full_name || "");
            setUsername(data.username || "");
            setBio(data.bio || "");
            setAvatarUrl(data.avatar_url || null);
          }
          setLoading(false);
        });
    });
  }, []);

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const fileName = `avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
    }
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      bio: bio.trim(),
      avatar_url: avatarUrl,
    }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push(`/profile/${username.trim().toLowerCase()}`);
    }, 1000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Edit profile
        </h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
              {fullName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Profile photo</p>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            Shown on your profile and next to your articles.
          </p>
          <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            {uploadingAvatar ? "Uploading..." : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
            style={{ background: "var(--bg)", color: "var(--text-primary)" }}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">
            Username
          </label>
          <div
            className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-gray-400"
            style={{ background: "var(--bg)" }}
          >
            <span className="text-sm text-gray-400 mr-1">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 text-sm focus:outline-none bg-transparent"
              style={{ color: "var(--text-primary)" }}
              placeholder="yourhandle"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">
            Short bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="A sentence about you and what you write about..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
            style={{ background: "var(--bg)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !fullName.trim() || !username.trim()}
        className="w-full mt-8 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-colors"
        style={{ backgroundColor: saved ? "#22c55e" : "#2979FF" }}
      >
        {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}