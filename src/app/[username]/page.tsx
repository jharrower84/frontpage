import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicWriterPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const reserved = ["signin", "signup", "explore", "dashboard", "notifications", "reading-list", "subscriptions", "settings", "profile", "p", "notes", "onboarding", "unsubscribe"];
  if (reserved.includes(username)) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

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
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 h-16 flex items-center justify-between sticky top-0 bg-white z-10">
        <Link href="/" className="text-xl font-bold text-black">FrontPage</Link>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm text-gray-500 hover:text-black transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

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
            <div className="w-20 h-20 rounded-full bg-pink-200 flex items-center justify-center text-3xl font-bold text-pink-700 mx-auto mb-4">
              {profile.full_name?.[0]?.toUpperCase()}
            </div>
          )}

          <h1 className="text-2xl font-bold text-black mb-1">{displayName}</h1>
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
          <Link href="/signup"
            className="inline-block px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#e8a0a0" }}>
            Subscribe
          </Link>
        </div>

        {/* Tabs — server rendered so we use anchor links */}
        <div className="flex border-b border-gray-100 mb-8">
          <a href={`/${username}`}
            className="pb-3 mr-6 text-sm font-semibold text-black border-b-2 border-black">
            Posts
          </a>
          <a href={`/${username}?tab=about`}
            className="pb-3 text-sm text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition-colors">
            About
          </a>
        </div>

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
        {unpinnedPosts.length === 0 && !pinnedPost ? (
          <p className="text-gray-400 text-center py-10">No published posts yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {unpinnedPosts.map((post) => (
              <article key={post.id} className="py-5 flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <Link href={`/p/${post.slug}`}>
                    <h2 className="font-bold text-black hover:underline leading-snug mb-1">{post.title}</h2>
                    {post.subtitle && <p className="text-sm text-gray-500 line-clamp-2">{post.subtitle}</p>}
                  </Link>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(post.published_at)}</p>
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
      </div>
    </div>
  );
}