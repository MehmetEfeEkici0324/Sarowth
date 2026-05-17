import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
Ürün takibi: takip stres çarkı
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
  const normalizedQuery = query.toLocaleLowerCase("tr-TR");
  const filtered = news.filter((item) => `${item.title} ${item.summary ?? ""}`.toLocaleLowerCase("tr-TR").includes(normalizedQuery)).slice(0, 3);
  return filtered.length > 0 ? filtered : news.slice(0, 3);
}

function buildNewsReply(query: string, news: NewsItem[]) {
  const items = filterNews(query, news);
  if (items.length === 0) {
    return "Haber agent verisi henüz boş. Haber API bağlandığında bu komut günlük sinyalleri konuya göre getirecek.";
  }

  return `Haber Bundle: ${query || "genel piyasa"}\n\n${items.map((item, index) => `${index + 1}. ${item.title}\nKaynak: ${item.source}\nLink: ${item.url}`).join("\n\n")}\n\nAjan notu: Bu sinyaller karar desteği içindir; tek başına yatırım veya stok alma kararı değildir.`;
}

function buildTrackingReply(query: string, signals: MarketSignal[], suppliers: SupplierLink[]) {
  const matched = signals.filter((item) => `${item.product_name} ${item.signal}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))).slice(0, 3);
  const items = matched.length > 0 ? matched : signals.slice(0, 3);
  const supplierItems = suppliers.filter((item) => `${item.product_name} ${item.title}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))).slice(0, 4);

  if (items.length === 0) {
    return `Takip başlatıldı: ${query}\n\nPiyasa API bağlandığında bu ürünle ilgili trend, tedarik ve satış linkleri günlük olarak bundle halinde gösterilecek.`;
  }

  const supplierText = supplierItems.length > 0 ? `\n\nTedarik linkleri:\n${supplierItems.map((item) => `- ${item.title} (${item.source}${item.price_text ? `, ${item.price_text}` : ""})\n  ${item.url}`).join("\n")}` : "\n\nTedarik linkleri: Ürün tedarik API bağlanınca burada listelenecek.";

  return `Ürün/Trend Bundle: ${query}\n\n${items.map((item) => `- ${item.product_name}: ${item.signal} (${item.score}/100)${item.source_url ? `\n  Kaynak: ${item.source_url}` : ""}`).join("\n")}${supplierText}\n\nAjan notu: Tedarik için önce düşük bütçeli talep testi yap; stok almadan önce fiyat, kargo ve iade riskini hesapla.`;
}

function buildInvestmentReply(summary: ReturnType<typeof buildBudgetSummary>) {
  if (summary.available <= 0) {
    return "Yatırım fırsatı alanı: YOK\n\nBu ay serbest bütçe görünmüyor. Önce giderleri azaltıp acil nakit alanı oluştur. Bu yatırım tavsiyesi değildir.";
  }

  return `Bakılabilecek alanlar: ₺${summary.available.toLocaleString("tr-TR")} serbest bütçe\n\n- %50 acil nakit tamponu\n- %30 düşük bütçeli ürün/reklam testi\n- %20 eğitim, araç veya araştırma bütçesi\n\nHisse, fon, coin veya benzeri alanlar için bu yatırım tavsiyesi değildir. Sadece bakılabilecek risk alanlarını ayırıyorum.`;
}

function buildDashboardData(summary: ReturnType<typeof buildBudgetSummary>, signals: MarketSignal[], news: NewsItem[]) {
  return {
    banka: {
      gelir: summary.income,
      gider: summary.expenses,
      tasarruf: summary.savings,
      serbestButce: summary.available,
      enYuksekKategori: summary.topCategory?.[0] ?? "Yok",
    },
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
      supabase.from("finance_news_items").select("title, source, url, summary").order("published_at", { ascending: false }).order("created_at", { ascending: false }).limit(12),
      supabase.from("product_supplier_links").select("product_name, title, url, source, price_text, score").order("score", { ascending: false }).limit(24),
    ]);

    const entries = (budgetEntries ?? []) as BudgetEntry[];
    const signals = (marketSignals ?? []) as MarketSignal[];
    const news = (financeNews ?? []) as NewsItem[];
    const suppliers = (supplierLinks ?? []) as SupplierLink[];
    const summary = buildBudgetSummary(entries);
    const { command, text } = parseCommand(message);
    const amount = parseAmount(text);

    let localReply = commandHelp;

    if (command === "al") {
      localReply = amount ? getPurchaseDecision(amount, summary) : "Satın alma kararı için tutar yazmalısın. Örnek: al Nike ayakkabı 2400 TL";
    } else if (command === "haber") {
      if (text) await rememberWatchTopic(supabase, userData.user.id, text, "news_watch");
      localReply = buildNewsReply(text, news);
    } else if (command === "takip") {
      if (text) await rememberWatchTopic(supabase, userData.user.id, text, "product_watch");
      localReply = text ? buildTrackingReply(text, signals, suppliers) : "Takip etmek istediğin ürünü yaz. Örnek: takip stres çarkı";
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
      dashboardData: buildDashboardData(summary, signals, news),
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
