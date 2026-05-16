import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface NewsItem {
  title: string;
  source: string;
  url: string;
  summary: string;
  published_at: string | null;
}

const defaultQueries = [
  "e-ticaret stok yönetimi",
  "KOBİ dijital ödeme maliyetleri",
  "tüketici trendleri pratik ürünler",
  "Türkiye e-ticaret trendleri",
  "popüler ürün trendleri",
];

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function getTagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function extractSource(title: string) {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : "Google News";
}

function normalizeGoogleNewsUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("url") ?? url;
  } catch {
    return url;
  }
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SarowthNewsAgent/1.0",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Google News RSS failed for ${query}: ${response.status}`);
  }

  const xml = await response.text();
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 6);

  return itemMatches.map((match) => {
    const raw = match[1];
    const title = getTagValue(raw, "title");
    const link = normalizeGoogleNewsUrl(getTagValue(raw, "link"));
    const description = getTagValue(raw, "description");
    const pubDate = getTagValue(raw, "pubDate");
    const date = pubDate ? new Date(pubDate) : null;

    return {
      title,
      source: extractSource(title),
      url: link,
      summary: description || `${query} aramasından yakalanan haber sinyali.`,
      published_at: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
    };
  }).filter((item) => item.title && item.url);
}

function isAuthorized(request: Request) {
  const secret = process.env.NEWS_AGENT_SECRET;
  if (!secret) return true;

  const requestUrl = new URL(request.url);
  const token = request.headers.get("x-agent-secret") ?? requestUrl.searchParams.get("secret");
  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Yetkisiz haber agent isteği." }, { status: 401 });
  }

  const queries = (process.env.NEWS_AGENT_QUERIES?.split(",").map((item) => item.trim()).filter(Boolean) ?? defaultQueries).slice(0, 8);
  const results = await Promise.allSettled(queries.map(fetchGoogleNews));
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const uniqueItems = [...new Map(items.map((item) => [item.url, item])).values()].slice(0, 30);

  if (uniqueItems.length === 0) {
    return NextResponse.json({ inserted: 0, items: [] });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("finance_news_items").upsert(uniqueItems, {
    onConflict: "url",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: uniqueItems.length, items: uniqueItems });
}

export async function POST(request: Request) {
  return GET(request);
}
