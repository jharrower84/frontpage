"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const FASHION_TAGS = [
  "Trends", "Runway", "Street Style", "Sustainability",
  "Business of Fashion", "Beauty", "Accessories", "Menswear",
  "Womenswear", "Vintage", "Luxury", "High Street"
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [about, setAbout] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [publicationName, setPublicationName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [publicationLogo, setPublicationLogo] = useState<string | null>(null);
  const [publicationHeader, setPublicationHeader] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);
      supabase.from("profiles").select("*").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setFullName(data.full_name || "");
            setUsername(data.username || "");
            setBio(data.bio || "");
            setAbout(data.about || "");
            setInterests(data.interests || []);
            setPublicationName(data.publication_name || "");
            setAvatarUrl(data.avatar_url || null);
            setPublicationLogo(data.publication_logo || null);
            setPublicationHeader(data.publication_header || null);
          }
          setLoading(false);
        });
    });
  }, []);

  const uploadImage = async (
    file: File,
    bucket: string,
    prefix: string,
    setter: (url: string) => void,
    loadingSetter: (v: boolean) => void
  ) => {
    loadingSetter(true);
    const ext = file.name.split(".").pop();
    const fileName = `${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setter(publicUrl);
    }
    loadingSetter(false);
  };

  const toggleInterest = (tag: string) =>
    setInterests((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      about: about.trim(),
      interests,
      publication_name: publicationName.trim(),
      avatar_url: avatarUrl,
      publication_logo: publicationLogo,
      publication_header: publicationHeader,
    }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="text-sm px-5 py-2.5 rounded-full text-white font-semibold disabled:opacity-40"
          style={{ backgroundColor: saved ? "#86efac" : "#e8a0a0" }}>
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Profile */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Profile</h2>

        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-16 h-16 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center text-xl font-bold text-pink-700">
                {fullName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: "var(--text-primary)" }}>Profile photo</label>
            <label className="cursor-pointer text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
              {uploadingAvatar ? "Uploading..." : "Upload new photo"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, "avatars", "avatar", setAvatarUrl, setUploadingAvatar);
                }} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Username</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-gray-400">
              <span className="text-sm text-gray-400 mr-1">@</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="flex-1 text-sm focus:outline-none bg-transparent" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Short bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
              placeholder="A sentence about you..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">About</label>
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={5}
              placeholder="Tell readers more about yourself..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none" />
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="border-t border-gray-100 pt-10 mb-10">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Your interests</h2>
        <p className="text-xs text-gray-400 mb-6">These personalise your For You feed.</p>
        <div className="flex flex-wrap gap-2">
          {FASHION_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleInterest(tag)}
              className="px-4 py-2 rounded-full text-sm border transition-colors"
              style={interests.includes(tag)
                ? { backgroundColor: "#e8a0a0", borderColor: "#e8a0a0", color: "white" }
                : { borderColor: "#e5e7eb", color: "var(--text-secondary)" }
              }>
              {tag}
            </button>
          ))}
        </div>
        {interests.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">{interests.length} selected</p>
        )}
      </div>

      {/* Publication */}
      <div className="border-t border-gray-100 pt-10 mb-10">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Publication</h2>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Publication name</label>
            <input type="text" value={publicationName} onChange={(e) => setPublicationName(e.target.value)}
              placeholder="e.g. The Runway Report"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            <p className="text-xs text-gray-400 mt-1.5">Shown on your profile instead of your name if set.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-3">Publication logo</label>
            <div className="flex items-center gap-4">
              {publicationLogo ? (
                <img src={publicationLogo} className="w-14 h-14 rounded-xl object-cover border border-gray-100" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-xs">Logo</div>
              )}
              <label className="cursor-pointer text-xs text-gray-400 hover:text-black transition-colors">
                {uploadingLogo ? "Uploading..." : "Upload logo"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "avatars", "logo", setPublicationLogo, setUploadingLogo);
                  }} />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-3">Header image</label>
            <div
              onClick={() => document.getElementById("header-upload")?.click()}
              className="relative w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors overflow-hidden">
              {publicationHeader ? (
                <>
                  <img src={publicationHeader} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Change header</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-300 text-sm">{uploadingHeader ? "Uploading..." : "Add a header image"}</p>
              )}
              <input id="header-upload" type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, "covers", "header", setPublicationHeader, setUploadingHeader);
                }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}