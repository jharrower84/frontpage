"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Editor from "@/app/components/Editor";

const FASHION_TAGS = [
  "Trends", "Runway", "Street Style", "Sustainability",
  "Business of Fashion", "Beauty", "Accessories", "Menswear",
  "Womenswear", "Vintage", "Luxury", "High Street"
];

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(async (silent = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !title.trim()) return;

    if (!silent) setSaveStatus("saving");

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

    if (draftId) {
      await supabase.from("posts").update({
        title: title.trim(),
        subtitle: subtitle.trim(),
        content,
        tags,
        cover_image: coverImage,
        updated_at: new Date().toISOString(),
      }).eq("id", draftId);
    } else {
      const { data } = await supabase.from("posts").insert({
        title: title.trim(),
        subtitle: subtitle.trim(),
        content,
        tags,
        cover_image: coverImage,
        author_id: user.id,
        published: false,
        slug,
      }).select().single();
      if (data) setDraftId(data.id);
    }

    setLastSaved(new Date());
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [title, subtitle, content, tags, coverImage, draftId]);

  useEffect(() => {
    if (!title.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(true), 5000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [title, subtitle, content, tags, coverImage]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("covers").getPublicUrl(fileName);
      setCoverImage(publicUrl);
    }
    setUploading(false);
  };

  const toggleTag = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handlePublish = async (scheduled = false) => {
    if (!title.trim()) return;
    setPublishing(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const isScheduled = scheduled && scheduledAt;
    const publishedAt = isScheduled ? new Date(scheduledAt).toISOString() : new Date().toISOString();

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      content,
      tags,
      cover_image: coverImage,
      published: !isScheduled,
      published_at: publishedAt,
      scheduled_at: isScheduled ? publishedAt : null,
    };

    if (draftId) {
      await supabase.from("posts").update(payload).eq("id", draftId);
    } else {
      await supabase.from("posts").insert({ ...payload, author_id: user.id, slug });
    }

    setPublishing(false);
    router.push("/dashboard");
  };

  // Minimum datetime for schedule picker — now
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-semibold text-black">New post</h1>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && <span className="text-xs text-gray-400">Saving...</span>}
          {saveStatus === "saved" && <span className="text-xs text-gray-400">✓ Draft saved</span>}
          {lastSaved && saveStatus === "idle" && (
            <span className="text-xs text-gray-300">
              Saved {lastSaved.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={() => saveDraft()} disabled={!title.trim()}
            className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
            Save draft
          </button>
          <button onClick={() => setShowSchedule(!showSchedule)} disabled={!title.trim()}
            className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
            Schedule
          </button>
          <button onClick={() => handlePublish(false)} disabled={!title.trim() || publishing}
            className="text-sm px-5 py-2 rounded-full text-white font-semibold disabled:opacity-40"
            style={{ backgroundColor: "#e8a0a0" }}>
            {publishing ? "Publishing..." : "Publish now"}
          </button>
        </div>
      </div>

      {/* Schedule panel */}
      {showSchedule && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">
              Publish at
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <button
            onClick={() => handlePublish(true)}
            disabled={!scheduledAt || !title.trim() || publishing}
            className="text-sm px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-40 mt-5"
            style={{ backgroundColor: "#e8a0a0" }}
          >
            {publishing ? "Scheduling..." : "Schedule post"}
          </button>
        </div>
      )}

      {/* Cover image */}
      <div
        onClick={() => document.getElementById("cover-upload")?.click()}
        className="relative w-full h-52 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors mb-8 overflow-hidden"
      >
        {coverImage ? (
          <>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change cover</span>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-300 text-sm">{uploading ? "Uploading..." : "Add a cover image"}</p>
            <p className="text-gray-200 text-xs mt-1">Click to upload</p>
          </div>
        )}
        <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      </div>

      {/* Title */}
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
        className="w-full text-4xl font-bold text-black placeholder-gray-200 border-none outline-none mb-3 bg-transparent" />

      {/* Subtitle */}
      <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Add a subtitle..."
        className="w-full text-xl text-gray-400 placeholder-gray-200 border-none outline-none mb-6 bg-transparent" />

      {/* Tags */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Tags</p>
        <div className="flex flex-wrap gap-2">
          {FASHION_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                tags.includes(tag) ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Editor content={content} onChange={setContent} />
    </div>
  );
}