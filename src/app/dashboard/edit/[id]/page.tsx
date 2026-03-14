"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    checkUser();
    loadPost();
  }, [postId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const loadPost = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (data) {
      setTitle(data.title);
      setSubtitle(data.subtitle || "");
      setContent(data.content || "");
      setSlug(data.slug);
      setSelectedTags(data.tags || []);
      setCoverImage(data.cover_image || null);
    }
    setLoading(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("covers")
      .upload(fileName, file);

    if (error) {
      alert("Error uploading image: " + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("covers")
      .getPublicUrl(fileName);

    setCoverImage(publicUrl);
    setUploading(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      alert("Please add a title before saving.");
      return;
    }

    publish ? setPublishing(true) : setSaving(true);

    const { error } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        subtitle: subtitle.trim(),
        content,
        tags: selectedTags,
        cover_image: coverImage,
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
      })
      .eq("id", postId);

    if (error) {
      alert("Error saving post: " + error.message);
      setSaving(false);
      setPublishing(false);
      return;
    }

    if (publish) {
      router.push(`/p/${slug}`);
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || publishing || uploading}
              className="text-sm text-gray-500 hover:text-black transition-colors disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save draft"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || publishing || uploading}
              className="bg-black text-white text-sm px-5 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">

        <div className="mb-8">
          {coverImage ? (
            <div className="relative">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <button
                onClick={() => setCoverImage(null)}
                className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gray-400 transition-colors">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">
                  {uploading ? "Uploading..." : "Add a cover image"}
                </p>
                <p className="text-xs text-gray-300">Click to upload</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full text-4xl font-bold text-black placeholder-gray-300 border-none outline-none mb-4 bg-transparent"
        />

        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Add a subtitle..."
          className="w-full text-xl text-gray-400 placeholder-gray-300 border-none outline-none mb-6 bg-transparent"
        />

        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Tags</p>
          <div className="flex flex-wrap gap-2">
            {FASHION_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-black text-white border-black"
                    : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

<div className="border-t border-gray-100 mb-8" />

        <Editor content={content} onChange={setContent} />

      </div>
    </div>
  );
}