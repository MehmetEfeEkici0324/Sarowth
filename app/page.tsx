import type { Metadata } from "next";
import { ArrowUpRight, BadgeDollarSign, Landmark, Mail, Newspaper, PlugZap, Radar } from "lucide-react";
import { AgentIntelligenceWorkspace } from "@/components/AgentIntelligenceWorkspace";
import { AgentCards } from "@/components/AgentCards";
import { CommerceAgentPanel } from "@/components/CommerceAgentPanel";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface HomePageProps {}

interface AuthenticatedHomeProps {
  userName: string;
  profile: { full_name?: string | null; savings_goal?: number | string | null } | null;
  budgetEntries: Array<{ amount: number | string; entry_type: string; category: string }>;
  ideas: Array<{ product_name: string; demand_score: number; estimated_margin: number | string; status: string }>;
  marketSignals: Array<{ name: string; signal: string; score: number; source: string }>;
  financeNews: Array<{ title: string; source: string; href: string; time?: string; bundleSummary?: string }>;
  supplierCards: Array<{ productName: string; title: string; url: string; source: string; price?: string | null; score: number }>;
  assistantMessages: Array<{ role: "user" | "assistant"; content: string }>;
  lastAgentTopic: string | null;
}

const defaultMarketSignals: Array<{ name: string; signal: string; score: number; source: string }> = [];

const defaultFinanceNews: Array<{ title: string; source: string; href: string; time?: string; bundleSummary?: string }> = [];

const agentConnections = [
  { name: "Bütçe Motoru", status: "Hazır", detail: "Panelden girilen gelir, gider ve kategorileri kişiye özel karar bağlamına çevirir." },
  { name: "Haber Agent", status: "Canlı", detail: "SerpAPI ve haber tablosundan konuya göre günlük haber bundle'ları üretir." },
  { name: "Trend/Tedarik Agent", status: "Canlı", detail: "SerpAPI Shopping ile ürün trendlerini ve tedarik linklerini getirir." },
  { name: "Gemini Agent", status: "Canlı", detail: "Chat kararlarını bütçe, haber ve trend bağlamıyla kişiselleştirir." },
];

export const metadata: Metadata = {
  title: "Sarowth | Bütçeni Koru, Fikrini Test Et",
  description: "Sarowth, harcamalarını takip etmeni, birikimini korumanı ve e-ticaret fikirlerini gerçek para harcamadan önce doğrulamanı sağlar.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage({}: HomePageProps) {
  let userName: string | null = null;
  let authenticatedHome: AuthenticatedHomeProps | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("full_name, email, savings_goal").eq("id", data.user.id).single();
      const { data: latestTopic } = await supabase.from("agent_watch_topics").select("topic, intent").eq("user_id", data.user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
      const lastAgentTopic = latestTopic?.topic ?? null;
      const [{ data: budgetEntries }, { data: ideas }, { data: signalRows }, { data: newsRows }, { data: supplierRows }, { data: messageRows }] = await Promise.all([
        supabase.from("budget_entries").select("amount, entry_type, category").eq("user_id", data.user.id),
        supabase.from("ecommerce_ideas").select("product_name, demand_score, estimated_margin, status").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(4),
        lastAgentTopic ? supabase.from("market_product_signals").select("product_name, signal, score, source_url").eq("product_name", lastAgentTopic).order("score", { ascending: false }).limit(6) : supabase.from("market_product_signals").select("product_name, signal, score, source_url").order("created_at", { ascending: false }).limit(0),
        lastAgentTopic ? supabase.from("finance_news_items").select("title, source, url, topic, summary").eq("topic", lastAgentTopic).order("published_at", { ascending: false }).order("created_at", { ascending: false }).limit(6) : supabase.from("finance_news_items").select("title, source, url, topic, summary").order("created_at", { ascending: false }).limit(0),
        lastAgentTopic ? supabase.from("product_supplier_links").select("product_name, title, url, source, price_text, score").eq("product_name", lastAgentTopic).order("created_at", { ascending: false }).limit(10) : supabase.from("product_supplier_links").select("product_name, title, url, source, price_text, score").order("created_at", { ascending: false }).limit(0),
        supabase.from("assistant_messages").select("role, content").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      const marketSignals = (signalRows ?? []).map((row) => {
        let source = "Piyasa Agent";
        if (row.source_url) {
          try {
            source = new URL(row.source_url).hostname.replace("www.", "");
          } catch {
            source = "Piyasa Agent";
          }
        }
        return {
          name: row.product_name,
          signal: row.signal,
          score: row.score,
          source,
        };
      });
      const financeNews = (newsRows ?? []).map((row) => ({
        title: row.title,
        source: row.source,
        href: row.url,
        time: "Canlı haber",
        bundleSummary: row.summary ? `AJAN NOTU: ${row.summary}` : "AJAN NOTU: Bu haber piyasa sinyalleri için izleniyor; kişisel risk analizi chat sonrası netleşir.",
      }));
      const supplierCards = (supplierRows ?? []).map((row) => ({
        productName: row.product_name,
        title: row.title,
        url: row.url,
        source: row.source,
        price: row.price_text,
        score: row.score,
      }));
      const assistantMessages = (messageRows ?? []).reverse().map((row) => ({
        role: row.role as "user" | "assistant",
        content: row.content,
      }));
      const resolvedUserName = profile?.full_name?.split(" ")[0] ?? profile?.email ?? data.user.email ?? "Profil";
      userName = resolvedUserName;
      authenticatedHome = {
        userName: resolvedUserName,
        profile,
        budgetEntries: budgetEntries ?? [],
        ideas: ideas ?? [],
        marketSignals: marketSignals.length > 0 ? marketSignals : defaultMarketSignals,
        financeNews: financeNews.length > 0 ? financeNews : defaultFinanceNews,
        supplierCards,
        assistantMessages,
        lastAgentTopic,
      };
    }
  } catch {
    userName = null;
  }

  if (authenticatedHome) {
    return <AuthenticatedHome {...authenticatedHome} />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <Navbar userName={userName} />
      <Hero />
      <AgentCards />
      <CycleSection />
      <AuthPreview />
      <Footer />
    </main>
  );
}

function AuthenticatedHome({ userName, profile, budgetEntries, ideas, marketSignals, financeNews, supplierCards, assistantMessages, lastAgentTopic }: AuthenticatedHomeProps) {
  const income = budgetEntries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = budgetEntries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const savings = budgetEntries.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const cycleCapital = Math.max(0, income - expenses + savings);
  const expenseByCategory = Object.entries(
    budgetEntries.filter((entry) => entry.entry_type === "expense").reduce<Record<string, number>>((groups, entry) => {
      groups[entry.category] = (groups[entry.category] ?? 0) + Number(entry.amount);
      return groups;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const topExpense = expenseByCategory[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <Navbar userName={userName} />
      <section className="relative px-5 py-10 sm:px-8 lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.14),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Kişisel Ana Sayfa</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Hoş geldin, {profile?.full_name?.split(" ")[0] ?? userName}.</h1>
               <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Gelir-gider kayıtların, haber/trend sinyalleri ve ürün takiplerin tek yerde birleşir. Asistan, sadece chatte sorduğunda bütçene göre karar desteği verir.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#assistant" className="rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-3 text-center font-semibold text-[#03110c]">Asistana Sor</a>
                <a href="#agents" className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10">Agent Durumlarını Gör</a>
                <a href="#how-it-works" className="rounded-full border border-blue-300/20 bg-blue-400/10 px-6 py-3 text-center font-semibold text-blue-50 transition hover:border-blue-300/40 hover:bg-blue-400/15">Nasıl Çalışır?</a>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard label="Bu ayki net alan" value={`₺${cycleCapital.toLocaleString("tr-TR")}`} detail="Paneldeki gelir, gider ve birikim kayıtlarına göre hesaplandı." />
              <StatCard label="Aylık hedef" value={profile?.savings_goal && Number(profile.savings_goal) > 0 && Number(profile.savings_goal) !== 500 ? `₺${Number(profile.savings_goal).toLocaleString("tr-TR")}` : "Belirle"} detail="Paneldeki Profil sayfasından kendin belirleyebilirsin." />
              <StatCard label="En yüksek harcama" value={topExpense ? topExpense[0] : "Yok"} detail={topExpense ? `₺${topExpense[1].toLocaleString("tr-TR")} harcama görünüyor.` : "Bütçe verisi bekleniyor."} />
            </div>
          </div>

          <section id="how-it-works" className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Sarowth nedir?</p>
            <h2 className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Nasıl Çalışır?</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Sarowth size kişisel finansmanlık yapan; e-ticaret, hisse-coin alım satımlarınıza fikir veren, Gemini destekli bir arkadaştır.</p>
          </section>

          <section id="agents" className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3">
              <PlugZap className="text-emerald-300" size={22} />
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">Agent bağlantı katmanı</h2>
            </div>
             <p className="mt-3 max-w-3xl leading-7 text-slate-400">Bütçe verisini panelden sen girersin. Haber, trend/tedarik ve Gemini agent'ları canlı API bağlantılarıyla chat sırasında çalışır.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {agentConnections.map((agent) => (
                <div key={agent.name} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{agent.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{agent.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <AgentIntelligenceWorkspace initialMarketSignals={marketSignals} initialFinanceNews={financeNews} initialSupplierCards={supplierCards} initialMessages={assistantMessages} lastAgentTopic={lastAgentTopic} />

          <section id="spending" className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Landmark className="text-emerald-300" size={22} />
                  <h2 className="text-3xl font-semibold tracking-[-0.04em]">Banka ve harcama görünümü</h2>
                </div>
                 <p className="mt-3 max-w-3xl leading-7 text-slate-400">Panelden girdiğin gelir, gider, birikim ve kategori kayıtları burada özetlenir. Chat asistanı satın alma kararlarını bu tabloya göre yorumlar.</p>
              </div>
              <a href="#assistant" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">Satın Alma Sor</a>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <SpendingDonut categories={expenseByCategory} total={expenses} />
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <StatCard label="Toplam gelir" value={`₺${income.toLocaleString()}`} detail="Panelden kaydedilen gelir toplamı." />
                <StatCard label="Toplam gider" value={`₺${expenses.toLocaleString()}`} detail="Bu ayki harcama toplamı." />
                <StatCard label="Toplam tasarruf" value={`₺${savings.toLocaleString()}`} detail="Geçen aydan veya bu aydan ayrılan tutar." />
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {expenseByCategory.length > 0 ? expenseByCategory.slice(0, 5).map(([category, amount]) => {
                const percent = expenses > 0 ? Math.round((amount / expenses) * 100) : 0;
                return <CategoryBar key={category} category={category} amount={amount} percent={percent} />;
              }) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-slate-400">Kategori grafiği için önce panelden gelir ve gider kayıtlarını ekle.</p>}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <InvestmentSection income={income} expenses={expenses} savings={savings} topExpense={topExpense} marketSignals={marketSignals} />
            <CommerceAgentPanel ideas={ideas} marketSignals={marketSignals} availableCapital={cycleCapital} />
          </div>

        </div>
      </section>
    </main>
  );
}

function AgentMarketSection({ marketSignals }: { marketSignals: Array<{ name: string; signal: string; score: number; source: string }> }) {
  return (
    <section id="market" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <Radar className="text-emerald-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Piyasada yükselen ürünler</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {marketSignals.map((item) => (
          <div key={item.name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-1 text-sm text-slate-400">{item.signal}</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{item.score}/100</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Kaynak: {item.source}. Daha sonra sosyal medya ve pazar yeri agent verisiyle beslenecek.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentNewsSection({ financeNews }: { financeNews: Array<{ title: string; source: string; href: string }> }) {
  return (
    <section id="news" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <Newspaper className="text-blue-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Finans ve e-ticaret haberleri</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {financeNews.map((news) => (
          <a key={news.title} href={news.href} target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-blue-400/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{news.title}</p>
                <p className="mt-2 text-sm text-slate-500">{news.source}</p>
              </div>
              <ArrowUpRight className="shrink-0 text-slate-500 transition group-hover:text-blue-300" size={18} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function CategoryBar({ category, amount, percent }: { category: string; amount: number; percent: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{category}</span>
        <span className="font-mono text-white">₺{amount.toLocaleString("tr-TR")} · %{percent}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SpendingDonut({ categories, total }: { categories: Array<[string, number]>; total: number }) {
  const fallback = [
    ["Yemek", 38],
    ["Ulaşım", 18],
    ["Fatura", 22],
    ["İhtiyaç", 14],
    ["Diğer", 8],
  ] as Array<[string, number]>;
  const source = categories.length > 0 && total > 0
    ? categories.map(([category, amount]) => ({ category, amount, percent: (amount / total) * 100 }))
    : fallback.map(([category, percent]) => ({ category, amount: percent, percent }));
  const colors = ["#10d99a", "#3b82f6", "#a855f7", "#f59e0b", "#22d3ee", "#f43f5e", "#94a3b8"];
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = source.map((item, index) => {
    const rawLength = (item.percent / 100) * circumference;
    const gap = source.length > 1 && rawLength > 3 ? 1.5 : 0;
    const visibleLength = Math.max(0, rawLength - gap);
    const segment = {
      ...item,
      color: colors[index % colors.length],
      dash: `${visibleLength} ${circumference - visibleLength}`,
      offset: -offset,
      displayPercent: item.percent < 1 ? "<1" : Math.round(item.percent).toString(),
    };
    offset += rawLength;
    return segment;
  });

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="relative mx-auto h-64 w-64">
        <svg viewBox="0 0 220 220" className="h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]" aria-label="Harcama dağılımı grafiği">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="34" />
          {segments.map((segment) => (
            <circle
              key={segment.category}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="34"
              strokeLinecap="butt"
              strokeDasharray={segment.dash}
              strokeDashoffset={segment.offset}
              transform="rotate(-90 110 110)"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div className="grid h-32 w-32 place-items-center rounded-full border border-white/10 bg-[#050505]/95 shadow-[0_0_30px_rgba(0,0,0,0.45)]">
            <div>
              <p className="text-3xl font-semibold text-white">%100</p>
              <p className="text-xs text-slate-500">harcama dağılımı</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {segments.map((segment) => (
          <div key={segment.category} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2 text-slate-300">
              <span className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: segment.color, color: segment.color }} />
              <span className="truncate">
                {segment.category}
              </span>
            </div>
            <span className="shrink-0 font-mono text-white">₺{segment.amount.toLocaleString("tr-TR")} · %{segment.displayPercent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy - radius * Math.sin(radians),
  };
}

function InvestmentSection({ income, expenses, savings, topExpense, marketSignals }: { income: number; expenses: number; savings: number; topExpense?: [string, number]; marketSignals: AuthenticatedHomeProps["marketSignals"] }) {
  const freeCapital = Math.max(0, income - expenses - savings);
  const testBudget = Math.floor(Math.max(0, freeCapital) * 0.25);
  const reserveBudget = Math.floor(Math.max(0, freeCapital) * 0.5);
  const expenseLoad = income > 0 ? expenses / income : 1;
  const liquidityLoad = income > 0 ? Math.max(0, 1 - freeCapital / income) : 1;
  const topCategoryLoad = expenses > 0 && topExpense ? topExpense[1] / expenses : 0;
  const riskScore = income > 0 ? Math.min(100, Math.round(expenseLoad * 55 + liquidityLoad * 30 + topCategoryLoad * 15)) : 0;
  const riskLevel = income === 0 ? "Veri bekleniyor" : riskScore > 80 ? "Güvensiz" : riskScore > 60 ? "Dikkat" : "Güvenli";
  const riskDetail = income === 0 ? "Gelir ve gider eklenince hesaplanır." : riskScore > 80 ? "Harcama yükü yüksek, yeni test bütçesi açma." : riskScore > 60 ? "Kontrollü ilerle, küçük test dışında harcama yapma." : "Serbest alan sağlıklı, mikro test yapılabilir.";
  const topSignal = marketSignals[0];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <BadgeDollarSign className="text-emerald-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Agent sermaye kararı</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">Bütçe motoru serbest alanı ayırır; trend agent bu alanla test edilebilecek en mantıklı küçük hamleyi seçer.</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="min-h-36 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Serbest alan</p>
            <p className="mt-2 text-2xl font-semibold text-white">₺{freeCapital.toLocaleString("tr-TR")}</p>
            <p className="mt-3 text-xs leading-5 text-emerald-50/60">Gelirden gider ve birikim ayrıldıktan sonra kalan güvenli hareket alanı.</p>
          </div>
          <div className="min-h-36 rounded-2xl border border-blue-300/15 bg-blue-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">Test bütçesi</p>
            <p className="mt-2 text-2xl font-semibold text-white">₺{testBudget.toLocaleString("tr-TR")}</p>
            <p className="mt-3 text-xs leading-5 text-blue-50/60">Ürün, reklam veya tedarik denemesi için ayrılabilecek küçük kontrollü pay.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Risk bandı</p>
            <span className="rounded-full border border-amber-200/20 bg-black/20 px-3 py-1 text-sm font-semibold text-white">{riskScore}/100</span>
          </div>
          <RiskGauge score={riskScore} label={riskLevel} />
          <p className="mt-2 text-center text-xs leading-5 text-amber-50/70">{riskDetail}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-300">
          <span className="font-semibold text-white">1. Önce tampon:</span> ₺{reserveBudget.toLocaleString("tr-TR")} acil nakit alanı bozulmadan tutulmalı.
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-300">
          <span className="font-semibold text-white">2. Sonra mikro test:</span> {topSignal ? `${topSignal.name} (${topSignal.score}/100) için küçük reklam veya tedarik testi düşünülebilir.` : "Trend agent sonucu geldikçe test edilebilir ürün burada görünür."}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-300">
          <span className="font-semibold text-white">3. Fren noktası:</span> {topExpense ? `${topExpense[0]} harcaması yüksek. Bu kategoriye yeni harcama eklemeden önce bekleme modu önerilir.` : "Harcama kategorileri girildikçe fren noktası hesaplanır."}
        </div>
      </div>
    </section>
  );
}

function RiskGauge({ score, label }: { score: number; label: string }) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const needleAngle = 180 - normalizedScore * 1.8;
  const needleEnd = polarPoint(100, 100, 68, needleAngle);
  const labelClass = normalizedScore > 80 ? "text-red-200" : normalizedScore > 60 ? "text-amber-100" : "text-emerald-100";
  const glowClass = normalizedScore > 80 ? "shadow-red-500/20" : normalizedScore > 60 ? "shadow-amber-500/20" : "shadow-emerald-500/20";

  return (
    <div className="mt-3">
      <div className={`relative mx-auto max-w-md rounded-3xl bg-black/20 p-2 shadow-2xl ${glowClass}`}>
        <svg viewBox="0 0 200 128" className="h-40 w-full sm:h-44" aria-label={`Risk skoru ${score}/100`}>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="22" strokeLinecap="round" pathLength="100" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="22" strokeLinecap="round" pathLength="100" strokeDasharray="58 100" strokeDashoffset="0" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#facc15" strokeWidth="22" strokeLinecap="round" pathLength="100" strokeDasharray="24 100" strokeDashoffset="-58" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="22" strokeLinecap="round" pathLength="100" strokeDasharray="18 100" strokeDashoffset="-82" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeLinecap="round" />
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = 180 - tick * 1.8;
            const outer = polarPoint(100, 100, 91, angle);
            const inner = polarPoint(100, 100, 81, angle);
            return <line key={tick} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />;
          })}
          <line x1="100" y1="100" x2={needleEnd.x} y2={needleEnd.y} stroke="white" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]" />
          <circle cx="100" cy="100" r="9" fill="#050505" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          <circle cx="100" cy="100" r="4" fill="white" />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
          <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${labelClass}`}>{label}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
        <span className="text-emerald-200/80">Güvenli</span>
        <span className="text-center text-amber-100/80">Dikkat</span>
        <span className="text-right text-red-200/80">Riskli</span>
      </div>
    </div>
  );
}

interface CycleStep {
  label: string;
  value: string;
  detail: string;
}

const cycleSteps: CycleStep[] = [
  { label: "Temizle", value: "01", detail: "Gelirini, giderini ve tekrar eden para kaçaklarını karmaşık bir finans ekranına boğulmadan kaydet." },
  { label: "Ayır", value: "02", detail: "Bütçen gerçekten uygunsa küçük bir tutarı test sermayesi olarak kenara koy." },
  { label: "Doğrula", value: "03", detail: "Stok almadan veya reklama çıkmadan önce ürün fikirlerini karşılaştır." },
  { label: "Değerlendir", value: "04", detail: "Her sonucu bir sonraki döngüyü daha küçük, güvenli ve net hale getirmek için kullan." },
];

function CycleSection() {
  return (
    <section id="cycles" className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.06),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Çalışma döngüsü</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Bütçeden işe geçmenin daha sakin yolu.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {cycleSteps.map((step) => (
            <div key={step.label} className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <span className="font-mono text-sm text-emerald-300">{step.value}</span>
              <h3 className="mt-8 text-2xl font-semibold text-white">{step.label}</h3>
              <p className="mt-3 leading-7 text-slate-400">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthPreview() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">E-posta doğrulama</p>
        <h2 className="mt-3 text-center text-3xl font-semibold tracking-[-0.04em] text-white">E-posta ile çalışma alanını oluştur</h2>
        <form action="/signup" className="mt-5 grid gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-400">
            <Mail size={17} /> Önce doğrulama kodu gönderiyoruz
          </div>
          <button type="submit" className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] transition hover:scale-[1.01]">
            E-posta ile hesap oluştur
          </button>
        </form>
      </div>
    </section>
  );
}
