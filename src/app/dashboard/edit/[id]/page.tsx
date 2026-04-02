"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Editor from "@/app/components/Editor";

const FASHION_TAGS = [
  "Trends", "Runway", "Street Style", "Sustainability",
  "Business of Fashion", "Beauty", "Accessories", "Menswear",
  "Womenswear", "Vintage", "Luxury", "High Street"
];

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const contentRef = useRef("");
  const titleRef = useRef("");
  const subtitleRef = useRef("");
  const tagsRef = useRef<string[]>([]);
  const coverImageRef = useRef<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { subtitleRef.current = subtitle; }, [subtitle]);
  useEffect(() => { tagsRef.current = selectedTags; }, [selectedTags]);
  useEffect(() => { coverImageRef.current = coverImage; }, [coverImage]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    const { data } = await supabase
      .from("posts").select("*").eq("id", postId).single();
    if (data) {
      setTitle(data.title || "");
      setSubtitle(data.subtitle || "");
      setContent(data.content || "");
      setSlug(data.slug || "");
      setSelectedTags(data.tags || []);
      setCoverImage(data.cover_image || null);
      setIsPublished(data.published || false);
      titleRef.current = data.title || "";
      subtitleRef.current = data.subtitle || "";
      contentRef.current = data.content || "";
      tagsRef.current = data.tags || [];
      coverImageRef.current = data.cover_image || null;
    }
    setLoading(false);
    setContentReady(true);
  };

  const saveToDb = async (extra?: Record<string, any>) => {
    const res = await fetch("/api/posts/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        title: titleRef.current.trim(),
        subtitle: subtitleRef.current.trim(),
        content: contentRef.current,
        tags: tagsRef.current,
        cover_image: coverImageRef.current,
        ...extra,
      }),
    });
    return res.ok;
  };

  const autoSave = useCallback(async () => {
    if (!titleRef.current.trim()) return;
    setSaveStatus("saving");
    await saveToDb();
    setLastSaved(new Date());
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [postId]);

  useEffect(() => {
    if (!contentReady) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(), 5000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [title, subtitle, content, selectedTags, coverImage]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("covers").getPublicUrl(fileName);
      setCoverImage(publicUrl);
      coverImageRef.current = publicUrl;
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!titleRef.current.trim()) return;
    setSaving(true);
    const ok = await saveToDb();
    setSaving(false);
    if (ok) {
      setLastSaved(new Date());
      setSaveStatus("saved");
    }
    router.push("/dashboard?tab=drafts");
  };

  const handlePublish = async () => {
    if (!titleRef.current.trim()) return;
    setPublishing(true);
    await saveToDb({
      published: true,
      published_at: new Date().toISOString(),
    });
    setPublishing(false);
    router.push(`/p/${slug}`);
  };

  const handlePreview = async () => {
    await saveToDb();
    window.open(`/dashboard/preview/${postId}`, "_blank");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      <div className="flex items-center justify-between mb-8">
        <div />
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>✓ Saved</span>
          )}
          {lastSaved && saveStatus === "idle" && (
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              Saved {lastSaved.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handlePreview}
            className="text-sm px-4 py-2 rounded-full border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Preview
          </button>
          {!isPublished && (
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="text-sm px-4 py-2 rounded-full border transition-colors hover:opacity-80 disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {saving ? "Saving..." : "Save draft"}
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing || !title.trim()}
            className="text-sm px-5 py-2 rounded-full text-white font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2979FF" }}
          >
            {publishing ? "Publishing..." : isPublished ? "Update" : "Publish now"}
          </button>
        </div>
      </div>

      <div
        onClick={() => document.getElementById("cover-upload-edit")?.click()}
        className="relative w-full h-52 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors mb-8 overflow-hidden"
        style={{ borderColor: "var(--border)" }}
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
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              {uploading ? "Uploading..." : "Add a cover image"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Click to upload</p>
          </div>
        )}
        <input id="cover-upload-edit" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-4xl font-bold placeholder-gray-200 border-none outline-none mb-3 bg-transparent"
        style={{ color: "var(--text-primary)" }}
      />

      <input
        type="text"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Add a subtitle..."
        className="w-full text-xl placeholder-gray-200 border-none outline-none mb-6 bg-transparent"
        style={{ color: "var(--text-secondary)" }}
      />

      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Tags</p>
        <div className="flex flex-wrap gap-2">
          {FASHION_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={selectedTags.includes(tag)
                ? { background: "var(--text-primary)", color: "var(--bg)", borderColor: "var(--text-primary)" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {contentReady && (
        <Editor key={postId} content={content} onChange={(html) => {
          setContent(html);
          contentRef.current = html;
        }} />
      )}
    </div>
  );
}