import { supabase } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import SubscribeButton from "@/app/components/SubscribeButton";
import BlockButton from "@/app/components/BlockButton";
import ProfilePostList from "@/app/components/ProfilePostList";

function VerifiedBadge() {
  return (
    <svg
      width="20"
      height="20"
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

export default async function PublicWriterPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const reserved = ["signin", "signup", "explore", "dashboard", "notifications", "reading-list", "subscriptions", "settings", "profile", "p", "notes", "onboarding", "unsubscribe", "messages", "privacy", "data-deletion"];
  if (reserved.includes(username)) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const cookieStore = await cookies();
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await serverSupabase.auth.getUser();
  const isOwner = user?.id === profile.id;
  const canMessage = !isOwner && profile.privacy_allow_messages !== false;

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", profile.id)
    .eq("published", true)
    .order("published_at", { ascending: false });

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profile.id);

  const pinnedPost = profile.pinned_post_id
    ? posts?.find((p) => p.id === profile.pinned_post_id) || null
    : null;

  const unpinnedPosts = posts?.filter((p) => p.id !== pinnedPost?.id) || [];
  const displayName = profile.publication_name || profile.full_name;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {user && <div className="h-14" />}

      {/* Header image */}
      {profile.publication_header && (
        <div className="w-full h-48 overflow-hidden">
          <img src={profile.publication_header} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Profile header */}
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
            <h1 className="text-2xl font-bold text-black">{displayName}</h1>
            {profile.verified && <VerifiedBadge />}
          </div>

          {profile.publication_name && (
            <p className="text-sm text-gray-400 mb-1">by {profile.full_name}</p>
          )}
          <p className="text-sm text-gray-400 mb-3">@{profile.username}</p>
          {profile.bio && (
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto mb-4">{profile.bio}</p>
          )}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-6">
            <span><strong className="text-black">{posts?.length || 0}</strong> posts</span>
            <span><strong className="text-black">{subscriberCount || 0}</strong> subscribers</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!isOwner && <SubscribeButton authorId={profile.id} />}
            {canMessage && (
              <Link
                href={`/messages/${profile.username}`}
                className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </Link>
            )}
            {!isOwner && <BlockButton profileId={profile.id} />}
          </div>
        </div>

        <div className="mb-8" style={{ borderBottom: "1px solid var(--border)" }} />

        {/* Pinned post */}
        {pinnedPost && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">📌 Pinned</p>
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

        {/* Posts */}
        <ProfilePostList posts={unpinnedPosts} />
      </div>
    </div>
  );
}