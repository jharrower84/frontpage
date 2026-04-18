import { supabase } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import Comments from "@/app/components/Comments";
import LikeButton from "@/app/components/LikeButton";
import BookmarkButton from "@/app/components/BookmarkButton";
import SubscribeButton from "@/app/components/SubscribeButton";
import ShareButton from "@/app/components/ShareButton";
import RelatedArticles from "@/app/components/RelatedArticles";
import ViewTracker from "@/app/components/ViewTracker";
import ReportButton from "@/app/components/ReportButton";

const BASE_URL = "https://www.frontpageapp.com";

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

function VerifiedBadge() {
  return (
    <svg
      width="16"
      height="16"
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("posts")
    .select("title, subtitle, cover_image, published_at, tags, profiles!posts_author_id_fkey(full_name, username)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "FrontPage" };

  const description = post.subtitle || `Read ${post.title} on FrontPage`;
  const author = (post.profiles as any)?.full_name;
  const authorUsername = (post.profiles as any)?.username;
  const url = `${BASE_URL}/p/${slug}`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: url,
    },
    authors: author ? [{ name: author, url: `${BASE_URL}/${authorUsername}` }] : undefined,
    keywords: post.tags || [],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      siteName: "FrontPage",
      authors: author ? [author] : undefined,
      publishedTime: post.published_at,
      tags: post.tags || [],
      images: post.cover_image
        ? [{ url: post.cover_image, width: 1200, height: 630, alt: post.title }]
        : [{ url: `${BASE_URL}/og-default.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : [`${BASE_URL}/og-default.png`],
    },
  };
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

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

  let post: any = null;
  if (isPreview && user) {
    const { data } = await serverSupabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(id, full_name, username, avatar_url, bio, verified)")
      .eq("slug", slug)
      .eq("author_id", user.id)
      .single();
    post = data;
  }

  if (!post) {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(id, full_name, username, avatar_url, bio, verified)")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    post = data;
  }

  if (!post) notFound();

  let canViewSubscriberContent = false;
  if (post.subscriber_only) {
    if (user) {
      if (user.id === post.author_id) {
        canViewSubscriberContent = true;
      } else {
        const { data: sub } = await serverSupabase
          .from("subscriptions")
          .select("id")
          .eq("subscriber_id", user.id)
          .eq("author_id", post.author_id)
          .single();
        canViewSubscriberContent = !!sub;
      }
    }
  } else {
    canViewSubscriberContent = true;
  }

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("author_id", post.author_id);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.subtitle || "",
            image: post.cover_image || undefined,
            datePublished: post.published_at,
            dateModified: post.edited_at || post.published_at,
            author: {
              "@type": "Person",
              name: post.profiles?.full_name,
              url: `${BASE_URL}/${post.profiles?.username}`,
            },
            publisher: {
              "@type": "Organization",
              name: "FrontPage",
              url: BASE_URL,
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${BASE_URL}/p/${post.slug}`,
            },
          }),
        }}
      />

      {!isPreview && <ViewTracker postId={post.id} />}

      {/* Preview banner */}
      {isPreview && (
        <div
          className="w-full py-2.5 text-center text-sm font-medium"
          style={{ background: "#2979FF", color: "white" }}
        >
          Preview mode — this article is not yet published.{" "}
          <Link
            href={`/dashboard/edit/${post.id}`}
            className="underline hover:opacity-80"
          >
            Back to editor
          </Link>
        </div>
      )}

      {post.cover_image && (
        <div className="w-full h-96">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <article className="max-w-2xl mx-auto px-6 pt-12 pb-32 lg:pb-24">

        {/* Title block */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-xl leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              {post.subtitle}
            </p>
          )}
        </div>

        {/* Author block */}
        <div className="flex items-center gap-3 mb-4">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.full_name}
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500 shrink-0">
              {post.profiles?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${post.profiles?.username}`}
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {post.profiles?.full_name}
              </Link>
              {post.profiles?.verified && <VerifiedBadge />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                {post.published_at ? formatDate(post.published_at) : "Draft"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                {getReadTime(post.content)}
              </span>
              {post.view_count > 0 && (
                <>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {formatViews(post.view_count)} views
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop action bar */}
        {!isPreview && (
          <div
            className="hidden lg:flex items-center gap-2 py-3 mb-8"
            style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
          >
            <LikeButton postId={post.id} authorId={post.author_id} />
            <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />
            <BookmarkButton postId={post.id} />
            <ShareButton slug={post.slug} title={post.title} />
            <div className="ml-auto">
              <ReportButton postId={post.id} />
            </div>
          </div>
        )}

        {/* Article content or lock gate */}
        {canViewSubscriberContent ? (
          <>
            <div
              className="prose prose-lg max-w-none leading-relaxed"
              style={{ color: "var(--text-primary)" }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {post.edited_at && (
              <p className="text-xs italic mt-6" style={{ color: "var(--text-faint)" }}>
                Edited {new Date(post.edited_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })} by {post.profiles?.full_name}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="relative mb-0 overflow-hidden" style={{ maxHeight: "260px" }}>
              <div
                className="prose prose-lg max-w-none leading-relaxed pointer-events-none select-none"
                style={{ color: "var(--text-primary)" }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 0%, var(--bg) 75%)" }}
              />
            </div>
            <div
              className="rounded-2xl p-8 text-center"
              style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#eef3ff" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth={2} className="w-6 h-6">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                This article is for subscribers only
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
                Subscribe to {post.profiles?.full_name} to read this article and get full access to their writing.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <SubscribeButton authorId={post.author_id} />
                {!user && (
                  <Link href="/signin" className="text-sm font-medium hover:underline" style={{ color: "var(--text-tertiary)" }}>
                    Already a subscriber? Sign in
                  </Link>
                )}
              </div>
            </div>
          </>
        )}

        {/* Comments and related */}
        {canViewSubscriberContent && !isPreview && (
          <>
            <div
              className="mt-16 p-6 rounded-2xl"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt={post.profiles.full_name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
                      {post.profiles?.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/${post.profiles?.username}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.profiles?.full_name}
                      </Link>
                      {post.profiles?.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {subscriberCount} subscribers
                    </p>
                    {post.profiles?.bio && (
                      <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                        {post.profiles.bio}
                      </p>
                    )}
                  </div>
                </div>
                <SubscribeButton authorId={post.author_id} />
              </div>
            </div>

            <RelatedArticles currentPostId={post.id} authorId={post.author_id} tags={post.tags || []} />
            <Comments postId={post.id} authorId={post.author_id} postSlug={post.slug} postTitle={post.title} />
          </>
        )}
      </article>

      {/* Mobile floating action bar */}
      {!isPreview && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 px-6 pointer-events-none">
          <div
            className="flex items-center gap-6 px-8 py-3 rounded-full pointer-events-auto"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <LikeButton postId={post.id} authorId={post.author_id} compact />
            <BookmarkButton postId={post.id} compact />
            <ShareButton slug={post.slug} title={post.title} compact />
            <ReportButton postId={post.id} compact />
          </div>
        </div>
      )}
    </div>
  );
}