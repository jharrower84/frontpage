import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/settings/",
        "/messages/",
        "/notifications/",
        "/reading-list/",
        "/onboarding/",
        "/api/",
      ],
    },
    sitemap: "https://www.frontpageapp.com/sitemap.xml",
  };
}