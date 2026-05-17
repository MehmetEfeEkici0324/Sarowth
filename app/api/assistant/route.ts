import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface AssistantRequest {
  message?: string;
  userMessage?: string;
}

interface BudgetEntry {
  label: string;
  category: string;
  amount: number | string;
  entry_type: "income" | "expense" | "saving";
  occurred_on?: string;
}

interface MarketSignal {
  product_name: string;
  signal: string;
  score: number;
  source_url?: string | null;
}

interface NewsItem {
  title: string;
  source: string;
  url: string;
  topic?: string | null;
  summary?: string | null;
}

interface SupplierLink {
  product_name: string;
  title: string;
  url: string;
  source: string;
  price_text?: string | null;
  score: number;
}

interface SerpShoppingResult {
  title?: string;
  link?: string;
  product_link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  rating?: number;
}

interface SerpNewsResult {
  title?: string;
  link?: string;
  source?: string | { name?: string };
  snippet?: string;
}

interface SerpShoppingResponse {
  shopping_results?: SerpShoppingResult[];
  error?: string;
}

interface SerpNewsResponse {
  news_results?: SerpNewsResult[];
  error?: string;
}

const searchStopWords = new Set([
  "ve", "veya", "ile", "icin", "için", "bir", "bu", "su", "şu", "en", "iyi", "ucuz", "fiyat", "fiyatı", "fiyati", "satın", "satin", "al", "alma", "tedarik", "ürün", "urun", "haber", "trend", "son", "güncel", "guncel",
]);

const genericProductWords = new Set(["scooter", "elektrikli", "electric", "ürün", "urun", "model", "modelleri", "fiyat", "fiyatı", "fiyati"]);

const queryCorrections: Record<string, string> = {
  kaboo: "kaabo",
};

const countrySearchSettings: Record<string, { gl: string; hl: string; currency: string; buyTerms: string; location?: string }> = {
  TR: { gl: "tr", hl: "tr", currency: "TRY", buyTerms: "satın al fiyat", location: "Turkey" },
  US: { gl: "us", hl: "en", currency: "USD", buyTerms: "buy price", location: "United States" },
  GB: { gl: "uk", hl: "en", currency: "GBP", buyTerms: "buy price", location: "United Kingdom" },
  DE: { gl: "de", hl: "de", currency: "EUR", buyTerms: "kaufen preis", location: "Germany" },
  FR: { gl: "fr", hl: "fr", currency: "EUR", buyTerms: "acheter prix", location: "France" },
  NL: { gl: "nl", hl: "nl", currency: "EUR", buyTerms: "kopen prijs", location: "Netherlands" },
  ES: { gl: "es", hl: "es", currency: "EUR", buyTerms: "comprar precio", location: "Spain" },
  IT: { gl: "it", hl: "it", currency: "EUR", buyTerms: "comprare prezzo", location: "Italy" },
  CA: { gl: "ca", hl: "en", currency: "CAD", buyTerms: "buy price", location: "Canada" },
  AU: { gl: "au", hl: "en", currency: "AUD", buyTerms: "buy price", location: "Australia" },
};

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const commandHelp = `Ne yapmak istediğini kısa yazabilirsin.

Alışveriş kararı: al tişört 6000
Haber analizi: haber e-ticaret
Ürün takibi: takip ürün adı
Yatırım alanı: yatırım
Bütçe özeti: özet

Slash kullanmak zorunda değilsin. İstersen /al, /haber, /takip, /yatirim, /ozet şeklinde de yazabilirsin.`;

function parseAmount(message: string) {
  const normalized = message.replace(/\./g, "").replace(/,/g, ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parseCommand(message: string) {
  const trimmed = message.trim();
  const lower = trimmed.toLocaleLowerCase("tr-TR");
  const slashCommand = trimmed.match(/^\/(\S+)/)?.[1]?.toLocaleLowerCase("tr-TR");

  if (slashCommand) {
    return { command: slashCommand, text: trimmed.replace(/^\/\S+\s*/, "").trim() };
  }

  const aliases = [
    { command: "al", prefixes: ["al ", "almalı mıyım ", "alayım mı ", "satın al ", "satın alayım mı "] },
    { command: "haber", prefixes: ["haber ", "haberleri ", "gündem ", "piyasa haberi "] },
    { command: "takip", prefixes: ["takip ", "izle ", "ürün takip ", "tedarik "] },
    { command: "yatirim", prefixes: ["yatırım", "yatirim", "fırsat", "firsat"] },
    { command: "ozet", prefixes: ["özet", "ozet", "bütçe", "butce"] },
  ];

  for (const alias of aliases) {
    const prefix = alias.prefixes.find((item) => lower === item.trim() || lower.startsWith(item));
    if (prefix) {
      return { command: alias.command, text: trimmed.slice(prefix.length).trim() };
    }
  }

  if (parseAmount(trimmed)) {
    return { command: "al", text: trimmed };
  }

  const command = "yardim";
  const text = trimmed;
  return { command, text };
}

function buildBudgetSummary(entries: BudgetEntry[]) {
  const income = entries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = entries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const savings = entries.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const available = Math.max(0, income - expenses - savings);
  const expenseByCategory = entries.filter((entry) => entry.entry_type === "expense").reduce<Record<string, number>>((groups, entry) => {
    groups[entry.category] = (groups[entry.category] ?? 0) + Number(entry.amount);
    return groups;
  }, {});
  const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0] ?? null;

  return { income, expenses, savings, available, expenseByCategory, topCategory };
}

function getPurchaseDecision(amount: number, summary: ReturnType<typeof buildBudgetSummary>) {
  if (summary.income === 0) {
    return "Karar: BEKLE\n\nHenüz gelir kaydı yok. Gelir ve giderlerini panelden girdikten sonra bu alışveriş için net karar verebilirim.";
  }

  const availableAfterPurchase = summary.available - amount;
  const expenseRatio = summary.income > 0 ? summary.expenses / summary.income : 1;
  const topCategoryText = summary.topCategory ? `Bu ay en yüksek harcama kategorin ${summary.topCategory[0]}: ₺${summary.topCategory[1].toLocaleString("tr-TR")}.` : "Henüz baskın bir harcama kategorisi görünmüyor.";

  if (amount > summary.available || availableAfterPurchase < summary.income * 0.08 || expenseRatio > 0.8) {
    return `Karar: ALMA\n\nBu alışveriş bütçeni güvenli alanın dışına çıkarıyor. ${topCategoryText} Tasarruf hedefini korumak için bu ay beklemen daha doğru.`;
  }

  if (amount > summary.available * 0.45 || expenseRatio > 0.65) {
    return `Karar: BEKLE\n\nAlabilecek gibi görünüyorsun ama bu tutar serbest bütçenin büyük kısmını kullanır. ${topCategoryText} 7 gün bekleyip daha ucuz alternatif veya indirim kontrolü yap.`;
  }

  return `Karar: ALINABİLİR\n\nGüvenli bölgedesin. Bu alışveriş sonrası yaklaşık ₺${availableAfterPurchase.toLocaleString("tr-TR")} serbest alan kalır. Yine de aşırıya kaçma ve aynı kategoriden tekrar harcama yapmadan önce bütçeni kontrol et.`;
}

function filterNews(query: string, news: NewsItem[]) {
  const normalizedQuery = normalizeQuery(query);
  const filtered = news
    .filter((item) => isRelevantSearchResult(normalizedQuery, `${item.title} ${item.summary ?? ""}`, "news"))
    .sort((a, b) => scoreSearchMatch(normalizedQuery, `${b.title} ${b.summary ?? ""}`) - scoreSearchMatch(normalizedQuery, `${a.title} ${a.summary ?? ""}`))
    .slice(0, 4);
  return filtered.length > 0 ? filtered : news.slice(0, 3);
}

function buildNewsReply(query: string, news: NewsItem[]) {
  const items = filterNews(query, news);
  if (items.length === 0) {
    return "Bu konuda canlı haber sonucu bulunamadı. Farklı bir konu deneyebilirsin: haber e-ticaret, haber ödeme sistemleri, haber tekstil.";
  }

  return `Haber Bundle: ${query || "genel piyasa"}\n\n${items.map((item, index) => `${index + 1}. ${item.title}\nKaynak: ${item.source}`).join("\n\n")}\n\nLinkleri sağdaki haber kartlarından açabilirsin. Bu sinyaller karar desteği içindir; tek başına yatırım veya stok alma kararı değildir.`;
}

function buildTrackingReply(query: string, signals: MarketSignal[], suppliers: SupplierLink[]) {
  const normalizedQuery = normalizeQuery(query);
  const matched = signals
    .filter((item) => isRelevantSearchResult(normalizedQuery, `${item.product_name} ${item.signal}`, "product"))
    .sort((a, b) => scoreSearchMatch(normalizedQuery, `${b.product_name} ${b.signal}`) - scoreSearchMatch(normalizedQuery, `${a.product_name} ${a.signal}`))
    .slice(0, 3);
  const supplierItems = suppliers
    .filter((item) => isRelevantSearchResult(normalizedQuery, `${item.product_name} ${item.title} ${item.source}`, "product"))
    .sort((a, b) => scoreSearchMatch(normalizedQuery, `${b.product_name} ${b.title} ${b.source}`) - scoreSearchMatch(normalizedQuery, `${a.product_name} ${a.title} ${a.source}`))
    .slice(0, 5);

  if (matched.length === 0 && supplierItems.length === 0) {
    return `Takip başlatıldı: ${query}\n\nBu ürün için yüksek eşleşmeli canlı sonuç bulamadım. Marka/modeli koruyarak tekrar deneyebilirsin; örnek: takip Kaabo Wolf Warrior X elektrikli scooter. Alakasız scooter sonuçlarını özellikle filtreledim.`;
  }

  const signalText = matched.length > 0 ? matched.map((item) => `- ${item.product_name}: ${item.signal} (${item.score}/100)`).join("\n") : "- Trend skoru için yeterli sinyal yok; tedarik kartları üzerinden kontrol et.";
  const supplierText = supplierItems.length > 0 ? `\n\nTedarik kartları hazır:\n${supplierItems.map((item, index) => `${index + 1}. ${item.title} (${item.source}${item.price_text ? `, ${item.price_text}` : ""})`).join("\n")}\n\nLinklere aşağıdaki tedarik kartlarından tıklayabilirsin.` : "\n\nTedarik linkleri: Bu ürün için canlı tedarik sonucu bulunamadı.";

  return `Ürün paketi hazır: ${query}\n\nTrend sinyali:\n${signalText}${supplierText}\n\nAjan notu: Ürün ve fiyat sonuçları konumuna göre bölgesel mağaza/para birimiyle, haber sinyalleri ise global kaynaklardan taranır. Sonuçlar marka/model kelime eşleşmesine göre filtrelendi. Stok almadan önce fiyat, kargo, iade ve düşük bütçeli talep testini kontrol et.`;
}

function buildInvestmentReply(summary: ReturnType<typeof buildBudgetSummary>) {
  if (summary.available <= 0) {
    return "Yatırım fırsatı alanı: YOK\n\nBu ay serbest bütçe görünmüyor. Önce giderleri azaltıp acil nakit alanı oluştur. Bu yatırım tavsiyesi değildir.";
  }

  return `Bakılabilecek alanlar: ₺${summary.available.toLocaleString("tr-TR")} serbest bütçe\n\n- %50 acil nakit tamponu\n- %30 düşük bütçeli ürün/reklam testi\n- %20 eğitim, araç veya araştırma bütçesi\n\nHisse, fon, coin veya benzeri alanlar için bu yatırım tavsiyesi değildir. Sadece bakılabilecek risk alanlarını ayırıyorum.`;
}

function buildDashboardData(summary: ReturnType<typeof buildBudgetSummary>, signals: MarketSignal[], news: NewsItem[], suppliers: SupplierLink[], activeTopic?: string, activeCommand?: string) {
  return {
    banka: {
      gelir: summary.income,
      gider: summary.expenses,
      tasarruf: summary.savings,
      serbestButce: summary.available,
      enYuksekKategori: summary.topCategory?.[0] ?? "Yok",
    },
    activeTopic: activeTopic ?? null,
    activeCommand: activeCommand ?? null,
    trendUrunler: signals.slice(0, 3).map((item) => {
      let source = "Piyasa Agent";
      if (item.source_url) {
        try {
          source = new URL(item.source_url).hostname.replace("www.", "");
        } catch {
          source = "Piyasa Agent";
        }
      }
      return {
        title: item.product_name,
        description: item.signal,
        score: `${item.score}/100`,
        source,
      };
    }),
    finansHaberleri: news.slice(0, 3).map((item) => ({
      title: item.title,
      source: item.source,
      url: item.url,
      time: "Günlük sinyal",
      bundleSummary: item.summary ? `AJAN NOTU: ${item.summary}` : "AJAN NOTU: Günlük haber sinyali izleniyor; ürün, bütçe veya yatırım kararı için tek başına yeterli değildir.",
    })),
    tedarikLinkleri: suppliers.slice(0, 8).map((item) => ({
      productName: item.product_name,
      title: item.title,
      url: item.url,
      source: item.source,
      price: item.price_text,
      score: item.score,
    })),
  };
}

async function rememberWatchTopic(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string, topic: string, intent: "product_watch" | "news_watch" | "investment_watch") {
  const normalizedTopic = topic.trim();
  if (!normalizedTopic) return;

  const { data: existing } = await supabase.from("agent_watch_topics").select("id").eq("user_id", userId).eq("topic", normalizedTopic).eq("intent", intent).maybeSingle();
  if (existing) return;

  await supabase.from("agent_watch_topics").insert({
    user_id: userId,
    topic: normalizedTopic,
    intent,
  });
}

function getSerpNewsSource(source: SerpNewsResult["source"]) {
  if (!source) return "Canlı Haber Agent";
  if (typeof source === "string") return source;
  return source.name ?? "Canlı Haber Agent";
}

function getLiveScore(index: number, item: SerpShoppingResult) {
  const base = Math.max(58, 92 - index * 8);
  const ratingBonus = item.rating ? Math.min(5, Math.round(item.rating)) : 0;
  return Math.min(100, base + ratingBonus);
}

function getSearchRegion(request: Request) {
  const countryHeader = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "";
  const languageHeader = request.headers.get("accept-language") ?? "";
  const languageCountry = languageHeader.match(/-([A-Z]{2})\b/i)?.[1]?.toUpperCase();
  const country = (countryHeader || languageCountry || "TR").toUpperCase();

  return countrySearchSettings[country] ?? countrySearchSettings.TR;
}

function formatRegionalPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString("tr-TR")} ${currency}`;
  }
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ı]/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ğüşöçıİ\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQuery(query: string) {
  const normalized = normalizeSearchText(query);
  return normalized.split(" ").map((token) => queryCorrections[token] ?? token).join(" ").trim();
}

function getSearchTokens(query: string) {
  return normalizeQuery(query)
    .split(" ")
    .filter((token) => token && !searchStopWords.has(token) && (token.length > 1 || token === "x"));
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function scoreSearchMatch(query: string, candidate: string) {
  const normalizedQuery = normalizeQuery(query);
  const normalizedCandidate = normalizeSearchText(candidate);
  const tokens = getSearchTokens(query);
  if (tokens.length === 0) return 0;

  const matchedTokens = tokens.filter((token) => normalizedCandidate.includes(token));
  const essentialTokens = tokens.filter((token) => !genericProductWords.has(token));
  const matchedEssential = essentialTokens.filter((token) => normalizedCandidate.includes(token));
  const tokenScore = (matchedTokens.length / tokens.length) * 60;
  const essentialScore = essentialTokens.length > 0 ? (matchedEssential.length / essentialTokens.length) * 25 : 15;
  const exactScore = normalizedCandidate.includes(normalizedQuery) ? 35 : 0;
  const firstTokenScore = tokens[0] && normalizedCandidate.includes(tokens[0]) ? 10 : 0;

  return Math.round(Math.min(100, tokenScore + essentialScore + exactScore + firstTokenScore));
}

function isRelevantSearchResult(query: string, candidate: string, mode: "product" | "news") {
  const tokens = getSearchTokens(query);
  if (tokens.length === 0) return true;

  const normalizedCandidate = normalizeSearchText(candidate);
  const matchedTokens = tokens.filter((token) => normalizedCandidate.includes(token));
  const essentialTokens = tokens.filter((token) => !genericProductWords.has(token));
  const matchedEssential = essentialTokens.filter((token) => normalizedCandidate.includes(token));
  const score = scoreSearchMatch(query, candidate);

  if (mode === "news") {
    return score >= 35 || matchedTokens.length >= Math.min(2, tokens.length);
  }

  if (tokens.length >= 4) {
    return score >= 55 && matchedEssential.length >= Math.max(2, Math.ceil(essentialTokens.length * 0.6));
  }

  if (tokens.length >= 2) {
    return score >= 48 && matchedTokens.length >= 2;
  }

  return score >= 45;
}

async function fetchFirstSerpResults<T extends { error?: string }>(queries: Array<Record<string, string>>) {
  const results = await Promise.all(queries.map((params) => fetchSerpApi<T>(params)));
  return results.filter(Boolean) as T[];
}

async function fetchSerpApi<T>(params: Record<string, string>) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL("https://serpapi.com/search.json");
  Object.entries({ ...params, api_key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json() as T & { error?: string };

    if (!response.ok || data.error) {
      console.error("SERPAPI_CHAT_AGENT_ERROR:", data.error ?? response.status);
      return null;
    }

    return data;
  } catch (error) {
    console.error("SERPAPI_CHAT_AGENT_RUNTIME_ERROR:", error);
    return null;
  }
}

async function fetchLiveProductBundle(productName: string, region: ReturnType<typeof getSearchRegion>) {
  const normalizedProductName = normalizeQuery(productName);
  const exactQuery = `"${normalizedProductName}"`;
  const regionalParams: Record<string, string> = { gl: region.gl, hl: region.hl };
  if (region.location) regionalParams.location = region.location;
  const [shoppingResponses, newsResponses] = await Promise.all([
    fetchFirstSerpResults<SerpShoppingResponse>([
      { engine: "google_shopping", q: exactQuery, ...regionalParams },
      { engine: "google_shopping", q: normalizedProductName, ...regionalParams },
      { engine: "google_shopping", q: `${normalizedProductName} ${region.buyTerms}`, ...regionalParams },
      { engine: "google_shopping", q: `${normalizedProductName} buy price`, gl: "us", hl: "en", location: "United States" },
    ]),
    fetchFirstSerpResults<SerpNewsResponse>([
      { engine: "google_news", q: exactQuery, gl: "us", hl: "en" },
      { engine: "google_news", q: `${normalizedProductName} news review`, gl: "us", hl: "en" },
      { engine: "google_news", q: `${normalizedProductName} global market`, gl: "gb", hl: "en" },
      { engine: "google_news", q: `${normalizedProductName} haber inceleme`, gl: "tr", hl: "tr" },
      { engine: "google_news", q: `${normalizedProductName} review news`, gl: "us", hl: "en" },
    ]),
  ]);

  const shoppingResults = uniqueBy(
    shoppingResponses.flatMap((data) => data.shopping_results ?? [])
      .filter((item) => item.title && (item.link || item.product_link))
      .filter((item) => isRelevantSearchResult(normalizedProductName, `${item.title} ${item.source ?? ""}`, "product"))
      .sort((a, b) => scoreSearchMatch(normalizedProductName, `${b.title} ${b.source ?? ""}`) - scoreSearchMatch(normalizedProductName, `${a.title} ${a.source ?? ""}`)),
    (item) => item.link ?? item.product_link ?? item.title ?? "",
  ).slice(0, 8);
  const newsResults = uniqueBy(
    newsResponses.flatMap((data) => data.news_results ?? [])
      .filter((item) => item.title && item.link)
      .filter((item) => isRelevantSearchResult(normalizedProductName, `${item.title} ${item.snippet ?? ""}`, "news"))
      .sort((a, b) => scoreSearchMatch(normalizedProductName, `${b.title} ${b.snippet ?? ""}`) - scoreSearchMatch(normalizedProductName, `${a.title} ${a.snippet ?? ""}`)),
    (item) => item.link ?? item.title ?? "",
  ).slice(0, 6);
  const suppliers: SupplierLink[] = shoppingResults.map((item, index) => ({
    product_name: normalizedProductName,
    title: item.title as string,
    url: (item.link ?? item.product_link) as string,
    source: item.source ?? "Google Shopping",
    price_text: item.price ?? (item.extracted_price ? formatRegionalPrice(item.extracted_price, region.currency) : null),
    score: Math.max(getLiveScore(index, item), scoreSearchMatch(normalizedProductName, `${item.title} ${item.source ?? ""}`)),
  }));
  const signals: MarketSignal[] = shoppingResults.length > 0 ? [{
    product_name: normalizedProductName,
    signal: `${shoppingResults.length} alakalı canlı tedarik sonucu bulundu. En güçlü kaynak: ${suppliers[0]?.source ?? "Google Shopping"}${suppliers[0]?.price_text ? `, fiyat: ${suppliers[0].price_text}` : ""}. Arama marka/model eşleşmesine göre filtrelendi.`,
    score: suppliers[0]?.score ?? 70,
    source_url: suppliers[0]?.url,
  }] : [];
  const news: NewsItem[] = newsResults.map((item) => ({
    title: item.title as string,
    source: getSerpNewsSource(item.source),
    url: item.link as string,
    topic: normalizedProductName,
    summary: item.snippet ?? `${normalizedProductName} için canlı haber sinyali.`,
  }));

  return { signals, suppliers, news };
}

async function fetchLiveNewsBundle(query: string) {
  const normalizedQuery = normalizeQuery(query || "e-ticaret finans");
  const responses = await fetchFirstSerpResults<SerpNewsResponse>([
    { engine: "google_news", q: `"${normalizedQuery}"`, gl: "us", hl: "en" },
    { engine: "google_news", q: `${normalizedQuery} latest news`, gl: "us", hl: "en" },
    { engine: "google_news", q: `${normalizedQuery} analysis trend`, gl: "gb", hl: "en" },
    { engine: "google_news", q: `${normalizedQuery} global market`, gl: "ca", hl: "en" },
    { engine: "google_news", q: `${normalizedQuery} haber son gelişme`, gl: "tr", hl: "tr" },
    { engine: "google_news", q: `${normalizedQuery} analyse tendance`, gl: "fr", hl: "fr" },
  ]);
  return uniqueBy(
    responses.flatMap((data) => data.news_results ?? [])
      .filter((item) => item.title && item.link)
      .filter((item) => isRelevantSearchResult(normalizedQuery, `${item.title} ${item.snippet ?? ""}`, "news"))
      .sort((a, b) => scoreSearchMatch(normalizedQuery, `${b.title} ${b.snippet ?? ""}`) - scoreSearchMatch(normalizedQuery, `${a.title} ${a.snippet ?? ""}`)),
    (item) => item.link ?? item.title ?? "",
  ).slice(0, 8).map((item) => ({
    title: item.title as string,
    source: getSerpNewsSource(item.source),
    url: item.link as string,
    topic: normalizedQuery,
    summary: item.snippet ?? `${normalizedQuery} için canlı haber sinyali.`,
  }));
}

async function persistLiveAgentResults({ signals, news, suppliers }: { signals: MarketSignal[]; news: NewsItem[]; suppliers: SupplierLink[] }) {
  if (signals.length === 0 && news.length === 0 && suppliers.length === 0) return;

  try {
    const admin = createSupabaseAdminClient();

    if (signals.length > 0) {
      await admin.from("market_product_signals").upsert(signals.map((item) => ({
        product_name: item.product_name,
        signal: item.signal,
        score: item.score,
        source_url: item.source_url ?? null,
      })), { onConflict: "product_name" });
    }

    if (news.length > 0) {
      await admin.from("finance_news_items").upsert(news.map((item) => ({
        title: item.title,
        source: item.source,
        url: item.url,
        topic: item.topic ?? null,
        summary: item.summary ?? null,
      })), { onConflict: "url" });
    }

    if (suppliers.length > 0) {
      await admin.from("product_supplier_links").upsert(suppliers.map((item) => ({
        product_name: item.product_name,
        title: item.title,
        url: item.url,
        source: item.source,
        price_text: item.price_text ?? null,
        score: item.score,
      })), { onConflict: "url" });
    }
  } catch (error) {
    console.error("LIVE_AGENT_PERSIST_ERROR:", error);
  }
}

async function generateGeminiReply({
  message,
  command,
  localReply,
  summary,
  budgetEntries,
  marketSignals,
  news,
  suppliers,
}: {
  message: string;
  command: string;
  localReply: string;
  summary: ReturnType<typeof buildBudgetSummary>;
  budgetEntries: BudgetEntry[];
  marketSignals: MarketSignal[];
  news: NewsItem[];
  suppliers: SupplierLink[];
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || command === "yardim") return localReply;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  const context = {
    budgetSummary: summary,
    recentBudgetEntries: budgetEntries.slice(0, 30),
    marketSignals: marketSignals.slice(0, 6),
    financeNews: news.slice(0, 6),
    supplierLinks: suppliers.slice(0, 8),
    deterministicDecision: localReply,
  };

  const prompt = `Sen Sarowth'un Türkçe kişisel finans ve e-ticaret karar asistanısın.

Kurallar:
- Sadece kullanıcının son chat mesajına cevap ver.
- Panelde girilen gelir, gider, birikim ve kategori verilerini esas al.
- Satın alma kararında deterministicDecision kararını bozma; sadece daha doğal, kişisel ve okunabilir anlat.
- Cevabı kısa tut. Gereksiz veri dökme.
- Haber, trend ve tedarik linklerini destekleyici sinyal olarak kullan; kesin stok veya yatırım emri verme.
- Ürün takibi ve haber aramasında sadece verilen marka/model/konu ile eşleşen sonuçları anlat; alakasız genel sonuç uydurma.
- Ürün ve fiyat sonuçları kullanıcının bölgesine/para birimine göre gelir; haberleri global kaynak sinyali olarak değerlendir.
- Tedarik sonucu azsa bunu açıkça söyle, eksik veriyi tamamlamaya çalışma.
- Hisse, fon, coin veya yatırım alanlarında mutlaka "yatırım tavsiyesi değildir" de.
- Eğer veri yoksa kullanıcıya panelden gelir/gider eklemesini söyle.

Kullanıcı mesajı: ${message}
Komut türü: ${command}
Bağlam: ${JSON.stringify(context)}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 650,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GEMINI_AGENT_ERROR:", response.status, errorText.slice(0, 500));
      return localReply;
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || localReply;
  } catch (error) {
    console.error("GEMINI_AGENT_RUNTIME_ERROR:", error);
    return localReply;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequest;
    const message = (body.userMessage ?? body.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ success: true, reply: commandHelp, dashboardData: null });
    }

    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ success: false, reply: "Bu asistanı kullanmak için önce giriş yapmalısın.", dashboardData: null }, { status: 401 });
    }

    const [{ data: budgetEntries }, { data: marketSignals }, { data: financeNews }, { data: supplierLinks }] = await Promise.all([
      supabase.from("budget_entries").select("label, category, amount, entry_type, occurred_on").eq("user_id", userData.user.id).limit(120),
      supabase.from("market_product_signals").select("product_name, signal, score, source_url").order("score", { ascending: false }).limit(12),
      supabase.from("finance_news_items").select("title, source, url, topic, summary").order("published_at", { ascending: false }).order("created_at", { ascending: false }).limit(12),
      supabase.from("product_supplier_links").select("product_name, title, url, source, price_text, score").order("score", { ascending: false }).limit(24),
    ]);

    const entries = (budgetEntries ?? []) as BudgetEntry[];
    let signals = (marketSignals ?? []) as MarketSignal[];
    let news = (financeNews ?? []) as NewsItem[];
    let suppliers = (supplierLinks ?? []) as SupplierLink[];
    const summary = buildBudgetSummary(entries);
    const { command, text } = parseCommand(message);
    const amount = parseAmount(text);
    const searchRegion = getSearchRegion(request);

    let localReply = commandHelp;

    if (command === "al") {
      localReply = amount ? getPurchaseDecision(amount, summary) : "Satın alma kararı için tutar yazmalısın. Örnek: al Nike ayakkabı 2400 TL";
    } else if (command === "haber") {
      if (text) await rememberWatchTopic(supabase, userData.user.id, text, "news_watch");
      const normalizedText = normalizeQuery(text);
      const liveNews = await fetchLiveNewsBundle(text);
      await persistLiveAgentResults({ signals: [], news: liveNews, suppliers: [] });
      news = [...liveNews, ...news.filter((item) => normalizeQuery(item.topic ?? "") === normalizedText)];
      signals = [];
      suppliers = [];
      localReply = buildNewsReply(text, news);
    } else if (command === "takip") {
      if (text) await rememberWatchTopic(supabase, userData.user.id, text, "product_watch");
      if (text) {
        const normalizedText = normalizeQuery(text);
        const liveBundle = await fetchLiveProductBundle(text, searchRegion);
        await persistLiveAgentResults(liveBundle);
        signals = [...liveBundle.signals, ...signals.filter((item) => normalizeQuery(item.product_name) === normalizedText)];
        suppliers = [...liveBundle.suppliers, ...suppliers.filter((item) => normalizeQuery(item.product_name) === normalizedText)];
        news = [...liveBundle.news, ...news.filter((item) => normalizeQuery(item.topic ?? "") === normalizedText)];
      }
      localReply = text ? buildTrackingReply(text, signals, suppliers) : "Takip etmek istediğin ürünü yaz. Örnek: takip ürün adı";
    } else if (command === "yatirim") {
      await rememberWatchTopic(supabase, userData.user.id, "yatırım fırsatları", "investment_watch");
      localReply = buildInvestmentReply(summary);
    } else if (command === "ozet") {
      localReply = `Bütçe Özeti\n\nGelir: ₺${summary.income.toLocaleString("tr-TR")}\nGider: ₺${summary.expenses.toLocaleString("tr-TR")}\nTasarruf: ₺${summary.savings.toLocaleString("tr-TR")}\nSerbest alan: ₺${summary.available.toLocaleString("tr-TR")}\nEn yüksek kategori: ${summary.topCategory?.[0] ?? "Yok"}`;
    } else {
      localReply = commandHelp;
    }

    const reply = await generateGeminiReply({
      message,
      command,
      localReply,
      summary,
      budgetEntries: entries,
      marketSignals: signals,
      news,
      suppliers,
    });

    await supabase.from("assistant_messages").insert([
      { user_id: userData.user.id, role: "user", content: message },
      { user_id: userData.user.id, role: "assistant", content: reply },
    ]);

    return NextResponse.json({
      success: true,
      reply,
      dashboardData: buildDashboardData(summary, signals, news, suppliers, text || undefined, command),
    });
  } catch (error) {
    console.error("ASSISTANT_COMMAND_ENGINE_ERROR:", error);
    return NextResponse.json({
      success: false,
      reply: "Asistan şu anda yanıt veremiyor. Biraz sonra tekrar dene.",
      dashboardData: null,
    }, { status: 500 });
  }
}
