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
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard label="Bu ayki net alan" value={`₺${cycleCapital.toLocaleString("tr-TR")}`} detail="Paneldeki gelir, gider ve birikim kayıtlarına göre hesaplandı." />
              <StatCard label="Aylık hedef" value={profile?.savings_goal && Number(profile.savings_goal) > 0 && Number(profile.savings_goal) !== 500 ? `₺${Number(profile.savings_goal).toLocaleString("tr-TR")}` : "Belirle"} detail="Paneldeki Profil sayfasından kendin belirleyebilirsin." />
              <StatCard label="En yüksek harcama" value={topExpense ? topExpense[0] : "Yok"} detail={topExpense ? `₺${topExpense[1].toLocaleString("tr-TR")} harcama görünüyor.` : "Bütçe verisi bekleniyor."} />
            </div>
          </div>

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
        <span className="font-mono text-white">${amount.toLocaleString()} · %{percent}</span>
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
  const source = categories.length > 0 && total > 0 ? categories.map(([category, amount]) => [category, Math.round((amount / total) * 100)] as [string, number]) : fallback;
  const colors = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#64748b"];
  let cursor = 0;
  const gradient = source.map(([, percent], index) => {
    const start = cursor;
    cursor += percent;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  }).join(", ");

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
      <div className="mx-auto grid h-56 w-56 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-32 w-32 place-items-center rounded-full bg-[#050505] text-center">
          <div>
            <p className="text-3xl font-semibold text-white">%100</p>
            <p className="text-xs text-slate-500">harcama dağılımı</p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {source.map(([category, percent], index) => (
          <div key={category} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              {category}
            </div>
            <span className="font-mono text-white">%{percent}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Serbest alan</p>
          <p className="mt-2 text-2xl font-semibold text-white">₺{freeCapital.toLocaleString("tr-TR")}</p>
        </div>
        <div className="rounded-2xl border border-blue-300/15 bg-blue-400/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">Test bütçesi</p>
          <p className="mt-2 text-2xl font-semibold text-white">₺{testBudget.toLocaleString("tr-TR")}</p>
        </div>
        <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Risk bandı</p>
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
  const rotation = 180 - normalizedScore * 1.8;
  const labelClass = normalizedScore > 80 ? "text-red-200" : normalizedScore > 60 ? "text-amber-100" : "text-emerald-100";

  return (
    <div className="mt-3">
      <div className="relative mx-auto h-20 w-40 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-40 rounded-full bg-[conic-gradient(from_270deg,#10b981_0deg,#84cc16_55deg,#f59e0b_115deg,#ef4444_180deg,transparent_180deg)] opacity-90" />
        <div className="absolute inset-x-5 top-5 h-[7.5rem] rounded-full bg-[#161207]" />
        <div className="absolute bottom-0 left-1/2 h-[3px] w-[64px] origin-left rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.35)] transition-transform duration-700" style={{ transform: `rotate(${rotation}deg)` }} />
        <div className="absolute bottom-[-6px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-white/30 bg-[#050505]" />
      </div>
      <div className="-mt-1 text-center">
        <p className="text-3xl font-semibold text-white">{score}/100</p>
        <p className={`mt-1 text-xs font-medium uppercase tracking-[0.2em] ${labelClass}`}>{label}</p>
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
