import type { Metadata } from "next";
import "./globals.css";
import SidebarWrapper from "./components/SidebarWrapper";

export const metadata: Metadata = {
  title: {
    default: "FrontPage — Fashion Writing for the Modern Reader",
    template: "%s — FrontPage",
  },
  description: "Discover independent fashion writing. Trends, runway, sustainability, street style and more from the best fashion writers.",
  metadataBase: new URL("https://www.frontpageapp.com"),
  alternates: {
    canonical: "/",
  },
  keywords: ["fashion", "fashion writing", "style", "runway", "streetwear", "fashion news"],
  authors: [{ name: "FrontPage", url: "https://www.frontpageapp.com" }],
  creator: "FrontPage",
  publisher: "FrontPage",
  openGraph: {
    siteName: "FrontPage",
    type: "website",
    url: "https://www.frontpageapp.com",
    title: "FrontPage — Fashion Writing for the Modern Reader",
    description: "Discover independent fashion writing. Trends, runway, sustainability, street style and more.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "FrontPage" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FrontPage — Fashion Writing for the Modern Reader",
    description: "Discover independent fashion writing. Trends, runway, sustainability, street style and more.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
        }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}