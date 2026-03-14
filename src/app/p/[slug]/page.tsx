import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import Comments from "@/app/components/Comments";
import LikeButton from "@/app/components/LikeButton";
import BookmarkButton from "@/app/components/BookmarkButton";
import SubscribeButton from "@/app/components/SubscribeButton";
import ShareButton from "@/app/components/ShareButton";
import RelatedArticles from "@/app/components/RelatedArticles";
import ViewTracker from "@/app/components/ViewTracker";
import RestackButton from "@/app/components/RestackButton";
import ReportButton from "@/app/components/ReportButton";

function getReadTime(html: string): string {
  const text = html?.replace(/<[^>]*>/g, "") || "";
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("posts")
    .select("title, subtitle, cover_image, profiles!posts_author_id_fkey(full_name)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "FrontPage" };

  const description = post.subtitle || "Read on FrontPage";
  const author = (post.profiles as any)?.full_name;

  return {
    title: `${post.title} — FrontPage`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      authors: author ? [author] : undefined,
      images: post.cover_image ? [{ url: post.cover_image, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(id, full_name, username, avatar_url, bio)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("author_id", post.author_id);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

  return (
    <div className="min-h-screen bg-white">
      <ViewTracker postId={post.id} />

      {post.cover_image && (
        <div className="w-full h-80">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <article className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-4 leading-tight">{post.title}</h1>
          {post.subtitle && <p className="text-xl text-gray-500 mb-6">{post.subtitle}</p>}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-sm font-semibold text-pink-700">
                  {post.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
              <div>
                <Link href={`/profile/${post.profiles?.username}`} className="text-sm font-medium text-black hover:underline">
                  {post.profiles?.full_name}
                </Link>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">{formatDate(post.published_at)}</p>
                  <span className="text-gray-300 text-xs">·</span>
                  <p className="text-xs text-gray-400">{getReadTime(post.content)}</p>
                  {post.view_count > 0 && (
                    <>
                      <span className="text-gray-300 text-xs">·</span>
                      <p className="text-xs text-gray-400">{formatViews(post.view_count)} views</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LikeButton postId={post.id} authorId={post.author_id} />
              <RestackButton postId={post.id} postTitle={post.title} />
              <BookmarkButton postId={post.id} />
              <ShareButton slug={post.slug} title={post.title} />
              <ReportButton postId={post.id} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mb-8" />

        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-16 p-6 rounded-2xl border border-gray-100 bg-gray-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center text-lg font-bold text-pink-700 shrink-0">
                  {post.profiles?.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <Link href={`/profile/${post.profiles?.username}`} className="font-semibold text-black hover:underline">
                  {post.profiles?.full_name}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{subscriberCount} subscribers</p>
                {post.profiles?.bio && <p className="text-sm text-gray-600 mt-2">{post.profiles.bio}</p>}
              </div>
            </div>
            <SubscribeButton authorId={post.author_id} />
          </div>
        </div>

        <RelatedArticles currentPostId={post.id} authorId={post.author_id} tags={post.tags || []} />
        <Comments postId={post.id} authorId={post.author_id} postSlug={post.slug} postTitle={post.title} />
      </article>
    </div>
  );
}