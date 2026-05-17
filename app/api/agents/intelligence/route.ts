import { NextResponse } from "next/server";
import { finishAgentRun, startAgentRun } from "@/lib/agents/run-log";
import { isAgentAuthorized } from "@/lib/agents/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface WatchTopic {
  id: string;
  user_id: string;
  topic: string;
  intent: "product_watch" | "news_watch" | "investment_watch";
}

interface ShoppingResult {
  title?: string;
  link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  rating?: number;
}

interface NewsResult {
  title?: string;
  link?: string;
  source?: string | { name?: string };
  snippet?: string;
  date?: string;
}

interface SerpShoppingResponse {
  shopping_results?: ShoppingResult[];
  error?: string;
}

interface SerpNewsResponse {
  news_results?: NewsResult[];
  error?: string;
}

const defaultTopics: WatchTopic[] = [
  { id: "default-1", user_id: "system", topic: "e-ticaret pratik ürünler", intent: "product_watch" },
  { id: "default-2", user_id: "system", topic: "düşük maliyetli trend ürünler", intent: "product_watch" },
  { id: "default-3", user_id: "system", topic: "KOBİ ödeme maliyetleri", intent: "news_watch" },
];

function getSourceName(source: NewsResult["source"]) {
  if (!source) return "SerpAPI News Agent";
  if (typeof source === "string") return source;
  return source.name ?? "SerpAPI News Agent";
}

function getTopicScore(index: number, result: ShoppingResult) {
  const rankScore = Math.max(55, 92 - index * 7);
  const ratingBonus = result.rating ? Math.min(6, Math.round(result.rating)) : 0;
  return Math.min(100, rankScore + ratingBonus);
}

async function fetchSerpApi<T>(params: Record<string, string>) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) throw new Error("SERPAPI_API_KEY eksik.");

  const url = new URL("https://serpapi.com/search.json");
  Object.entries({ ...params, api_key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, { next: { revalidate: 3600 } });
  const data = await response.json() as T & { error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error ?? `SerpAPI isteği başarısız: ${response.status}`);
  }

  return data;
}

async function syncTopic(topic: WatchTopic) {
  const supabase = createSupabaseAdminClient();
  const shoppingQuery = `${topic.topic} tedarik satın al`;
  const newsQuery = `${topic.topic} haber trend e-ticaret`;

  const [shoppingData, newsData] = await Promise.all([
    fetchSerpApi<SerpShoppingResponse>({ engine: "google_shopping", q: shoppingQuery, gl: "tr", hl: "tr" }),
    fetchSerpApi<SerpNewsResponse>({ engine: "google_news", q: newsQuery, gl: "tr", hl: "tr" }),
  ]);

  const shoppingResults = (shoppingData.shopping_results ?? []).filter((item) => item.title && item.link).slice(0, 6);
  const newsResults = (newsData.news_results ?? []).filter((item) => item.title && item.link).slice(0, 4);

  if (shoppingResults.length > 0) {
    const supplierRows = shoppingResults.map((item, index) => ({
      product_name: topic.topic,
      title: item.title as string,
      url: item.link as string,
      source: item.source ?? "Google Shopping",
      price_text: item.price ?? (item.extracted_price ? `₺${item.extracted_price}` : null),
      score: getTopicScore(index, item),
    }));

    const { error: supplierError } = await supabase.from("product_supplier_links").upsert(supplierRows, { onConflict: "url" });
    if (supplierError) throw supplierError;

    const best = supplierRows[0];
    const { error: signalError } = await supabase.from("market_product_signals").upsert({
      product_name: topic.topic,
      signal: `${shoppingResults.length} tedarik sonucu bulundu. En güçlü kaynak: ${best.source}${best.price_text ? `, fiyat: ${best.price_text}` : ""}.`,
      score: best.score,
      source_url: best.url,
    }, { onConflict: "product_name" });
    if (signalError) throw signalError;
  }

  if (newsResults.length > 0) {
    const newsRows = newsResults.map((item) => ({
      title: item.title as string,
      source: getSourceName(item.source),
      url: item.link as string,
      summary: item.snippet ?? `${topic.topic} için günlük haber sinyali.`,
      published_at: item.date ? new Date(item.date).toISOString() : null,
    }));

    const { error: newsError } = await supabase.from("finance_news_items").upsert(newsRows, { onConflict: "url" });
    if (newsError) throw newsError;
  }

  if (!topic.id.startsWith("default-")) {
    await supabase.from("agent_watch_topics").update({ last_checked_at: new Date().toISOString() }).eq("id", topic.id);
  }

  return {
    topic: topic.topic,
    suppliers: shoppingResults.length,
    news: newsResults.length,
  };
}

async function handle(request: Request) {
  if (!isAgentAuthorized(request, "INTELLIGENCE_AGENT_SECRET")) {
    return NextResponse.json({ error: "Yetkisiz intelligence agent isteği." }, { status: 401 });
  }

  const runId = await startAgentRun("intelligence", "Kullanıcı takip konuları için SerpAPI haber, trend ve tedarik senkronizasyonu.");

  try {
    const supabase = createSupabaseAdminClient();
    const { data: topics, error } = await supabase.from("agent_watch_topics").select("id, user_id, topic, intent").eq("status", "active").order("last_checked_at", { ascending: true, nullsFirst: true }).limit(10);

    if (error) throw error;

    const activeTopics = ((topics ?? []) as WatchTopic[]).length > 0 ? (topics as WatchTopic[]) : defaultTopics;
    const results = [];

    for (const topic of activeTopics) {
      results.push(await syncTopic(topic));
    }

    await finishAgentRun(runId, "success", `${results.length} konu işlendi.`);
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intelligence agent çalıştırılamadı.";
    console.error("INTELLIGENCE_AGENT_ERROR:", error);
    await finishAgentRun(runId, "error", undefined, message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
