"use client";

import { useState } from "react";
import { ArrowUpRight, LinkIcon, Newspaper, Radar } from "lucide-react";
import { AssistantChat } from "@/components/AssistantChat";

interface MarketSignal {
  name: string;
  signal: string;
  score: number;
  source: string;
}

interface FinanceNewsItem {
  title: string;
  source: string;
  href: string;
  time?: string;
  bundleSummary?: string;
}

interface SupplierCard {
  productName: string;
  title: string;
  url: string;
  source: string;
  price?: string | null;
  score: number;
}

interface DashboardData {
  trendUrunler?: Array<{
    title: string;
    description: string;
    score: string;
    source: string;
  }>;
  finansHaberleri?: Array<{
    title: string;
    source: string;
    url: string;
    time?: string;
    bundleSummary?: string;
  }>;
  tedarikLinkleri?: SupplierCard[];
}

interface AgentIntelligenceWorkspaceProps {
  initialMarketSignals: MarketSignal[];
  initialFinanceNews: FinanceNewsItem[];
  initialSupplierCards: SupplierCard[];
  initialMessages: Array<{ role: "user" | "assistant"; content: string }>;
  lastAgentTopic: string | null;
}

function normalizeDashboardData(value: unknown): DashboardData | null {
  if (!value || typeof value !== "object") return null;
  return value as DashboardData;
}

export function AgentIntelligenceWorkspace({ initialMarketSignals, initialFinanceNews, initialSupplierCards, initialMessages, lastAgentTopic }: AgentIntelligenceWorkspaceProps) {
  const [marketSignals, setMarketSignals] = useState(initialMarketSignals);
  const [financeNews, setFinanceNews] = useState(initialFinanceNews);
  const [supplierCards, setSupplierCards] = useState<SupplierCard[]>(initialSupplierCards);

  function handleDashboardData(value: unknown) {
    const dashboardData = normalizeDashboardData(value);
    if (!dashboardData) return;

    if (dashboardData.trendUrunler) {
      const nextSignals = dashboardData.trendUrunler.map((item) => ({
        name: item.title,
        signal: item.description,
        score: Number(item.score.split("/")[0]) || 0,
        source: item.source,
      }));
      setMarketSignals(nextSignals.slice(0, 6));
    }

    if (dashboardData.finansHaberleri) {
      const nextNews = dashboardData.finansHaberleri.map((item) => ({
        title: item.title,
        source: item.source,
        href: item.url,
        time: item.time,
        bundleSummary: item.bundleSummary,
      }));
      setFinanceNews(nextNews.slice(0, 8));
    }

    if (dashboardData.tedarikLinkleri) {
      setSupplierCards(dashboardData.tedarikLinkleri.slice(0, 10));
    }
  }

  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AgentMarketSection marketSignals={marketSignals} lastAgentTopic={lastAgentTopic} />
        <AgentNewsSection financeNews={financeNews} lastAgentTopic={lastAgentTopic} />
      </div>
      <SupplierSection supplierCards={supplierCards} />

      <div id="assistant" className="mt-6">
        <AssistantChat onDashboardData={handleDashboardData} initialMessages={initialMessages} />
      </div>
    </>
  );
}

function AgentMarketSection({ marketSignals, lastAgentTopic }: { marketSignals: MarketSignal[]; lastAgentTopic: string | null }) {
  return (
    <section id="market" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <Radar className="text-emerald-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Piyasada yükselen ürünler</h2>
      </div>
      {lastAgentTopic ? <p className="mt-2 text-sm text-slate-500">Son arama: <span className="text-emerald-200">{lastAgentTopic}</span></p> : null}
      <div className="mt-5 grid gap-3">
        {marketSignals.length > 0 ? marketSignals.map((item) => (
          <div key={item.name} className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="break-words font-medium text-white">{item.name}</p>
                <p className="mt-1 break-words text-sm text-slate-400">{item.signal}</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{item.score}/100</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Kaynak: {item.source}. Agent bundle yanıtıyla anlık güncellenir.</p>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5">
            <p className="font-medium text-white">Ürün bekleniyor</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Chatte <span className="text-emerald-200">takip ürün adı</span> yazınca SerpAPI canlı tedarik ve trend sonuçları burada görünür.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function SupplierSection({ supplierCards }: { supplierCards: SupplierCard[] }) {
  if (supplierCards.length === 0) return null;

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <LinkIcon className="text-emerald-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Tedarik linkleri</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">Son aradığın ürünlerden gelen canlı SerpAPI sonuçları. Stok almadan önce fiyat, kargo ve iade koşullarını ayrıca kontrol et.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {supplierCards.map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="group min-w-0 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-300/30 hover:bg-white/[0.06]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200/70">{item.productName}</p>
                <h3 className="mt-2 line-clamp-2 break-words font-semibold leading-6 text-white">{item.title}</h3>
              </div>
              <ArrowUpRight className="shrink-0 text-slate-500 transition group-hover:text-emerald-300" size={18} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{item.source}</span>
              {item.price ? <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-100">{item.price}</span> : null}
              <span>{item.score}/100</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function AgentNewsSection({ financeNews, lastAgentTopic }: { financeNews: FinanceNewsItem[]; lastAgentTopic: string | null }) {
  return (
    <section id="news" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <Newspaper className="text-blue-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Finans ve e-ticaret haberleri</h2>
      </div>
      {lastAgentTopic ? <p className="mt-2 text-sm text-slate-500">Son arama: <span className="text-blue-200">{lastAgentTopic}</span></p> : null}
      <div className="mt-5 grid gap-3">
        {financeNews.length > 0 ? financeNews.map((news) => (
          <article key={news.title} className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-blue-400/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>{news.source}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-700" />
                  <span>{news.time ?? "Bundle hazır"}</span>
                </div>
                <h3 className="mt-2 font-semibold leading-6 text-white">{news.title}</h3>
                {news.bundleSummary ? (
                  <div className="mt-3 rounded-2xl border border-emerald-300/10 bg-white/[0.06] p-3 text-sm leading-6 text-amber-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {news.bundleSummary}
                  </div>
                ) : null}
              </div>
              <a href={news.href} target="_blank" rel="noreferrer" aria-label={`${news.title} haberini aç`} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-500 transition hover:border-blue-300/30 hover:text-blue-300">
                <ArrowUpRight className="shrink-0" size={18} />
              </a>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5">
            <p className="font-medium text-white">Haber bundle bekleniyor</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Chatte <span className="text-blue-200">haber konu</span> veya <span className="text-blue-200">takip ürün adı</span> yazınca canlı haber sinyalleri burada listelenir.</p>
          </div>
        )}
      </div>
    </section>
  );
}
