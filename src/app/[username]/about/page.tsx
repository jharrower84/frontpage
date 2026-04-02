import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicWriterAboutPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: false })
    .eq("author_id", profile.id)
    .eq("published", true);

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profile.id);

  const displayName = profile.publication_name || profile.full_name;

  return (
    <div className="min-h-screen bg-white">

      <nav className="border-b border-gray-100 px-8 h-16 flex items-center justify-between sticky top-0 bg-white z-10">
        <Link href="/" className="text-xl font-bold text-black">FrontPage</Link>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm text-gray-500 hover:text-black transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {profile.publication_header && (
        <div className="w-full h-48 overflow-hidden">
          <img src={profile.publication_header} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-12">

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
            <span><strong className="text-black">{posts?.length || 0}</strong> posts</span>
            <span><strong className="text-black">{subscriberCount || 0}</strong> subscribers</span>
          </div>
          <Link href="/signup"
            className="inline-block px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2979FF" }}>
            Subscribe
          </Link>
        </div>

        <div className="flex border-b border-gray-100 mb-8">
          <a href={`/${username}`}
            className="pb-3 mr-6 text-sm text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition-colors">
            Posts
          </a>
          <a href={`/${username}/about`}
            className="pb-3 text-sm font-semibold text-black border-b-2 border-black">
            About
          </a>
        </div>

        {profile.about ? (
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.about}</div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">No about page yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}