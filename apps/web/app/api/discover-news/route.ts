import { NextResponse } from 'next/server';

type DiscoverNewsItem = {
  title: string;
  link: string;
  source: string;
  summary: string;
  publishedAt: string;
  imageUrl?: string;
};

const feeds = [
  { source: 'ScienceDaily Tech', url: 'https://www.sciencedaily.com/rss/top/technology.xml' },
  { source: 'MIT AI', url: 'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml' },
  { source: 'MIT Electronics', url: 'https://news.mit.edu/topic/electronics-rss.xml' },
  { source: 'MIT Robotics', url: 'https://news.mit.edu/topic/robotics-rss.xml' },
  { source: 'NASA Technology', url: 'https://www.nasa.gov/technology/feed/' },
];

const technologyKeywords = [
  'ai',
  'artificial intelligence',
  'automation',
  'battery',
  'chip',
  'circuit',
  'computer',
  'computing',
  'device',
  'electronics',
  'engineering',
  'hardware',
  'innovation',
  'machine learning',
  'manufacturing',
  'microchip',
  'processor',
  'quantum',
  'robot',
  'semiconductor',
  'sensor',
  'software',
  'technology',
];

export async function GET() {
  const settledFeeds = await Promise.allSettled(
    feeds.map(async (feed) => {
      const response = await fetch(feed.url, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`${feed.source} feed failed: ${response.status}`);
      }

      return parseRssItems(await response.text(), feed.source);
    }),
  );

  const rawItems = settledFeeds
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .filter((item) => item.title && item.link)
    .filter(isTechnologyItem)
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, 12);

  const items = await enrichMissingImages(rawItems);

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      sources: feeds.map((feed) => ({ name: feed.source, url: feed.url })),
      items,
    },
    {
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=1800',
      },
    },
  );
}

async function enrichMissingImages(items: DiscoverNewsItem[]) {
  const settled = await Promise.allSettled(
    items.map(async (item) => {
      if (item.imageUrl) return item;

      try {
        const response = await fetch(item.link, {
          headers: { Accept: 'text/html,application/xhtml+xml' },
          cache: 'no-store',
        });
        if (!response.ok) return item;

        const html = await response.text();
        const imageUrl = extractPageImage(html);
        return imageUrl ? { ...item, imageUrl } : item;
      } catch {
        return item;
      }
    }),
  );

  return settled.map((result, index) => (result.status === 'fulfilled' ? result.value : items[index]));
}

function parseRssItems(xml: string, source: string): DiscoverNewsItem[] {
  return Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => {
    const item = match[0];
    const publishedAt = extractTag(item, 'pubDate') || extractTag(item, 'dc:date') || new Date().toISOString();

    return {
      title: cleanXmlText(extractTag(item, 'title')),
      link: cleanXmlText(extractTag(item, 'link')),
      source,
      summary: summarize(cleanXmlText(extractTag(item, 'description'))),
      publishedAt: normalizeDate(publishedAt),
      imageUrl: extractImageUrl(item),
    };
  });
}

function isTechnologyItem(item: DiscoverNewsItem) {
  const haystack = `${item.source} ${item.title} ${item.summary}`.toLowerCase();
  return technologyKeywords.some((keyword) => haystack.includes(keyword));
}

function extractTag(xml: string, tag: string) {
  const escapedTag = tag.replace(':', '\\:');
  const match = xml.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'));
  return match?.[1] ?? '';
}

function extractImageUrl(item: string) {
  const media = item.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (media?.[1]) return decodeXml(media[1]);

  const enclosure = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (enclosure?.[1]) return decodeXml(enclosure[1]);

  const descriptionImage = item.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (descriptionImage?.[1]) return decodeXml(descriptionImage[1]);

  return undefined;
}

function extractPageImage(html: string) {
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (ogImage?.[1]) return decodeXml(ogImage[1]);

  const twitterImage = html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (twitterImage?.[1]) return decodeXml(twitterImage[1]);

  const firstArticleImage = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (firstArticleImage?.[1]) return decodeXml(firstArticleImage[1]);

  return undefined;
}

function cleanXmlText(value: string) {
  return decodeXml(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function summarize(value: string) {
  if (value.length <= 156) return value;
  return `${value.slice(0, 153).trim()}...`;
}

function normalizeDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
