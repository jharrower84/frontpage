// v8

// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractCDATA(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const cdataMatch = xml.match(re);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainRe = new RegExp(`<${tag}[^>]*>\\s*([^<]*?)\\s*<\\/${tag}>`, 'i');
  const plainMatch = xml.match(plainRe);
  return plainMatch ? plainMatch[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : '';
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/&[^;]+;/g, '');
}

function cleanHtml(raw: string): string {
  // Decode entities first — some feeds (e.g. PopSugar) double-encode their HTML
  const decoded = decodeEntities(raw);

  // Strip leading link/image blocks before first <p>
  const afterLeading = decoded.replace(/^[\s\S]*?(?=<p)/i, '');
  const source = afterLeading.length > 20 ? afterLeading : decoded;

  return decodeEntities(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\w+=["'][^"']*["']?/g, '')
      .replace(/https?:\/\/[^\s<>"]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FrontPageApp/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    const xml = await response.text();
    const articles: any[] = [];

    const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemPattern.exec(xml)) !== null) {
      const item = match[1];

      const title = extractCDATA(item, 'title');
      const rawDescription = extractCDATA(item, 'description') || extractCDATA(item, 'content:encoded') || '';

      const link = extractCDATA(item, 'link') ||
                   item.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/i)?.[1] ||
                   item.match(/<link[^>]*>\s*(https?:\/\/[^\s<]*)\s*<\/link>/i)?.[1] ||
                   extractCDATA(item, 'guid') || '';
      const pubDate = extractCDATA(item, 'pubDate') || extractCDATA(item, 'published');

      const rawImage = extractAttr(item, 'media:content', 'url') ||
                       extractAttr(item, 'media:thumbnail', 'url') ||
                       extractAttr(item, 'enclosure', 'url') ||
                       rawDescription.match(/<img[^>]*src="([^"]*)"[^>]*\/?>/i)?.[1] ||
                       null;

      let coverImage: string | null = null;
      if (rawImage) {
        const decodedImage = rawImage.replace(/&amp;/g, '&');
        if (decodedImage.startsWith('http://') || decodedImage.startsWith('https://')) {
          coverImage = decodedImage;
        } else if (decodedImage.startsWith('//')) {
          coverImage = `https:${decodedImage}`;
        } else if (decodedImage.startsWith('/')) {
          const baseUrl = new URL(url).origin;
          coverImage = `${baseUrl}${decodedImage}`;
        }
      }

      const cleaned = cleanHtml(rawDescription);
      const cleanDescription = cleaned.length > 160
        ? cleaned.slice(0, 160).split(' ').slice(0, -1).join(' ')
        : cleaned;

      const cleanTitle = decodeEntities(title.replace(/<[^>]*>/g, '')).trim();

      if (cleanTitle && link) {
        articles.push({
          title: cleanTitle,
          description: cleanDescription,
          cover_image: coverImage,
          url: link.trim(),
          published_at: pubDate,
        });
      }

      if (articles.length >= 10) break;
    }

    console.log(`Parsed ${articles.length} articles from ${url}`);

    return new Response(JSON.stringify({ articles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});