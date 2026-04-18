import { supabase } from "@/lib/supabase";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.frontpageapp.com";

  // Fetch all published posts
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  // Fetch all public profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .not("username", "is", null);

  const postUrls: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/p/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const profileUrls: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
    url: `${baseUrl}/${profile.username}`,
    lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...postUrls,
    ...profileUrls,
  ];
}