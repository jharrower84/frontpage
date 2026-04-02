"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import SubscribeButton from "@/app/components/SubscribeButton";
import BlockButton from "@/app/components/BlockButton";
import ProfilePostList from "@/app/components/ProfilePostList";

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
  verified: boolean;
  privacy_allow_messages: boolean | null;
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

function VerifiedBadge() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0"
      aria-label="Verified writer"
    >
      <circle cx="12" cy="12" r="12" fill="#6ab0e8" />
      <path
        d="M7 12.5l3.5 3.5 6.5-7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPost, setPinnedPost] = useState<Post | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

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
  const canMessage = !isOwner && profile?.privacy_allow_messages !== false;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading...</p>
    </div>
  );
  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ color: "var(--text-tertiary)" }}>Profile not found.</p>
    </div>
  );

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
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-500 mx-auto mb-4">
            {profile.full_name?.[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{displayName}</h1>
          {profile.verified && <VerifiedBadge />}
        </div>
        {profile.publication_name && (
          <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>by {profile.full_name}</p>
        )}
        <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm leading-relaxed max-w-md mx-auto mb-4" style={{ color: "var(--text-secondary)" }}>
            {profile.bio}
          </p>
        )}
        <div className="flex items-center justify-center gap-6 text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
          <span><strong style={{ color: "var(--text-primary)" }}>{posts.length}</strong> posts</span>
          <span><strong style={{ color: "var(--text-primary)" }}>{subscriberCount}</strong> subscribers</span>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {!isOwner && <SubscribeButton authorId={profile.id} />}
          {canMessage && (
            <Link
              href={`/messages/${profile.username}`}
              className="flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-medium transition-colors hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </Link>
          )}
          {!isOwner && <BlockButton profileId={profile.id} />}
          {isOwner && (
            <>
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 px-5 py-2 rounded-full border text-sm transition-colors hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: "#2979FF", color: "white" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mb-8" style={{ borderBottom: "1px solid var(--border)" }} />

      {/* Pinned post */}
      {pinnedPost && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>📌 Pinned</span>
            {isOwner && (
              <button onClick={handleUnpin} className="text-xs ml-auto transition-colors hover:opacity-70" style={{ color: "var(--text-faint)" }}>Unpin</button>
            )}
          </div>
          <Link href={`/p/${pinnedPost.slug}`} className="flex gap-4 items-start group p-4 rounded-2xl transition-colors" style={{ border: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold group-hover:underline leading-snug mb-1" style={{ color: "var(--text-primary)" }}>{pinnedPost.title}</h2>
              {pinnedPost.subtitle && <p className="text-sm line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{pinnedPost.subtitle}</p>}
              <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>{formatDate(pinnedPost.published_at)}</p>
            </div>
            {pinnedPost.cover_image && (
              <img src={pinnedPost.cover_image} alt={pinnedPost.title} className="w-20 h-14 object-cover rounded-lg shrink-0" />
            )}
          </Link>
        </div>
      )}

     {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-center py-10 text-sm" style={{ color: "var(--text-tertiary)" }}>No published posts yet.</p>
      ) : (
        <ProfilePostList posts={unpinnedPosts} />
      )}
    </div>
  );
}