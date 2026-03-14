"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import SubscribeButton from "@/app/components/SubscribeButton";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  about: string;
  publication_name: string | null;
  publication_logo: string | null;
  publication_header: string | null;
  pinned_post_id: string | null;
}

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  published_at: string;
  cover_image: string | null;
  tags: string[];
  view_count: number;
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPost, setPinnedPost] = useState<Post | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profileData) { setLoading(false); return; }

    setProfile(profileData);
    setIsOwner(user?.id === profileData.id);

    const [postsRes, subRes] = await Promise.all([
      supabase.from("posts").select("*").eq("author_id", profileData.id).eq("published", true).order("published_at", { ascending: false }),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("author_id", profileData.id),
    ]);

    const postsData = (postsRes.data || []) as Post[];
    setPosts(postsData);
    setSubscriberCount(subRes.count || 0);

    if (profileData.pinned_post_id) {
      const pinned = postsData.find((p) => p.id === profileData.pinned_post_id);
      setPinnedPost(pinned || null);
    }

    setLoading(false);
  };

  const handlePin = async (postId: string) => {
    await supabase.from("profiles").update({ pinned_post_id: postId }).eq("id", profile!.id);
    const post = posts.find((p) => p.id === postId) || null;
    setPinnedPost(post);
    setProfile((prev) => prev ? { ...prev, pinned_post_id: postId } : prev);
  };

  const handleUnpin = async () => {
    await supabase.from("profiles").update({ pinned_post_id: null }).eq("id", profile!.id);
    setPinnedPost(null);
    setProfile((prev) => prev ? { ...prev, pinned_post_id: null } : prev);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const unpinnedPosts = posts.filter((p) => p.id !== pinnedPost?.id);
  const displayName = profile?.publication_name || profile?.full_name;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400 text-sm">Loading...</p></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Profile not found.</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {profile.publication_header && (
        <div className="w-full h-40 rounded-2xl overflow-hidden mb-8">
          <img src={profile.publication_header} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      <div className="mb-8 text-center">
        {profile.publication_logo ? (
          <img src={profile.publication_logo} className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 border border-gray-100" alt="" />
        ) : profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-pink-200 flex items-center justify-center text-3xl font-bold text-pink-700 mx-auto mb-4">
            {profile.full_name?.[0]?.toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl font-bold text-black mb-1">{displayName}</h1>
        {profile.publication_name && <p className="text-sm text-gray-400 mb-1">by {profile.full_name}</p>}
        <p className="text-sm text-gray-400 mb-3">@{profile.username}</p>
        {profile.bio && <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto mb-4">{profile.bio}</p>}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-6">
          <span><strong className="text-black">{posts.length}</strong> posts</span>
          <span><strong className="text-black">{subscriberCount}</strong> subscribers</span>
        </div>
        {!isOwner && <SubscribeButton authorId={profile.id} />}
        {isOwner && (
          <Link href="/settings" className="inline-block px-5 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400 transition-colors">
            Edit profile
          </Link>
        )}
      </div>

<div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "32px" }}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{ paddingBottom: "12px", marginRight: "24px", fontSize: "14px", fontWeight: activeTab === "posts" ? 600 : 400, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: activeTab === "posts" ? "2px solid var(--text-primary)" : "2px solid transparent", color: activeTab === "posts" ? "var(--text-primary)" : "var(--text-tertiary)", background: "none", cursor: "pointer" }}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("about")}
          style={{ paddingBottom: "12px", fontSize: "14px", fontWeight: activeTab === "about" ? 600 : 400, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: activeTab === "about" ? "2px solid var(--text-primary)" : "2px solid transparent", color: activeTab === "about" ? "var(--text-primary)" : "var(--text-tertiary)", background: "none", cursor: "pointer" }}
        >
          About
        </button>
      </div>

      {activeTab === "posts" && (
        <>
          {pinnedPost && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">📌 Pinned</span>
                {isOwner && (
                  <button onClick={handleUnpin} className="text-xs text-gray-300 hover:text-gray-500 transition-colors ml-auto">Unpin</button>
                )}
              </div>
              <Link href={`/p/${pinnedPost.slug}`} className="flex gap-4 items-start group p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-black group-hover:underline leading-snug mb-1">{pinnedPost.title}</h2>
                  {pinnedPost.subtitle && <p className="text-sm text-gray-500 line-clamp-2">{pinnedPost.subtitle}</p>}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(pinnedPost.published_at)}</p>
                </div>
                {pinnedPost.cover_image && (
                  <img src={pinnedPost.cover_image} alt={pinnedPost.title} className="w-20 h-14 object-cover rounded-lg shrink-0" />
                )}
              </Link>
            </div>
          )}
          {posts.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No published posts yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {unpinnedPosts.map((post) => (
                <article key={post.id} className="py-5 flex gap-4 items-start group">
                  <div className="flex-1 min-w-0">
                    <Link href={`/p/${post.slug}`}>
                      <h2 className="font-bold text-black hover:underline leading-snug mb-1">{post.title}</h2>
                      {post.subtitle && <p className="text-sm text-gray-500 line-clamp-2">{post.subtitle}</p>}
                    </Link>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-gray-400">{formatDate(post.published_at)}</p>
                      {post.view_count > 0 && <p className="text-xs text-gray-300">{post.view_count} views</p>}
                      {isOwner && !pinnedPost && (
                        <button onClick={() => handlePin(post.id)} className="text-xs text-gray-300 hover:text-gray-500 transition-colors ml-auto">
                          📌 Pin
                        </button>
                      )}
                      {isOwner && pinnedPost && pinnedPost.id !== post.id && (
                        <button onClick={() => handlePin(post.id)} className="text-xs text-gray-300 hover:text-gray-500 transition-colors ml-auto">
                          📌 Pin instead
                        </button>
                      )}
                    </div>
                  </div>
                  {post.cover_image && (
                    <Link href={`/p/${post.slug}`} className="shrink-0">
                      <img src={post.cover_image} alt={post.title} className="w-20 h-14 object-cover rounded-lg" />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "about" && (
        <div>
          {profile.about ? (
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.about}</div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No about page yet.</p>
              {isOwner && (
                <Link href="/settings" className="text-sm text-black font-medium hover:underline mt-2 block">
                  Add one in settings →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}